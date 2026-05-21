// src/hooks/useCobranzaStore.ts - Versión Supabase

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cobranza, PagoRecibido } from '@/types/pendientes';
import type { ProyectoVenta } from '@/types/ventas';

export const useCobranzaStore = () => {
  const [cobranzas, setCobranzas] = useState<Cobranza[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar cobranzas desde Supabase
  const cargarCobranzas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cobranza')
        .select(`
          *,
          pagos_recibidos (*)
        `)
        .order('fecha_vencimiento', { ascending: true });

      if (error) {
        console.error('Error cargando cobranza:', error);
        return;
      }

      if (data) {
        const mapped: Cobranza[] = data.map(c => ({
          id: c.id,
          proyectoId: c.proyecto_id,
          clienteNombre: c.cliente_nombre,
          proyectoNombre: c.proyecto_nombre,
          numeroFactura: c.numero_factura,
          montoFacturado: parseFloat(c.monto_facturado),
          montoPagado: parseFloat(c.monto_pagado),
          fechaFacturacion: c.fecha_facturacion,
          diasCredito: c.dias_credito,
          fechaVencimiento: c.fecha_vencimiento,
          estado: c.estado,
          historialPagos: (c.pagos_recibidos || []).map((p: any) => ({
            id: p.id,
            fecha: p.fecha,
            monto: parseFloat(p.monto),
            formaPago: p.forma_pago,
            referencia: p.referencia,
          })),
          ultimoContacto: c.ultimo_contacto || '',
          notasCobranza: c.notas_cobranza || '',
          diasVencido: c.dias_vencido,
        }));
        setCobranzas(mapped);
      }
    } catch (e) {
      console.error('Error cargando cobranza:', e);
    }
  }, []);

  // Cargar al inicializar
  useEffect(() => {
    cargarCobranzas();
    setCargado(true);
  }, [cargarCobranzas]);

  // Generar cobranzas desde proyectos facturados
  const generarDesdeProyectos = useCallback(async (proyectos: ProyectoVenta[]) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      for (const p of proyectos.filter(p => p.estado === 'facturado' && p.numeroFactura)) {
        // Verificar si ya existe
        const { data: existente } = await supabase
          .from('cobranza')
          .select('id')
          .eq('proyecto_id', p.id)
          .maybeSingle();

        if (!existente) {
          const fechaFactura = new Date(p.fechaFacturado!);
          const diasCredito = 30;
          const fechaVencimiento = new Date(fechaFactura);
          fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);

          const hoy = new Date();
          const diasVencido = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));

          await supabase.from('cobranza').insert([{
            usuario_id: user.user.id,
            proyecto_id: p.id,
            cliente_nombre: p.clienteNombre,
            proyecto_nombre: p.proyectoNombre,
            numero_factura: p.numeroFactura,
            monto_facturado: p.totalFacturado || p.totalCotizado,
            monto_pagado: 0,
            fecha_facturacion: p.fechaFacturado,
            dias_credito: diasCredito,
            fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
            estado: diasVencido > 0 ? 'vencido' : 'pendiente',
            dias_vencido: diasVencido > 0 ? diasVencido : 0,
          }]);
        }
      }

      await cargarCobranzas();
    } catch (e) {
      console.error('Error generando cobranza:', e);
    }
  }, [cargarCobranzas]);

  // Registrar pago
  const registrarPago = useCallback(async (proyectoId: string, pago: Omit<PagoRecibido, 'id'>) => {
    try {
      // Obtener cobranza del proyecto
      const { data: cobranzaData } = await supabase
        .from('cobranza')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .single();

      if (!cobranzaData) return;

      // Insertar pago
      const { error: pagoError } = await supabase
        .from('pagos_recibidos')
        .insert([{
          cobranza_id: cobranzaData.id,
          fecha: pago.fecha,
          monto: pago.monto,
          forma_pago: pago.formaPago,
          referencia: pago.referencia,
        }])
        .select()
        .single();

      if (pagoError) {
        console.error('Error registrando pago:', pagoError);
        return;
      }

      // Calcular nuevo estado
      const nuevoMontoPagado = parseFloat(cobranzaData.monto_pagado) + pago.monto;
      const montoFacturado = parseFloat(cobranzaData.monto_facturado);

      let nuevoEstado: Cobranza['estado'] = 'pendiente';
      if (nuevoMontoPagado >= montoFacturado) {
        nuevoEstado = 'pagado';
      } else if (nuevoMontoPagado > 0) {
        nuevoEstado = 'parcial';
      } else if (cobranzaData.fecha_vencimiento < new Date().toISOString().split('T')[0]) {
        nuevoEstado = 'vencido';
      }

      // Actualizar cobranza
      await supabase
        .from('cobranza')
        .update({
          monto_pagado: nuevoMontoPagado,
          estado: nuevoEstado,
          ultimo_contacto: pago.fecha,
        })
        .eq('id', cobranzaData.id);

      await cargarCobranzas();
    } catch (e) {
      console.error('Error registrando pago:', e);
    }
  }, [cargarCobranzas]);

  // Actualizar notas
  const actualizarNotas = useCallback(async (proyectoId: string, notas: string) => {
    try {
      await supabase
        .from('cobranza')
        .update({ notas_cobranza: notas })
        .eq('proyecto_id', proyectoId);

      setCobranzas(prev => prev.map(c => 
        c.proyectoId === proyectoId ? { ...c, notasCobranza: notas } : c
      ));
    } catch (e) {
      console.error('Error actualizando notas:', e);
    }
  }, []);

  // Actualizar último contacto
  const actualizarContacto = useCallback(async (proyectoId: string, fecha: string) => {
    try {
      await supabase
        .from('cobranza')
        .update({ ultimo_contacto: fecha })
        .eq('proyecto_id', proyectoId);

      setCobranzas(prev => prev.map(c => 
        c.proyectoId === proyectoId ? { ...c, ultimoContacto: fecha } : c
      ));
    } catch (e) {
      console.error('Error actualizando contacto:', e);
    }
  }, []);

  // Marcar como incobrable
  const marcarIncobrable = useCallback(async (proyectoId: string) => {
    try {
      await supabase
        .from('cobranza')
        .update({ estado: 'incobrable' })
        .eq('proyecto_id', proyectoId);

      setCobranzas(prev => prev.map(c => 
        c.proyectoId === proyectoId ? { ...c, estado: 'incobrable' } : c
      ));
    } catch (e) {
      console.error('Error marcando incobrable:', e);
    }
  }, []);

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
    cargarCobranzas,
    generarDesdeProyectos,
    registrarPago,
    actualizarNotas,
    actualizarContacto,
    marcarIncobrable,
    getVencidos,
    getTotales,
  };
};
