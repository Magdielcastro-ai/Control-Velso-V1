import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ProyectoVenta } from '@/types/ventas';

export const useProyectosStore = () => {
  const [proyectos, setProyectos] = useState<ProyectoVenta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTime = useRef(0);
  const LOAD_DEBOUNCE = 2000;

  const cargarProyectos = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('[useProyectosStore] Carga ya en progreso, saltando...');
      return;
    }

    const now = Date.now();
    if (now - lastLoadTime.current < LOAD_DEBOUNCE && proyectos.length > 0) {
      console.log('[useProyectosStore] Datos recientes, saltando recarga');
      return;
    }

    console.log('[useProyectosStore] === INICIANDO CARGA ===');
    isLoadingRef.current = true;

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
        lastLoadTime.current = Date.now();
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
      isLoadingRef.current = false;
    }
  }, [proyectos.length]);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Helper para hacer update con fallback
  const updateProyectoSeguro = useCallback(async (
    id: string,
    datosCompletos: any,
    datosMinimos: any,
    nombreAccion: string
  ) => {
    try {
      // Intento 1: update completo
      let { error } = await supabase
        .from('proyectos')
        .update(datosCompletos)
        .eq('id', id);

      if (error) {
        console.warn(`[useProyectosStore] ${nombreAccion} error completo:`, error.message);

        // Intento 2: update mínimo (solo estado)
        const { error: errorMinimo } = await supabase
          .from('proyectos')
          .update(datosMinimos)
          .eq('id', id);

        if (errorMinimo) {
          console.error(`[useProyectosStore] ${nombreAccion} error mínimo:`, errorMinimo.message);
          toast.error(`${nombreAccion} falló: ${errorMinimo.message}`);
          return false;
        }

        console.log(`[useProyectosStore] ${nombreAccion} exitoso (mínimo)`);
        return true;
      }

      console.log(`[useProyectosStore] ${nombreAccion} exitoso (completo)`);
      return true;
    } catch (e: any) {
      console.error(`[useProyectosStore] ${nombreAccion} excepción:`, e.message);
      toast.error(`${nombreAccion} falló: ${e.message}`);
      return false;
    }
  }, []);

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

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Error: No estás autenticado');
        return false;
      }

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

      if (datos.clienteId && datos.clienteId.trim() !== '') {
        proyectoData.cliente_id = datos.clienteId;
      }

      const { data, error } = await supabase
        .from('proyectos')
        .insert([proyectoData])
        .select()
        .single();

      if (error) {
        console.error('[useProyectosStore] ERROR INSERT:', error);

        if (error.message?.includes('cliente_id') || error.code === 'PGRST204') {
          console.log('[useProyectosStore] Reintentando sin cliente_id...');
          delete proyectoData.cliente_id;

          const { data: retryData, error: retryError } = await supabase
            .from('proyectos')
            .insert([proyectoData])
            .select()
            .single();

          if (retryError) {
            toast.error('Error guardando venta: ' + retryError.message);
            return false;
          }

          if (retryData) {
            const nuevoProyecto: ProyectoVenta = {
              id: retryData.id,
              numeroCotizacion: retryData.numero_cotizacion || '',
              ordenCompra: retryData.orden_compra || '',
              clienteId: '',
              clienteNombre: retryData.cliente_nombre || '',
              proyectoNombre: retryData.proyecto_nombre || '',
              totalCotizado: Number(retryData.total_cotizado) || 0,
              margenUtilidad: Number(retryData.margen_utilidad) || 30,
              ivaPorcentaje: Number(retryData.iva_porcentaje) || 16,
              estado: retryData.estado || 'en_fabricacion',
              fechaVenta: retryData.fecha_venta || new Date().toISOString(),
              materiales: retryData.materiales || [],
              procesos: retryData.procesos || [],
              costosAdicionales: retryData.costos_adicionales || {},
              usuarioId: retryData.usuario_id,
            };
            setProyectos(prev => [nuevoProyecto, ...prev]);
            return true;
          }
        }

        toast.error('Error guardando venta: ' + error.message);
        return false;
      }

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
      }

      return true;
    } catch (e: any) {
      console.error('[useProyectosStore] ERROR EN CONVERTIR A VENTA:', e);
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  const marcarFabricado = useCallback(async (id: string) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const exitoso = await updateProyectoSeguro(
      id,
      { estado: 'fabricado', fecha_fabricado: fechaHoy },
      { estado: 'fabricado' },
      'Marcar fabricado'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'fabricado', fechaFabricado: fechaHoy } : p));
      toast.success('Proyecto marcado como fabricado');
    }
  }, [updateProyectoSeguro]);

  const marcarEntregado = useCallback(async (id: string) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const exitoso = await updateProyectoSeguro(
      id,
      { estado: 'entregado', fecha_entregado: fechaHoy },
      { estado: 'entregado' },
      'Marcar entregado'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'entregado', fechaEntregado: fechaHoy } : p));
      toast.success('Proyecto marcado como entregado');
    }
  }, [updateProyectoSeguro]);

  const marcarFacturado = useCallback(async (id: string, numeroFactura: string, totalFacturado: number) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const exitoso = await updateProyectoSeguro(
      id,
      {
        estado: 'facturado',
        fecha_facturado: fechaHoy,
        numero_factura: numeroFactura,
        total_facturado: totalFacturado
      },
      { estado: 'facturado' },
      'Marcar facturado'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? {
        ...p,
        estado: 'facturado',
        fechaFacturado: fechaHoy,
        numeroFactura,
        totalFacturado
      } : p));
      toast.success('Proyecto facturado');
    }
  }, [updateProyectoSeguro]);

  const guardarDatosReales = useCallback(async (id: string, datos: any) => {
    const procesos = datos.procesosReales || datos.procesos || [];
    const utilidadReal = datos.utilidadReal;

    const updateData: any = {};
    if (procesos.length > 0) updateData.procesos = procesos;
    if (utilidadReal !== undefined && utilidadReal !== null) updateData.utilidad_real = utilidadReal;

    const exitoso = await updateProyectoSeguro(
      id,
      updateData,
      {},
      'Guardar datos reales'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? {
        ...p,
        procesos: procesos.length > 0 ? procesos : p.procesos,
        utilidadReal: utilidadReal !== undefined ? utilidadReal : p.utilidadReal
      } : p));
    }
  }, [updateProyectoSeguro]);

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
