// src/hooks/usePendientesStore.ts - Versión Supabase

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Pendiente, Alerta } from '@/types/pendientes';
import type { ProyectoVenta } from '@/types/ventas';
import type { CotizacionGuardada } from '@/types/cotizacion';

export const usePendientesStore = () => {
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar pendientes desde Supabase
  const cargarPendientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pendientes')
        .select('*')
        .eq('completado', false)
        .order('prioridad', { ascending: true });

      if (error) {
        console.error('Error cargando pendientes:', error);
        return;
      }

      if (data) {
        const mapped: Pendiente[] = data.map(p => ({
          id: p.id,
          tipo: p.tipo,
          titulo: p.titulo,
          descripcion: p.descripcion || '',
          proyectoId: p.proyecto_id,
          cotizacionId: p.cotizacion_id,
          clienteNombre: p.cliente_nombre,
          proyectoNombre: p.proyecto_nombre || '',
          fechaCreacion: p.fecha_creacion,
          fechaVencimiento: p.fecha_vencimiento,
          prioridad: p.prioridad,
          completado: p.completado,
          responsable: p.responsable,
          notas: p.notas || '',
          diasEstancado: p.dias_estancado,
        }));
        setPendientes(mapped);
      }
    } catch (e) {
      console.error('Error cargando pendientes:', e);
    }
  }, []);

  // Cargar alertas desde Supabase
  const cargarAlertas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .eq('leida', false)
        .order('dias', { ascending: false });

      if (error) {
        console.error('Error cargando alertas:', error);
        return;
      }

      if (data) {
        const mapped: Alerta[] = data.map(a => ({
          id: a.id,
          tipo: a.tipo,
          titulo: a.titulo,
          descripcion: a.descripcion || '',
          proyectoId: a.proyecto_id,
          cotizacionId: a.cotizacion_id,
          clienteNombre: a.cliente_nombre,
          dias: a.dias,
          fecha: a.fecha,
          leida: a.leida,
          monto: a.monto,
        }));
        setAlertas(mapped);
      }
    } catch (e) {
      console.error('Error cargando alertas:', e);
    }
  }, []);

  // Cargar al inicializar
  useEffect(() => {
    cargarPendientes();
    cargarAlertas();
    setCargado(true);
  }, [cargarPendientes, cargarAlertas]);

  // Guardar pendiente en Supabase
  const guardarPendienteDB = useCallback(async (pendiente: Omit<Pendiente, 'id' | 'fechaCreacion' | 'diasEstancado'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('pendientes')
        .insert([{
          usuario_id: user.user.id,
          tipo: pendiente.tipo,
          titulo: pendiente.titulo,
          descripcion: pendiente.descripcion,
          proyecto_id: pendiente.proyectoId,
          cotizacion_id: pendiente.cotizacionId,
          cliente_nombre: pendiente.clienteNombre,
          proyecto_nombre: pendiente.proyectoNombre,
          fecha_vencimiento: pendiente.fechaVencimiento,
          prioridad: pendiente.prioridad,
          completado: pendiente.completado,
          responsable: pendiente.responsable,
          notas: pendiente.notas,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error guardando pendiente:', error);
        return null;
      }

      return data;
    } catch (e) {
      console.error('Error guardando pendiente:', e);
      return null;
    }
  }, []);

  // Generar pendientes y alertas automáticos desde proyectos y cotizaciones
  const generarPendientesDesdeProyectos = useCallback(async (
    proyectos: ProyectoVenta[],
    cotizaciones: CotizacionGuardada[]
  ) => {
    const hoy = new Date().toISOString().split('T')[0];

    // 1. Cotizaciones en estado "enviada" → seguimiento
    for (const c of cotizaciones.filter(c => c.estado === 'enviada')) {
      const diasEspera = Math.floor(
        (Date.now() - new Date(c.fecha).getTime()) / (1000 * 60 * 60 * 24)
      );

      const existe = pendientes.find(p => p.cotizacionId === c.id && p.tipo === 'seguimiento_cotizacion');
      if (!existe) {
        await guardarPendienteDB({
          tipo: 'seguimiento_cotizacion',
          titulo: `Seguimiento cotización ${c.numero}`,
          descripcion: `Cotización enviada hace ${diasEspera} días. Llamar al cliente para seguimiento.`,
          cotizacionId: c.id,
          clienteNombre: c.clienteNombre,
          proyectoNombre: c.proyectoNombre,
          fechaVencimiento: hoy,
          prioridad: diasEspera > 5 ? 'urgente' : diasEspera > 3 ? 'alta' : 'media',
          completado: false,
          responsable: 'yo',
          notas: '',
        });
      }
    }

    // 2. Proyectos en fabricación → seguimiento producción
    for (const p of proyectos.filter(p => p.estado === 'en_fabricacion')) {
      const diasFabricacion = Math.floor(
        (Date.now() - new Date(p.fechaVenta).getTime()) / (1000 * 60 * 60 * 24)
      );

      const existe = pendientes.find(pen => pen.proyectoId === p.id && pen.tipo === 'produccion');
      if (!existe) {
        await guardarPendienteDB({
          tipo: 'produccion',
          titulo: `Seguimiento producción: ${p.proyectoNombre}`,
          descripcion: `Proyecto en fabricación desde hace ${diasFabricacion} días. Verificar avance.`,
          proyectoId: p.id,
          clienteNombre: p.clienteNombre,
          proyectoNombre: p.proyectoNombre,
          fechaVencimiento: hoy,
          prioridad: diasFabricacion > 7 ? 'urgente' : diasFabricacion > 3 ? 'alta' : 'media',
          completado: false,
          responsable: 'pm',
          notas: '',
        });
      }
    }

    // 3. Proyectos fabricados → cotejar utilidad
    for (const p of proyectos.filter(p => p.estado === 'fabricado')) {
      const existe = pendientes.find(pen => pen.proyectoId === p.id && pen.tipo === 'cotejar_utilidad');
      if (!existe) {
        await guardarPendienteDB({
          tipo: 'cotejar_utilidad',
          titulo: `Cotejar utilidad: ${p.proyectoNombre}`,
          descripcion: `Verificar si se cobró bien y si se alcanzó el 30% de utilidad esperada.`,
          proyectoId: p.id,
          clienteNombre: p.clienteNombre,
          proyectoNombre: p.proyectoNombre,
          fechaVencimiento: hoy,
          prioridad: 'alta',
          completado: false,
          responsable: 'yo',
          notas: '',
        });
      }
    }

    // 4. Proyectos entregados → facturar
    for (const p of proyectos.filter(p => p.estado === 'entregado')) {
      const existe = pendientes.find(pen => pen.proyectoId === p.id && pen.tipo === 'facturar');
      if (!existe) {
        await guardarPendienteDB({
          tipo: 'facturar',
          titulo: `Facturar: ${p.proyectoNombre}`,
          descripcion: `Proyecto entregado. Emitir y enviar factura al cliente.`,
          proyectoId: p.id,
          clienteNombre: p.clienteNombre,
          proyectoNombre: p.proyectoNombre,
          fechaVencimiento: hoy,
          prioridad: 'alta',
          completado: false,
          responsable: 'yo',
          notas: '',
        });
      }
    }

    // Recargar pendientes después de generar
    await cargarPendientes();
  }, [pendientes, guardarPendienteDB, cargarPendientes]);

  // Completar pendiente
  const completarPendiente = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('pendientes')
        .update({ completado: true })
        .eq('id', id);

      if (error) {
        console.error('Error completando pendiente:', error);
        return;
      }

      setPendientes(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Error completando pendiente:', e);
    }
  }, []);

  // Agregar pendiente manual
  const agregarPendiente = useCallback(async (pendiente: Omit<Pendiente, 'id' | 'fechaCreacion' | 'diasEstancado'>) => {
    const result = await guardarPendienteDB(pendiente);
    if (result) {
      await cargarPendientes();
    }
  }, [guardarPendienteDB, cargarPendientes]);

  // Actualizar notas
  const actualizarNotas = useCallback(async (id: string, notas: string) => {
    try {
      const { error } = await supabase
        .from('pendientes')
        .update({ notas })
        .eq('id', id);

      if (error) {
        console.error('Error actualizando notas:', error);
        return;
      }

      setPendientes(prev => prev.map(p => 
        p.id === id ? { ...p, notas } : p
      ));
    } catch (e) {
      console.error('Error actualizando notas:', e);
    }
  }, []);

  // Marcar alerta como leída
  const marcarAlertaLeida = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('alertas')
        .update({ leida: true })
        .eq('id', id);

      if (error) {
        console.error('Error marcando alerta:', error);
        return;
      }

      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Error marcando alerta:', e);
    }
  }, []);

  // Eliminar alerta
  const eliminarAlerta = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('alertas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando alerta:', error);
        return;
      }

      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Error eliminando alerta:', e);
    }
  }, []);

  // Obtener pendientes de hoy
  const getPendientesHoy = useCallback(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return pendientes.filter(p => !p.completado && p.fechaVencimiento <= hoy);
  }, [pendientes]);

  // Contar alertas rojas (no leídas)
  const getAlertasRojas = useCallback(() => {
    return alertas.filter(a => !a.leida);
  }, [alertas]);

  return {
    pendientes,
    alertas,
    cargado,
    cargarPendientes,
    cargarAlertas,
    generarPendientesDesdeProyectos,
    completarPendiente,
    agregarPendiente,
    actualizarNotas,
    marcarAlertaLeida,
    eliminarAlerta,
    getPendientesHoy,
    getAlertasRojas,
  };
};
