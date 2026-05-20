// src/hooks/usePendientesStore.ts

import { useState, useEffect, useCallback } from 'react';
import type { Pendiente, TipoPendiente, PrioridadPendiente, Alerta } from '@/types/pendientes';
import type { ProyectoVenta } from '@/types/ventas';
import type { CotizacionGuardada } from '@/types/cotizacion';

const STORAGE_KEY = 'velso_pendientes';
const STORAGE_KEY_ALERTAS = 'velso_alertas';

export const usePendientesStore = () => {
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar pendientes
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      try {
        setPendientes(JSON.parse(guardado));
      } catch (e) {
        console.error('Error cargando pendientes:', e);
      }
    }
    const guardadoAlertas = localStorage.getItem(STORAGE_KEY_ALERTAS);
    if (guardadoAlertas) {
      try {
        setAlertas(JSON.parse(guardadoAlertas));
      } catch (e) {
        console.error('Error cargando alertas:', e);
      }
    }
    setCargado(true);
  }, []);

  // Guardar pendientes
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendientes));
    }
  }, [pendientes, cargado]);

  // Guardar alertas
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY_ALERTAS, JSON.stringify(alertas));
    }
  }, [alertas, cargado]);

  // Generar pendientes y alertas automáticos desde proyectos y cotizaciones
  const generarPendientesDesdeProyectos = useCallback((
    proyectos: ProyectoVenta[],
    cotizaciones: CotizacionGuardada[]
  ) => {
    const hoy = new Date().toISOString().split('T')[0];
    const nuevosPendientes: Pendiente[] = [];
    const nuevasAlertas: Alerta[] = [];

    // 1. Cotizaciones en estado "enviada" → seguimiento
    cotizaciones
      .filter(c => c.estado === 'enviada')
      .forEach(c => {
        const diasEspera = Math.floor(
          (Date.now() - new Date(c.fecha).getTime()) / (1000 * 60 * 60 * 24)
        );

        nuevosPendientes.push({
          id: `seg-cot-${c.id}`,
          tipo: 'seguimiento_cotizacion',
          titulo: `Seguimiento cotización ${c.numero}`,
          descripcion: `Cotización enviada hace ${diasEspera} días. Llamar al cliente para seguimiento.`,
          cotizacionId: c.id,
          clienteNombre: c.clienteNombre,
          proyectoNombre: c.proyectoNombre,
          fechaCreacion: c.fecha,
          fechaVencimiento: hoy,
          prioridad: diasEspera > 5 ? 'urgente' : diasEspera > 3 ? 'alta' : 'media',
          completado: false,
          responsable: 'yo',
          notas: '',
          diasEstancado: diasEspera,
        });

        if (diasEspera > 3) {
          nuevasAlertas.push({
            id: `alert-cot-${c.id}`,
            tipo: 'seguimiento_cotizacion',
            titulo: `Cotización ${c.numero} sin respuesta`,
            descripcion: `Han pasado ${diasEspera} días desde el envío. Cliente: ${c.clienteNombre}`,
            cotizacionId: c.id,
            clienteNombre: c.clienteNombre,
            dias: diasEspera,
            fecha: hoy,
            leida: false,
            monto: c.total,
          });
        }
      });

    // 2. Cotizaciones en estado "borrador" → enviar
    cotizaciones
      .filter(c => c.estado === 'borrador')
      .forEach(c => {
        const diasBorrador = Math.floor(
          (Date.now() - new Date(c.fecha).getTime()) / (1000 * 60 * 60 * 24)
        );

        nuevosPendientes.push({
          id: `env-cot-${c.id}`,
          tipo: 'enviar_cotizacion',
          titulo: `Enviar cotización ${c.numero}`,
          descripcion: `Cotización en borrador desde hace ${diasBorrador} días. Enviar al cliente.`,
          cotizacionId: c.id,
          clienteNombre: c.clienteNombre,
          proyectoNombre: c.proyectoNombre,
          fechaCreacion: c.fecha,
          fechaVencimiento: hoy,
          prioridad: diasBorrador > 2 ? 'alta' : 'media',
          completado: false,
          responsable: 'yo',
          notas: '',
          diasEstancado: diasBorrador,
        });
      });

    // 3. Proyectos en fabricación → seguimiento producción
    proyectos
      .filter(p => p.estado === 'en_fabricacion')
      .forEach(p => {
        const diasFabricacion = Math.floor(
          (Date.now() - new Date(p.fechaVenta).getTime()) / (1000 * 60 * 60 * 24)
        );

        nuevosPendientes.push({
          id: `prod-${p.id}`,
          tipo: 'produccion',
          titulo: `Seguimiento producción: ${p.proyectoNombre}`,
          descripcion: `Proyecto en fabricación desde hace ${diasFabricacion} días. Verificar avance con PM.`,
          proyectoId: p.id,
          clienteNombre: p.clienteNombre,
          proyectoNombre: p.proyectoNombre,
          fechaCreacion: p.fechaVenta,
          fechaVencimiento: hoy,
          prioridad: diasFabricacion > 7 ? 'urgente' : diasFabricacion > 3 ? 'alta' : 'media',
          completado: false,
          responsable: 'pm',
          notas: '',
          diasEstancado: diasFabricacion,
        });

        if (diasFabricacion > 7) {
          nuevasAlertas.push({
            id: `alert-prod-${p.id}`,
            tipo: 'proyecto_estancado',
            titulo: `Producción atrasada: ${p.proyectoNombre}`,
            descripcion: `Lleva ${diasFabricacion} días en fabricación. Cliente: ${p.clienteNombre}`,
            proyectoId: p.id,
            clienteNombre: p.clienteNombre,
            dias: diasFabricacion,
            fecha: hoy,
            leida: false,
            monto: p.totalCotizado,
          });
        }
      });

    // 4. Proyectos fabricados → cotejar utilidad
    proyectos
      .filter(p => p.estado === 'fabricado')
      .forEach(p => {
        const diasFabricado = p.fechaFabricado 
          ? Math.floor((Date.now() - new Date(p.fechaFabricado).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        nuevosPendientes.push({
          id: `util-${p.id}`,
          tipo: 'cotejar_utilidad',
          titulo: `Cotejar utilidad: ${p.proyectoNombre}`,
          descripcion: `Verificar si se cobró bien y si se alcanzó el 30% de utilidad esperada.`,
          proyectoId: p.id,
          clienteNombre: p.clienteNombre,
          proyectoNombre: p.proyectoNombre,
          fechaCreacion: p.fechaFabricado || p.fechaVenta,
          fechaVencimiento: hoy,
          prioridad: 'alta',
          completado: false,
          responsable: 'yo',
          notas: '',
          diasEstancado: diasFabricado,
        });
      });

    // 5. Proyectos entregados → facturar
    proyectos
      .filter(p => p.estado === 'entregado')
      .forEach(p => {
        const diasEntregado = p.fechaEntregado
          ? Math.floor((Date.now() - new Date(p.fechaEntregado).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        nuevosPendientes.push({
          id: `fact-${p.id}`,
          tipo: 'facturar',
          titulo: `Facturar: ${p.proyectoNombre}`,
          descripcion: `Proyecto entregado hace ${diasEntregado} días. Emitir y enviar factura al cliente.`,
          proyectoId: p.id,
          clienteNombre: p.clienteNombre,
          proyectoNombre: p.proyectoNombre,
          fechaCreacion: p.fechaEntregado || p.fechaVenta,
          fechaVencimiento: hoy,
          prioridad: diasEntregado > 2 ? 'urgente' : 'alta',
          completado: false,
          responsable: 'yo',
          notas: '',
          diasEstancado: diasEntregado,
        });
      });

    // 6. Proyectos facturados → cobranza
    proyectos
      .filter(p => p.estado === 'facturado' && p.fechaFacturado)
      .forEach(p => {
        const diasDesdeFactura = Math.floor(
          (Date.now() - new Date(p.fechaFacturado!).getTime()) / (1000 * 60 * 60 * 24)
        );
        const diasCredito = 30;
        const diasVencido = diasDesdeFactura - diasCredito;

        if (diasVencido > 0) {
          nuevosPendientes.push({
            id: `cob-${p.id}`,
            tipo: diasVencido > 15 ? 'cobranza_urgente' : 'cobranza',
            titulo: `Cobranza: ${p.proyectoNombre}`,
            descripcion: `Factura vencida hace ${diasVencido} días. Contactar al cliente para pago.`,
            proyectoId: p.id,
            clienteNombre: p.clienteNombre,
            proyectoNombre: p.proyectoNombre,
            fechaCreacion: p.fechaFacturado!,
            fechaVencimiento: hoy,
            prioridad: diasVencido > 15 ? 'urgente' : diasVencido > 7 ? 'alta' : 'media',
            completado: false,
            responsable: 'yo',
            notas: '',
            diasEstancado: diasVencido,
          });

          nuevasAlertas.push({
            id: `alert-cob-${p.id}`,
            tipo: 'factura_vencida',
            titulo: `Factura vencida: ${p.proyectoNombre}`,
            descripcion: `Vencida hace ${diasVencido} días. Monto: $${(p.totalFacturado || p.totalCotizado).toLocaleString()}`,
            proyectoId: p.id,
            clienteNombre: p.clienteNombre,
            dias: diasVencido,
            fecha: hoy,
            leida: false,
            monto: p.totalFacturado || p.totalCotizado,
          });
        }
      });

    // Merge: mantener los que ya existen (para no perder notas/completados)
    setPendientes(prev => {
      const existentes = new Map(prev.map(p => [p.id, p]));

      nuevosPendientes.forEach(nuevo => {
        const existente = existentes.get(nuevo.id);
        if (existente) {
          existentes.set(nuevo.id, {
            ...nuevo,
            completado: existente.completado,
            notas: existente.notas,
          });
        } else {
          existentes.set(nuevo.id, nuevo);
        }
      });

      return Array.from(existentes.values()).filter(p => !p.completado);
    });

    // Merge alertas
    setAlertas(prev => {
      const existentes = new Map(prev.map(a => [a.id, a]));

      nuevasAlertas.forEach(nueva => {
        const existente = existentes.get(nueva.id);
        if (!existente) {
          existentes.set(nueva.id, nueva);
        }
      });

      return Array.from(existentes.values());
    });
  }, []);

  // Completar pendiente
  const completarPendiente = useCallback((id: string) => {
    setPendientes(prev => prev.map(p => 
      p.id === id ? { ...p, completado: true } : p
    ).filter(p => !p.completado));
  }, []);

  // Agregar pendiente manual
  const agregarPendiente = useCallback((pendiente: Omit<Pendiente, 'id' | 'fechaCreacion' | 'diasEstancado'>) => {
    const nuevo: Pendiente = {
      ...pendiente,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString().split('T')[0],
      diasEstancado: 0,
    };
    setPendientes(prev => [nuevo, ...prev]);
    return nuevo;
  }, []);

  // Actualizar notas
  const actualizarNotas = useCallback((id: string, notas: string) => {
    setPendientes(prev => prev.map(p => 
      p.id === id ? { ...p, notas } : p
    ));
  }, []);

  // Marcar alerta como leída
  const marcarAlertaLeida = useCallback((id: string) => {
    setAlertas(prev => prev.map(a => 
      a.id === id ? { ...a, leida: true } : a
    ));
  }, []);

  // Eliminar alerta
  const eliminarAlerta = useCallback((id: string) => {
    setAlertas(prev => prev.filter(a => a.id !== id));
  }, []);

  // Obtener pendientes por prioridad
  const getPendientesPorPrioridad = useCallback(() => {
    const orden = { urgente: 0, alta: 1, media: 2, baja: 3 };
    return [...pendientes]
      .filter(p => !p.completado)
      .sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
  }, [pendientes]);

  // Obtener pendientes por responsable
  const getPendientesPorResponsable = useCallback((responsable: string) => {
    return pendientes.filter(p => p.responsable === responsable && !p.completado);
  }, [pendientes]);

  // Obtener pendientes de hoy
  const getPendientesHoy = useCallback(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return pendientes.filter(p => !p.completado && p.fechaVencimiento <= hoy);
  }, [pendientes]);

  // Contar alertas rojas (no leídas)
  const getAlertasRojas = useCallback(() => {
    return alertas.filter(a => !a.leida);
  }, [alertas]);

  // Obtener alertas por tipo
  const getAlertasPorTipo = useCallback((tipo: Alerta['tipo']) => {
    return alertas.filter(a => a.tipo === tipo && !a.leida);
  }, [alertas]);

  return {
    pendientes,
    alertas,
    cargado,
    generarPendientesDesdeProyectos,
    completarPendiente,
    agregarPendiente,
    actualizarNotas,
    marcarAlertaLeida,
    eliminarAlerta,
    getPendientesPorPrioridad,
    getPendientesPorResponsable,
    getPendientesHoy,
    getAlertasRojas,
    getAlertasPorTipo,
  };
};
