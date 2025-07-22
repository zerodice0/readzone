import { useSession as useNextAuthSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';

export function useSession() {
  const { data: session, status } = useNextAuthSession();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user as any);
    } else {
      setUser(null);
    }
  }, [session, setUser]);

  return {
    session,
    status,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
  };
}