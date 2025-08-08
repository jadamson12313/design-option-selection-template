import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface User {
  id: string;
  email: string;
  name: string;
  teamId?: string;
}

export interface ProjectMetadata {
  projectId: string;
  ownerId: string;
  lastSyncAt: string;
  teamId?: string;
}

export interface CloudSyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

class CloudSyncService {
  private supabase;
  private baseUrl: string;
  private currentUser: User | null = null;
  private lastSignupAttempt: number = 0;

  constructor() {
    this.supabase = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      }
    );
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173`;
    
    console.log('CloudSync: Initialized (JWT disabled, email confirmation disabled)');
    
    // Check for existing session on initialization
    this.initializeSession();
  }

  private async initializeSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        this.currentUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          teamId: session.user.user_metadata?.teamId
        };
        console.log('CloudSync: Found existing session for user:', this.currentUser.email);
      }
    } catch (error) {
      console.log('CloudSync: No existing session found');
    }
  }

  async testServerConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private canAttemptSignup(): { canAttempt: boolean; waitTime?: number } {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastSignupAttempt;
    const minWaitTime = 30000; // 30 seconds

    if (timeSinceLastAttempt < minWaitTime) {
      const waitTime = Math.ceil((minWaitTime - timeSinceLastAttempt) / 1000);
      return { canAttempt: false, waitTime };
    }

    return { canAttempt: true };
  }

  async signup(email: string, password: string, name: string, teamId?: string): Promise<User> {
    const { canAttempt, waitTime } = this.canAttemptSignup();
    if (!canAttempt) {
      throw new Error(`Please wait ${waitTime} seconds before trying again.`);
    }

    this.lastSignupAttempt = Date.now();
    console.log('CloudSync: Simple signup for:', email, '(no JWT, no email confirmation)');

    // Clear any existing session
    try {
      await this.supabase.auth.signOut();
      this.currentUser = null;
    } catch (e) {
      console.log('CloudSync: No session to clear');
    }

    // Try direct Supabase signup (should work since email confirmation is disabled)
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, teamId: teamId || null, joinedAt: new Date().toISOString() }
        }
      });

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          throw new Error('An account with this email already exists. Please try signing in instead.');
        }
        console.log('CloudSync: Direct signup failed:', error.message);
      } else if (data.user) {
        console.log('CloudSync: Direct signup successful');
        // Since email confirmation is disabled, try immediate signin
        try {
          return await this.signIn(email, password);
        } catch (signInError) {
          throw new Error('Account created successfully! Please try signing in with your credentials.');
        }
      }
    } catch (directError) {
      if (directError instanceof Error && (
        directError.message.includes('already exists') ||
        directError.message.includes('Account created successfully!')
      )) {
        throw directError;
      }
    }

    // Try server-side signup as fallback
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, teamId })
      });

      if (response.ok) {
        console.log('CloudSync: Server signup successful');
        throw new Error('Account created successfully! Please try signing in with your credentials.');
      } else if (response.status !== 404) {
        const errorData = await response.json();
        if (errorData.message?.includes('already exists')) {
          throw new Error('An account with this email already exists. Please try signing in instead.');
        }
      }
    } catch (serverError) {
      if (serverError instanceof Error && (
        serverError.message.includes('already exists') ||
        serverError.message.includes('Account created successfully!')
      )) {
        throw serverError;
      }
    }

    throw new Error('Unable to create account. Please try a different email address or contact support.');
  }

  async signIn(email: string, password: string): Promise<User> {
    console.log('CloudSync: Simple sign in for:', email);
    
    const { data: { session }, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !session) {
      console.error('CloudSync: Sign in error:', error);
      
      if (error?.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      
      // Since email confirmation is disabled, we shouldn't get "Email not confirmed" errors
      throw new Error(error?.message || 'Sign in failed. Please try again.');
    }

    console.log('CloudSync: Sign in successful');
    
    this.currentUser = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || '',
      teamId: session.user.user_metadata?.teamId
    };

    return this.currentUser;
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
      this.currentUser = null;
      console.log('CloudSync: Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  getAccessToken(): string | null {
    // JWT is disabled, return null
    return null;
  }

  async syncToCloud(projectData: any, projectId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      console.error('CloudSync: syncToCloud called but user not authenticated');
      throw new Error('Authentication required for cloud sync');
    }

    if (!this.currentUser?.email) {
      console.error('CloudSync: syncToCloud called but user email not available');
      throw new Error('User email required for cloud sync');
    }

    console.log('CloudSync: Syncing to cloud for user:', this.currentUser.email, 'project:', projectId);

    try {
      const requestBody = { 
        projectData, 
        projectId,
        userEmail: this.currentUser.email
      };

      console.log('CloudSync: Making sync upload request with userEmail:', this.currentUser.email);

      // Validate required fields before sending
      if (!requestBody.projectData || !requestBody.projectId || !requestBody.userEmail) {
        throw new Error('Missing required fields: projectData, projectId, and userEmail are required');
      }

      const response = await fetch(`${this.baseUrl}/sync/upload`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
          // No Authorization header needed - server uses email-based auth
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to sync to cloud';
        try {
          const error = await response.json();
          console.error('CloudSync: Sync upload failed with status:', response.status, 'error:', error);
          
          if (error.message?.includes('User not found')) {
            this.currentUser = null;
            throw new Error('Session expired. Please sign in again.');
          }
          
          errorMessage = error.message || error.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      console.log('Data synced to cloud successfully');
    } catch (error) {
      // Don't double-wrap errors
      if (error instanceof Error) {
        console.error('Cloud sync error:', error.message);
        throw error;
      } else {
        const errorMessage = String(error);
        console.error('Cloud sync error:', errorMessage);
        throw new Error(errorMessage);
      }
    }
  }

  async syncFromCloud(projectId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      console.error('CloudSync: syncFromCloud called but user not authenticated');
      throw new Error('Authentication required for cloud sync');
    }

    if (!this.currentUser?.email) {
      console.error('CloudSync: syncFromCloud called but user email not available');
      throw new Error('User email required for cloud sync');
    }

    console.log('CloudSync: Syncing from cloud for user:', this.currentUser.email, 'project:', projectId);

    try {
      const url = `${this.baseUrl}/sync/download/${projectId}?userEmail=${encodeURIComponent(this.currentUser.email)}`;
      console.log('CloudSync: Making sync download request with userEmail:', this.currentUser.email);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json'
          // No Authorization header needed - server uses email-based auth
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to sync from cloud';
        try {
          const error = await response.json();
          console.error('CloudSync: Sync download failed with status:', response.status, 'error:', error);
          
          if (error.message?.includes('User not found')) {
            this.currentUser = null;
            throw new Error('Session expired. Please sign in again.');
          }
          
          errorMessage = error.message || error.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('CloudSync: Successfully downloaded data from cloud');
      return result.projectData;
    } catch (error) {
      // Don't double-wrap errors
      if (error instanceof Error) {
        console.error('Cloud sync download error:', error.message);
        throw error;
      } else {
        const errorMessage = String(error);
        console.error('Cloud sync download error:', errorMessage);
        throw new Error(errorMessage);
      }
    }
  }

  async getProjects(): Promise<ProjectMetadata[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    if (!this.currentUser?.email) {
      throw new Error('User email required for projects list');
    }

    try {
      const response = await fetch(`${this.baseUrl}/projects?userEmail=${encodeURIComponent(this.currentUser.email)}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json'
          // No Authorization header needed - server uses email-based auth
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch projects';
        try {
          const error = await response.json();
          
          if (error.message?.includes('User not found')) {
            this.currentUser = null;
            throw new Error('Session expired. Please sign in again.');
          }
          
          errorMessage = error.message || error.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.projects || [];
    } catch (error) {
      // Don't double-wrap errors
      if (error instanceof Error) {
        console.error('Get projects error:', error.message);
        throw error;
      } else {
        const errorMessage = String(error);
        console.error('Get projects error:', errorMessage);
        throw new Error(errorMessage);
      }
    }
  }

  // Simplified methods for compatibility
  async notifyTeamOfChange(projectId: string, changeType: string, changeData?: any): Promise<void> {
    // No-op since collaboration is simplified
    console.log('CloudSync: Team notification (disabled)');
  }

  async getRecentChanges(projectId: string, since?: string): Promise<any[]> {
    // Return empty array since collaboration is simplified
    return [];
  }

  startAutoSync() {
    console.log('CloudSync: Auto sync (disabled)');
  }

  stopAutoSync() {
    console.log('CloudSync: Stop auto sync (disabled)');
  }

  setDataChangeListener() {
    console.log('CloudSync: Data change listener (disabled)');
  }

  async checkForRemoteChanges(): Promise<boolean> {
    return false;
  }
}

// Enhanced CloudSyncManager for backward compatibility with existing components
export interface SyncStatus {
  isAuthenticated: boolean;
  isOnline: boolean;
  syncInProgress: boolean;
  conflictDetected: boolean;
  hasCloudData: boolean;
  lastSyncTime?: string;
}

export interface TeamProject {
  id: string;
  name: string;
  teamSize: number;
  lastModifiedAt: string;
  data: any;
}

export class CloudSyncManager {
  private onSyncStatus: ((status: SyncStatus) => void) | null = null;
  private onConflict: ((cloudData: any, localData: any) => Promise<any>) | null = null;

  constructor(options?: {
    autoSync?: boolean;
    syncInterval?: number;
    onSyncStatus?: (status: SyncStatus) => void;
    onConflict?: (cloudData: any, localData: any) => Promise<any>;
  }) {
    this.onSyncStatus = options?.onSyncStatus || null;
    this.onConflict = options?.onConflict || null;
  }

  getSyncStatus(): SyncStatus {
    return {
      isAuthenticated: cloudSync.isAuthenticated(),
      isOnline: true,
      syncInProgress: false,
      conflictDetected: false,
      hasCloudData: false
    };
  }

  async signUp(email: string, password: string, name: string, teamId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await cloudSync.signup(email, password, name, teamId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await cloudSync.signIn(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  }

  async uploadData(data: any): Promise<void> {
    const projectId = 'main-project';
    await cloudSync.syncToCloud(data, projectId);
  }

  async downloadData(): Promise<{ success: boolean; data?: any }> {
    try {
      const projectId = 'main-project';
      const data = await cloudSync.syncFromCloud(projectId);
      return { success: true, data };
    } catch (error) {
      return { success: false };
    }
  }

  async checkForUpdates(lastSyncTime?: string): Promise<{ needsSync: boolean; hasCloudData: boolean }> {
    return { needsSync: false, hasCloudData: false };
  }

  async resolveConflict(localData: any): Promise<any> {
    if (this.onConflict) {
      const cloudData = await this.downloadData();
      if (cloudData.success && cloudData.data) {
        return await this.onConflict(cloudData.data, localData);
      }
    }
    return localData;
  }

  async getTeamProjects(): Promise<{ success: boolean; projects?: TeamProject[] }> {
    try {
      const projects = await cloudSync.getProjects();
      const teamProjects: TeamProject[] = projects.map(p => ({
        id: p.projectId,
        name: p.projectId,
        teamSize: 1,
        lastModifiedAt: p.lastSyncAt,
        data: null
      }));
      return { success: true, projects: teamProjects };
    } catch (error) {
      return { success: false };
    }
  }

  async shareWithTeam(projectName: string, emails: string[], data: any): Promise<{ success: boolean }> {
    try {
      await cloudSync.syncToCloud(data, projectName);
      await cloudSync.notifyTeamOfChange(projectName, 'project_shared', { emails, projectName });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  async loadTeamProject(projectId: string): Promise<{ success: boolean; project?: { data: any } }> {
    try {
      const data = await cloudSync.syncFromCloud(projectId);
      return { success: true, project: { data } };
    } catch (error) {
      return { success: false };
    }
  }

  async signOut(): Promise<void> {
    await cloudSync.signOut();
  }
}

export const cloudSync = new CloudSyncService();