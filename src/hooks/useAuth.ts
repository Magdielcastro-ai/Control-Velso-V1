import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser, signIn as supabaseSignIn, signOut as supabaseSignOut } from '@/lib/supabase';

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
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser && currentUser.perfil) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            nombre: currentUser.perfil.nombre,
            rol: currentUser.perfil.rol,
            activo: currentUser.perfil.activo,
          });
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const perfil = await getCurrentUser();
        if (perfil && perfil.perfil) {
          setUser({
            id: perfil.id,
            email: perfil.email || '',
            nombre: perfil.perfil.nombre,
            rol: perfil.perfil.rol,
            activo: perfil.perfil.activo,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await supabaseSignIn(email, password);
      if (data.user) {
        const perfil = await getCurrentUser();
        if (perfil && perfil.perfil) {
          const authUser: AuthUser = {
            id: perfil.id,
            email: perfil.email || '',
            nombre: perfil.perfil.nombre,
            rol: perfil.perfil.rol,
            activo: perfil.perfil.activo,
          };
          setUser(authUser);
          return authUser;
        }
      }
      throw new Error('No se pudo iniciar sesión');
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
