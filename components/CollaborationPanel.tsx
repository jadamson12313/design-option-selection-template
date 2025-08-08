import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Merge, 
  GitBranch,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  Eye,
  Edit,
  Crown
} from 'lucide-react';
import { enhancedCloudSync, SyncState, User as CollaborationUser } from '../services/enhancedCloudSync';

interface ActivityItem {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
}

interface ConflictItem {
  id: string;
  entityType: string;
  entityId: string;
  localValue: any;
  remoteValue: any;
  timestamp: number;
  description: string;
}

interface CollaborationPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborationPanel({ projectId, isOpen, onClose }: CollaborationPanelProps) {
  const [syncState, setSyncState] = useState<SyncState>(enhancedCloudSync.getSyncState());
  const [teamMembers, setTeamMembers] = useState<CollaborationUser[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [activeTab, setActiveTab] = useState('activity');

  useEffect(() => {
    if (!isOpen) return;

    // Set up sync state listener
    enhancedCloudSync.onSyncStateChangeCallback(setSyncState);

    // Set up conflict listener
    enhancedCloudSync.onConflictDetectedCallback((conflict) => {
      setConflicts(prev => [...prev, {
        id: conflict.id,
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        localValue: conflict.localOperation.newValue,
        remoteValue: conflict.remoteOperation.newValue,
        timestamp: Date.now(),
        description: `Conflict in ${conflict.entityType} "${conflict.entityId}"`
      }]);
    });

    // Set up activity listener
    enhancedCloudSync.onCollaboratorActivityCallback((activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50 activities
    });

    // Load initial data
    loadTeamMembers();
    loadRecentActivity();

    return () => {
      enhancedCloudSync.onSyncStateChangeCallback(() => {});
      enhancedCloudSync.onConflictDetectedCallback(() => {});
      enhancedCloudSync.onCollaboratorActivityCallback(() => {});
    };
  }, [isOpen, projectId]);

  const loadTeamMembers = async () => {
    const currentUser = enhancedCloudSync.getCurrentUser();
    if (currentUser?.teamId) {
      const members = await enhancedCloudSync.getTeamMembers(currentUser.teamId);
      setTeamMembers(members);
    }
  };

  const loadRecentActivity = async () => {
    const since = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    const recentActivities = await enhancedCloudSync.getTeamActivity(projectId, since);
    setActivities(recentActivities);
  };

  const handleConflictResolution = async (conflictId: string, strategy: 'mine' | 'theirs' | 'merge') => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    let resolution;
    switch (strategy) {
      case 'mine':
        resolution = conflict.localValue;
        break;
      case 'theirs':
        resolution = conflict.remoteValue;
        break;
      case 'merge':
        resolution = { ...conflict.remoteValue, ...conflict.localValue };
        break;
    }

    await enhancedCloudSync.applyConflictResolution({
      conflictId,
      strategy,
      resolution
    });

    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    setSelectedConflict(null);
  };

  const forceSync = async () => {
    await enhancedCloudSync.forceSync();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'editor': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'create': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'update': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Collaboration
            {syncState.conflictCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {syncState.conflictCount} conflicts
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sync Status Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {syncState.isOnline ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Wifi className="w-4 h-4" />
                      <span className="text-sm">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <WifiOff className="w-4 h-4" />
                      <span className="text-sm">Offline</span>
                    </div>
                  )}
                  
                  {syncState.isSyncing && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Syncing...</span>
                    </div>
                  )}

                  {syncState.pendingOperations.length > 0 && (
                    <Badge variant="secondary">
                      {syncState.pendingOperations.length} pending
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Last sync: {syncState.lastSuccessfulSync ? 
                      formatTimestamp(syncState.lastSuccessfulSync) : 'Never'}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={forceSync}
                    disabled={!syncState.isOnline || syncState.isSyncing}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {conflicts.length} merge conflict(s) need your attention. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1"
                  onClick={() => setActiveTab('conflicts')}
                >
                  Resolve now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="team">
                <Users className="w-4 h-4 mr-2" />
                Team ({teamMembers.length})
              </TabsTrigger>
              <TabsTrigger value="conflicts">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Conflicts ({conflicts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activities.map(activity => (
                          <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <div className="mt-1">
                              {getActivityIcon(activity.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{activity.userName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {activity.entityType}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <span className="text-sm capitalize">{member.role || 'member'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conflicts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Merge Conflicts</CardTitle>
                </CardHeader>
                <CardContent>
                  {conflicts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                      No conflicts to resolve
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conflicts.map(conflict => (
                        <div key={conflict.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium">{conflict.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatTimestamp(conflict.timestamp)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setSelectedConflict(conflict)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Conflict Resolution Dialog */}
        {selectedConflict && (
          <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Resolve Merge Conflict</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedConflict.description}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Your Version</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                        {JSON.stringify(selectedConflict.localValue, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Their Version</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                        {JSON.stringify(selectedConflict.remoteValue, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleConflictResolution(selectedConflict.id, 'mine')}
                >
                  Keep Mine
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConflictResolution(selectedConflict.id, 'theirs')}
                >
                  Use Theirs
                </Button>
                <Button
                  onClick={() => handleConflictResolution(selectedConflict.id, 'merge')}
                >
                  <Merge className="w-4 h-4 mr-2" />
                  Auto Merge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}