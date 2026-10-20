import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getPerfilUsuario, signIn as supabaseSignIn, signOut as supabaseSignOut } from '@/lib/supabase';

export type UserRole = 'superadmin' | 'admin' | 'vendedor' | 'produccion' | 'finanzas';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
  // Overrides de permisos por usuario (checkboxes del superadmin).
  // true/false explícito gana sobre el default del rol; ausente = default.
  permisos?: Record<string, boolean>;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const isProcessingAuth = useRef(false);
  const loadingProfile = useRef(false);
  const lastUserId = useRef<string | null>(null);

  const loadUserProfile = useCallback(async (userId: string, email: string): Promise<AuthUser | null> => {
    if (loadingProfile.current) {
      console.log('[useAuth] Ya cargando perfil, esperando...');
      let attempts = 0;
      while (loadingProfile.current && attempts < 10) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      return user;
    }

    if (lastUserId.current === userId && user) {
      console.log('[useAuth] Perfil ya cargado para:', userId);
      return user;
    }

    loadingProfile.current = true;
    try {
      const perfil = await getPerfilUsuario(userId);
      if (perfil) {
        const authUser = {
          id: userId,
          email: email,
          nombre: perfil.nombre,
          rol: perfil.rol as UserRole,
          activo: perfil.activo,
          permisos: perfil.permisos || {},
        };
        lastUserId.current = userId;
        return authUser;
      }
      return null;
    } catch (error) {
      console.error('[useAuth] Error cargando perfil:', error);
      return null;
    } finally {
      loadingProfile.current = false;
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (isProcessingAuth.current) return;
      isProcessingAuth.current = true;

      try {
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

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth event:', event);
      if (!isMounted) return;

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
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
            lastUserId.current = null;
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
      }, 100);
    });

    authSubscription.current = subscription;

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
      }
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    lastUserId.current = null;
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
    lastUserId.current = null;
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
        if (lastUserId.current !== session.user.id || !user) {
          const authUser = await loadUserProfile(session.user.id, session.user.email || '');
          if (authUser) {
            setUser(authUser);
            return true;
          }
        } else {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[useAuth] Error refrescando sesión:', error);
      return false;
    }
  }, [loadUserProfile, user]);

  const isAdmin = useCallback(() => {
    return ['admin', 'superadmin', 'finanzas'].includes(user?.rol || '');
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

  // ═══ RESOLVER DE PERMISOS ═══
  // Permiso efectivo = override por usuario (perfiles.permisos, checkbox del
  // superadmin) si existe; si no, el default del rol.
  const tienePermiso = useCallback((clave: string, defaultRol: boolean): boolean => {
    if (!user) return false;
    const overrides = user.permisos || {};
    if (overrides[clave] !== undefined) return overrides[clave];
    return defaultRol;
  }, [user]);

  const esAdminLike = () => ['admin', 'superadmin', 'finanzas'].includes(user?.rol || '');

  const canManageUsers = useCallback(() => {
    return tienePermiso('adminUsuarios', esAdminLike());
  }, [user, tienePermiso]);

  const canCreateUsers = useCallback(() => {
    return user?.rol === 'superadmin';
  }, [user]);

  // Cotizaciones: override 'cotizaciones' gana; default admin/finanzas/
  // superadmin, y vendedor solo las suyas
  const canCreateCotizacion = useCallback(() => {
    if (!user) return false;
    return tienePermiso('cotizaciones', ['admin', 'superadmin', 'vendedor', 'finanzas'].includes(user.rol));
  }, [user, tienePermiso]);

  const canEditCotizacion = useCallback((cotizacionUserId?: string) => {
    if (!user) return false;
    const overrides = user.permisos || {};
    if (overrides['cotizaciones'] !== undefined) return overrides['cotizaciones'];
    if (['admin', 'superadmin', 'finanzas'].includes(user.rol)) return true;
    if (user.rol === 'vendedor') {
      return !cotizacionUserId || cotizacionUserId === user.id;
    }
    return false;
  }, [user]);

  const canViewCotizaciones = useCallback(() => {
    return !!user;
  }, [user]);

  const canViewAllProyectos = useCallback(() => {
    return tienePermiso('proyectosTodos', esAdminLike());
  }, [user, tienePermiso]);

  const canViewOwnProyectos = useCallback(() => {
    return user?.rol === 'vendedor';
  }, [user]);

  const canConvertirAVenta = useCallback(() => {
    if (!user) return false;
    return tienePermiso('convertirProyecto', ['admin', 'superadmin', 'vendedor', 'finanzas'].includes(user.rol));
  }, [user, tienePermiso]);

  const canUpdateProyectoEstado = useCallback((nuevoEstado?: string) => {
    if (!user) return false;
    if (esAdminLike()) return true;
    if (user.rol === 'produccion') {
      return nuevoEstado === 'fabricado';
    }
    if (user.rol === 'vendedor') {
      return nuevoEstado === 'entregado' || nuevoEstado === 'facturado';
    }
    return false;
  }, [user]);

  // Dashboard consolidado: admin, superadmin y finanzas (o checkbox)
  const canViewDashboard = useCallback(() => {
    return tienePermiso('dashboard', esAdminLike());
  }, [user, tienePermiso]);

  // Mantenido por compatibilidad: el dashboard de producción se fusionó
  // en el dashboard consolidado (solo admin)
  const canViewProduccionDashboard = useCallback(() => {
    return tienePermiso('dashboard', esAdminLike());
  }, [user, tienePermiso]);

  const canViewControlCodigos = useCallback(() => {
    if (!user) return false;
    return tienePermiso('controlCodigos', ['admin', 'superadmin', 'produccion', 'finanzas'].includes(user.rol));
  }, [user, tienePermiso]);

  // Ver COSTOS y utilidad en Control de Códigos: producción por default
  // solo ve tiempos; el superadmin puede activarle este permiso
  const canViewControlCodigosCostos = useCallback(() => {
    return tienePermiso('controlCodigosCostos', esAdminLike());
  }, [user, tienePermiso]);

  const canManageClientes = useCallback(() => {
    if (!user) return false;
    return tienePermiso('clientes', ['admin', 'superadmin', 'vendedor', 'finanzas'].includes(user.rol));
  }, [user, tienePermiso]);

  const canDeleteClientes = useCallback(() => {
    return tienePermiso('eliminarClientes', esAdminLike());
  }, [user, tienePermiso]);

  const canManageTalleres = useCallback(() => {
    return tienePermiso('talleres', esAdminLike());
  }, [user, tienePermiso]);

  const canViewTalleres = useCallback(() => {
    if (!user) return false;
    return user.rol !== 'produccion';
  }, [user]);

  const canManageMateriales = useCallback(() => {
    return tienePermiso('catalogos', esAdminLike());
  }, [user, tienePermiso]);

  const canViewMateriales = useCallback(() => {
    if (!user) return false;
    return user.rol !== 'produccion';
  }, [user]);

  const canManageProcesos = useCallback(() => {
    return tienePermiso('catalogos', esAdminLike());
  }, [user, tienePermiso]);

  const canViewProcesos = useCallback(() => {
    if (!user) return false;
    return user.rol !== 'produccion';
  }, [user]);

  const canDeleteProyectos = useCallback(() => {
    // Eliminar proyectos: solo superadmin por default (checkbox puede darlo)
    return tienePermiso('eliminarProyectos', user?.rol === 'superadmin');
  }, [user, tienePermiso]);

  // Órdenes de compra: crear (admin+); autorizar/eliminar (finanzas, superadmin)
  const canCrearOrdenesCompra = useCallback(() => {
    return tienePermiso('crearOC', esAdminLike());
  }, [user, tienePermiso]);

  const canAutorizarOrdenesCompra = useCallback(() => {
    return tienePermiso('autorizarOC', user?.rol === 'finanzas' || user?.rol === 'superadmin');
  }, [user, tienePermiso]);

  const canEliminarOrdenesCompra = useCallback(() => {
    return tienePermiso('eliminarOC', user?.rol === 'superadmin' || user?.rol === 'finanzas');
  }, [user, tienePermiso]);

  const canViewPiezasCatalogo = useCallback(() => {
    if (!user) return false;
    return user.rol !== 'produccion';
  }, [user]);

  const canManagePiezasCatalogo = useCallback(() => {
    return tienePermiso('catalogos', esAdminLike());
  }, [user, tienePermiso]);

  return {
    user,
    loading,
    initialized,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin,
    isVendedor,
    isProduccion,
    canManageUsers,
    canCreateUsers,
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
    canCrearOrdenesCompra,
    canAutorizarOrdenesCompra,
    canEliminarOrdenesCompra,
    canViewPiezasCatalogo,
    canManagePiezasCatalogo,
    canViewControlCodigosCostos,
    tienePermiso,
  };
}
