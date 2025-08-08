import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface User {
  id: string;
  email: string;
  name: string;
  teamId?: string;
}

class CloudSyncService {
  private supabase;
  private baseUrl: string;
  private currentUser: User | null = null;

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
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/working-server-2025`;
    
    console.log('CloudSync: Initialized (JWT disabled, email confirmation disabled)');
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
      }
    } catch (error) {
      console.log('CloudSync: No existing session found');
    }
  }

  async signup(email: string, password: string, name: string, teamId?: string): Promise<User> {
    console.log('CloudSync: Signup for:', email);

    try {
      await this.supabase.auth.signOut();
      this.currentUser = null;
    } catch (e) {
      console.log('CloudSync: No session to clear');
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, teamId: teamId || null }
        }
      });

      if (error) {
        if (error.message?.includes('already registered')) {
          throw new Error('An account with this email already exists. Please try signing in instead.');
        }
        throw new Error(error.message);
      }

      if (data.user) {
        try {
          return await this.signIn(email, password);
        } catch (signInError) {
          throw new Error('Account created successfully! Please try signing in with your credentials.');
        }
      }
    } catch (error) {
      throw error;
    }

    throw new Error('Unable to create account. Please try again.');
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data: { session }, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !session) {
      throw new Error(error?.message || 'Sign in failed');
    }

    this.currentUser = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || '',
      teamId: session.user.user_metadata?.teamId
    };

    return this.currentUser;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  async syncToCloud(projectData: any, projectId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required for cloud sync');
    }

    const response = await fetch(`${this.baseUrl}/sync/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectData, projectId, userEmail: this.currentUser?.email })
    });

    if (!response.ok) {
      throw new Error('Failed to sync to cloud');
    }
  }

  async syncFromCloud(projectId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required for cloud sync');
    }

    const response = await fetch(
      `${this.baseUrl}/sync/download/${projectId}?userEmail=${encodeURIComponent(this.currentUser?.email || '')}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error('Failed to sync from cloud');
    }

    const result = await response.json();
    return result.projectData;
  }
}

export const cloudSync = new CloudSyncService();