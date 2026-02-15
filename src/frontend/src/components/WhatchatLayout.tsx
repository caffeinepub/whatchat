import { MessageCircle, Settings, LogOut } from 'lucide-react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetUnreadMessageCount } from '../hooks/useQueries';
import { useSignOut } from '../hooks/useSignOut';
import { usePollingRefetch } from '../hooks/usePollingRefetch';

export default function WhatchatLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { signOut } = useSignOut();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const isAuthenticated = !!identity;

  const { data: unreadCount, refetch: refetchUnreadCount } = useGetUnreadMessageCount();
  const unreadNumber = unreadCount ? Number(unreadCount) : 0;

  // Auto-refresh unread count while authenticated
  usePollingRefetch({
    enabled: isAuthenticated,
    interval: 3000,
    onRefetch: () => {
      refetchUnreadCount();
    },
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate({ to: isAuthenticated ? '/chats' : '/' })} className="flex items-center gap-2">
            <MessageCircle className="w-7 h-7" />
            <h1 className="text-2xl font-bold">Whatchat</h1>
          </button>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: '/settings' })}
                className="text-primary-foreground hover:bg-primary/90"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-primary-foreground hover:bg-primary/90"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Bottom Navigation (Mobile) */}
      {isAuthenticated && (
        <nav className="bg-card border-t border-border md:hidden">
          <div className="container mx-auto px-4 py-2 flex justify-around">
            <Button
              variant={currentPath.startsWith('/chats') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate({ to: '/chats' })}
              className="flex flex-col items-center gap-1 relative"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Chats</span>
              {unreadNumber > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadNumber > 9 ? '9+' : unreadNumber}
                </Badge>
              )}
            </Button>
            <Button
              variant={currentPath === '/settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate({ to: '/settings' })}
              className="flex flex-col items-center gap-1"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
