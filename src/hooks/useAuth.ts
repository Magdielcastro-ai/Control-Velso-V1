import { useState, useEffect, useCallback } from 'react';
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

  // Cargar usuario al iniciar
  useEffect(() => {
    let isMounted = true;

    // Configurar listener de auth PRIMERO (antes de cargar la sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event, session?.user?.id);
      
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          try {
            const perfil = await getPerfilUsuario(session.user.id);
            if (perfil) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                nombre: perfil.nombre,
                rol: perfil.rol,
                activo: perfil.activo,
              });
            } else {
              console.warn('[useAuth] Usuario sin perfil');
              setUser(null);
            }
          } catch (error) {
            console.error('[useAuth] Error cargando perfil:', error);
            setUser(null);
          }
          setLoading(false);
          setInitialized(true);
        } else {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    // Forzar verificación de sesión existente
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[useAuth] Sesión inicial:', session?.user?.id);
        
        // Si no hay sesión, marcar como inicializado
        if (!session && isMounted) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
        // Si hay sesión, onAuthStateChange ya se habrá disparado
      } catch (err) {
        console.error('[useAuth] Error verificando sesión:', err);
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const data = await supabaseSignIn(email, password);
      if (data.user) {
        const perfil = await getPerfilUsuario(data.user.id);
        if (perfil) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            nombre: perfil.nombre,
            rol: perfil.rol,
            activo: perfil.activo,
          };
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
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabaseSignOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
    return true; // Todos pueden ver proyectos
  }, [user]);

  const canUpdateProyectoEstado = useCallback((nuevoEstado?: string) => {
    if (!user) return false;
    if (user.rol === 'admin') return true;
    if (user.rol === 'produccion') {
      // Producción puede marcar como fabricado y entregado
      return nuevoEstado === 'fabricado' || nuevoEstado === 'entregado';
    }
    if (user.rol === 'vendedor') {
      // Vendedor puede facturar
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
