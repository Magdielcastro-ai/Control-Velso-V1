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

  // Función para cargar el perfil del usuario
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
          console.log('[useAuth] Token refrescado exitosamente');
          break;
          
        case 'USER_UPDATED':
          if (session?.user) {
            const authUser = await loadUserProfile(session.user.id, session.user.email || '');
            if (authUser && isMounted) {
              setUser(authUser);
            }
          }
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

  // ============ PERMISOS BASADOS EN ROLES ============

  // Verificar si es admin o superadmin (acceso total excepto gestión de usuarios para admin)
  const isAdmin = useCallback(() => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }, [user]);

  const isSuperAdmin = useCallback(() => {
    return user?.rol === 'superadmin';
  }, [user]);

  const isVendedor = useCallback(() => {
    return user?.rol === 'vendedor';
  }, [user]);

  const isProduccion = useCallback(() => {
    return user?.rol === 'produccion';
  }, [user]);

  // Gestión de usuarios: SOLO superadmin
  const canManageUsers = useCallback(() => {
    return user?.rol === 'superadmin';
  }, [user]);

  // Crear cotizaciones: admin, superadmin, vendedor
  const canCreateCotizacion = useCallback(() => {
    if (!user) return false;
    return ['admin', 'superadmin', 'vendedor'].includes(user.rol);
  }, [user]);

  // Editar cotizaciones: admin, superadmin, vendedor (solo las suyas)
  const canEditCotizacion = useCallback((cotizacionUserId?: string) => {
    if (!user) return false;
    if (user.rol === 'admin' || user.rol === 'superadmin') return true;
    if (user.rol === 'vendedor') {
      // Vendedor solo puede editar sus propias cotizaciones
      return !cotizacionUserId || cotizacionUserId === user.id;
    }
    return false;
  }, [user]);

  // Ver cotizaciones: todos pueden ver, pero con filtros
  const canViewCotizaciones = useCallback(() => {
    return !!user;
  }, [user]);

  // Ver todos los proyectos: admin y superadmin ven todos, vendedor solo los suyos
  const canViewAllProyectos = useCallback(() => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }, [user]);

  // Ver proyectos (propio): vendedor puede ver sus proyectos
  const canViewOwnProyectos = useCallback(() => {
    return user?.rol === 'vendedor';
  }, [user]);

  // Convertir cotización a venta: admin, superadmin, vendedor
  const canConvertirAVenta = useCallback(() => {
    if (!user) return false;
    return ['admin', 'superadmin', 'vendedor'].includes(user.rol);
  }, [user]);

  // Actualizar estado de proyecto
  const canUpdateProyectoEstado = useCallback((nuevoEstado?: string) => {
    if (!user) return false;
    
    // Admin y superadmin pueden hacer todo
    if (user.rol === 'admin' || user.rol === 'superadmin') return true;
    
    // Producción solo puede marcar como fabricado
    if (user.rol === 'produccion') {
      return nuevoEstado === 'fabricado';
    }
    
    // Vendedor puede marcar como entregado y facturado (de sus propios proyectos)
    if (user.rol === 'vendedor') {
      return nuevoEstado === 'entregado' || nuevoEstado === 'facturado';
    }
    
    return false;
  }, [user]);

  // Ver dashboard: admin, superadmin, vendedor (con datos filtrados)
  const canViewDashboard = useCallback(() => {
    if (!user) return false;
    return ['admin', 'superadmin', 'vendedor'].includes(user.rol);
  }, [user]);

  // Ver dashboard de producción
  const canViewProduccionDashboard = useCallback(() => {
    return user?.rol === 'produccion';
  }, [user]);

  // Ver control de códigos: admin, superadmin, producción
  const canViewControlCodigos = useCallback(() => {
    if (!user) return false;
    return ['admin', 'superadmin', 'produccion'].includes(user.rol);
  }, [user]);

  // Gestionar clientes: admin, superadmin, vendedor (agregar)
  const canManageClientes = useCallback(() => {
    if (!user) return false;
    return ['admin', 'superadmin', 'vendedor'].includes(user.rol);
  }, [user]);

  // Eliminar clientes: solo admin y superadmin
  const canDeleteClientes = useCallback(() => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }, [user]);

  // Gestionar talleres: solo admin y superadmin
  const canManageTalleres = useCallback(() => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }, [user]);

  // Ver talleres guardados: todos excepto producción
  const canViewTalleres = useCallback(() => {
    if (!user) return false;
    return user.rol !== 'produccion';
  }, [user]);

  // Gestionar materiales: solo admin y superadmin
  const canManageMateriales = useCallback(() => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }, [user]);

  // Ver materiales: todos excepto producción
  const canViewMateriales = useCallback(() => {
    if (!user) return false;
    return user.rol !== 'produccion';
  }, [user]);

  // Gestionar procesos: solo admin y superadmin
  const canManageProcesos = useCallback(() => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }, [user]);

  // Ver procesos: todos excepto producción
  const canViewProcesos = useCallback(() => {
    if (!user) return false;
    return user.rol !== 'produccion';
  }, [user]);

  // Eliminar proyectos: solo admin y superadmin
  const canDeleteProyectos = useCallback(() => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }, [user]);

  return {
    user,
    loading,
    initialized,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated: !!user,
    // Helpers de rol
    isAdmin,
    isSuperAdmin,
    isVendedor,
    isProduccion,
    // Permisos
    canManageUsers,
    canCreateCotizacion,
    canEditCotizacion,
    canViewCotizaciones,
    canViewAllProyectos,
    canViewOwnProyectos,
    canConvertirAVenta,
    canUpdateProyectoEstado,
    canViewDashboard,
    canViewProduccionDashboard,
    canViewControlCodigos,
    canManageClientes,
    canDeleteClientes,
    canManageTalleres,
    canViewTalleres,
    canManageMateriales,
    canViewMateriales,
    canManageProcesos,
    canViewProcesos,
    canDeleteProyectos,
  };
}
