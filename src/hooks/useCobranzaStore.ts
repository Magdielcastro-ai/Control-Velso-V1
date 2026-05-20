// src/hooks/useCobranzaStore.ts

import { useState, useEffect, useCallback } from 'react';
import type { Cobranza, PagoRecibido } from '@/types/pendientes';
import type { ProyectoVenta } from '@/types/ventas';

const STORAGE_KEY = 'velso_cobranza';

export const useCobranzaStore = () => {
  const [cobranzas, setCobranzas] = useState<Cobranza[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      try {
        setCobranzas(JSON.parse(guardado));
      } catch (e) {
        console.error('Error cargando cobranza:', e);
      }
    }
    setCargado(true);
  }, []);

  // Guardar
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cobranzas));
    }
  }, [cobranzas, cargado]);

  // Generar cobranzas desde proyectos facturados
  const generarDesdeProyectos = useCallback((proyectos: ProyectoVenta[]) => {
    setCobranzas(prev => {
      const existentes = new Map(prev.map(c => [c.proyectoId, c]));

      proyectos
        .filter(p => p.estado === 'facturado' && p.numeroFactura)
        .forEach(p => {
          if (!existentes.has(p.id)) {
            const fechaFactura = new Date(p.fechaFacturado!);
            const diasCredito = 30;
            const fechaVencimiento = new Date(fechaFactura);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);

            const hoy = new Date();
            const diasVencido = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));

            const nuevaCobranza: Cobranza = {
              id: crypto.randomUUID(),
              proyectoId: p.id,
              clienteNombre: p.clienteNombre,
              proyectoNombre: p.proyectoNombre,
              numeroFactura: p.numeroFactura!,
              montoFacturado: p.totalFacturado || p.totalCotizado,
              montoPagado: 0,
              fechaFacturacion: p.fechaFacturado!,
              diasCredito,
              fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
              estado: diasVencido > 0 ? 'vencido' : 'pendiente',
              historialPagos: [],
              ultimoContacto: '',
              notasCobranza: '',
              diasVencido: diasVencido > 0 ? diasVencido : 0,
            };
            existentes.set(p.id, nuevaCobranza);
          } else {
            // Actualizar días vencido
            const existente = existentes.get(p.id)!;
            const hoy = new Date();
            const fechaVencimiento = new Date(existente.fechaVencimiento);
            const diasVencido = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));

            existentes.set(p.id, {
              ...existente,
              diasVencido: diasVencido > 0 ? diasVencido : 0,
              estado: diasVencido > 0 && existente.estado !== 'pagado' && existente.estado !== 'incobrable' 
                ? 'vencido' 
                : existente.estado,
            });
          }
        });

      return Array.from(existentes.values());
    });
  }, []);

  // Registrar pago
  const registrarPago = useCallback((proyectoId: string, pago: Omit<PagoRecibido, 'id'>) => {
    const nuevoPago: PagoRecibido = {
      ...pago,
      id: crypto.randomUUID(),
    };

    setCobranzas(prev => prev.map(c => {
      if (c.proyectoId !== proyectoId) return c;

      const nuevoMontoPagado = c.montoPagado + pago.monto;
      const nuevoEstado: Cobranza['estado'] = 
        nuevoMontoPagado >= c.montoFacturado ? 'pagado' :
        nuevoMontoPagado > 0 ? 'parcial' :
        c.fechaVencimiento < new Date().toISOString().split('T')[0] ? 'vencido' : 'pendiente';

      return {
        ...c,
        montoPagado: nuevoMontoPagado,
        estado: nuevoEstado,
        historialPagos: [...c.historialPagos, nuevoPago],
        ultimoContacto: pago.fecha,
      };
    }));
  }, []);

  // Actualizar notas
  const actualizarNotas = useCallback((proyectoId: string, notas: string) => {
    setCobranzas(prev => prev.map(c => 
      c.proyectoId === proyectoId ? { ...c, notasCobranza: notas } : c
    ));
  }, []);

  // Actualizar último contacto
  const actualizarContacto = useCallback((proyectoId: string, fecha: string) => {
    setCobranzas(prev => prev.map(c => 
      c.proyectoId === proyectoId ? { ...c, ultimoContacto: fecha } : c
    ));
  }, []);

  // Marcar como incobrable
  const marcarIncobrable = useCallback((proyectoId: string) => {
    setCobranzas(prev => prev.map(c => 
      c.proyectoId === proyectoId ? { ...c, estado: 'incobrable' } : c
    ));
  }, []);

  // Obtener por estado
  const getPorEstado = useCallback((estado: Cobranza['estado']) => {
    return cobranzas.filter(c => c.estado === estado);
  }, [cobranzas]);

  // Obtener vencidos
  const getVencidos = useCallback(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return cobranzas.filter(c => 
      c.fechaVencimiento < hoy && c.estado !== 'pagado' && c.estado !== 'incobrable'
    );
  }, [cobranzas]);

  // Obtener totales
  const getTotales = useCallback(() => {
    const porCobrar = cobranzas.filter(c => c.estado !== 'pagado' && c.estado !== 'incobrable');
    const vencidos = cobranzas.filter(c => c.estado === 'vencido');
    const pagados = cobranzas.filter(c => c.estado === 'pagado');
    const parciales = cobranzas.filter(c => c.estado === 'parcial');

    return {
      totalPorCobrar: porCobrar.reduce((sum, c) => sum + (c.montoFacturado - c.montoPagado), 0),
      totalVencido: vencidos.reduce((sum, c) => sum + (c.montoFacturado - c.montoPagado), 0),
      totalPagado: pagados.reduce((sum, c) => sum + c.montoPagado, 0),
      totalParcial: parciales.reduce((sum, c) => sum + c.montoPagado, 0),
      totalIncobrable: cobranzas
        .filter(c => c.estado === 'incobrable')
        .reduce((sum, c) => sum + c.montoFacturado, 0),
      cantidadPorCobrar: porCobrar.length,
      cantidadVencidos: vencidos.length,
      cantidadPagados: pagados.length,
      cantidadParciales: parciales.length,
    };
  }, [cobranzas]);

  return {
    cobranzas,
    cargado,
    generarDesdeProyectos,
    registrarPago,
    actualizarNotas,
    actualizarContacto,
    marcarIncobrable,
    getPorEstado,
    getVencidos,
    getTotales,
  };
};
