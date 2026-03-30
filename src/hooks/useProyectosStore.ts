import { useState, useEffect, useCallback } from 'react';
import type { ProyectoVenta, EstadoProyecto, MaterialProyecto, ProcesoProyecto, CostosAdicionalesProyecto } from '@/types/ventas';

const STORAGE_KEY_PROYECTOS = 'velso_proyectos';

export const useProyectosStore = () => {
  const [proyectos, setProyectos] = useState<ProyectoVenta[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar proyectos del localStorage
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY_PROYECTOS);
    if (guardado) {
      try {
        setProyectos(JSON.parse(guardado));
      } catch (e) {
        console.error('Error al cargar proyectos:', e);
      }
    }
    setCargado(true);
  }, []);

  // Guardar proyectos en localStorage
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY_PROYECTOS, JSON.stringify(proyectos));
    }
  }, [proyectos, cargado]);

  // Convertir cotización a proyecto/venta
  const convertirAVenta = useCallback((datos: {
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
    const nuevo: ProyectoVenta = {
      ...datos,
      id: crypto.randomUUID(),
      fechaVenta: new Date().toISOString().split('T')[0],
      estado: 'en_fabricacion',
      totalFacturado: undefined,
      numeroFactura: undefined,
    };
    setProyectos(prev => [nuevo, ...prev]);
    return nuevo;
  }, []);

  // Cambiar estado a fabricado
  const marcarFabricado = useCallback((id: string) => {
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, estado: 'fabricado', fechaFabricado: new Date().toISOString().split('T')[0] } 
        : p
    ));
  }, []);

  // Cambiar estado a entregado
  const marcarEntregado = useCallback((id: string) => {
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, estado: 'entregado', fechaEntregado: new Date().toISOString().split('T')[0] } 
        : p
    ));
  }, []);

  // Cambiar estado a facturado
  const marcarFacturado = useCallback((id: string, numeroFactura: string, totalFacturado: number) => {
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { 
            ...p, 
            estado: 'facturado', 
            fechaFacturado: new Date().toISOString().split('T')[0],
            numeroFactura,
            totalFacturado
          } 
        : p
    ));
  }, []);

  // Guardar datos reales del proyecto (control de códigos)
  const guardarDatosReales = useCallback((id: string, datos: {
    materialesReales: MaterialProyecto[];
    procesosReales: ProcesoProyecto[];
    costosAdicionalesReales: CostosAdicionalesProyecto;
    costoTotalReal: number;
    utilidadReal: number;
    porcentajeUtilidadReal: number;
  }) => {
    setProyectos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...datos } 
        : p
    ));
  }, []);

  // Eliminar proyecto
  const eliminarProyecto = useCallback((id: string) => {
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
        
        // Siempre cuenta como vendida
        horas[proc.tipo].vendidas += tiempoHoras;
        
        // Si está fabricado o más allá
        if (p.estado === 'fabricado' || p.estado === 'entregado' || p.estado === 'facturado') {
          horas[proc.tipo].fabricadas += tiempoRealHoras;
        }
        
        // Si está facturado
        if (p.estado === 'facturado') {
          horas[proc.tipo].facturadas += tiempoRealHoras;
        }
      });
    });
    
    return horas;
  }, [getProyectosPorMes]);

  return {
    proyectos,
    cargado,
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
  };
};
