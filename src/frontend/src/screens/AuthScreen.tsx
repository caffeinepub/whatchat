import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Shield, Users, Zap, Loader2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { shouldSkipAutoLogin, clearSkipAutoLogin } from '../utils/authBootstrap';

export default function AuthScreen() {
  const { login, identity, isLoggingIn, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  // Auto-navigate to /chats when authenticated (unless skip marker is set)
  useEffect(() => {
    if (identity && !isInitializing) {
      const skipAutoLogin = shouldSkipAutoLogin();
      if (!skipAutoLogin) {
        navigate({ to: '/chats' });
      }
    }
  }, [identity, isInitializing, navigate]);

  const handleLogin = async () => {
    // Clear skip marker when user explicitly clicks sign-in
    clearSkipAutoLogin();
    login();
  };

  // Show loading state while initializing authentication
  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-primary text-primary-foreground p-6 rounded-full">
              <MessageCircle className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to Whatchat
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A secure, decentralized messaging platform built on the Internet Computer. Connect with friends and family
            without compromising your privacy.
          </p>
        </div>

        {/* Login Card */}
        <Card className="max-w-md mx-auto mb-12 shadow-lg">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Sign in with Internet Identity to start chatting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full" size="lg">
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Sign In with Internet Identity'
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Internet Identity provides secure, anonymous authentication without passwords or personal data.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-primary mb-2" />
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your messages are stored on the blockchain with cryptographic security. No central server can access your
                data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle className="text-lg">Direct Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Send messages directly to other users. Start conversations by sharing your Principal ID.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-primary mb-2" />
              <CardTitle className="text-lg">Decentralized</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built on the Internet Computer blockchain. No single point of failure, no downtime.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground">
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
