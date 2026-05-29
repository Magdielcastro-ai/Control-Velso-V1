import { useState, useCallback } from 'react';
import type { HorasDisponiblesMensuales } from '@/types/ventas';
import type { CotizacionGuardada } from '@/types/cotizacion';

const HORAS_DEFAULT: HorasDisponiblesMensuales = {
  codigo_07: 742.69,
  mo_s: 268.88,
  mo_e: 403.31,
  hora_diseno: 159.30,
  hora_ensamble: 159.30,
  torno_convencional: 161.93,
  perfiladora: 161.93,
  torno_cnc: 133.35,
  cnc_vertical: 382.91,
};

export const useDashboardStore = () => {
  const [horasDisponibles, setHorasDisponibles] = useState<HorasDisponiblesMensuales>(HORAS_DEFAULT);
  const [cargado, setCargado] = useState(true);

  const actualizarHorasDisponibles = useCallback((horas: Partial<HorasDisponiblesMensuales>) => {
    setHorasDisponibles(prev => ({ ...prev, ...horas }));
  }, []);

  const calcularMetricasMes = useCallback((cotizaciones: CotizacionGuardada[]) => {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const cotizacionesMes = cotizaciones.filter(c => {
      const fecha = new Date(c.fecha);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    const totalCotizado = cotizacionesMes.reduce((sum, c) => sum + c.total, 0);

    const porCliente: Record<string, { nombre: string; cantidad: number; total: number }> = {};
    cotizacionesMes.forEach(c => {
      if (!porCliente[c.clienteNombre]) {
        porCliente[c.clienteNombre] = { nombre: c.clienteNombre, cantidad: 0, total: 0 };
      }
      porCliente[c.clienteNombre].cantidad++;
      porCliente[c.clienteNombre].total += c.total;
    });

    const totalCotizaciones = cotizacionesMes.length;
    const cotizacionesPorCliente = Object.values(porCliente).map(c => ({
      clienteId: c.nombre,
      clienteNombre: c.nombre,
      cantidad: c.cantidad,
      total: c.total,
      porcentaje: totalCotizaciones > 0 ? (c.cantidad / totalCotizaciones) * 100 : 0,
    }));

    return {
      mes: mesActual,
      anio: anioActual,
      totalCotizado,
      totalCotizaciones,
      cotizacionesPorCliente,
    };
  }, []);

  const calcularHorasPorProceso = useCallback((cotizacionesCompletas: any[]) => {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const horas: Record<string, number> = {
      codigo_07: 0,
      mo_s: 0,
      mo_e: 0,
      hora_diseno: 0,
      hora_ensamble: 0,
      torno_convencional: 0,
      perfiladora: 0,
      torno_cnc: 0,
      cnc_vertical: 0,
    };

    cotizacionesCompletas.forEach((cot: any) => {
      const fecha = new Date(cot.fecha);
      if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
        cot.procesos?.forEach((p: any) => {
          const tiempoHoras = (p.tiempoMinutos || 0) / 60;
          if (horas[p.tipo] !== undefined) {
            horas[p.tipo] += tiempoHoras;
          }
        });
      }
    });

    return horas as unknown as HorasDisponiblesMensuales;
  }, []);

  const calcularCumplimientoCodigo07 = useCallback((horasCotizadas: number) => {
    const objetivo = horasDisponibles.codigo_07;
    if (objetivo === 0) return 0;
    return (horasCotizadas / objetivo) * 100;
  }, [horasDisponibles]);

  return {
    horasDisponibles,
    cargado,
    actualizarHorasDisponibles,
    calcularMetricasMes,
    calcularHorasPorProceso,
    calcularCumplimientoCodigo07,
  };
};
