// ============================================
// TIPOS ACTUALIZADOS - Soporte Piezas/Proyectos
// Agregar estos tipos a tu archivo types/cotizacion.ts
// ============================================

export type TipoCotizacion = 'pieza_unica' | 'proyecto';

export interface PiezaCotizacion {
  id: string;
  nombre: string;
  cantidad: number;
  materiales: Material[];
  procesos: Proceso[];
  costosAdicionales: CostosAdicionales;
  subtotalPieza: number;
  ivaPieza: number;
  totalPieza: number;
}

export interface Cotizacion {
  id: string;
  numero: string;
  fecha: string;
  tipo: TipoCotizacion;           // ← NUEVO
  datosTaller: DatosTaller;
  datosCliente: DatosCliente;
  proyecto: EspecificacionesProyecto;
  piezas: PiezaCotizacion[];      // ← NUEVO (reemplaza materiales[] y procesos[] directos)
  materiales: Material[];          // ← DEPRECADO: mantener para compatibilidad
  procesos: Proceso[];            // ← DEPRECADO: mantener para compatibilidad
  costosAdicionales: CostosAdicionales;  // ← Costos GENERALES del proyecto
  condiciones: CondicionesComerciales;
  subtotal: number;
  ivaPorcentaje: number;
  iva: number;
  total: number;
  margenUtilidad: number;
}

export interface CotizacionGuardada {
  id: string;
  numero: string;
  fecha: string;
  tipo: TipoCotizacion;           // ← NUEVO
  clienteNombre: string;
  proyectoNombre: string;
  total: number;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  usuarioId?: string;
  cantidadPiezas?: number;        // ← NUEVO
}
