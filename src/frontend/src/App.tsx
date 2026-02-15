import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import WhatchatLayout from './components/WhatchatLayout';
import AuthScreen from './screens/AuthScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatThreadScreen from './screens/ChatThreadScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileSetupModal from './components/ProfileSetupModal';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

function LayoutWrapper() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <WhatchatLayout>
        <Outlet />
      </WhatchatLayout>
      {showProfileSetup && <ProfileSetupModal />}
    </>
  );
}

const rootRoute = createRootRoute({
  component: LayoutWrapper,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AuthScreen,
});

const chatListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chats',
  component: ChatListScreen,
});

const chatThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chats/$conversationId',
  component: ChatThreadScreen,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsScreen,
});

const routeTree = rootRoute.addChildren([authRoute, chatListRoute, chatThreadRoute, settingsRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
