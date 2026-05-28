// src/hooks/useProyectosStore.ts - Sin cliente_id para evitar error schema cache

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
          clienteId: p.cliente_id || p.clienteid || '',
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

  // Convertir cotización a venta - SIN cliente_id para evitar error schema cache
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

      // Datos SIN cliente_id para evitar error schema cache
      const proyectoData: any = {
        usuario_id: userData.user.id,
        numero_cotizacion: datos.numeroCotizacion || '',
        orden_compra: datos.ordenCompra || '',
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

      // Solo agregar cliente_id si existe en la tabla
      // Por ahora lo omitimos para evitar el error PGRST204
      console.log('[useProyectosStore] Datos para Supabase (sin cliente_id):', JSON.stringify(proyectoData, null, 2));

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

        toast.error('Error guardando venta: ' + error.message);
        return false;
      }

      console.log('[useProyectosStore] INSERT EXITOSO, data:', data);

      if (data) {
        const nuevoProyecto: ProyectoVenta = {
          id: data.id,
          numeroCotizacion: data.numero_cotizacion || '',
          ordenCompra: data.orden_compra || '',
          clienteId: '', // No se guardó cliente_id
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
      const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const { error } = await supabase
        .from('proyectos')
        .update({ estado: 'fabricado', fecha_fabricado: fechaHoy })
        .eq('id', id);

      if (error) {
        console.error('[useProyectosStore] Error fabricado:', error);
        toast.error('Error: ' + error.message);
        return;
      }

      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'fabricado', fechaFabricado: fechaHoy } : p));
      toast.success('Proyecto marcado como fabricado');
    } catch (e) { console.error(e); }
  }, []);

  const marcarEntregado = useCallback(async (id: string) => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const { error } = await supabase
        .from('proyectos')
        .update({ estado: 'entregado', fecha_entregado: fechaHoy })
        .eq('id', id);

      if (error) {
        console.error('[useProyectosStore] Error entregado:', error);
        toast.error('Error: ' + error.message);
        return;
      }

      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'entregado', fechaEntregado: fechaHoy } : p));
      toast.success('Proyecto marcado como entregado');
    } catch (e) { console.error(e); }
  }, []);

  const marcarFacturado = useCallback(async (id: string, numeroFactura: string, totalFacturado: number) => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          estado: 'facturado', 
          fecha_facturado: fechaHoy, 
          numero_factura: numeroFactura, 
          total_facturado: totalFacturado 
        })
        .eq('id', id);

      if (error) {
        console.error('[useProyectosStore] Error facturado:', error);
        toast.error('Error: ' + error.message);
        return;
      }

      setProyectos(prev => prev.map(p => p.id === id ? { 
        ...p, 
        estado: 'facturado', 
        fechaFacturado: fechaHoy, 
        numeroFactura, 
        totalFacturado 
      } : p));
      toast.success('Proyecto facturado');
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
