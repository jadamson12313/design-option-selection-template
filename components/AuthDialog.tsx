import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, Loader2, CheckCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { cloudSync, User } from '../services/cloudSync';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: (user: User) => void;
}

export function AuthDialog({ open, onOpenChange, onAuthSuccess }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpTeam, setSignUpTeam] = useState('');
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const availableTeams = [
    'CAD Project Blue',
    'Core CAD',
    'MDM Suite Integration',
    'Red Team',
    'Spherical Cows'
  ];

  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpName('');
    setSignUpTeam('');
    setError('');
    setSuccessMessage('');
    setLoading(false);
    setShowManualConfirm(false);
    setConfirmEmail('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const user = await cloudSync.signIn(signInEmail, signInPassword);
      onAuthSuccess(user);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      
      // Check if it's an email confirmation issue
      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('account requires activation')) {
        setError('');
        setSuccessMessage('Your account needs email activation. We are attempting to activate it automatically...');
        
        // Show manual confirmation option
        setShowManualConfirm(true);
        setConfirmEmail(signInEmail);
        
        setTimeout(() => {
          setSuccessMessage('');
          setError('If automatic activation didn\'t work, try the manual activation option below.');
        }, 3000);
      } else {
        setError(errorMessage);
        setSuccessMessage('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpName) {
      setError('Please fill in all required fields');
      return;
    }

    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const user = await cloudSync.signup(
        signUpEmail, 
        signUpPassword, 
        signUpName, 
        signUpTeam === 'no-team' ? undefined : signUpTeam || undefined
      );

      // If we get here, signup was successful and user is signed in
      onAuthSuccess(user);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account creation failed';
      
      // Check if it's a success message (account created, manual sign in needed)
      if (errorMessage.includes('Account created successfully!')) {
        setSuccessMessage(errorMessage);
        setError('');
        
        // Pre-fill sign-in form and switch tabs
        setSignInEmail(signUpEmail);
        setSignInPassword(signUpPassword);
        
        setTimeout(() => {
          setActiveTab('signin');
          setSuccessMessage('');
          setError('');
        }, 3000);
      } else if (errorMessage.includes('already exists')) {
        // User already exists - suggest signing in
        setSuccessMessage('Account already exists! Switching to sign in...');
        setError('');
        
        setTimeout(() => {
          setActiveTab('signin');
          setSignInEmail(signUpEmail);
          setSignInPassword(signUpPassword);
          setSuccessMessage('');
          setError('');
        }, 2000);
      } else {
        setError(errorMessage);
        setSuccessMessage('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173/auth/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: confirmEmail })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage('Email confirmed successfully! You can now try signing in.');
        setShowManualConfirm(false);
        setActiveTab('signin');
        setSignInEmail(confirmEmail);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to confirm email');
      }
    } catch (error) {
      setError('Failed to confirm email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Access Cloud Sync & Collaboration</DialogTitle>
          <DialogDescription>
            Sign in to sync your design options across devices and collaborate with your team in real-time.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription>
                {successMessage}
                {successMessage.includes('Switching') && (
                  <div className="mt-2 text-sm opacity-80">
                    Switching tabs automatically...
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />
              </div>
              <DialogFooter>
                <Button variant="primaryOutlined" type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Secure Account Creation:</strong> Your account will be created instantly and 
                  automatically activated. You can sign in immediately after creation.
                </div>
              </div>
            </div>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name *</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password *</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-team">Team (Optional)</Label>
                <Select value={signUpTeam} onValueChange={setSignUpTeam} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-team">No team</SelectItem>
                    {availableTeams.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>

        {showManualConfirm && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Manual Email Activation</h4>
            <form onSubmit={handleManualConfirm} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="confirm-email">Email Address</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} size="sm" className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate Account
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}