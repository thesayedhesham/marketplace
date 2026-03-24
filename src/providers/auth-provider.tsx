import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService } from '@/lib/auth-service';
import type { AuthUser, SignInData, SignUpData } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signIn: (data: SignInData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getSession().then(({ session }) => {
      setSession(session);
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      }
      setLoading(false);
    });

    const { unsubscribe } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    const { error } = await authService.signUp(data);
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (data: SignInData) => {
    const { error } = await authService.signIn(data);
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
