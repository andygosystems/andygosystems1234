import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kb_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.warn("Could not fetch profile role:", profileError.message);
          }

          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: (profile?.role as any) || 'user'
          };
          setUser(userData);
          localStorage.setItem('kb_user', JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem('kb_user');
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.warn("Could not fetch profile role:", profileError.message);
        }

        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: (profile?.role as any) || 'user'
        };
        setUser(userData);
        localStorage.setItem('kb_user', JSON.stringify(userData));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('kb_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    if (res.success && res.user) {
      // Profile check is handled by the onAuthStateChange listener or manually here
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', res.user.id)
        .single();

      if (profileError || !profile) {
        // Sign out if profile is missing or query fails
        await supabase.auth.signOut();
        throw new Error('Access denied. No admin profile found.');
      }

      if (profile.role !== 'admin') {
        // Log them out immediately if they aren't an admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      const userData: User = { 
        id: res.user.id, 
        email, 
        role: profile.role as 'admin'
      };
      setUser(userData);
      localStorage.setItem('kb_user', JSON.stringify(userData));
      return;
    }
    throw new Error(res.error || 'Invalid credentials');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('kb_user');
  };


  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
