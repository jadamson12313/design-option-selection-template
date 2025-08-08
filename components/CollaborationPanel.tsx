import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Badge } from './ui/badge';
import { Users, Clock, AlertTriangle } from 'lucide-react';

interface CollaborationPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborationPanel({ projectId, isOpen, onClose }: CollaborationPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Collaboration
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Project Status</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Last synced: Just now
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="text-sm text-muted-foreground">
              No recent team activity
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Team Members</h4>
            <div className="text-sm text-muted-foreground">
              Sign in to see team members
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              Invite Team Members
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}