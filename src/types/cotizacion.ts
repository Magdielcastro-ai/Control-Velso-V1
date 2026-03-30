// Tipos para Presupuesto Pro CNC - Catálogo Velso

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
}

export interface EspecificacionesProyecto {
  nombre: string;
  descripcion: string;
  cantidad: number;
  dibujo?: string;
  notas?: string;
}

// Formas de material
export type FormaMaterial = 'redondo' | 'cuadrado' | 'placa' | 'placa_rectificada' | 'otro';

// Unidades de medida
export type UnidadMedida = 'mm' | 'in';

// Catálogo de materiales predefinidos
export interface CatalogoMaterial {
  id: string;
  nombre: string;
  tipo: string;
  forma: FormaMaterial;
  unidadMedida: UnidadMedida;
  // Dimensiones base del catálogo (pueden modificarse al usar)
  diametro?: number; // Para redondo
  lado?: number; // Para cuadrado
  largo?: number; // Para redondo, cuadrado
  ancho?: number; // Para placa
  espesor?: number; // Para placa
  // Costo base
  costoUnitario: number;
  unidadCosto: 'kg' | 'pieza' | 'metro';
}

export interface Material {
  id: string;
  nombre: string;
  tipo: string;
  forma: FormaMaterial;
  unidadMedida: UnidadMedida;
  // Dimensiones
  diametro?: number; // Redondo
  lado?: number; // Cuadrado
  largo?: number; // Redondo, Cuadrado
  ancho?: number; // Placa
  espesor?: number; // Placa
  // Cantidad y costo
  cantidad: number;
  unidad: 'kg' | 'pieza' | 'metro';
  costoUnitario: number;
  margenPorcentaje: number;
  costoTotal: number;
}

// Catálogo de procesos Velso
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

// Definición del catálogo de costos Velso
export interface CatalogoProceso {
  id: TipoProcesoVelso;
  nombre: string;
  costoPorHora: number;
  requiereManoObra: 'ninguna' | 'mo_s' | 'mo_e';
  descripcion: string;
  categoria: 'indirecto' | 'mano_obra' | 'servicio' | 'maquina';
}

// Catálogo de procesos con costos predefinidos
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

// Costos de mano de obra adicional
export const COSTOS_MANO_OBRA = {
  mo_s: 191.19,
  mo_e: 286.78,
};

export interface Proceso {
  id: string;
  nombre: string;
  tipo: TipoProcesoVelso;
  tiempoMinutos: number;
  costoPorHora: number;
  costoManoObra: number;
  costoTotal: number;
  descripcion?: string;
  incluyeManoObra: boolean;
  tipoManoObraSeleccionada?: 'mo_s' | 'mo_e'; // Solo para máquinas donde se puede elegir
}

export interface CostosAdicionales {
  disenoCAD: number;
  programacionCNC: number;
  setup: number;
  transporte: number;
  otro: number;
}

export interface CondicionesComerciales {
  validezDias: number;
  tiempoEntregaDias: number;
  formaPago: string;
  anticipoPorcentaje: number;
  garantia: string;
  notasLegales?: string;
}

export interface Cotizacion {
  id: string;
  numero: string;
  fecha: string;
  datosTaller: DatosTaller;
  datosCliente: DatosCliente;
  proyecto: EspecificacionesProyecto;
  materiales: Material[];
  procesos: Proceso[];
  costosAdicionales: CostosAdicionales;
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
  clienteNombre: string;
  proyectoNombre: string;
  total: number;
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
}
