import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isConstrutora, setIsConstrutora] = useState<boolean>(false);
  const [hasLaunchPermission, setHasLaunchPermission] = useState<boolean>(false);
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPermissions = async (userId: string) => {
      setPermissionsLoading(true);
      await Promise.all([
        checkAdminStatus(userId),
        checkConstrutora(userId),
        checkLaunchPermission(userId),
      ]);
      setPermissionsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          loadPermissions(session.user.id);
        } else {
          setIsAdmin(false);
          setIsConstrutora(false);
          setHasLaunchPermission(false);
          setPermissionsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        loadPermissions(session.user.id);
      } else {
        setPermissionsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkLaunchPermission = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('launch_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      setHasLaunchPermission(!error && !!data);
    } catch {
      setHasLaunchPermission(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'MASTER_ADMIN',
      });

      setIsAdmin(!error && data === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const checkConstrutora = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('person_type, company_type')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setIsConstrutora(data.person_type === 'PJ' && data.company_type === 'CONSTRUTORA');
      } else {
        setIsConstrutora(false);
      }
    } catch {
      setIsConstrutora(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const canPublishLaunches = isAdmin === true || isConstrutora || hasLaunchPermission;

  return { user, session, loading, isAdmin, isConstrutora, hasLaunchPermission, canPublishLaunches, signOut };
};
