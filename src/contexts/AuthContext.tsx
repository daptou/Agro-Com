import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
  isAdmin: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  isDeliveryAgent: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  isAdmin: false,
  isSeller: false,
  isBuyer: false,
  isDeliveryAgent: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(r => r.role) || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Fetch roles when user signs in
        if (currentSession?.user) {
          setTimeout(async () => {
            const userRoles = await fetchUserRoles(currentSession.user.id);
            setRoles(userRoles);
            setLoading(false);
          }, 0);
        } else {
          setRoles([]);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        const userRoles = await fetchUserRoles(existingSession.user.id);
        setRoles(userRoles);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    roles,
    isAdmin: roles.includes('admin'),
    isSeller: roles.includes('seller') || (roles.length === 0 && !!user), // fallback: if user has no roles but exists, treat as seller
    isBuyer: roles.includes('buyer'),
    isDeliveryAgent: roles.includes('delivery_agent'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
