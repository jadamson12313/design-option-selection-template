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
      throw new Error('Authentication required for cloud sync');
    }

    try {
      const response = await fetch(`${this.baseUrl}/sync/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectData, 
          projectId,
          userEmail: this.currentUser?.email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (error.message?.includes('User not found')) {
          this.currentUser = null;
          throw new Error('Session expired. Please sign in again.');
        }
        
        throw new Error(error.message || error.error || 'Failed to sync to cloud');
      }

      console.log('Data synced to cloud successfully');
    } catch (error) {
      console.error('Cloud sync error:', error);
      throw error;
    }
  }

  async syncFromCloud(projectId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required for cloud sync');
    }

    try {
      const response = await fetch(`${this.baseUrl}/sync/download/${projectId}?userEmail=${encodeURIComponent(this.currentUser?.email || '')}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (error.message?.includes('User not found')) {
          this.currentUser = null;
          throw new Error('Session expired. Please sign in again.');
        }
        
        throw new Error(error.message || error.error || 'Failed to sync from cloud');
      }

      const result = await response.json();
      return result.projectData;
    } catch (error) {
      console.error('Cloud sync download error:', error);
      throw error;
    }
  }

  async getProjects(): Promise<ProjectMetadata[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/projects?userEmail=${encodeURIComponent(this.currentUser?.email || '')}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (error.message?.includes('User not found')) {
          this.currentUser = null;
          throw new Error('Session expired. Please sign in again.');
        }
        
        throw new Error(error.message || error.error || 'Failed to fetch projects');
      }

      const result = await response.json();
      return result.projects;
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
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

export const cloudSync = new CloudSyncService();