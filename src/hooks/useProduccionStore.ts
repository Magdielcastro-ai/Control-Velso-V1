import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type {
  RegistroProduccion,
  ResumenProduccionPieza,
  ResumenProduccionProyecto,
  EstadoProcesoProduccion,
  TipoIncidencia,
  MetricasReporte,
  PeriodoReporte,
} from '@/types/produccion';
import type { ProyectoVenta } from '@/types/ventas';
import type { Cotizacion } from '@/types/cotizacion';
import { COSTOS_MANO_OBRA } from '@/types/cotizacion';

// ========== HELPERS ==========

const calcularCostoRealProceso = (
  tiempoRealMinutos: number,
  tipoManoObra?: 'mo_s' | 'mo_e'
): number => {
  const tiempoHoras = tiempoRealMinutos / 60;
  const costoMO = tipoManoObra
    ? tiempoHoras * (tipoManoObra === 'mo_e' ? COSTOS_MANO_OBRA.mo_e : COSTOS_MANO_OBRA.mo_s)
    : 0;
  return costoMO;
};

const generarAlertas = (resumen: ResumenProduccionProyecto) => {
  const alertas: ResumenProduccionProyecto['alertas'] = [];

  // Alerta por tiempo
  if (resumen.eficienciaGlobal < 70) {
    alertas.push({
      tipo: 'tiempo',
      severidad: 'alta',
      mensaje: `Eficiencia de tiempo: ${resumen.eficienciaGlobal.toFixed(0)}% (muy por debajo del 100%)`,
    });
  } else if (resumen.eficienciaGlobal < 85) {
    alertas.push({
      tipo: 'tiempo',
      severidad: 'media',
      mensaje: `Eficiencia de tiempo: ${resumen.eficienciaGlobal.toFixed(0)}% (bajo el 85%)`,
    });
  }

  // Alerta por utilidad
  if (resumen.porcentajeDesviacionUtilidad < -30) {
    alertas.push({
      tipo: 'utilidad',
      severidad: 'critica',
      mensaje: `Utilidad real ${resumen.porcentajeUtilidadReal.toFixed(1)}% (desviación ${resumen.porcentajeDesviacionUtilidad.toFixed(1)}%)`,
    });
  } else if (resumen.porcentajeDesviacionUtilidad < -15) {
    alertas.push({
      tipo: 'utilidad',
      severidad: 'alta',
      mensaje: `Utilidad real ${resumen.porcentajeUtilidadReal.toFixed(1)}% (desviación ${resumen.porcentajeDesviacionUtilidad.toFixed(1)}%)`,
    });
  }

  return alertas;
};

// ========== STORE ==========

export const useProduccionStore = () => {
  const [registros, setRegistros] = useState<RegistroProduccion[]>([]);
  const [cargando, setCargando] = useState(false);

  // ========== CARGAR REGISTROS ==========

  const cargarRegistros = useCallback(async (proyectoId?: string) => {
    setCargando(true);
    try {
      let query = supabase
        .from('registros_produccion')
        .select('*')
        .order('created_at', { ascending: true });

      if (proyectoId) {
        query = query.eq('proyecto_id', proyectoId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const registrosFormateados: RegistroProduccion[] = (data || []).map(r => ({
        id: r.id,
        proyectoId: r.proyecto_id,
        piezaId: r.pieza_id,
        piezaNombre: r.pieza_nombre,
        procesoTipo: r.proceso_tipo,
        procesoNombre: r.proceso_nombre,
        operadorId: r.operador_id,
        operadorNombre: r.operador_nombre,
        tiempoEstimadoMinutos: r.tiempo_estimado_minutos || 0,
        tiempoRealMinutos: r.tiempo_real_minutos || 0,
        fechaInicio: r.fecha_inicio,
        fechaFin: r.fecha_fin,
        costoEstimado: r.costo_estimado || 0,
        costoReal: r.costo_real || 0,
        estado: r.estado as EstadoProcesoProduccion,
        notas: r.notas,
        incidencias: r.incidencias,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      setRegistros(registrosFormateados);
      return registrosFormateados;
    } catch (err: any) {
      console.error('[useProduccionStore] Error cargando registros:', err);
      toast.error('Error cargando registros de producción');
      return [];
    } finally {
      setCargando(false);
    }
  }, []);

  // ========== CREAR REGISTROS DESDE COTIZACIÓN ==========

  const inicializarProduccionDesdeProyecto = useCallback(async (
    proyecto: ProyectoVenta,
    cotizacion: Cotizacion
  ) => {
    const registrosNuevos: Omit<RegistroProduccion, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const pieza of cotizacion.piezas) {
      for (const proceso of pieza.procesos) {
        if (proceso.tipo === 'otro') continue; // Procesos externos no se registran en producción

        const costoEstimado = proceso.costoTotal;

        registrosNuevos.push({
          proyectoId: proyecto.id,
          piezaId: pieza.id,
          piezaNombre: pieza.nombre,
          procesoTipo: proceso.tipo,
          procesoNombre: proceso.nombre,
          tiempoEstimadoMinutos: proceso.tiempoMinutos,
          tiempoRealMinutos: 0,
          costoEstimado,
          costoReal: 0,
          estado: 'pendiente',
        });
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const registrosDB = registrosNuevos.map(r => ({
        proyecto_id: r.proyectoId,
        pieza_id: r.piezaId,
        pieza_nombre: r.piezaNombre,
        proceso_tipo: r.procesoTipo,
        proceso_nombre: r.procesoNombre,
        tiempo_estimado_minutos: r.tiempoEstimadoMinutos,
        tiempo_real_minutos: r.tiempoRealMinutos,
        costo_estimado: r.costoEstimado,
        costo_real: r.costoReal,
        estado: r.estado,
        usuario_id: user.id,
      }));

      const { error } = await supabase
        .from('registros_produccion')
        .insert(registrosDB);

      if (error) throw error;

      toast.success('Producción inicializada con ' + registrosNuevos.length + ' procesos');
      await cargarRegistros(proyecto.id);
    } catch (err: any) {
      console.error('[useProduccionStore] Error inicializando:', err);
      toast.error('Error inicializando producción: ' + err.message);
    }
  }, [cargarRegistros]);

  // ========== ACTUALIZAR REGISTRO ==========

  const actualizarRegistro = useCallback(async (
    registroId: string,
    datos: Partial<RegistroProduccion>
  ) => {
    try {
      const updates: any = {};
      if (datos.tiempoRealMinutos !== undefined) updates.tiempo_real_minutos = datos.tiempoRealMinutos;
      if (datos.costoReal !== undefined) updates.costo_real = datos.costoReal;
      if (datos.estado !== undefined) updates.estado = datos.estado;
      if (datos.fechaInicio !== undefined) updates.fecha_inicio = datos.fechaInicio;
      if (datos.fechaFin !== undefined) updates.fecha_fin = datos.fechaFin;
      if (datos.notas !== undefined) updates.notas = datos.notas;
      if (datos.incidencias !== undefined) updates.incidencias = datos.incidencias;
      if (datos.operadorId !== undefined) updates.operador_id = datos.operadorId;
      if (datos.operadorNombre !== undefined) updates.operador_nombre = datos.operadorNombre;

      const { error } = await supabase
        .from('registros_produccion')
        .update(updates)
        .eq('id', registroId);

      if (error) throw error;

      // Actualizar estado local
      setRegistros(prev => prev.map(r =>
        r.id === registroId ? { ...r, ...datos, updatedAt: new Date().toISOString() } : r
      ));

      toast.success('Registro actualizado');
    } catch (err: any) {
      console.error('[useProduccionStore] Error actualizando:', err);
      toast.error('Error actualizando registro');
    }
  }, []);

  // ========== INICIAR PROCESO ==========

  const iniciarProceso = useCallback(async (registroId: string, operadorId?: string, operadorNombre?: string) => {
    await actualizarRegistro(registroId, {
      estado: 'en_proceso',
      fechaInicio: new Date().toISOString(),
      operadorId,
      operadorNombre,
    });
  }, [actualizarRegistro]);

  // ========== COMPLETAR PROCESO ==========

  const completarProceso = useCallback(async (registroId: string, tiempoRealMinutos: number) => {
    const registro = registros.find(r => r.id === registroId);
    if (!registro) return;

    const costoReal = calcularCostoRealProceso(
      tiempoRealMinutos,
      registro.procesoTipo === 'torno_cnc' || registro.procesoTipo === 'cnc_vertical'
        ? 'mo_e'
        : 'mo_s'
    );

    await actualizarRegistro(registroId, {
      estado: 'completado',
      tiempoRealMinutos,
      costoReal,
      fechaFin: new Date().toISOString(),
    });
  }, [registros, actualizarRegistro]);

  // ========== AGREGAR INCIDENCIA ==========

  const agregarIncidencia = useCallback(async (
    registroId: string,
    tipo: TipoIncidencia,
    descripcion: string,
    costoImpacto?: number
  ) => {
    const registro = registros.find(r => r.id === registroId);
    if (!registro) return;

    const incidencias = [...(registro.incidencias || []), { tipo, descripcion, costoImpacto }];
    await actualizarRegistro(registroId, { incidencias });
  }, [registros, actualizarRegistro]);

  // ========== RESUMEN POR PROYECTO ==========

  const generarResumenProyecto = useCallback((
    proyecto: ProyectoVenta,
    cotizacion: Cotizacion
  ): ResumenProduccionProyecto => {
    const registrosProyecto = registros.filter(r => r.proyectoId === proyecto.id);

    // Agrupar por pieza
    const piezasMap = new Map<string, ResumenProduccionPieza>();

    for (const pieza of cotizacion.piezas) {
      const registrosPieza = registrosProyecto.filter(r => r.piezaId === pieza.id);

      const tiempoEstimadoTotal = pieza.procesos
        .filter(p => p.tipo !== 'otro')
        .reduce((sum, p) => sum + p.tiempoMinutos, 0);

      const costoEstimadoTotal = pieza.procesos
        .filter(p => p.tipo !== 'otro')
        .reduce((sum, p) => sum + p.costoTotal, 0);

      const tiempoRealTotal = registrosPieza.reduce((sum, r) => sum + r.tiempoRealMinutos, 0);
      const costoRealTotal = registrosPieza.reduce((sum, r) => sum + r.costoReal, 0);

      const diferenciaTiempo = tiempoRealTotal - tiempoEstimadoTotal;
      const diferenciaCosto = costoRealTotal - costoEstimadoTotal;

      piezasMap.set(pieza.id, {
        piezaId: pieza.id,
        piezaNombre: pieza.nombre,
        cantidad: pieza.cantidad,
        tiempoEstimadoTotalMin: tiempoEstimadoTotal,
        costoEstimadoTotal,
        tiempoRealTotalMin: tiempoRealTotal,
        costoRealTotal,
        diferenciaTiempoMin: diferenciaTiempo,
        diferenciaCosto,
        porcentajeDesviacionTiempo: tiempoEstimadoTotal > 0
          ? (diferenciaTiempo / tiempoEstimadoTotal) * 100
          : 0,
        porcentajeDesviacionCosto: costoEstimadoTotal > 0
          ? (diferenciaCosto / costoEstimadoTotal) * 100
          : 0,
        procesos: registrosPieza,
      });
    }

    const piezas = Array.from(piezasMap.values());

    const tiempoTotalEstimado = piezas.reduce((sum, p) => sum + p.tiempoEstimadoTotalMin, 0);
    const tiempoTotalReal = piezas.reduce((sum, p) => sum + p.tiempoRealTotalMin, 0);
    const costoRealTotal = piezas.reduce((sum, p) => sum + p.costoRealTotal, 0);

    const eficienciaGlobal = tiempoTotalEstimado > 0
      ? (tiempoTotalEstimado / tiempoTotalReal) * 100
      : 0;

    const utilidadReal = proyecto.totalCotizado - costoRealTotal;
    const porcentajeUtilidadReal = proyecto.totalCotizado > 0
      ? (utilidadReal / proyecto.totalCotizado) * 100
      : 0;

    const desviacionUtilidad = utilidadReal - (proyecto.totalCotizado * (proyecto.margenUtilidad / 100));
    const porcentajeDesviacionUtilidad = proyecto.margenUtilidad > 0
      ? ((porcentajeUtilidadReal - proyecto.margenUtilidad) / proyecto.margenUtilidad) * 100
      : 0;

    const resumen: ResumenProduccionProyecto = {
      proyectoId: proyecto.id,
      proyectoNombre: proyecto.proyectoNombre,
      clienteNombre: proyecto.clienteNombre,
      fechaVenta: proyecto.fechaVenta,
      subtotalCotizado: proyecto.totalCotizado / 1.16, // Aproximado
      totalCotizado: proyecto.totalCotizado,
      margenUtilidadCotizado: proyecto.margenUtilidad,
      costoRealTotal,
      tiempoRealTotalMin: tiempoTotalReal,
      tiempoRealTotalHoras: tiempoTotalReal / 60,
      utilidadReal,
      porcentajeUtilidadReal,
      desviacionUtilidad,
      porcentajeDesviacionUtilidad,
      eficienciaGlobal,
      piezas,
      alertas: [], // Se llenan después
    };

    resumen.alertas = generarAlertas(resumen);

    return resumen;
  }, [registros]);

  // ========== REPORTES ==========

  const generarMetricasReporte = useCallback(async (
    periodo: PeriodoReporte,
    fechaInicio: string,
    fechaFin: string
  ): Promise<MetricasReporte> => {
    // TODO: Implementar con queries de Supabase
    return {
      periodo,
      fechaInicio,
      fechaFin,
      totalProyectos: 0,
      proyectosCompletados: 0,
      proyectosEnProceso: 0,
      proyectosRetrasados: 0,
      tiempoTotalEstimadoHoras: 0,
      tiempoTotalRealHoras: 0,
      eficienciaPromedio: 0,
      ingresoTotal: 0,
      costoTotalReal: 0,
      utilidadTotal: 0,
      margenPromedio: 0,
      eficienciaPorProceso: [],
      topClientes: [],
    };
  }, []);

  return {
    registros,
    cargando,
    cargarRegistros,
    inicializarProduccionDesdeProyecto,
    actualizarRegistro,
    iniciarProceso,
    completarProceso,
    agregarIncidencia,
    generarResumenProyecto,
    generarMetricasReporte,
  };
};
