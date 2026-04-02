import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getPerfilUsuario, signIn as supabaseSignIn, signOut as supabaseSignOut } from '@/lib/supabase';

export type UserRole = 'admin' | 'vendedor' | 'produccion';

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

  // Función para cargar el perfil del usuario
  const loadUserProfile = useCallback(async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      const perfil = await getPerfilUsuario(userId);
      if (perfil) {
        return {
          id: userId,
          email: email,
          nombre: perfil.nombre,
          rol: perfil.rol,
          activo: perfil.activo,
        };
      }
      return null;
    } catch (error) {
      console.error('[useAuth] Error cargando perfil:', error);
      return null;
    }
  }, []);

  // Cargar usuario al iniciar
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (isProcessingAuth.current) return;
      isProcessingAuth.current = true;

      try {
        // Obtener sesión actual primero
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useAuth] Error obteniendo sesión:', sessionError);
        }

        if (session?.user && isMounted) {
          const authUser = await loadUserProfile(session.user.id, session.user.email || '');
          if (authUser && isMounted) {
            setUser(authUser);
          }
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

    // Configurar listener de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth event:', event);
      
      if (!isMounted) return;

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            const authUser = await loadUserProfile(session.user.id, session.user.email || '');
            if (authUser && isMounted) {
              setUser(authUser);
            }
          }
          break;
          
        case 'SIGNED_OUT':
          if (isMounted) {
            setUser(null);
          }
          break;
          
        case 'TOKEN_REFRESHED':
          // El token se refrescó automáticamente, mantener la sesión
          console.log('[useAuth] Token refrescado exitosamente');
          break;
          
        case 'USER_UPDATED':
          // Actualizar datos del usuario si cambiaron
          if (session?.user) {
            const authUser = await loadUserProfile(session.user.id, session.user.email || '');
            if (authUser && isMounted) {
              setUser(authUser);
            }
          }
          break;
          
        case 'INITIAL_SESSION':
          // Ya manejado en initializeAuth
          break;
      }
    });

    authSubscription.current = subscription;

    return () => {
      isMounted = false;
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
      }
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
        } else {
          throw new Error('Usuario no tiene perfil asignado');
        }
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

  // Función para refrescar la sesión manualmente
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

  // Permisos basados en roles
  const canCreateCotizacion = useCallback(() => {
    if (!user) return false;
    return user.rol === 'admin' || user.rol === 'vendedor';
  }, [user]);

  const canEditCotizacion = useCallback(() => {
    if (!user) return false;
    return user.rol === 'admin' || user.rol === 'vendedor';
  }, [user]);

  const canViewProyectos = useCallback(() => {
    if (!user) return false;
    return true;
  }, [user]);

  const canUpdateProyectoEstado = useCallback((nuevoEstado?: string) => {
    if (!user) return false;
    if (user.rol === 'admin') return true;
    if (user.rol === 'produccion') {
      return nuevoEstado === 'fabricado' || nuevoEstado === 'entregado';
    }
    if (user.rol === 'vendedor') {
      return nuevoEstado === 'facturado';
    }
    return false;
  }, [user]);

  const canManageUsers = useCallback(() => {
    return user?.rol === 'admin';
  }, [user]);

  const canViewDashboard = useCallback(() => {
    if (!user) return false;
    return user.rol === 'admin' || user.rol === 'vendedor';
  }, [user]);

  const canViewControlCodigos = useCallback(() => {
    if (!user) return false;
    return user.rol === 'admin' || user.rol === 'produccion';
  }, [user]);

  return {
    user,
    loading,
    initialized,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated: !!user,
    // Permisos
    canCreateCotizacion,
    canEditCotizacion,
    canViewProyectos,
    canUpdateProyectoEstado,
    canManageUsers,
    canViewDashboard,
    canViewControlCodigos,
  };
}
