import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DatosTaller } from '@/types/cotizacion';

export interface TallerGuardado extends DatosTaller {
  id: string;
  fechaRegistro: string;
}

const STORAGE_KEY_TALLERES = 'velso_talleres';

export const useTalleresStore = () => {
  const [talleres, setTalleres] = useState<TallerGuardado[]>([]);
  const [cargado, setCargado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar talleres desde Supabase primero, luego localStorage como fallback
  useEffect(() => {
    const cargarTalleres = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Intentar cargar desde Supabase primero
        const { data, error: supabaseError } = await supabase
          .from('talleres')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.warn('[useTalleresStore] Error cargando de Supabase:', supabaseError);
          // Fallback a localStorage
          const guardado = localStorage.getItem(STORAGE_KEY_TALLERES);
          if (guardado) {
            setTalleres(JSON.parse(guardado));
          }
        } else if (data && data.length > 0) {
          // Transformar datos de Supabase al formato de la app
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
          // Actualizar localStorage como caché
          localStorage.setItem(STORAGE_KEY_TALLERES, JSON.stringify(talleresFormateados));
        } else {
          // Si no hay datos en Supabase, cargar de localStorage
          const guardado = localStorage.getItem(STORAGE_KEY_TALLERES);
          if (guardado) {
            setTalleres(JSON.parse(guardado));
          }
        }
      } catch (err: any) {
        console.error('[useTalleresStore] Error:', err);
        setError(err.message);
        // Fallback a localStorage
        const guardado = localStorage.getItem(STORAGE_KEY_TALLERES);
        if (guardado) {
          setTalleres(JSON.parse(guardado));
        }
      } finally {
        setLoading(false);
        setCargado(true);
      }
    };

    cargarTalleres();
  }, []);

  // Guardar talleres en localStorage cuando cambien
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY_TALLERES, JSON.stringify(talleres));
    }
  }, [talleres, cargado]);

  // Agregar taller (Supabase + local)
  const agregarTaller = useCallback(async (taller: Omit<DatosTaller, 'id'>) => {
    // Verificar si ya existe
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
    
    // Guardar en Supabase
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

  // Actualizar taller
  const actualizarTaller = useCallback(async (id: string, datos: Partial<DatosTaller>) => {
    // Actualizar en Supabase
    try {
      const updateData: any = {};
      if (datos.nombre) updateData.nombre = datos.nombre;
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
        }
      }
    } catch (err) {
      console.error('[useTalleresStore] Error:', err);
    }
    
    setTalleres(prev => prev.map(t => t.id === id ? { ...t, ...datos } : t));
  }, []);

  // Eliminar taller
  const eliminarTaller = useCallback(async (id: string) => {
    // Eliminar de Supabase
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

  // Buscar taller por nombre
  const buscarTaller = useCallback((query: string) => {
    const q = query.toLowerCase();
    return talleres.filter(t => 
      t.nombre.toLowerCase().includes(q)
    );
  }, [talleres]);

  // Obtener taller por ID
  const getTallerById = useCallback((id: string) => {
    return talleres.find(t => t.id === id);
  }, [talleres]);

  // Verificar si existe taller
  const existeTaller = useCallback((nombre: string) => {
    return talleres.some(t => 
      t.nombre.toLowerCase() === nombre.toLowerCase()
    );
  }, [talleres]);

  // Guardar taller desde cotización (si no existe)
  const guardarTallerDesdeCotizacion = useCallback(async (datos: DatosTaller): Promise<TallerGuardado | null> => {
    if (!datos.nombre) return null;
    
    // Si ya existe, no lo guardamos de nuevo
    if (existeTaller(datos.nombre)) {
      return talleres.find(t => t.nombre.toLowerCase() === datos.nombre.toLowerCase()) || null;
    }

    return agregarTaller(datos);
  }, [existeTaller, agregarTaller, talleres]);

  // Recargar talleres desde Supabase
  const recargarTalleres = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('talleres')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
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
        localStorage.setItem(STORAGE_KEY_TALLERES, JSON.stringify(talleresFormateados));
      }
    } catch (err: any) {
      console.error('[useTalleresStore] Error recargando:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
