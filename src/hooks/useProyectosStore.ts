// src/hooks/useProyectosStore.ts - 100% Supabase, sin localStorage

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ProyectoVenta } from '@/types/ventas';

export const useProyectosStore = () => {
  const [proyectos, setProyectos] = useState<ProyectoVenta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar proyectos desde Supabase al inicializar
  const cargarProyectos = useCallback(async () => {
    console.log('[useProyectosStore] Iniciando carga desde Supabase...');
    try {
      setCargando(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('[useProyectosStore] Error de autenticación:', userError);
        setError('No autenticado');
        return;
      }

      console.log('[useProyectosStore] Usuario:', userData.user.id);

      const { data, error: supabaseError } = await supabase
        .from('proyectos')
        .select('*')
        .order('fecha_venta', { ascending: false });

      if (supabaseError) {
        console.error('[useProyectosStore] Error Supabase:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      console.log('[useProyectosStore] Datos crudos de Supabase:', data);

      if (data && data.length > 0) {
        const proyectosMapeados: ProyectoVenta[] = data.map(p => ({
          id: p.id,
          numeroCotizacion: p.numero_cotizacion || '',
          ordenCompra: p.orden_compra || '',
          clienteId: p.cliente_id || '',
          clienteNombre: p.cliente_nombre || '',
          proyectoNombre: p.proyecto_nombre || '',
          totalCotizado: Number(p.total_cotizado) || 0,
          margenUtilidad: Number(p.margen_utilidad) || 30,
          ivaPorcentaje: Number(p.iva_porcentaje) || 16,
          estado: p.estado || 'en_fabricacion',
          fechaVenta: p.fecha_venta || new Date().toISOString(),
          fechaFabricado: p.fecha_fabricado,
          fechaEntregado: p.fecha_entregado,
          fechaFacturado: p.fecha_facturado,
          numeroFactura: p.numero_factura,
          totalFacturado: p.total_facturado ? Number(p.total_facturado) : undefined,
          utilidadReal: p.utilidad_real ? Number(p.utilidad_real) : undefined,
          materiales: p.materiales || [],
          procesos: p.procesos || [],
          costosAdicionales: p.costos_adicionales || {
            disenoCAD: 0,
            programacionCNC: 0,
            setup: 0,
            transporte: 0,
            otro: 0,
          },
          usuarioId: p.usuario_id,
        }));

        setProyectos(proyectosMapeados);
        console.log('[useProyectosStore] Proyectos cargados:', proyectosMapeados.length);
      } else {
        console.log('[useProyectosStore] No hay proyectos en Supabase');
        setProyectos([]);
      }
    } catch (e: any) {
      console.error('[useProyectosStore] Error general:', e);
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar al montar el componente
  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Convertir cotización a venta
  const convertirAVenta = useCallback(async (datos: {
    numeroCotizacion: string;
    ordenCompra: string;
    clienteId: string;
    clienteNombre: string;
    proyectoNombre: string;
    totalCotizado: number;
    margenUtilidad: number;
    ivaPorcentaje: number;
    materiales: any[];
    procesos: any[];
    costosAdicionales: any;
  }) => {
    console.log('[useProyectosStore] Convirtiendo a venta:', datos);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('[useProyectosStore] No hay usuario autenticado');
        return false;
      }

      const proyectoData = {
        usuario_id: userData.user.id,
        numero_cotizacion: datos.numeroCotizacion,
        orden_compra: datos.ordenCompra,
        cliente_id: datos.clienteId,
        cliente_nombre: datos.clienteNombre,
        proyecto_nombre: datos.proyectoNombre,
        total_cotizado: datos.totalCotizado,
        margen_utilidad: datos.margenUtilidad,
        iva_porcentaje: datos.ivaPorcentaje,
        estado: 'en_fabricacion',
        fecha_venta: new Date().toISOString(),
        materiales: datos.materiales,
        procesos: datos.procesos,
        costos_adicionales: datos.costosAdicionales,
      };

      console.log('[useProyectosStore] Insertando en Supabase:', proyectoData);

      const { data, error } = await supabase
        .from('proyectos')
        .insert([proyectoData])
        .select()
        .single();

      if (error) {
        console.error('[useProyectosStore] Error insertando:', error);
        toast.error('Error guardando venta: ' + error.message);
        return false;
      }

      console.log('[useProyectosStore] Proyecto creado:', data);

      if (data) {
        const nuevoProyecto: ProyectoVenta = {
          id: data.id,
          numeroCotizacion: data.numero_cotizacion,
          ordenCompra: data.orden_compra,
          clienteId: data.cliente_id || '',
          clienteNombre: data.cliente_nombre,
          proyectoNombre: data.proyecto_nombre,
          totalCotizado: Number(data.total_cotizado),
          margenUtilidad: Number(data.margen_utilidad),
          ivaPorcentaje: Number(data.iva_porcentaje),
          estado: data.estado,
          fechaVenta: data.fecha_venta,
          materiales: data.materiales || [],
          procesos: data.procesos || [],
          costosAdicionales: data.costos_adicionales || {},
          usuarioId: data.usuario_id,
        };
        setProyectos(prev => [nuevoProyecto, ...prev]);
      }

      return true;
    } catch (e) {
      console.error('[useProyectosStore] Error en convertirAVenta:', e);
      return false;
    }
  }, []);

  // Marcar como fabricado
  const marcarFabricado = useCallback(async (id: string) => {
    console.log('[useProyectosStore] Marcando fabricado:', id);
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          estado: 'fabricado',
          fecha_fabricado: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('[useProyectosStore] Error:', error);
        return;
      }

      setProyectos(prev => prev.map(p => 
        p.id === id ? { ...p, estado: 'fabricado', fechaFabricado: new Date().toISOString() } : p
      ));
      console.log('[useProyectosStore] Fabricado OK');
    } catch (e) {
      console.error('[useProyectosStore] Error:', e);
    }
  }, []);

  // Marcar como entregado
  const marcarEntregado = useCallback(async (id: string) => {
    console.log('[useProyectosStore] Marcando entregado:', id);
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          estado: 'entregado',
          fecha_entregado: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('[useProyectosStore] Error:', error);
        return;
      }

      setProyectos(prev => prev.map(p => 
        p.id === id ? { ...p, estado: 'entregado', fechaEntregado: new Date().toISOString() } : p
      ));
      console.log('[useProyectosStore] Entregado OK');
    } catch (e) {
      console.error('[useProyectosStore] Error:', e);
    }
  }, []);

  // Marcar como facturado
  const marcarFacturado = useCallback(async (id: string, numeroFactura: string, totalFacturado: number) => {
    console.log('[useProyectosStore] Marcando facturado:', id, numeroFactura, totalFacturado);
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          estado: 'facturado',
          fecha_facturado: new Date().toISOString(),
          numero_factura: numeroFactura,
          total_facturado: totalFacturado
        })
        .eq('id', id);

      if (error) {
        console.error('[useProyectosStore] Error:', error);
        return;
      }

      setProyectos(prev => prev.map(p => 
        p.id === id ? { 
          ...p, 
          estado: 'facturado', 
          fechaFacturado: new Date().toISOString(),
          numeroFactura,
          totalFacturado
        } : p
      ));
      console.log('[useProyectosStore] Facturado OK');
    } catch (e) {
      console.error('[useProyectosStore] Error:', e);
    }
  }, []);

  // Guardar datos reales (control de códigos)
  const guardarDatosReales = useCallback(async (id: string, datos: {
    procesos?: any[];
    procesosReales?: any[];
    materialesReales?: any[];
    costosReales?: any;
    utilidadReal: number;
  }) => {
    console.log('[useProyectosStore] Guardando datos reales:', id, datos);
    try {
      const procesos = datos.procesosReales || datos.procesos || [];

      const { error } = await supabase
        .from('proyectos')
        .update({ 
          procesos: procesos,
          utilidad_real: datos.utilidadReal
        })
        .eq('id', id);

      if (error) {
        console.error('[useProyectosStore] Error:', error);
        return;
      }

      setProyectos(prev => prev.map(p => 
        p.id === id ? { ...p, procesos: procesos, utilidadReal: datos.utilidadReal } : p
      ));
    } catch (e) {
      console.error('[useProyectosStore] Error:', e);
    }
  }, []);

  // Eliminar proyecto
  const eliminarProyecto = useCallback(async (id: string) => {
    console.log('[useProyectosStore] Eliminando:', id);
    try {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (error) {
        console.error('[useProyectosStore] Error:', error);
        return;
      }
      setProyectos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('[useProyectosStore] Error:', e);
    }
  }, []);

  // Refrescar desde Supabase (para usar después de login)
  const refrescarDesdeSupabase = useCallback(async () => {
    console.log('[useProyectosStore] Refrescando desde Supabase...');
    await cargarProyectos();
  }, [cargarProyectos]);

  return {
    proyectos,
    cargando,
    error,
    convertirAVenta,
    eliminarProyecto,
    marcarFabricado,
    marcarEntregado,
    marcarFacturado,
    guardarDatosReales,
    refrescarDesdeSupabase,
    cargarProyectos,
  };
};
