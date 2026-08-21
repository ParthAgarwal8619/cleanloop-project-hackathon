import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Role } from '@/types';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'cleanloop-profile-id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', storedId)
        .maybeSingle()
        .then(({ data }) => {
          setProfile(data as Profile | null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) return { error: 'Unable to sign in. Please try again.' };
    if (!data) return { error: 'No account found with this email.' };

    setProfile(data as Profile);
    localStorage.setItem(STORAGE_KEY, data.id);
    return { error: null };
  };

  const signOut = () => {
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchRole = (role: Role) => {
    if (!profile) return;
    const updated = { ...profile, role };
    setProfile(updated);
    supabase.from('profiles').update({ role }).eq('id', profile.id).then(() => {});
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
