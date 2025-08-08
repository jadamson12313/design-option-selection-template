import { User2, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from '../services/cloudSync';

interface UserAuthProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function UserAuth({ user, onSignIn, onSignOut }: UserAuthProps) {
  if (!user) {
    return (
      <Button
        onClick={onSignIn}
        size="sm"
        variant="outline"
        style={{
          borderColor: 'rgb(0,136,255)',
          color: 'rgb(0,136,255)'
        }}
        className="flex items-center gap-2 hover:bg-accent"
      >
        <User2 className="w-4 h-4" />
        Sign In
      </Button>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 transition-colors">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="text-xs" style={{ backgroundColor: 'rgb(0,136,255)', color: 'white' }}>
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm max-w-32 truncate">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <div className="px-2 py-1.5">
          <p className="text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} className="text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}