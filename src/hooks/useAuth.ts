import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getPerfilUsuario, signIn as supabaseSignIn, signOut as supabaseSignOut } from '@/lib/supabase';

export type UserRole = 'superadmin' | 'admin' | 'vendedor' | 'produccion';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const isProcessingAuth = useRef(false);

  const loadUserProfile = useCallback(async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      const perfil = await getPerfilUsuario(userId);
      if (perfil) {
        return {
          id: userId,
          email: email,
          nombre: perfil.nombre,
          rol: perfil.rol as UserRole,
          activo: perfil.activo,
        };
      }
      return null;
    } catch (error) {
      console.error('[useAuth] Error cargando perfil:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      if (isProcessingAuth.current) return;
      isProcessingAuth.current = true;
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error('[useAuth] Error obteniendo sesión:', sessionError);
        if (session?.user && isMounted) {
          const authUser = await loadUserProfile(session.user.id, session.user.email || '');
          if (authUser && isMounted) setUser(authUser);
        }
      } catch (error) {
        console.error('[useAuth] Error inicializando auth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
          isProcessingAuth.current = false;
        }
      }
    };
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            const authUser = await loadUserProfile(session.user.id, session.user.email || '');
            if (authUser && isMounted) setUser(authUser);
          }
          break;
        case 'SIGNED_OUT':
          if (isMounted) setUser(null);
          break;
        case 'USER_UPDATED':
          if (session?.user) {
            const authUser = await loadUserProfile(session.user.id, session.user.email || '');
            if (authUser && isMounted) setUser(authUser);
          }
          break;
      }
    });
    authSubscription.current = subscription;
    return () => {
      isMounted = false;
      if (authSubscription.current) authSubscription.current.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const data = await supabaseSignIn(email, password);
      if (data.user) {
        const authUser = await loadUserProfile(data.user.id, data.user.email || '');
        if (authUser) {
          setUser(authUser);
          return authUser;
        } else throw new Error('Usuario no tiene perfil asignado');
      }
      throw new Error('No se pudo iniciar sesión');
    } catch (error: any) {
      console.error('Error en signIn:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabaseSignOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        const authUser = await loadUserProfile(session.user.id, session.user.email || '');
        if (authUser) {
          setUser(authUser);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[useAuth] Error refrescando sesión:', error);
      return false;
    }
  }, [loadUserProfile]);

  const isAdmin = useCallback(() => user?.rol === 'admin' || user?.rol === 'superadmin', [user]);
  const isSuperAdmin = useCallback(() => user?.rol === 'superadmin', [user]);
  const isVendedor = useCallback(() => user?.rol === 'vendedor', [user]);
  const isProduccion = useCallback(() => user?.rol === 'produccion', [user]);

  const canManageUsers = useCallback(() => user?.rol === 'superadmin' || user?.rol === 'admin', [user]);
  const canCreateUsers = useCallback(() => user?.rol === 'superadmin', [user]);
  const canCreateCotizacion = useCallback(() => !!user && ['admin', 'superadmin', 'vendedor'].includes(user.rol), [user]);
  const canEditCotizacion = useCallback((cotizacionUserId?: string) => {
    if (!user) return false;
    if (user.rol === 'admin' || user.rol === 'superadmin') return true;
    if (user.rol === 'vendedor') return !cotizacionUserId || cotizacionUserId === user.id;
    return false;
  }, [user]);
  const canViewCotizaciones = useCallback(() => !!user, [user]);
  const canViewAllProyectos = useCallback(() => user?.rol === 'admin' || user?.rol === 'superadmin', [user]);
  const canViewOwnProyectos = useCallback(() => user?.rol === 'vendedor', [user]);
  const canConvertirAVenta = useCallback(() => !!user && ['admin', 'superadmin', 'vendedor'].includes(user.rol), [user]);
  const canUpdateProyectoEstado = useCallback((nuevoEstado?: string) => {
    if (!user) return false;
    if (user.rol === 'admin' || user.rol === 'superadmin') return true;
    if (user.rol === 'produccion') return nuevoEstado === 'fabricado';
    if (user.rol === 'vendedor') return nuevoEstado === 'entregado' || nuevoEstado === 'facturado';
    return false;
  }, [user]);
  const canViewDashboard = useCallback(() => !!user && ['admin', 'superadmin', 'vendedor'].includes(user.rol), [user]);
  const canViewProduccionDashboard = useCallback(() => user?.rol === 'produccion', [user]);
  const canViewControlCodigos = useCallback(() => !!user && ['admin', 'superadmin', 'produccion'].includes(user.rol), [user]);
  const canManageClientes = useCallback(() => !!user && ['admin', 'superadmin', 'vendedor'].includes(user.rol), [user]);
  const canDeleteClientes = useCallback(() => user?.rol === 'admin' || user?.rol === 'superadmin', [user]);
  const canManageTalleres = useCallback(() => user?.rol === 'admin' || user?.rol === 'superadmin', [user]);
  const canViewTalleres = useCallback(() => !!user && user.rol !== 'produccion', [user]);
  const canManageMateriales = useCallback(() => user?.rol === 'admin' || user?.rol === 'superadmin', [user]);
  const canViewMateriales = useCallback(() => !!user && user.rol !== 'produccion', [user]);
  const canManageProcesos = useCallback(() => user?.rol === 'admin' || user?.rol === 'superadmin', [user]);
  const canViewProcesos = useCallback(() => !!user && user.rol !== 'produccion', [user]);
  const canDeleteProyectos = useCallback(() => user?.rol === 'admin' || user?.rol === 'superadmin', [user]);

  return {
    user, loading, initialized, signIn, signOut, refreshSession, isAuthenticated: !!user,
    isAdmin, isSuperAdmin, isVendedor, isProduccion,
    canManageUsers, canCreateUsers, canCreateCotizacion, canEditCotizacion,
    canViewCotizaciones, canViewAllProyectos, canViewOwnProyectos, canConvertirAVenta,
    canUpdateProyectoEstado, canViewDashboard, canViewProduccionDashboard, canViewControlCodigos,
    canManageClientes, canDeleteClientes, canManageTalleres, canViewTalleres,
    canManageMateriales, canViewMateriales, canManageProcesos, canViewProcesos, canDeleteProyectos,
  };
}
