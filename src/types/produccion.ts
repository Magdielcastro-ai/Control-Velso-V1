// Tipos para el módulo de Producción y Trazabilidad

export type EstadoProcesoProduccion =
  | 'pendiente'
  | 'en_proceso'
  | 'pausado'
  | 'completado'
  | 'retrasado'
  | 'rechazado';

export type TipoIncidencia =
  | 'retrabajo'
  | 'desperdicio_material'
  | 'falla_maquina'
  | 'error_operador'
  | 'cambio_especificaciones'
  | 'otro';

export interface RegistroProduccion {
  id: string;
  proyectoId: string;           // FK a proyectos
  piezaId: string;                // ID de la pieza dentro del proyecto
  piezaNombre: string;
  procesoTipo: string;            // 'torno_cnc', 'cnc_vertical', etc.
  procesoNombre: string;
  operadorId?: string;            // FK a perfiles
  operadorNombre?: string;

  // Tiempos
  tiempoEstimadoMinutos: number;  // De la cotización original
  tiempoRealMinutos: number;       // Registrado en producción
  fechaInicio?: string;            // ISO timestamp
  fechaFin?: string;               // ISO timestamp

  // Costos
  costoEstimado: number;          // De la cotización original
  costoReal: number;              // Calculado con tiempo real × tarifa

  // Estado y seguimiento
  estado: EstadoProcesoProduccion;
  notas?: string;
  incidencias?: {
    tipo: TipoIncidencia;
    descripcion: string;
    costoImpacto?: number;         // Costo adicional por la incidencia
  }[];

  createdAt: string;
  updatedAt: string;
}

export interface ResumenProduccionPieza {
  piezaId: string;
  piezaNombre: string;
  cantidad: number;

  // Totales estimados (de cotización)
  tiempoEstimadoTotalMin: number;
  costoEstimadoTotal: number;

  // Totales reales (de producción)
  tiempoRealTotalMin: number;
  costoRealTotal: number;

  // Diferencias
  diferenciaTiempoMin: number;
  diferenciaCosto: number;
  porcentajeDesviacionTiempo: number;  // +25% = se tardó 25% más
  porcentajeDesviacionCosto: number;

  procesos: RegistroProduccion[];
}

export interface ResumenProduccionProyecto {
  proyectoId: string;
  proyectoNombre: string;
  clienteNombre: string;
  fechaVenta: string;

  // Cotización original
  subtotalCotizado: number;
  totalCotizado: number;
  margenUtilidadCotizado: number;

  // Real
  costoRealTotal: number;
  tiempoRealTotalMin: number;
  tiempoRealTotalHoras: number;

  // Comparativa
  utilidadReal: number;
  porcentajeUtilidadReal: number;
  desviacionUtilidad: number;       // -$80 = se perdieron $80
  porcentajeDesviacionUtilidad: number; // -40% = utilidad 40% menor

  // Eficiencia
  eficienciaGlobal: number;         // 85% = se usó 85% del tiempo estimado
  piezas: ResumenProduccionPieza[];

  // Alertas
  alertas: {
    tipo: 'tiempo' | 'costo' | 'utilidad' | 'incidencia';
    severidad: 'baja' | 'media' | 'alta' | 'critica';
    mensaje: string;
  }[];
}

export interface FiltrosReporteProduccion {
  fechaInicio?: string;
  fechaFin?: string;
  clienteId?: string;
  operadorId?: string;
  estado?: EstadoProcesoProduccion;
}

export type PeriodoReporte = 'semana' | 'mes' | 'trimestre' | 'semestre' | 'anio';

export interface MetricasReporte {
  periodo: PeriodoReporte;
  fechaInicio: string;
  fechaFin: string;

  // Proyectos
  totalProyectos: number;
  proyectosCompletados: number;
  proyectosEnProceso: number;
  proyectosRetrasados: number;

  // Tiempos
  tiempoTotalEstimadoHoras: number;
  tiempoTotalRealHoras: number;
  eficienciaPromedio: number;

  // Financiero
  ingresoTotal: number;            // Total cotizado
  costoTotalReal: number;
  utilidadTotal: number;
  margenPromedio: number;

  // Por máquina/proceso
  eficienciaPorProceso: {
    procesoTipo: string;
    procesoNombre: string;
    tiempoEstimadoHoras: number;
    tiempoRealHoras: number;
    eficiencia: number;
  }[];

  // Top clientes
  topClientes: {
    clienteNombre: string;
    proyectos: number;
    ingreso: number;
    utilidad: number;
  }[];
}
