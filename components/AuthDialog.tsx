import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { User, cloudSync } from '../services/cloudSync';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChange: (user: User | null) => void;
}

export function AuthDialog({ isOpen, onClose, onUserChange }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    teamId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let user: User;
      
      if (isSignUp) {
        user = await cloudSync.signup(
          formData.email,
          formData.password,
          formData.name,
          formData.teamId || undefined
        );
        toast.success('Account created successfully!');
      } else {
        user = await cloudSync.signIn(formData.email, formData.password);
        toast.success('Signed in successfully!');
      }

      onUserChange(user);
      onClose();
      setFormData({ email: '', password: '', name: '', teamId: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamId">Team (optional)</Label>
                <Input
                  id="teamId"
                  type="text"
                  value={formData.teamId}
                  onChange={(e) => handleInputChange('teamId', e.target.value)}
                  placeholder="e.g., Design Team"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : 
               (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}