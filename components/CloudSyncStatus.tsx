import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  LogOut,
  LogIn,
  Wrench
} from 'lucide-react';
import { cloudSync, User } from '../services/cloudSync';
import { AuthDialog } from './AuthDialog';

interface CloudSyncStatusProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
}

interface TeamActivity {
  userName: string;
  changeType: string;
  timestamp: string;
  changeData?: any;
}

export function CloudSyncStatus({ 
  user, 
  onUserChange
}: CloudSyncStatusProps) {
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [testingEmailFix, setTestingEmailFix] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    if (user && showActivity) {
      loadTeamActivity();
    }
  }, [user, showActivity]);

  const loadTeamActivity = async () => {
    if (!user) return;
    
    setLoadingActivity(true);
    try {
      const changes = await cloudSync.getRecentChanges('current-project');
      setTeamActivity(changes.map(change => ({
        userName: change.userName,
        changeType: change.changeType,
        timestamp: change.timestamp,
        changeData: change.changeData
      })));
    } catch (error) {
      console.warn('Failed to load team activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    
    setSyncStatus('syncing');
    try {
      // Perform sync operations here
      setLastSyncTime(new Date().toISOString());
      setSyncStatus('success');
      
      // Reset to idle after a delay
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncStatus('error');
      
      // Reset to idle after a delay
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  };

  const handleSignOut = async () => {
    try {
      await cloudSync.signOut();
      onUserChange(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const testEmailFix = async () => {
    if (!user) return;
    
    setTestingEmailFix(true);
    try {
      console.log('🔧 Testing email confirmation fix for user:', user.email);
      
      // Import the necessary function from the service
      const { projectId: supabaseProjectId, publicAnonKey } = await import('../utils/supabase/info');
      const baseUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-0b7c7173`;
      
      const response = await fetch(`${baseUrl}/fix-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Email fix test successful:', result.message);
        alert(`✅ Email Fix Test Result:\n\n${result.message}\n\nConfirmed: ${result.confirmed}\nFix Applied: ${result.fixApplied}`);
      } else {
        console.error('❌ Email fix test failed:', result.message);
        alert(`❌ Email Fix Test Failed:\n\n${result.message}\n\nThis helps diagnose authentication issues.`);
      }
    } catch (error) {
      console.error('❌ Email fix test error:', error);
      alert(`❌ Email Fix Test Error:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check console for details.`);
    } finally {
      setTestingEmailFix(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'feature_added':
        return '✨';
      case 'variant_added':
        return '🌟';
      case 'feature_updated':
        return '✏️';
      case 'variant_updated':
        return '🔧';
      case 'agreed_solution':
        return '✅';
      case 'image_uploaded':
        return '🖼️';
      default:
        return '📝';
    }
  };

  const getChangeDescription = (changeType: string, changeData?: any) => {
    switch (changeType) {
      case 'feature_added':
        return 'added a new feature';
      case 'variant_added':
        return 'added a variant';
      case 'feature_updated':
        return 'updated feature details';
      case 'variant_updated':
        return 'updated a variant';
      case 'agreed_solution':
        return 'selected an agreed solution';
      case 'image_uploaded':
        return 'uploaded an image';
      default:
        return 'made changes';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      default:
        return 'Ready';
    }
  };

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <CloudOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Offline mode</span>
          <Button 
            variant="primaryOutlined" 
            size="sm"
            onClick={() => setShowAuthDialog(true)}
          >
            <LogIn className="h-4 w-4 mr-1" />
            Sign In
          </Button>
        </div>
        
        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          onAuthSuccess={(authenticatedUser) => {
            onUserChange(authenticatedUser);
            setShowAuthDialog(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* User Name Display */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Signed in as</span>
        <span className="text-sm font-medium">{user.name}</span>
        {user.teamId && (
          <Badge variant="secondary" className="text-xs">
            {user.teamId}
          </Badge>
        )}
      </div>

      {/* Cloud Sync Status */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            {getSyncStatusIcon()}
            <span className="ml-1 text-xs">{getSyncStatusText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Cloud Sync</h4>
                <Badge variant="secondary" className="text-xs">
                  {user.teamId || 'Personal'}
                </Badge>
              </div>
              {lastSyncTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last sync: {formatTimeAgo(lastSyncTime)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleManualSync}
                  disabled={syncStatus === 'syncing'}
                  className="flex-1"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowActivity(!showActivity)}
                  className="flex-1"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Team Activity
                </Button>
              </div>
              
              {/* Email Fix Test Button - Only show if there might be authentication issues */}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testEmailFix}
                disabled={testingEmailFix}
                className="w-full text-primary border-primary/20 hover:bg-primary/10"
              >
                {testingEmailFix ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Wrench className="h-3 w-3 mr-1" />
                )}
                {testingEmailFix ? 'Testing Email Fix...' : 'Test Email Fix'}
              </Button>
            </div>

            {showActivity && (
              <>
                <Separator />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recent Team Activity</CardTitle>
                    <CardDescription className="text-xs">
                      Latest changes from your team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loadingActivity ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : teamActivity.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No recent activity
                      </div>
                    ) : (
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {teamActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-base mt-0.5">
                                {getChangeTypeIcon(activity.changeType)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="truncate">
                                  <span className="font-medium">{activity.userName}</span>
                                  {' '}
                                  <span className="text-muted-foreground">
                                    {getChangeDescription(activity.changeType, activity.changeData)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimeAgo(activity.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

          </div>
        </PopoverContent>
      </Popover>

      {/* Logout Button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-1" />
        Sign Out
      </Button>
    </div>
  );
}