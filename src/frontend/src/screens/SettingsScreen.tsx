import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, User, Mail, Key, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DeveloperInfoCard from '../components/DeveloperInfoCard';
import { Separator } from '@/components/ui/separator';
import { useSignOut } from '../hooks/useSignOut';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { signOut } = useSignOut();
  const principalId = identity?.getPrincipal().toText();

  useEffect(() => {
    if (!identity && !isInitializing) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Show loading state while auth is initializing
  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Settings</h2>
          <p className="text-muted-foreground">Manage your profile and account settings</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Name
              </Label>
              <Input id="name" value={userProfile?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input id="email" value={userProfile?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                Note: Email is used as an identifier only. No verification is performed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Principal ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Your Principal ID
            </CardTitle>
            <CardDescription>Share this ID with others to receive messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Principal ID</Label>
              <div className="flex gap-2">
                <Input id="principal" value={principalId || ''} disabled className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => principalId && copyToClipboard(principalId)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is your unique identifier on the Internet Computer. Share it with contacts so they can message you.
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut} className="w-full sm:w-auto flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Switch account
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Sign out and log in with a different Internet Identity
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Developer Info */}
        <DeveloperInfoCard />

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-6 pb-4">
          <p>
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="mt-1">© {new Date().getFullYear()} Whatchat. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
