export interface OrdenCompra {
  id: string;
  numeroOc: string;
  proyectoId?: string;
  cotizacionId?: string;
  usuarioId?: string;
  proveedor?: string;
  proveedorId?: string;
  concepto?: string;
  items: OrdenCompraItem[];
  subtotal: number;
  ivaPorcentaje: number;
  iva: number;
  total: number;
  estado: 'pendiente' | 'autorizada' | 'pagada' | 'recibida' | 'cancelada';
  fechaOc: string;
  fechaEntrega?: string;
  terminosPago?: 'contado' | 'credito';
  moneda?: 'MXN' | 'USD';
  certificadoCalidad?: boolean;
  solicitanteNombre?: string;
  solicitanteCodigo?: string;
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

export interface Proveedor {
  id: string;
  numero: string;
  nombre: string;
  tipo?: string;
  domicilio?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  createdAt?: string;
}
