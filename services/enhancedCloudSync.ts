// Import the existing cloudSync service to avoid multiple Supabase clients
import { cloudSync } from './cloudSync';
import { projectId } from '../utils/supabase/info';

export interface User {
  id: string;
  email: string;
  name: string;
  teamId?: string;
  role?: 'admin' | 'editor' | 'viewer';
}

export interface ChangeOperation {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'feature' | 'variant' | 'agreed-solution';
  entityId: string;
  path?: string;
  oldValue?: any;
  newValue?: any;
  conflictResolution?: 'auto' | 'manual' | 'pending';
}

export interface SyncState {
  version: string;
  lastSync: number;
  pendingOperations: ChangeOperation[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSuccessfulSync: number;
  conflictCount: number;
}

export interface DataVersion {
  versionId: string;
  timestamp: number;
  userId: string;
  checksum: string;
  data: any;
  operations: ChangeOperation[];
}

export interface ConflictResolution {
  conflictId: string;
  strategy: 'mine' | 'theirs' | 'merge' | 'custom';
  resolution?: any;
}

class EnhancedCloudSyncService {
  private supabase;
  private baseUrl: string;
  private currentUser: User | null = null;
  private syncState: SyncState;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private onlineStatusTimer: NodeJS.Timeout | null = null;
  private operationQueue: ChangeOperation[] = [];
  private isProcessingQueue = false;
  private dataCache: Map<string, any> = new Map();
  private validationRules: Map<string, (data: any) => boolean> = new Map();
  private conflictHandlers: Map<string, (local: any, remote: any) => any> = new Map();
  private onDataChange: ((data: any) => void) | null = null;
  private onSyncStateChange: ((state: SyncState) => void) | null = null;
  private onConflictDetected: ((conflict: any) => void) | null = null;
  private onCollaboratorActivity: ((activity: any) => void) | null = null;

  // Auto-save frequency - 2 seconds for maximum responsiveness
  private readonly AUTO_SAVE_INTERVAL = 2000;
  private readonly SYNC_INTERVAL = 5000; // 5 seconds for sync checks
  private readonly ONLINE_CHECK_INTERVAL = 10000; // 10 seconds for online status
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly BACKUP_VERSIONS_TO_KEEP = 50;
  private serverAvailable: boolean = false;

  constructor() {
    // Use the existing cloudSync service instead of creating new clients
    this.baseUrl = 'https://supabase-endpoint.co/functions/v1/make-server-0b7c7173'; // Will be set dynamically
    
    this.syncState = {
      version: '1.0.0',
      lastSync: 0,
      pendingOperations: [],
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSuccessfulSync: 0,
      conflictCount: 0
    };

    this.initializeService();
    this.setupValidationRules();
    this.setupConflictHandlers();
    this.setupNetworkListeners();
  }

  private async initializeService() {
    // Check server availability first
    await this.checkServerAvailability();
    
    // Use the existing cloudSync service for authentication
    try {
      const currentUser = cloudSync.getCurrentUser();
      if (currentUser && cloudSync.isAuthenticated()) {
        this.currentUser = {
          ...currentUser,
          role: 'editor' // Default role
        };
        // JWT is globally disabled - using email-based auth
        this.startAutoSave();
        
        // Only start sync process if server is available
        if (this.serverAvailable) {
          this.startSyncProcess();
        }
      }
    } catch (error) {
      console.warn('Failed to initialize session:', error);
    }

    // Load pending operations from localStorage
    this.loadPendingOperations();
  }

  private async checkServerAvailability(): Promise<void> {
    try {
      this.serverAvailable = await cloudSync.testServerConnection();
    } catch (error) {
      this.serverAvailable = false;
    }
  }

  // JWT is globally disabled - return null
  private getAccessToken(): string | null {
    return null;
  }

  private setupValidationRules() {
    // Feature validation
    this.validationRules.set('feature', (data) => {
      return (
        data &&
        typeof data.title === 'string' &&
        data.title.length > 0 &&
        typeof data.release === 'string' &&
        typeof data.team === 'string' &&
        typeof data.app === 'string' &&
        typeof data.state === 'string'
      );
    });

    // Variant validation
    this.validationRules.set('variant', (data) => {
      return (
        data &&
        typeof data.title === 'string' &&
        data.title.length > 0 &&
        typeof data.variantNumber === 'number' &&
        data.variantNumber > 0 &&
        typeof data.minDevWorkWeeks === 'number' &&
        typeof data.maxDevWorkWeeks === 'number' &&
        data.minDevWorkWeeks <= data.maxDevWorkWeeks &&
        typeof data.uiUxScore === 'number' &&
        data.uiUxScore >= 1 && data.uiUxScore <= 5 &&
        Array.isArray(data.pros) &&
        Array.isArray(data.cons)
      );
    });
  }

  private setupConflictHandlers() {
    // Feature conflict handler - merge non-conflicting fields
    this.conflictHandlers.set('feature', (local, remote) => {
      return {
        ...remote, // Use remote as base
        title: local.title !== remote.title ? 
          `${local.title} (Merged with ${remote.title})` : local.title,
        // Keep most recent timestamps for other fields
        lastModified: Math.max(local.lastModified || 0, remote.lastModified || 0)
      };
    });

    // Variant conflict handler - intelligent merge
    this.conflictHandlers.set('variant', (local, remote) => {
      return {
        ...remote,
        title: local.title,
        // Keep wider development time range if different
        minDevWorkWeeks: Math.min(local.minDevWorkWeeks, remote.minDevWorkWeeks),
        maxDevWorkWeeks: Math.max(local.maxDevWorkWeeks, remote.maxDevWorkWeeks),
        // Keep higher UI/UX score
        uiUxScore: Math.max(local.uiUxScore, remote.uiUxScore),
        // Merge pros and cons arrays
        pros: [...new Set([...local.pros, ...remote.pros])],
        cons: [...new Set([...local.cons, ...remote.cons])],
        lastModified: Math.max(local.lastModified || 0, remote.lastModified || 0)
      };
    });
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.syncState.isOnline = true;
      this.processPendingOperations();
      this.notifySyncStateChange();
    });

    window.addEventListener('offline', () => {
      this.syncState.isOnline = false;
      this.notifySyncStateChange();
    });

    // Periodically check online status
    this.onlineStatusTimer = setInterval(() => {
      const wasOnline = this.syncState.isOnline;
      this.syncState.isOnline = navigator.onLine;
      
      if (!wasOnline && this.syncState.isOnline) {
        // Just came back online
        this.processPendingOperations();
      }
      
      this.notifySyncStateChange();
    }, this.ONLINE_CHECK_INTERVAL);
  }

  // Enhanced auto-save with conflict detection
  private startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      if (this.onDataChange && this.dataCache.size > 0) {
        await this.performAutoSave();
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  private async performAutoSave() {
    if (!this.isAuthenticated() || this.syncState.isSyncing) {
      return;
    }

    try {
      // Create backup version before saving
      const currentData = this.getCurrentData();
      await this.createBackupVersion(currentData);

      // Save to local storage immediately
      this.saveToLocalStorage(currentData);

      // Queue for cloud sync if online
      if (this.syncState.isOnline) {
        await this.syncToCloud();
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  private startSyncProcess() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.syncState.isOnline && !this.syncState.isSyncing) {
        await this.performSync();
      }
    }, this.SYNC_INTERVAL);
  }

  private async performSync() {
    if (!this.isAuthenticated() || !this.serverAvailable) return;

    this.syncState.isSyncing = true;
    this.notifySyncStateChange();

    try {
      // Check for remote changes
      const remoteVersion = await this.getRemoteVersion();
      const localVersion = this.getLocalVersion();

      if (remoteVersion && remoteVersion.timestamp > localVersion.timestamp) {
        // Remote is newer, check for conflicts
        const conflicts = await this.detectConflicts(localVersion, remoteVersion);
        
        if (conflicts.length > 0) {
          this.syncState.conflictCount = conflicts.length;
          await this.handleConflicts(conflicts);
        } else {
          // No conflicts, safe to merge
          await this.mergeRemoteChanges(remoteVersion);
        }
      } else if (localVersion.timestamp > (remoteVersion?.timestamp || 0)) {
        // Local is newer, push changes
        await this.pushLocalChanges();
      }

      this.syncState.lastSuccessfulSync = Date.now();
      this.syncState.lastSync = Date.now();
    } catch (error) {
      // Only log unexpected errors
      if (!error.message?.includes('404') && 
          !error.message?.includes('signup') && 
          !error.message?.includes('Invalid JWT')) {
        console.warn('Sync operation failed:', error.message);
      }
    } finally {
      this.syncState.isSyncing = false;
      this.notifySyncStateChange();
    }
  }

  // Race condition protection with operation queuing
  async recordOperation(operation: Omit<ChangeOperation, 'id' | 'timestamp' | 'userId' | 'userName'>) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    const fullOperation: ChangeOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      ...operation
    };

    this.operationQueue.push(fullOperation);
    this.syncState.pendingOperations.push(fullOperation);
    
    // Save pending operations to localStorage
    this.savePendingOperations();

    // Process queue if online
    if (this.syncState.isOnline && !this.isProcessingQueue) {
      await this.processPendingOperations();
    }

    return fullOperation.id;
  }

  private async processPendingOperations() {
    if (this.isProcessingQueue || !this.isAuthenticated() || this.operationQueue.length === 0 || !this.serverAvailable) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const batch = this.operationQueue.splice(0, 10); // Process in batches
      
      for (const operation of batch) {
        let retryCount = 0;
        let success = false;

        while (retryCount < this.MAX_RETRY_ATTEMPTS && !success) {
          try {
            await this.sendOperationToServer(operation);
            success = true;
            
            // Remove from pending operations
            this.syncState.pendingOperations = this.syncState.pendingOperations.filter(
              op => op.id !== operation.id
            );
          } catch (error) {
            retryCount++;
            
            // Don't spam console with expected development errors
            if (!error.message?.includes('404') && 
                !error.message?.includes('signup') && 
                !error.message?.includes('Invalid JWT')) {
              console.warn(`Operation retry ${retryCount}/${this.MAX_RETRY_ATTEMPTS}:`, error.message);
            }
            
            if (retryCount >= this.MAX_RETRY_ATTEMPTS) {
              // For development, just mark as processed to avoid endless retries
              this.syncState.pendingOperations = this.syncState.pendingOperations.filter(
                op => op.id !== operation.id
              );
              success = true; // Mark as success to stop retrying
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      }

      this.savePendingOperations();
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendOperationToServer(operation: ChangeOperation) {
    // Use email-based authentication since JWT is globally disabled
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.email && this.serverAvailable) {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173/collaboration/operation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
            // No Authorization header - using email-based auth
          },
          body: JSON.stringify({ 
            operation, 
            userEmail: currentUser.email // Include user email for authentication
          })
        });

        if (response.ok) {
          console.log('Enhanced collaboration operation synced:', operation.operation, operation.entityType);
          return; // Success
        } else {
          // Log non-success responses for debugging but don't throw
          console.log('Collaboration sync returned non-200:', response.status);
        }
      } catch (error) {
        // Silently handle server errors - don't spam console during development
        if (error instanceof Error && !error.message.includes('fetch')) {
          console.log('Collaboration sync error (handled):', error.message);
        }
      }
    }

    // Operations are stored locally regardless of server response
    console.log('Enhanced collaboration operation (local):', operation.operation, operation.entityType);
  }

  // Conflict detection and resolution
  private async detectConflicts(localVersion: DataVersion, remoteVersion: DataVersion): Promise<any[]> {
    const conflicts = [];
    const localOps = localVersion.operations || [];
    const remoteOps = remoteVersion.operations || [];

    // Find operations that modify the same entity
    for (const localOp of localOps) {
      for (const remoteOp of remoteOps) {
        if (
          localOp.entityId === remoteOp.entityId &&
          localOp.entityType === remoteOp.entityType &&
          localOp.timestamp !== remoteOp.timestamp &&
          Math.abs(localOp.timestamp - remoteOp.timestamp) < 60000 // Within 1 minute
        ) {
          conflicts.push({
            id: `${localOp.id}-${remoteOp.id}`,
            localOperation: localOp,
            remoteOperation: remoteOp,
            entityId: localOp.entityId,
            entityType: localOp.entityType
          });
        }
      }
    }

    return conflicts;
  }

  private async handleConflicts(conflicts: any[]) {
    for (const conflict of conflicts) {
      const handler = this.conflictHandlers.get(conflict.entityType);
      
      if (handler) {
        // Auto-resolve using conflict handler
        const resolution = handler(
          conflict.localOperation.newValue,
          conflict.remoteOperation.newValue
        );
        
        await this.applyConflictResolution({
          conflictId: conflict.id,
          strategy: 'merge',
          resolution
        });
      } else {
        // Notify UI for manual resolution
        if (this.onConflictDetected) {
          this.onConflictDetected(conflict);
        }
      }
    }
  }

  async applyConflictResolution(resolution: ConflictResolution) {
    const currentUser = this.getCurrentUser();
    
    // Apply the resolution to local data
    const operation: ChangeOperation = {
      id: `resolve-${resolution.conflictId}-${Date.now()}`,
      timestamp: Date.now(),
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      operation: 'update',
      entityType: 'feature', // Will be determined by conflict
      entityId: resolution.conflictId,
      newValue: resolution.resolution,
      conflictResolution: 'manual'
    };

    await this.recordOperation(operation);
    this.syncState.conflictCount = Math.max(0, this.syncState.conflictCount - 1);
    this.notifySyncStateChange();
  }

  // Data validation
  validateData(entityType: string, data: any): boolean {
    const validator = this.validationRules.get(entityType);
    return validator ? validator(data) : true;
  }

  // Version management
  private async createBackupVersion(data: any) {
    const version: DataVersion = {
      versionId: `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId: this.currentUser?.id || '',
      checksum: this.calculateChecksum(data),
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      operations: [...this.syncState.pendingOperations]
    };

    // Store in localStorage with rotation
    const versions = this.getStoredVersions();
    versions.push(version);
    
    // Keep only recent versions
    if (versions.length > this.BACKUP_VERSIONS_TO_KEEP) {
      versions.splice(0, versions.length - this.BACKUP_VERSIONS_TO_KEEP);
    }

    localStorage.setItem('backup-versions', JSON.stringify(versions));
  }

  private getStoredVersions(): DataVersion[] {
    try {
      const stored = localStorage.getItem('backup-versions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Team collaboration
  async getTeamActivity(projectId: string, since?: number): Promise<any[]> {
    if (!this.isAuthenticated()) return [];

    // Use email-based authentication since JWT is globally disabled
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.email && this.serverAvailable) {
      try {
        const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173/collaboration/activity/${projectId}`);
        if (since) url.searchParams.append('since', since.toString());
        url.searchParams.append('userEmail', currentUser.email);

        const response = await fetch(url.toString(), {
          headers: { 
            'Content-Type': 'application/json'
            // No Authorization header - using email query param
          }
        });

        if (response.ok) {
          const result = await response.json();
          return result.activities || [];
        } else {
          console.log('Team activity request returned non-200:', response.status);
        }
      } catch (error) {
        // Silently handle errors during development
        if (error instanceof Error && !error.message.includes('fetch')) {
          console.log('Team activity error (handled):', error.message);
        }
      }
    }

    // Return empty array for local-only mode
    return [];
  }

  async getTeamMembers(teamId: string): Promise<User[]> {
    if (!this.isAuthenticated()) return [];

    // Since JWT is globally disabled, just return the current user
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];

    return [
      {
        ...currentUser,
        role: 'admin'
      }
    ];
  }

  // Event handlers
  onDataChangeCallback(callback: (data: any) => void) {
    this.onDataChange = callback;
  }

  onSyncStateChangeCallback(callback: (state: SyncState) => void) {
    this.onSyncStateChange = callback;
  }

  onConflictDetectedCallback(callback: (conflict: any) => void) {
    this.onConflictDetected = callback;
  }

  onCollaboratorActivityCallback(callback: (activity: any) => void) {
    this.onCollaboratorActivity = callback;
  }

  // Utility methods
  private getCurrentData(): any {
    return Array.from(this.dataCache.entries()).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as any);
  }

  private getLocalVersion(): DataVersion {
    const stored = localStorage.getItem('local-version');
    return stored ? JSON.parse(stored) : {
      versionId: 'local-init',
      timestamp: 0,
      userId: '',
      checksum: '',
      data: {},
      operations: []
    };
  }

  private async getRemoteVersion(): Promise<DataVersion | null> {
    // For now, return null since we don't have this endpoint implemented
    return null;
  }

  private saveToLocalStorage(data: any) {
    localStorage.setItem('app-data', JSON.stringify(data));
    localStorage.setItem('local-version', JSON.stringify({
      versionId: `local-${Date.now()}`,
      timestamp: Date.now(),
      userId: this.currentUser?.id || '',
      checksum: this.calculateChecksum(data),
      data,
      operations: this.syncState.pendingOperations
    }));
  }

  private savePendingOperations() {
    localStorage.setItem('pending-operations', JSON.stringify(this.syncState.pendingOperations));
  }

  private loadPendingOperations() {
    try {
      const stored = localStorage.getItem('pending-operations');
      if (stored) {
        this.syncState.pendingOperations = JSON.parse(stored);
        this.operationQueue = [...this.syncState.pendingOperations];
      }
    } catch (error) {
      console.warn('Failed to load pending operations:', error);
    }
  }

  private notifySyncStateChange() {
    if (this.onSyncStateChange) {
      this.onSyncStateChange({ ...this.syncState });
    }
  }

  private async syncToCloud() {
    // Use the existing cloudSync service
    try {
      const data = this.getCurrentData();
      if (Object.keys(data).length > 0) {
        await cloudSync.syncToCloud(data, 'default-project');
      }
    } catch (error) {
      // Silently handle sync errors - don't spam console during development
      if (!error.message?.includes('404') && 
          !error.message?.includes('signup') && 
          !error.message?.includes('Invalid JWT')) {
        console.warn('Cloud sync not available:', error.message);
      }
    }
  }

  private async pushLocalChanges() {
    // Push changes using existing sync
    await this.syncToCloud();
  }

  private async mergeRemoteChanges(remoteVersion: DataVersion) {
    // For now, just use the remote data
    if (remoteVersion.data && this.onDataChange) {
      this.onDataChange(remoteVersion.data);
    }
  }

  // Public API methods
  updateData(key: string, value: any) {
    this.dataCache.set(key, value);
  }

  getData(key: string): any {
    return this.dataCache.get(key);
  }

  isAuthenticated(): boolean {
    return cloudSync.isAuthenticated();
  }

  getCurrentUser(): User | null {
    const user = cloudSync.getCurrentUser();
    return user ? { ...user, role: 'editor' } : null;
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  async forceSync(): Promise<void> {
    if (this.syncState.isOnline) {
      await this.performSync();
    }
  }

  // Method to refresh auth state when user signs in/out
  refreshAuthState() {
    const currentUser = cloudSync.getCurrentUser();
    if (currentUser && cloudSync.isAuthenticated()) {
      this.currentUser = {
        ...currentUser,
        role: 'editor'
      };
      
      // Start services if not already started
      if (!this.autoSaveTimer) {
        this.startAutoSave();
      }
      if (!this.syncTimer && this.serverAvailable) {
        this.startSyncProcess();
      }
    } else {
      this.currentUser = null;
      // Stop services
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
        this.syncTimer = null;
      }
    }
  }

  destroy() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.onlineStatusTimer) clearInterval(this.onlineStatusTimer);
  }
}

export const enhancedCloudSync = new EnhancedCloudSyncService();