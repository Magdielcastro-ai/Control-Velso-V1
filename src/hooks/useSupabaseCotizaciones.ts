import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cotizacion } from '@/types/cotizacion';

export interface CotizacionDB {
  id: string;
  numero: string;
  usuario_id: string;
  cliente_nombre: string;
  proyecto_nombre: string;
  datos_taller: any;
  datos_cliente: any;
  materiales: any[];
  procesos: any[];
  costos_adicionales: any;
  margen_utilidad: number;
  iva_porcentaje: number;
  subtotal: number;
  total: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export function useSupabaseCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todas las cotizaciones (para admin/superadmin)
  const getAllCotizaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
      return data || [];
    } catch (err: any) {
      console.error('Error al cargar cotizaciones:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener cotizaciones del usuario actual
  const getMisCotizaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCotizaciones([]);
        return [];
      }

      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
      return data || [];
    } catch (err: any) {
      console.error('Error al cargar cotizaciones:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar cotización completa en Supabase
  const saveCotizacion = useCallback(async (cotizacion: Cotizacion, estado: string = 'borrador') => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const id = cotizacion.id || crypto.randomUUID();
      
      const cotizacionDB = {
        id,
        numero: cotizacion.numero,
        usuario_id: user.id,
        cliente_nombre: cotizacion.datosCliente.nombre || cotizacion.datosCliente.empresa || 'Sin cliente',
        proyecto_nombre: cotizacion.proyecto.nombre || 'Sin nombre',
        datos_taller: cotizacion.datosTaller,
        datos_cliente: cotizacion.datosCliente,
        materiales: cotizacion.materiales,
        procesos: cotizacion.procesos,
        costos_adicionales: cotizacion.costosAdicionales,
        margen_utilidad: cotizacion.margenUtilidad,
        iva_porcentaje: cotizacion.ivaPorcentaje,
        subtotal: cotizacion.subtotal,
        total: cotizacion.total,
        estado,
      };

      const { data, error } = await supabase
        .from('cotizaciones')
        .upsert(cotizacionDB)
        .select()
        .single();

      if (error) throw error;
      
      // Actualizar lista local
      setCotizaciones(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index >= 0) {
          const nuevas = [...prev];
          nuevas[index] = data;
          return nuevas;
        }
        return [data, ...prev];
      });

      return data;
    } catch (err: any) {
      console.error('Error al guardar cotización:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener una cotización por ID
  const getCotizacionById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error al obtener cotización:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar cotización
  const deleteCotizacion = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('cotizaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCotizaciones(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error al eliminar cotización:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar estado de cotización
  const updateEstado = useCallback(async (id: string, estado: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .update({ estado, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCotizaciones(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cotizaciones,
    loading,
    error,
    getAllCotizaciones,
    getMisCotizaciones,
    saveCotizacion,
    getCotizacionById,
    deleteCotizacion,
    updateEstado,
  };
}
