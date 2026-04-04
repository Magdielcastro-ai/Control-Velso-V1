import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProyectoVenta, EstadoProyecto, MaterialProyecto, ProcesoProyecto, CostosAdicionalesProyecto } from '@/types/ventas';

const STORAGE_KEY_PROYECTOS = 'velso_proyectos';

export const useProyectosStore = () => {
  const [proyectos, setProyectos] = useState<ProyectoVenta[]>([]);
  const [cargado, setCargado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar proyectos: primero Supabase, localStorage como fallback (modo offline)
  useEffect(() => {
    const cargarProyectos = async () => {
      setLoading(true);
      
      try {
        console.log('[useProyectosStore] Cargando desde Supabase...');
        const { data, error: supabaseError } = await supabase
          .from('proyectos')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) throw supabaseError;

        if (data) {
          const proyectosFormateados: ProyectoVenta[] = data.map(p => ({
            id: p.id,
            numeroCotizacion: p.numero_cotizacion,
            ordenCompra: p.orden_compra,
            usuarioId: p.usuario_id,
            clienteId: p.cliente_id || '',
            clienteNombre: p.cliente_nombre,
            proyectoNombre: p.proyecto_nombre,
            totalCotizado: p.total_cotizado,
            totalFacturado: p.total_facturado,
            margenUtilidad: p.margen_utilidad,
            ivaPorcentaje: p.iva_porcentaje,
            materiales: p.materiales || [],
            procesos: p.procesos || [],
            costosAdicionales: p.costos_adicionales || {},
            estado: p.estado as EstadoProyecto,
            numeroFactura: p.numero_factura,
            fechaVenta: p.fecha_venta ? p.fecha_venta.split('T')[0] : new Date().toISOString().split('T')[0],
            fechaFabricado: p.fecha_fabricado ? p.fecha_fabricado.split('T')[0] : undefined,
            fechaEntregado: p.fecha_entregado ? p.fecha_entregado.split('T')[0] : undefined,
            fechaFacturado: p.fecha_facturado ? p.fecha_facturado.split('T')[0] : undefined,
            utilidadReal: p.utilidad_real,
          }));
          
          setProyectos(proyectosFormateados);
          localStorage.setItem(STORAGE_KEY_PROYECTOS, JSON.stringify(proyectosFormateados));
          console.log('[useProyectosStore] Cargados desde Supabase:', data.length);
        }
      } catch (err: any) {
        console.warn('[useProyectosStore] Error de conexión, usando localStorage:', err.message);
        // MODO OFFLINE: Cargar de localStorage
        const guardado = localStorage.getItem(STORAGE_KEY_PROYECTOS);
        if (guardado) {
          try {
            setProyectos(JSON.parse(guardado));
            console.log('[useProyectosStore] Cargados desde localStorage (offline)');
          } catch (e) {
            console.error('[useProyectosStore] Error parseando localStorage:', e);
          }
        }
      } finally {
        setLoading(false);
        setCargado(true);
      }
    };

    cargarProyectos();
  }, []);

  // Guardar proyectos en localStorage cuando cambien
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY_PROYECTOS, JSON.stringify(proyectos));
    }
  }, [proyectos, cargado]);

  // Convertir cotización a proyecto/venta (Supabase + local)
  const convertirAVenta = useCallback(async (datos: {
    numeroCotizacion: string;
    ordenCompra: string;
    clienteId: string;
    clienteNombre: string;
    proyectoNombre: string;
    totalCotizado: number;
    margenUtilidad: number;
    ivaPorcentaje: number;
    materiales: MaterialProyecto[];
    procesos: ProcesoProyecto[];
    costosAdicionales: CostosAdicionalesProyecto;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const nuevo: ProyectoVenta = {
      ...datos,
      id: crypto.randomUUID(),
      fechaVenta: new Date().toISOString().split('T')[0],
      estado: 'en_fabricacion',
      totalFacturado: undefined,
      numeroFactura: undefined,
      usuarioId: user?.id,
    };
    
    // Guardar en Supabase
    try {
      const { error } = await supabase
        .from('proyectos')
        .insert([{
          id: nuevo.id,
          numero_cotizacion: nuevo.numeroCotizacion,
          orden_compra: nuevo.ordenCompra,
          usuario_id: user?.id,
          cliente_id: nuevo.clienteId || null,
          cliente_nombre: nuevo.clienteNombre,
          proyecto_nombre: nuevo.proyectoNombre,
          total_cotizado: nuevo.totalCotizado,
          margen_utilidad: nuevo.margenUtilidad,
          iva_porcentaje: nuevo.ivaPorcentaje,
          materiales: nuevo.materiales,
          procesos: nuevo.procesos,
          costos_adicionales: nuevo.costosAdicionales,
          estado: nuevo.estado,
          fecha_venta: nuevo.fechaVenta,
        }]);
      
      if (error) {
        console.error('[useProyectosStore] Error guardando en Supabase:', error);
      }
    } catch (err) {
      console.error('[useProyectosStore] Error:', err);
    }
    
    setProyectos(prev => [nuevo, ...prev]);
    return nuevo;
  }, []);

  // Cambiar estado a fabricado
  const marcarFabricado = useCallback(async (id: string) => {
    const fechaFabricado = new Date().toISOString().split('T')[0];
    
    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          estado: 'fabricado', 
          fecha_fabricado: fechaFabricado 
        })
        .eq('id', id);
      
      if (error) {
        console.error('[useProyectosStore] Error actualizando en Supabase:', error);
      }
    } catch (err) {
      console.error('[useProyectosStore] Error:', err);
    }
    
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, estado: 'fabricado', fechaFabricado } 
        : p
    ));
  }, []);

  // Cambiar estado a entregado
  const marcarEntregado = useCallback(async (id: string) => {
    const fechaEntregado = new Date().toISOString().split('T')[0];
    
    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          estado: 'entregado', 
          fecha_entregado: fechaEntregado 
        })
        .eq('id', id);
      
      if (error) {
        console.error('[useProyectosStore] Error actualizando en Supabase:', error);
      }
    } catch (err) {
      console.error('[useProyectosStore] Error:', err);
    }
    
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, estado: 'entregado', fechaEntregado } 
        : p
    ));
  }, []);

  // Cambiar estado a facturado
  const marcarFacturado = useCallback(async (id: string, numeroFactura: string, totalFacturado: number) => {
    const fechaFacturado = new Date().toISOString().split('T')[0];
    
    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          estado: 'facturado', 
          fecha_facturado: fechaFacturado,
          numero_factura: numeroFactura,
          total_facturado: totalFacturado,
        })
        .eq('id', id);
      
      if (error) {
        console.error('[useProyectosStore] Error actualizando en Supabase:', error);
      }
    } catch (err) {
      console.error('[useProyectosStore] Error:', err);
    }
    
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { 
            ...p, 
            estado: 'facturado', 
            fechaFacturado,
            numeroFactura,
            totalFacturado
          } 
        : p
    ));
  }, []);

  // Guardar datos reales del proyecto (control de códigos)
  const guardarDatosReales = useCallback(async (id: string, datos: {
    materialesReales: MaterialProyecto[];
    procesosReales: ProcesoProyecto[];
    costosAdicionalesReales: CostosAdicionalesProyecto;
    costoTotalReal: number;
    utilidadReal: number;
    porcentajeUtilidadReal: number;
  }) => {
    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          materiales: datos.materialesReales,
          procesos: datos.procesosReales,
          costos_adicionales: datos.costosAdicionalesReales,
          utilidad_real: datos.utilidadReal,
        })
        .eq('id', id);
      
      if (error) {
        console.error('[useProyectosStore] Error actualizando en Supabase:', error);
      }
    } catch (err) {
      console.error('[useProyectosStore] Error:', err);
    }
    
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...datos } 
        : p
    ));
  }, []);

  // Eliminar proyecto
  const eliminarProyecto = useCallback(async (id: string) => {
    // Eliminar de Supabase
    try {
      const { error } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[useProyectosStore] Error eliminando de Supabase:', error);
      }
    } catch (err) {
      console.error('[useProyectosStore] Error:', err);
    }
    
    setProyectos(prev => prev.filter(p => p.id !== id));
  }, []);

  // Obtener proyectos por estado
  const getProyectosPorEstado = useCallback((estado: EstadoProyecto) => {
    return proyectos.filter(p => p.estado === estado);
  }, [proyectos]);

  // Obtener proyectos por mes
  const getProyectosPorMes = useCallback((mes: number, anio: number) => {
    return proyectos.filter(p => {
      const fecha = new Date(p.fechaVenta);
      return fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });
  }, [proyectos]);

  // Obtener proyectos facturados por mes
  const getProyectosFacturadosPorMes = useCallback((mes: number, anio: number) => {
    return proyectos.filter(p => {
      if (p.estado !== 'facturado' || !p.fechaFacturado) return false;
      const fecha = new Date(p.fechaFacturado);
      return fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });
  }, [proyectos]);

  // Calcular totales por mes
  const getTotalesPorMes = useCallback((mes: number, anio: number) => {
    const proyectosMes = getProyectosPorMes(mes, anio);
    const facturadosMes = getProyectosFacturadosPorMes(mes, anio);
    
    return {
      totalVendido: proyectosMes.reduce((sum, p) => sum + p.totalCotizado, 0),
      totalFacturado: facturadosMes.reduce((sum, p) => sum + (p.totalFacturado || 0), 0),
      totalUtilidad: facturadosMes.reduce((sum, p) => sum + (p.utilidadReal || 0), 0),
      cantidadVendidos: proyectosMes.length,
      cantidadFacturados: facturadosMes.length,
    };
  }, [getProyectosPorMes, getProyectosFacturadosPorMes]);

  // Calcular horas por estado
  const getHorasPorEstado = useCallback((mes: number, anio: number) => {
    const proyectosMes = getProyectosPorMes(mes, anio);
    
    const horas: Record<string, { vendidas: number; fabricadas: number; facturadas: number }> = {};
    
    proyectosMes.forEach(p => {
      p.procesos.forEach(proc => {
        const tiempoHoras = (proc.tiempoMinutosCotizado || 0) / 60;
        const tiempoRealHoras = (proc.tiempoMinutosReal || proc.tiempoMinutosCotizado || 0) / 60;
        
        if (!horas[proc.tipo]) {
          horas[proc.tipo] = { vendidas: 0, fabricadas: 0, facturadas: 0 };
        }
        
        horas[proc.tipo].vendidas += tiempoHoras;
        
        if (p.estado === 'fabricado' || p.estado === 'entregado' || p.estado === 'facturado') {
          horas[proc.tipo].fabricadas += tiempoRealHoras;
        }
        
        if (p.estado === 'facturado') {
          horas[proc.tipo].facturadas += tiempoRealHoras;
        }
      });
    });
    
    return horas;
  }, [getProyectosPorMes]);

  // Recargar proyectos desde Supabase
  const recargarProyectos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const proyectosFormateados: ProyectoVenta[] = data.map(p => ({
          id: p.id,
          numeroCotizacion: p.numero_cotizacion,
          ordenCompra: p.orden_compra,
          usuarioId: p.usuario_id,
          clienteId: p.cliente_id || '',
          clienteNombre: p.cliente_nombre,
          proyectoNombre: p.proyecto_nombre,
          totalCotizado: p.total_cotizado,
          totalFacturado: p.total_facturado,
          margenUtilidad: p.margen_utilidad,
          ivaPorcentaje: p.iva_porcentaje,
          materiales: p.materiales || [],
          procesos: p.procesos || [],
          costosAdicionales: p.costos_adicionales || {},
          estado: p.estado as EstadoProyecto,
          numeroFactura: p.numero_factura,
          fechaVenta: p.fecha_venta ? p.fecha_venta.split('T')[0] : new Date().toISOString().split('T')[0],
          fechaFabricado: p.fecha_fabricado ? p.fecha_fabricado.split('T')[0] : undefined,
          fechaEntregado: p.fecha_entregado ? p.fecha_entregado.split('T')[0] : undefined,
          fechaFacturado: p.fecha_facturado ? p.fecha_facturado.split('T')[0] : undefined,
          utilidadReal: p.utilidad_real,
        }));
        setProyectos(proyectosFormateados);
        localStorage.setItem(STORAGE_KEY_PROYECTOS, JSON.stringify(proyectosFormateados));
      }
    } catch (err: any) {
      console.error('[useProyectosStore] Error recargando:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    proyectos,
    cargado,
    loading,
    error,
    convertirAVenta,
    marcarFabricado,
    marcarEntregado,
    marcarFacturado,
    guardarDatosReales,
    eliminarProyecto,
    getProyectosPorEstado,
    getProyectosPorMes,
    getProyectosFacturadosPorMes,
    getTotalesPorMes,
    getHorasPorEstado,
    recargarProyectos,
  };
};
