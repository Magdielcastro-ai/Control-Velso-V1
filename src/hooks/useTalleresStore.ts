import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { DatosTaller } from '@/types/cotizacion';

export interface TallerGuardado extends DatosTaller {
  id: string;
  fechaRegistro: string;
}

export const useTalleresStore = () => {
  const [talleres, setTalleres] = useState<TallerGuardado[]>([]);
  const [cargado, setCargado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDesdeSupabase = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('talleres')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.warn('[useTalleresStore] Error cargando de Supabase:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      if (data && data.length > 0) {
        const talleresFormateados: TallerGuardado[] = data.map(t => ({
          id: t.id,
          nombre: t.nombre,
          direccion: t.direccion || '',
          telefono: t.telefono || '',
          email: t.email || '',
          rfc: t.rfc || '',
          fechaRegistro: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        }));
        setTalleres(talleresFormateados);
      }
    } catch (err: any) {
      console.error('[useTalleresStore] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setCargado(true);
    }
  }, []);

  useEffect(() => {
    // Escuchar cambios de autenticación para recargar datos
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        console.log('[useTalleresStore] Usuario autenticado, recargando...');
        cargarDesdeSupabase();
      } else if (event === 'SIGNED_OUT') {
        console.log('[useTalleresStore] Usuario desautenticado, limpiando...');
        setTalleres([]);
        setCargado(false);
      }
    });

    // Carga inicial si ya hay sesión
    cargarDesdeSupabase();

    return () => subscription.unsubscribe();
  }, [cargarDesdeSupabase]);

  const agregarTaller = useCallback(async (taller: Omit<DatosTaller, 'id'>) => {
    const existe = talleres.some(t => 
      t.nombre.toLowerCase() === taller.nombre.toLowerCase()
    );

    if (existe) {
      return null;
    }

    const nuevo: TallerGuardado = {
      ...taller,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('talleres')
        .insert([{
          id: nuevo.id,
          nombre: nuevo.nombre,
          direccion: nuevo.direccion,
          telefono: nuevo.telefono,
          email: nuevo.email,
          rfc: nuevo.rfc,
          usuario_id: user?.id,
        }]);

      if (error) {
        console.error('[useTalleresStore] Error guardando en Supabase:', error);
      }
    } catch (err) {
      console.error('[useTalleresStore] Error:', err);
    }

    setTalleres(prev => [...prev, nuevo]);
    return nuevo;
  }, [talleres]);

  const actualizarTaller = useCallback(async (id: string, datos: Partial<DatosTaller>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
      if (datos.direccion !== undefined) updateData.direccion = datos.direccion;
      if (datos.telefono !== undefined) updateData.telefono = datos.telefono;
      if (datos.email !== undefined) updateData.email = datos.email;
      if (datos.rfc !== undefined) updateData.rfc = datos.rfc;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('talleres')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('[useTalleresStore] Error actualizando en Supabase:', error);
          toast.error('Error al guardar taller: ' + error.message);
          return false;
        }
      }

      setTalleres(prev => prev.map(t => t.id === id ? { ...t, ...datos } : t));
      toast.success('Taller actualizado correctamente');
      return true;
    } catch (err: any) {
      console.error('[useTalleresStore] Error:', err);
      toast.error('Error de conexión: ' + err.message);
      return false;
    }
  }, []);

  const eliminarTaller = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('talleres')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useTalleresStore] Error eliminando de Supabase:', error);
      }
    } catch (err) {
      console.error('[useTalleresStore] Error:', err);
    }

    setTalleres(prev => prev.filter(t => t.id !== id));
  }, []);

  const buscarTaller = useCallback((query: string) => {
    const q = query.toLowerCase();
    return talleres.filter(t => 
      t.nombre.toLowerCase().includes(q)
    );
  }, [talleres]);

  const getTallerById = useCallback((id: string) => {
    return talleres.find(t => t.id === id);
  }, [talleres]);

  const existeTaller = useCallback((nombre: string) => {
    return talleres.some(t => 
      t.nombre.toLowerCase() === nombre.toLowerCase()
    );
  }, [talleres]);

  const guardarTallerDesdeCotizacion = useCallback(async (datos: DatosTaller): Promise<TallerGuardado | null> => {
    if (!datos.nombre) return null;

    if (existeTaller(datos.nombre)) {
      return talleres.find(t => t.nombre.toLowerCase() === datos.nombre.toLowerCase()) || null;
    }

    return agregarTaller(datos);
  }, [existeTaller, agregarTaller, talleres]);

  const recargarTalleres = useCallback(async () => {
    await cargarDesdeSupabase();
  }, [cargarDesdeSupabase]);

  return {
    talleres,
    cargado,
    loading,
    error,
    agregarTaller,
    actualizarTaller,
    eliminarTaller,
    buscarTaller,
    getTallerById,
    existeTaller,
    guardarTallerDesdeCotizacion,
    recargarTalleres,
  };
};
