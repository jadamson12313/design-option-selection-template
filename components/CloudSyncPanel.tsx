import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  Cloud, 
  CloudOff, 
  Users, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Share2,
  Plus,
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cloudSync, User, CloudSyncManager, SyncStatus, TeamProject } from '../services/cloudSync';

interface CloudSyncPanelProps {
  data: any;
  onDataImport: (data: any) => void;
  onConflictResolve?: (cloudData: any, localData: any) => Promise<any>;
}



interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'signup') {
        const user = await cloudSync.signup(email, password, name);
        console.log('Signup successful, user:', user);
        onSuccess();
        onClose();
      } else {
        const user = await cloudSync.signIn(email, password);
        console.log('Sign in successful, user:', user);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin' 
              ? 'Sign in to sync your data across devices and collaborate with your team.'
              : 'Create an account to sync your data across devices and collaborate with your team.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm">Name</label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'signup'}
                placeholder="Your full name"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              minLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="w-full"
            >
              {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface TeamSharingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (projectName: string, emails: string[]) => void;
  loading: boolean;
}

const TeamSharingDialog: React.FC<TeamSharingDialogProps> = ({ isOpen, onClose, onShare, loading }) => {
  const [projectName, setProjectName] = useState('');
  const [emailsText, setEmailsText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = emailsText
      .split(',')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    
    if (emails.length > 0 && projectName.trim()) {
      onShare(projectName.trim(), emails);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with Team</DialogTitle>
          <DialogDescription>
            Share your design options with team members for collaborative evaluation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm">Project Name</label>
            <Input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="e.g., Advanced Search Interface Options"
            />
          </div>
          
          <div>
            <label htmlFor="emails" className="block text-sm">Team Member Emails</label>
            <Input
              id="emails"
              type="text"
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              required
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple emails with commas
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Share Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CloudSyncPanel: React.FC<CloudSyncPanelProps> = ({ 
  data, 
  onDataImport, 
  onConflictResolve 
}) => {
  const [cloudSyncManager] = useState(() => new CloudSyncManager({
    autoSync: true,
    syncInterval: 60000, // 1 minute
    onSyncStatus: (status) => setSyncStatus(status),
    onConflict: onConflictResolve
  }));

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cloudSyncManager.getSyncStatus());
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [teamProjects, setTeamProjects] = useState<TeamProject[]>([]);
  const [loadingTeamAction, setLoadingTeamAction] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem('design-app-last-sync')
  );

  useEffect(() => {
    if (syncStatus.lastSyncTime) {
      setLastSyncTime(syncStatus.lastSyncTime);
      localStorage.setItem('design-app-last-sync', syncStatus.lastSyncTime);
    }
  }, [syncStatus.lastSyncTime]);

  useEffect(() => {
    if (syncStatus.isAuthenticated) {
      loadTeamProjects();
    }
  }, [syncStatus.isAuthenticated]);

  const loadTeamProjects = async () => {
    try {
      const result = await cloudSyncManager.getTeamProjects();
      if (result.success && result.projects) {
        setTeamProjects(result.projects);
      }
    } catch (error) {
      console.error('Failed to load team projects:', error);
    }
  };

  const handleSync = async () => {
    if (!syncStatus.isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    try {
      // Check for conflicts first
      const updateCheck = await cloudSyncManager.checkForUpdates(lastSyncTime || undefined);
      
      if (updateCheck.needsSync && updateCheck.hasCloudData && lastSyncTime) {
        // Conflict detected - resolve it
        const resolvedData = await cloudSyncManager.resolveConflict(data);
        onDataImport(resolvedData);
      }

      // Upload current data
      await cloudSyncManager.uploadData(data);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleDownload = async () => {
    if (!syncStatus.isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    try {
      const result = await cloudSyncManager.downloadData();
      if (result.success && result.data) {
        onDataImport(result.data);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleSignOut = async () => {
    await cloudSyncManager.signOut();
    setTeamProjects([]);
  };

  const handleTeamShare = async (projectName: string, emails: string[]) => {
    setLoadingTeamAction(true);
    try {
      const result = await cloudSyncManager.shareWithTeam(projectName, emails, data);
      if (result.success) {
        setShowTeamDialog(false);
        await loadTeamProjects();
      }
    } catch (error) {
      console.error('Team sharing failed:', error);
    } finally {
      setLoadingTeamAction(false);
    }
  };

  const handleLoadTeamProject = async (projectId: string) => {
    setLoadingTeamAction(true);
    try {
      const result = await cloudSyncManager.loadTeamProject(projectId);
      if (result.success && result.project) {
        onDataImport(result.project.data);
      }
    } catch (error) {
      console.error('Failed to load team project:', error);
    } finally {
      setLoadingTeamAction(false);
    }
  };

  const getSyncStatusIcon = () => {
    if (!syncStatus.isOnline) return <CloudOff className="w-4 h-4 text-gray-400" />;
    if (syncStatus.syncInProgress) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (syncStatus.conflictDetected) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (syncStatus.isAuthenticated && syncStatus.hasCloudData) return <Cloud className="w-4 h-4 text-green-500" />;
    return <Cloud className="w-4 h-4 text-gray-400" />;
  };

  const getSyncStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.conflictDetected) return 'Conflict detected';
    if (!syncStatus.isAuthenticated) return 'Not signed in';
    if (!syncStatus.hasCloudData) return 'No cloud data';
    return 'Synced';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSyncStatusIcon()}
            <CardTitle className="text-lg">Cloud Sync</CardTitle>
          </div>
          <Badge variant={syncStatus.isAuthenticated ? "default" : "secondary"}>
            {getSyncStatusText()}
          </Badge>
        </div>
        {lastSyncTime && (
          <CardDescription className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last sync: {new Date(lastSyncTime).toLocaleString()}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-3 mt-4">
            {!syncStatus.isAuthenticated ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to sync your data across devices
                </p>
                <Button onClick={() => setShowAuthDialog(true)} className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In / Sign Up
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSync} 
                    disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync to Cloud
                  </Button>
                  <Button 
                    onClick={handleDownload} 
                    variant="outline" 
                    disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                    className="flex-1"
                  >
                    <Cloud className="w-4 h-4 mr-2" />
                    Load from Cloud
                  </Button>
                </div>

                {syncStatus.conflictDetected && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Your local data conflicts with cloud data. Click "Sync to Cloud" to resolve.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleSignOut} 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-3 mt-4">
            {!syncStatus.isAuthenticated ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to collaborate with your team
                </p>
                <Button onClick={() => setShowAuthDialog(true)} variant="outline" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Collaborate
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowTeamDialog(true)} 
                  className="w-full"
                  disabled={loadingTeamAction}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share with Team
                </Button>

                {teamProjects.length > 0 && (
                  <div>
                    <h4 className="text-sm mb-2">Team Projects</h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {teamProjects.map((project) => (
                          <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{project.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {project.teamSize} members • {new Date(project.lastModifiedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLoadTeamProject(project.id)}
                              disabled={loadingTeamAction}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSuccess={() => {
          // Refresh team projects after successful auth
          loadTeamProjects();
        }}
      />

      <TeamSharingDialog
        isOpen={showTeamDialog}
        onClose={() => setShowTeamDialog(false)}
        onShare={handleTeamShare}
        loading={loadingTeamAction}
      />
    </Card>
  );
};

export default CloudSyncPanel;