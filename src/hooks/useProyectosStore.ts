// src/hooks/useProyectosStore.ts - Debug version

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ProyectoVenta } from '@/types/ventas';

export const useProyectosStore = () => {
  const [proyectos, setProyectos] = useState<ProyectoVenta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarProyectos = useCallback(async () => {
    console.log('[useProyectosStore] === INICIANDO CARGA ===');
    try {
      setCargando(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('[useProyectosStore] NO HAY USUARIO');
        setError('No autenticado');
        return;
      }

      console.log('[useProyectosStore] Usuario ID:', userData.user.id);

      // Primero verificar que la tabla existe consultando información del schema
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_schema_info', { table_name: 'proyectos' })
        .maybeSingle();

      if (schemaError) {
        console.log('[useProyectosStore] Schema RPC no disponible, continuando...');
      } else {
        console.log('[useProyectosStore] Schema info:', schemaData);
      }

      const { data, error: supabaseError } = await supabase
        .from('proyectos')
        .select('*')
        .order('fecha_venta', { ascending: false });

      if (supabaseError) {
        console.error('[useProyectosStore] ERROR SUPABASE:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      console.log('[useProyectosStore] Datos crudos:', data);

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
        console.log('[useProyectosStore] === CARGADOS:', proyectosMapeados.length, 'proyectos ===');
      } else {
        console.log('[useProyectosStore] === NO HAY PROYECTOS ===');
        setProyectos([]);
      }
    } catch (e: any) {
      console.error('[useProyectosStore] ERROR GENERAL:', e);
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Convertir cotización a venta - CON LOGGING DETALLADO
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
    console.log('[useProyectosStore] === CONVERTIR A VENTA ===');
    console.log('[useProyectosStore] Datos recibidos:', JSON.stringify(datos, null, 2));

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('[useProyectosStore] NO HAY USUARIO AUTENTICADO');
        toast.error('Error: No estás autenticado');
        return false;
      }

      // SANITIZAR DATOS - asegurar que no hay nulls/undefineds
      const proyectoData = {
        usuario_id: userData.user.id,
        numero_cotizacion: datos.numeroCotizacion || '',
        orden_compra: datos.ordenCompra || '',
        cliente_id: datos.clienteId || '',  // Asegurar string, no null
        cliente_nombre: datos.clienteNombre || '',
        proyecto_nombre: datos.proyectoNombre || '',
        total_cotizado: Number(datos.totalCotizado) || 0,
        margen_utilidad: Number(datos.margenUtilidad) || 30,
        iva_porcentaje: Number(datos.ivaPorcentaje) || 16,
        estado: 'en_fabricacion',
        fecha_venta: new Date().toISOString(),
        materiales: datos.materiales || [],
        procesos: datos.procesos || [],
        costos_adicionales: datos.costosAdicionales || {},
      };

      console.log('[useProyectosStore] Datos sanitizados para Supabase:', JSON.stringify(proyectoData, null, 2));

      // INTENTAR INSERT CON SELECT
      console.log('[useProyectosStore] Enviando INSERT a Supabase...');
      const { data, error } = await supabase
        .from('proyectos')
        .insert([proyectoData])
        .select()
        .single();

      if (error) {
        console.error('[useProyectosStore] ERROR INSERT:', error);
        console.error('[useProyectosStore] Error code:', error.code);
        console.error('[useProyectosStore] Error message:', error.message);
        console.error('[useProyectosStore] Error details:', error.details);

        toast.error('Error guardando venta: ' + error.message);
        return false;
      }

      console.log('[useProyectosStore] INSERT EXITOSO, data:', data);

      if (data) {
        const nuevoProyecto: ProyectoVenta = {
          id: data.id,
          numeroCotizacion: data.numero_cotizacion || '',
          ordenCompra: data.orden_compra || '',
          clienteId: data.cliente_id || '',
          clienteNombre: data.cliente_nombre || '',
          proyectoNombre: data.proyecto_nombre || '',
          totalCotizado: Number(data.total_cotizado) || 0,
          margenUtilidad: Number(data.margen_utilidad) || 30,
          ivaPorcentaje: Number(data.iva_porcentaje) || 16,
          estado: data.estado || 'en_fabricacion',
          fechaVenta: data.fecha_venta || new Date().toISOString(),
          materiales: data.materiales || [],
          procesos: data.procesos || [],
          costosAdicionales: data.costos_adicionales || {},
          usuarioId: data.usuario_id,
        };
        setProyectos(prev => [nuevoProyecto, ...prev]);
        console.log('[useProyectosStore] Proyecto agregado al estado local');
      }

      return true;
    } catch (e: any) {
      console.error('[useProyectosStore] ERROR EN CONVERTIR A VENTA:', e);
      console.error('[useProyectosStore] Stack:', e.stack);
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  const marcarFabricado = useCallback(async (id: string) => {
    try {
      await supabase.from('proyectos').update({ estado: 'fabricado', fecha_fabricado: new Date().toISOString() }).eq('id', id);
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'fabricado', fechaFabricado: new Date().toISOString() } : p));
    } catch (e) { console.error(e); }
  }, []);

  const marcarEntregado = useCallback(async (id: string) => {
    try {
      await supabase.from('proyectos').update({ estado: 'entregado', fecha_entregado: new Date().toISOString() }).eq('id', id);
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'entregado', fechaEntregado: new Date().toISOString() } : p));
    } catch (e) { console.error(e); }
  }, []);

  const marcarFacturado = useCallback(async (id: string, numeroFactura: string, totalFacturado: number) => {
    try {
      await supabase.from('proyectos').update({ estado: 'facturado', fecha_facturado: new Date().toISOString(), numero_factura: numeroFactura, total_facturado: totalFacturado }).eq('id', id);
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'facturado', fechaFacturado: new Date().toISOString(), numeroFactura, totalFacturado } : p));
    } catch (e) { console.error(e); }
  }, []);

  const guardarDatosReales = useCallback(async (id: string, datos: any) => {
    try {
      const procesos = datos.procesosReales || datos.procesos || [];
      await supabase.from('proyectos').update({ procesos, utilidad_real: datos.utilidadReal }).eq('id', id);
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, procesos, utilidadReal: datos.utilidadReal } : p));
    } catch (e) { console.error(e); }
  }, []);

  const eliminarProyecto = useCallback(async (id: string) => {
    try {
      await supabase.from('proyectos').delete().eq('id', id);
      setProyectos(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  const refrescarDesdeSupabase = useCallback(async () => {
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
