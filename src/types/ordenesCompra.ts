export interface OrdenCompra {
  id: string;
  numeroOc: string;
  proyectoId?: string;
  cotizacionId?: string;
  usuarioId?: string;
  proveedor?: string;
  concepto?: string;
  items: OrdenCompraItem[];
  subtotal: number;
  ivaPorcentaje: number;
  iva: number;
  total: number;
  estado: 'pendiente' | 'autorizada' | 'pagada' | 'recibida' | 'cancelada';
  fechaOc: string;
  fechaEntrega?: string;
  notas?: string;
  createdAt?: string;
}

export interface OrdenCompraItem {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  total: number;
}
