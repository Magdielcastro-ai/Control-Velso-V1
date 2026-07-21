// Tipos para Presupuesto Pro CNC - Catálogo Velso

export type TipoCotizacion = 'pieza_unica' | 'proyecto';

export interface DatosTaller {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  logo?: string;
  rfc?: string;
}

export interface DatosCliente {
  nombre: string;
  empresa: string;
  direccion: string;
  telefono: string;
  email: string;
  rfc?: string;
  clienteId?: string;
}

export interface EspecificacionesProyecto {
  nombre: string;
  descripcion: string;
  cantidad: number;
  dibujo?: string;
  notas?: string;
}

// FORMAS DE MATERIAL - ACTUALIZADAS CON NUEVAS FORMAS
export type FormaMaterial = 
  | 'redondo' 
  | 'cuadrado' 
  | 'placa' 
  | 'placa_rectificada' 
  | 'barra_hueca' 
  | 'barra_cromada' 
  | 'angulo' 
  | 'otro';

export type UnidadMedida = 'mm' | 'in';

export interface CatalogoMaterial {
  id: string;
  nombre: string;
  tipo: string;
  forma: FormaMaterial;
  unidadMedida: UnidadMedida;
  diametro?: number;
  lado?: number;
  largo?: number;
  ancho?: number;
  espesor?: number;
  diametro_exterior?: number;
  diametro_interior?: number;
  lado_a?: number;
  lado_b?: number;
  descripcion?: string;
  dimensiones_libre?: string;
  costoUnitario: number;
  unidadCosto: 'kg' | 'pieza' | 'metro';
  created_at?: string;
}

// MATERIAL ASIGNADO A UNA PIEZA (UNICO)
export interface Material {
  id: string;
  nombre: string;
  tipo: string;
  forma: FormaMaterial;
  unidadMedida: UnidadMedida;
  // Dimensiones según forma
  diametro?: number;
  lado?: number;
  largo?: number;
  ancho?: number;
  espesor?: number;
  diametro_exterior?: number;
  diametro_interior?: number;
  lado_a?: number;
  lado_b?: number;
  descripcion?: string;
  dimensiones_libre?: string;
  // Costos
  cantidad: number;           // cantidad física de material (kg, metros, etc.)
  unidad: 'kg' | 'pieza' | 'metro';
  costoUnitario: number;     // costo por unidad de medida del material
  margenPorcentaje: number;
  costoTotal: number;         // COSTO TOTAL del material para TODAS las piezas (ingresado por usuario)
}

export type TipoProcesoVelso =
  | 'codigo_07'
  | 'mo_s'
  | 'mo_e'
  | 'hora_diseno'
  | 'hora_ensamble'
  | 'torno_convencional'
  | 'perfiladora'
  | 'torno_cnc'
  | 'cnc_vertical'
  | 'otro';

export interface CatalogoProceso {
  id: TipoProcesoVelso;
  nombre: string;
  costoPorHora: number;
  requiereManoObra: 'ninguna' | 'mo_s' | 'mo_e';
  descripcion: string;
  categoria: 'indirecto' | 'mano_obra' | 'servicio' | 'maquina';
}

export const CATALOGO_PROCESOS_VELSO: CatalogoProceso[] = [
  {
    id: 'codigo_07',
    nombre: 'Código 07',
    costoPorHora: 707.96,
    requiereManoObra: 'ninguna',
    descripcion: 'Costo indirecto. Se asigna proporcionalmente a cada proyecto.',
    categoria: 'indirecto',
  },
  {
    id: 'mo_s',
    nombre: 'MO-S (Operador Sencillo)',
    costoPorHora: 191.19,
    requiereManoObra: 'ninguna',
    descripcion: 'Tareas básicas, limpieza, apoyo, procesos simples.',
    categoria: 'mano_obra',
  },
  {
    id: 'mo_e',
    nombre: 'MO-E (Operador Especializado)',
    costoPorHora: 286.78,
    requiereManoObra: 'ninguna',
    descripcion: 'Operación especializada, CNC, procesos críticos.',
    categoria: 'mano_obra',
  },
  {
    id: 'hora_diseno',
    nombre: 'Hora Diseño',
    costoPorHora: 360.97,
    requiereManoObra: 'ninguna',
    descripcion: 'Ingeniería, modelado, planos, ajustes técnicos.',
    categoria: 'servicio',
  },
  {
    id: 'hora_ensamble',
    nombre: 'Hora Ensamble',
    costoPorHora: 347.56,
    requiereManoObra: 'ninguna',
    descripcion: 'Ensamble mecánico, ajustes finales, armado.',
    categoria: 'servicio',
  },
  {
    id: 'torno_convencional',
    nombre: 'Torno Convencional',
    costoPorHora: 63.24,
    requiereManoObra: 'mo_s',
    descripcion: 'Máquina + operador.',
    categoria: 'maquina',
  },
  {
    id: 'perfiladora',
    nombre: 'Perfiladora',
    costoPorHora: 36.68,
    requiereManoObra: 'mo_s',
    descripcion: 'Máquina + operador.',
    categoria: 'maquina',
  },
  {
    id: 'torno_cnc',
    nombre: 'Torno CNC',
    costoPorHora: 206.06,
    requiereManoObra: 'mo_e',
    descripcion: 'Máquina + operador especializado.',
    categoria: 'maquina',
  },
  {
    id: 'cnc_vertical',
    nombre: 'CNC Vertical (Pool 4)',
    costoPorHora: 338.47,
    requiereManoObra: 'mo_e',
    descripcion: 'Incluye máquina parada. Requiere operador especializado.',
    categoria: 'maquina',
  },
  {
    id: 'otro',
    nombre: 'Otro Proceso',
    costoPorHora: 0,
    requiereManoObra: 'ninguna',
    descripcion: 'Proceso personalizado con costo manual.',
    categoria: 'servicio',
  },
];

export const COSTOS_MANO_OBRA = {
  mo_s: 191.19,
  mo_e: 286.78,
};

export interface Proceso {
  id: string;
  nombre: string;
  tipo: TipoProcesoVelso;
  tiempoMinutosPorPieza: number;  // TIEMPO POR PIEZA (ingresado por usuario)
  tiempoMinutos: number;          // TIEMPO TOTAL = tiempoMinutosPorPieza × cantidadPiezas
  costoPorHora: number;
  costoManoObraPorHora: number;   // TASA por hora de MO (191.19 o 286.78)
  costoManoObra: number;          // Costo TOTAL de MO (para compatibilidad)
  costoTotal: number;
  descripcion?: string;
  incluyeManoObra: boolean;
  tipoManoObraSeleccionada?: 'mo_s' | 'mo_e';
  costoTotalIngresado?: number;   // Para procesos externos: costo POR PIEZA ingresado por usuario
  margenPorcentaje?: number;      // Margen de seguridad/financiamiento para procesos externos
}

export interface CostosAdicionales {
  disenoCAD: number;
  programacionCNC: number;
  setup: number;
  transporte: number;
  otro: number;
}

// NUEVO: Costos adicionales a nivel de PROYECTO (pestaña Costos)
export interface CostoAdicionalItem {
  costo: number;
  incluidoGratis: boolean;
}

export interface CostosAdicionalesProyecto {
  envio: CostoAdicionalItem;
  diseno: CostoAdicionalItem;
  estudioMaterial: CostoAdicionalItem;
  pruebaDureza: CostoAdicionalItem;
}

export interface CondicionesComerciales {
  validezDias: number;
  tiempoEntregaDias: number;
  formaPago: string;
  anticipoPorcentaje: number;
  garantia: string;
  notasLegales?: string;
}

// PIEZA CON MATERIAL UNICO (NO ARRAY)
export interface PiezaCotizacion {
  id: string;
  codigo?: string;  // Código del catálogo de piezas
  nombre: string;
  cantidad: number;
  material: Material | null;  // ← UN SOLO MATERIAL POR PIEZA
  procesos: Proceso[];
  costosAdicionales: CostosAdicionalesProyecto;
  subtotalPieza: number;
  utilidadPieza: number;
  ivaPieza: number;
  totalPieza: number;
  // Campos para costos por pieza en la pestaña Costos
  margenPieza?: number;        // Margen de utilidad específico por pieza (sobrescribe el global)
}

export interface PiezaCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  material: Material | null;
  procesos: Proceso[];
  costosAdicionales: CostosAdicionalesProyecto;
  subtotalPieza: number;
  utilidadPieza: number;
  ivaPieza: number;
  totalPieza: number;
  created_at?: string;
  updated_at?: string;
}

export interface Cotizacion {  id: string;
  numero: string;
  fecha: string;
  tipo: TipoCotizacion;
  datosTaller: DatosTaller;
  datosCliente: DatosCliente;
  proyecto: EspecificacionesProyecto;
  piezas: PiezaCotizacion[];
  materiales: Material[];  // Legacy - mantenido para compatibilidad
  procesos: Proceso[];     // Legacy
  costosAdicionales: CostosAdicionalesProyecto;
  condiciones: CondicionesComerciales;
  subtotal: number;
  ivaPorcentaje: number;
  iva: number;
  total: number;
  margenUtilidad: number;
}

export type PasoCotizacion =
  | 'bienvenida'
  | 'taller'
  | 'cliente'
  | 'proyecto'
  | 'piezas'
  | 'materiales'
  | 'procesos'
  | 'costos'
  | 'condiciones'
  | 'resumen'
  | 'cotizacion-final';

export interface CotizacionGuardada {
  id: string;
  numero: string;
  fecha: string;
  tipo: TipoCotizacion;
  clienteNombre: string;
  proyectoNombre: string;
  total: number;
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  usuarioId?: string;
  cantidadPiezas?: number;
}
