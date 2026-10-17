import type { PiezaCotizacion } from './cotizacion';

// Estados de proyecto
export type EstadoProyecto = 
  | 'en_fabricacion' 
  | 'fabricado' 
  | 'entregado' 
  | 'facturado';

// Origen del proyecto:
// - cotizacion: flujo normal (cotización → PO → proyecto)
// - urgencia: proyecto directo sin PO; la cotización se genera después con
//   datos reales; la venta impacta al registrar la PO del cliente
// - stock: fabricación para almacén; gastos impactan al hacerse, la
//   utilidad solo al facturar. Soporta venta parcial (stockVendido)
export type TipoOrigenProyecto = 'cotizacion' | 'urgencia' | 'stock';

// Registro de venta parcial de un proyecto de stock
export interface VentaStockParcial {
  proyectoDestinoId: string;      // proyecto nuevo (código por factura)
  codigoDestino: string;
  fecha: string;
  piezas: { piezaId: string; cantidad: number }[];
}

// Contacto de cliente
export interface UsuarioCliente {
  id: string;
  nombre: string;
  departamento: string;
  email: string;
  telefono: string;
  celular: string;
  esPrincipal: boolean;
}

export interface Cliente {
  id: string;
  nombreEmpresa: string;
  direccion: string;
  telefono: string;
  rfc: string;
  terminosPago: string;
  usuarios: UsuarioCliente[];
  fechaRegistro: string;
}

// Material usado en proyecto
export interface MaterialProyecto {
  id: string;
  nombre: string;
  tipo: string;
  forma: string;
  cantidad: number;
  unidad: string;
  costoUnitarioCotizado: number;
  costoUnitarioReal?: number;
  margenPorcentaje: number;
  costoTotalCotizado: number;
  costoTotalReal?: number;
}

// Proceso usado en proyecto
export interface ProcesoProyecto {
  id: string;
  nombre: string;
  tipo: string;
  tiempoMinutosCotizado: number;
  tiempoMinutosReal?: number;
  costoPorHora: number;
  costoManoObra: number;
  costoTotalCotizado: number;
  costoTotalReal?: number;
}

// Costos adicionales del proyecto
export interface CostosAdicionalesProyecto {
  disenoCAD: number;
  programacionCNC: number;
  setup: number;
  transporte: number;
  otro: number;
}

// Proyecto/Venta completo
export interface ProyectoVenta {
  id: string;
  codigoProyecto: string;
  tipoProyecto: 'suministro' | 'maquinado';
  tipoOrigen?: TipoOrigenProyecto;  // default 'cotizacion'
  stockVendido?: VentaStockParcial[]; // ventas parciales apartadas (solo stock)
  cotizadoSnapshot?: any;           // baseline cotizado (proyectos directos, al generar su cotización)
  numeroCotizacion: string;
  cotizacionId?: string;
  ordenCompra: string;
  numeroFactura?: string;
  fechaVenta: string;
  fechaFabricado?: string;
  fechaEntregado?: string;
  fechaFacturado?: string;
  estado: EstadoProyecto;
  clienteId: string;
  clienteNombre: string;
  proyectoNombre: string;
  totalCotizado: number;
  totalFacturado?: number;
  margenUtilidad: number;
  ivaPorcentaje: number;
  usuarioId?: string;
  // Datos de cotización
  piezas: PiezaCotizacion[];
  materiales: MaterialProyecto[];
  procesos: ProcesoProyecto[];
  costosAdicionales: CostosAdicionalesProyecto;
  // Datos reales (para control de códigos)
  materialesReales?: MaterialProyecto[];
  procesosReales?: ProcesoProyecto[];
  costosAdicionalesReales?: CostosAdicionalesProyecto;
  // Utilidad calculada
  costoTotalReal?: number;
  utilidadReal?: number;
  porcentajeUtilidadReal?: number;
}

// Métricas del dashboard
export interface MetricasMensuales {
  mes: string;
  anio: number;
  totalCotizado: number;
  totalVendido: number;
  totalFabricado: number;
  totalFacturado: number;
  horasPorProceso: {
    codigo_07: number;
    mo_s: number;
    mo_e: number;
    hora_diseno: number;
    hora_ensamble: number;
    torno_convencional: number;
    perfiladora: number;
    torno_cnc: number;
    cnc_vertical: number;
  };
  cotizacionesPorCliente: {
    clienteId: string;
    clienteNombre: string;
    cantidad: number;
    total: number;
    porcentaje: number;
  }[];
}

// Horas disponibles por proceso (configuración)
export interface HorasDisponiblesMensuales {
  codigo_07: number;
  mo_s: number;
  mo_e: number;
  hora_diseno: number;
  hora_ensamble: number;
  torno_convencional: number;
  perfiladora: number;
  torno_cnc: number;
  cnc_vertical: number;
}

// Datos para gráficas circulares
export interface DatosGraficaCircular {
  nombre: string;
  valor: number;
  color: string;
}

export interface ComparacionHoras {
  categoria: string;
  cotizadas: number;
  vendidas: number;
  fabricadas: number;
  facturadas: number;
}
