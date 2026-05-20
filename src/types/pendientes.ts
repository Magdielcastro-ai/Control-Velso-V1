// src/types/pendientes.ts

export type TipoPendiente = 
  | 'levantamiento'
  | 'pasar_a_diseño'
  | 'cotizar'
  | 'enviar_cotizacion'
  | 'seguimiento_cotizacion'
  | 'autorizar_oc'
  | 'seguimiento_oc'
  | 'produccion'
  | 'cotejar_utilidad'
  | 'entrega'
  | 'facturar'
  | 'cobranza'
  | 'cobranza_urgente';

export type PrioridadPendiente = 'baja' | 'media' | 'alta' | 'urgente';

export interface Pendiente {
  id: string;
  tipo: TipoPendiente;
  titulo: string;
  descripcion: string;
  proyectoId?: string;
  cotizacionId?: string;
  clienteNombre: string;
  proyectoNombre: string;
  fechaCreacion: string;
  fechaVencimiento: string;
  prioridad: PrioridadPendiente;
  completado: boolean;
  responsable: string;
  notas: string;
  diasEstancado: number;
}

export interface Alerta {
  id: string;
  tipo: 'cotizacion_sin_enviar' | 'proyecto_estancado' | 'factura_vencida' | 'oc_pendiente' | 'cobranza_urgente' | 'seguimiento_cotizacion';
  titulo: string;
  descripcion: string;
  proyectoId?: string;
  cotizacionId?: string;
  clienteNombre: string;
  dias: number;
  fecha: string;
  leida: boolean;
  monto?: number;
}

export interface Cobranza {
  id: string;
  proyectoId: string;
  clienteNombre: string;
  proyectoNombre: string;
  numeroFactura: string;
  montoFacturado: number;
  montoPagado: number;
  fechaFacturacion: string;
  diasCredito: number;
  fechaVencimiento: string;
  estado: 'pendiente' | 'parcial' | 'pagado' | 'vencido' | 'incobrable';
  historialPagos: PagoRecibido[];
  ultimoContacto: string;
  notasCobranza: string;
  diasVencido: number;
}

export interface PagoRecibido {
  id: string;
  fecha: string;
  monto: number;
  formaPago: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'deposito';
  referencia: string;
}

export interface OrdenCompra {
  id: string;
  proyectoId: string;
  numeroOC: string;
  clienteNombre: string;
  proyectoNombre: string;
  proveedor: string;
  materiales: Array<{
    material: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }>;
  totalOC: number;
  fechaEmision: string;
  fechaEntregaEsperada: string;
  fechaEntregaReal?: string;
  estado: 'pendiente' | 'enviada' | 'parcial' | 'recibida' | 'cancelada';
  notas: string;
}
