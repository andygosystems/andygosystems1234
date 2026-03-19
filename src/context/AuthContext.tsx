import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const asPromise = (value: any): Promise<any> => Promise.resolve(value as any);

  const withTimeout = async (promiseLike: any, ms: number): Promise<any> => {
    return await Promise.race([
      asPromise(promiseLike),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error(`timeout_${ms}ms`)), ms)),
    ]);
  };

  const isInvalidRefreshTokenError = (e: any) => {
    const msg = String(e?.message || e || '').toLowerCase();
    return msg.includes('invalid refresh token') || msg.includes('refresh token not found');
  };

  const clearAuthStorage = () => {
    try {
      const removeKeys = (store: Storage) => {
        for (let i = store.length - 1; i >= 0; i--) {
          const key = store.key(i);
          if (!key) continue;
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) store.removeItem(key);
          if (key === 'supabase.auth.token') store.removeItem(key);
        }
      };
      removeKeys(window.localStorage);
      removeKeys(window.sessionStorage);
    } catch {
      return;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const setFromSession = async () => {
      try {
        const { data, error } = await withTimeout(supabase.auth.getSession(), 12000);
      if (cancelled) return;

      if (error) {
        if (isInvalidRefreshTokenError(error)) {
          clearAuthStorage();
          await supabase.auth.signOut({ scope: 'local' });
        }
        setUser(null);
        setLoading(false);
        return;
      }

      const session = data.session;
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await withTimeout(
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle(),
        12000
      );

      if (cancelled) return;

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        role: (profile?.role as any) || 'user',
      });
      setLoading(false);
      } catch {
        if (cancelled) return;
        clearAuthStorage();
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setLoading(false);
      }
    };

    setFromSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await withTimeout(
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle(),
        12000
      );

      if (cancelled) return;

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        role: (profile?.role as any) || 'user',
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Login failed');
    await refresh();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(supabase.auth.getSession(), 12000);
      if (error || !data.session?.user) {
        if (isInvalidRefreshTokenError(error)) {
          clearAuthStorage();
          await supabase.auth.signOut({ scope: 'local' });
        }
        setUser(null);
        return;
      }

      const { data: profile } = await withTimeout(
        supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .maybeSingle(),
        12000
      );

      setUser({
        id: data.session.user.id,
        email: data.session.user.email || '',
        role: (profile?.role as any) || 'user',
      });
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    signOut,
    refresh,
  }), [user, loading, login, signOut, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
