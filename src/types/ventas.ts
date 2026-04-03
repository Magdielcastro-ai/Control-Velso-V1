// Tipos para Sistema de Control de Ventas Velso

// Estados de proyecto
export type EstadoProyecto = 
  | 'en_fabricacion' 
  | 'fabricado' 
  | 'entregado' 
  | 'facturado';

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
  numeroCotizacion: string;
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
