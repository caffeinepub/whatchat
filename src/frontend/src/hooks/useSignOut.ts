import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { setSkipAutoLogin } from '../utils/authBootstrap';

export function useSignOut() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    // Set marker to prevent auto-login after sign-out
    setSkipAutoLogin();
    
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  return { signOut };
}
