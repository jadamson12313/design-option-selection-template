import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, cloudSync } from '../services/cloudSync';
import { AuthDialog } from './AuthDialog';
import { Cloud, CloudOff, User as UserIcon, LogOut } from 'lucide-react';

interface CloudSyncStatusProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
}

export function CloudSyncStatus({ user, onUserChange }: CloudSyncStatusProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSignOut = async () => {
    try {
      await cloudSync.signOut();
      onUserChange(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Cloud className="w-3 h-3" />
          {user.name || user.email}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="h-6 px-2"
        >
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAuthDialog(true)}
        className="flex items-center gap-2"
      >
        <CloudOff className="w-4 h-4" />
        Sign In
      </Button>
      
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onUserChange={onUserChange}
      />
    </>
  );
}