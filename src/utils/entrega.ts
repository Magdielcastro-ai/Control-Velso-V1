import type { CondicionesComerciales } from '@/types/cotizacion';

/** Convierte 7 o "3-4" a "7 días hábiles" / "3-4 días hábiles".
 *  Si el usuario ya escribió la unidad, respeta su texto sin duplicarla. */
export function formatearTiempoEntrega(valor: number | string | undefined): string {
  const texto = String(valor ?? '').trim();
  if (!texto) return 'Por definir';
  return /d[ií]a/i.test(texto) ? texto : `${texto} días hábiles`;
}

/** La entrega extra es opcional: si no se capturó, se usa la regular. */
export function entregaParaModalidad(condiciones: CondicionesComerciales, tiempoExtra: boolean): string {
  const extra = String(condiciones.tiempoEntregaDiasExtra ?? '').trim();
  return formatearTiempoEntrega(
    tiempoExtra && extra ? condiciones.tiempoEntregaDiasExtra : condiciones.tiempoEntregaDias,
  );
}
