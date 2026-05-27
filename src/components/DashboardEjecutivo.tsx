// src/components/DashboardEjecutivo.tsx

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Factory,
  FileText,
  Truck,
  Phone,
  AlertOctagon,
  BarChart3,
  Package,
  Users,
  Building2,
  Settings,
  Loader2,
  Calendar,
  ChevronDown
} from 'lucide-react';
import type { Pendiente, Alerta } from '@/types/pendientes';
import type { ProyectoVenta } from '@/types/ventas';
import type { CotizacionGuardada } from '@/types/cotizacion';

interface DashboardEjecutivoProps {
  onVolver: () => void;
  pendientesHoy: Pendiente[];
  alertasRojas: Alerta[];
  proyectos: ProyectoVenta[];
  cotizaciones: CotizacionGuardada[];
  totalesCobranza: {
    totalPorCobrar: number;
    totalVencido: number;
    totalPagado: number;
    totalParcial: number;
    totalIncobrable: number;
    cantidadPorCobrar: number;
    cantidadVencidos: number;
    cantidadPagados: number;
    cantidadParciales: number;
  };
  onIrAPendientes: () => void;
  onIrACobranza: () => void;
  onIrAProyectos: () => void;
  onIrACotizaciones: () => void;
  // Datos adicionales de catálogos (opcionales)
  talleresCount?: number;
  materialesCount?: number;
  clientesCount?: number;
  procesosCount?: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DashboardEjecutivo({
  onVolver,
  pendientesHoy,
  alertasRojas,
  proyectos,
  cotizaciones,
  totalesCobranza,
  onIrAPendientes,
  onIrACobranza,
  onIrAProyectos,
  onIrACotizaciones,
  talleresCount = 0,
  materialesCount = 0,
  clientesCount = 0,
  procesosCount = 0,
}: DashboardEjecutivoProps) {
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'pipeline' | 'alertas' | 'catalogos'>('resumen');
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null); // null = todos los meses
  const [anioSeleccionado] = useState(2026);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);


  // ============================================
  // CÁLCULOS HISTÓRICOS (todos los datos)
  // ============================================
  const totalesHistoricos = useMemo(() => {
    const totalCotizado = cotizaciones.reduce((sum, c) => sum + (c.total || 0), 0);
    const totalVendido = proyectos.reduce((sum, p) => sum + (p.totalCotizado || 0), 0);
    const totalFacturado = proyectos.reduce((sum, p) => sum + (p.totalFacturado || 0), 0);
    const totalUtilidad = proyectos.reduce((sum, p) => sum + (p.utilidadReal || 0), 0);

    const cotizacionesEnviadas = cotizaciones.filter(c => c.estado === 'enviada').length;
    const cotizacionesBorrador = cotizaciones.filter(c => c.estado === 'borrador').length;
    const cotizacionesAutorizadas = proyectos.length; // Las que se convirtieron en proyecto

    const proyectosFabricacion = proyectos.filter(p => p.estado === 'en_fabricacion').length;
    const proyectosFabricados = proyectos.filter(p => p.estado === 'fabricado').length;
    const proyectosEntregados = proyectos.filter(p => p.estado === 'entregado').length;
    const proyectosFacturados = proyectos.filter(p => p.estado === 'facturado').length;

    return {
      totalCotizado,
      totalVendido,
      totalFacturado,
      totalUtilidad,
      cotizacionesEnviadas,
      cotizacionesBorrador,
      cotizacionesAutorizadas,
      proyectosFabricacion,
      proyectosFabricados,
      proyectosEntregados,
      proyectosFacturados,
      tasaConversion: totalCotizado > 0 ? ((totalVendido / totalCotizado) * 100).toFixed(1) : '0',
    };
  }, [cotizaciones, proyectos]);

  // ============================================
  // CÁLCULOS POR MES (si se selecciona un mes)
  // ============================================
  const datosPorMes = useMemo(() => {
    if (mesSeleccionado === null) return null;

    const cotizacionesMes = cotizaciones.filter(c => {
      const fecha = new Date(c.fecha);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });

    const proyectosMes = proyectos.filter(p => {
      const fecha = new Date(p.fechaVenta);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });

    return {
      cotizacionesMes,
      proyectosMes,
      totalCotizadoMes: cotizacionesMes.reduce((sum, c) => sum + (c.total || 0), 0),
      totalVendidoMes: proyectosMes.reduce((sum, p) => sum + (p.totalCotizado || 0), 0),
    };
  }, [cotizaciones, proyectos, mesSeleccionado, anioSeleccionado]);

  // ============================================
  // PIPELINE
  // ============================================
  const pipelineData = useMemo(() => {
    const cotBorrador = cotizaciones.filter(c => c.estado === 'borrador');
    const cotEnviada = cotizaciones.filter(c => c.estado === 'enviada');
    const projFabricacion = proyectos.filter(p => p.estado === 'en_fabricacion');
    const projFabricado = proyectos.filter(p => p.estado === 'fabricado');
    const projEntregado = proyectos.filter(p => p.estado === 'entregado');
    const projFacturado = proyectos.filter(p => p.estado === 'facturado');

    return [
      { 
        etapa: 'Borrador', 
        cantidad: cotBorrador.length, 
        monto: cotBorrador.reduce((sum, c) => sum + (c.total || 0), 0),
        color: 'bg-slate-500',
        icon: FileText,
        descripcion: 'Cotizaciones en borrador'
      },
      { 
        etapa: 'Enviada / Esperando', 
        cantidad: cotEnviada.length, 
        monto: cotEnviada.reduce((sum, c) => sum + (c.total || 0), 0),
        color: 'bg-blue-500',
        icon: Phone,
        descripcion: 'Cotizaciones enviadas al cliente'
      },
      { 
        etapa: 'Autorizado / En Fabricación', 
        cantidad: projFabricacion.length, 
        monto: projFabricacion.reduce((sum, p) => sum + (p.totalCotizado || 0), 0),
        color: 'bg-orange-500',
        icon: Factory,
        descripcion: 'Proyectos en producción'
      },
      { 
        etapa: 'Fabricado', 
        cantidad: projFabricado.length, 
        monto: projFabricado.reduce((sum, p) => sum + (p.totalCotizado || 0), 0),
        color: 'bg-yellow-500',
        icon: Package,
        descripcion: 'Proyectos terminados'
      },
      { 
        etapa: 'Entregado', 
        cantidad: projEntregado.length, 
        monto: projEntregado.reduce((sum, p) => sum + (p.totalCotizado || 0), 0),
        color: 'bg-purple-500',
        icon: Truck,
        descripcion: 'Entregados al cliente'
      },
      { 
        etapa: 'Facturado', 
        cantidad: projFacturado.length, 
        monto: projFacturado.reduce((sum, p) => sum + (p.totalFacturado || p.totalCotizado || 0), 0),
        color: 'bg-green-500',
        icon: DollarSign,
        descripcion: 'Facturas enviadas'
      },
    ];
  }, [cotizaciones, proyectos]);

  // ============================================
  // DETECCIÓN DE ESTADO
  // ============================================
  const hayDatos = cotizaciones.length > 0 || proyectos.length > 0;
  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onVolver} className="border-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Ejecutivo</h1>
            <p className="text-sm text-slate-500">
              {hayDatos 
                ? `${cotizaciones.length} cotizaciones · ${proyectos.length} proyectos · $${totalesHistoricos.totalCotizado.toLocaleString()} en pipeline`
                : 'Cargando datos de Supabase...'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant={vistaActiva === 'resumen' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('resumen')}
            className={vistaActiva === 'resumen' ? 'bg-blue-600' : ''}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Resumen
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'pipeline' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('pipeline')}
            className={vistaActiva === 'pipeline' ? 'bg-blue-600' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Pipeline
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'alertas' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('alertas')}
            className={vistaActiva === 'alertas' ? 'bg-red-600' : ''}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Alertas {alertasRojas.length > 0 && `(${alertasRojas.length})`}
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'catalogos' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('catalogos')}
            className={vistaActiva === 'catalogos' ? 'bg-purple-600' : ''}
          >
            <Settings className="w-4 h-4 mr-1" />
            Catálogos
          </Button>
        </div>
      </div>

      {/* Estado de carga */}
      {!hayDatos && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-lg font-medium text-slate-700">Cargando datos de Supabase...</p>
            <p className="text-sm text-slate-500 mt-1">
              Si tienes datos guardados, aparecerán en un momento.
            </p>
            <div className="mt-4 text-xs text-slate-400 space-y-1">
              <p>Cotizaciones: {cotizaciones.length}</p>
              <p>Proyectos: {proyectos.length}</p>
              <p>Pendientes: {pendientesHoy.length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro de período */}
      {hayDatos && (
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <button 
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 w-full"
            >
              <Calendar className="w-4 h-4" />
              {mesSeleccionado !== null 
                ? `Filtrando: ${MESES[mesSeleccionado]} ${anioSeleccionado}` 
                : 'Mostrando datos históricos (todos los períodos)'
              }
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
            </button>

            {mostrarFiltros && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  variant={mesSeleccionado === null ? 'default' : 'outline'}
                  onClick={() => setMesSeleccionado(null)}
                  className={mesSeleccionado === null ? 'bg-blue-600' : ''}
                >
                  Todos
                </Button>
                {MESES.map((mes, index) => (
                  <Button 
                    key={index}
                    size="sm" 
                    variant={mesSeleccionado === index ? 'default' : 'outline'}
                    onClick={() => setMesSeleccionado(index)}
                    className={mesSeleccionado === index ? 'bg-blue-600' : ''}
                  >
                    {mes}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === VISTA RESUMEN === */}
      {vistaActiva === 'resumen' && (
        <>
          {/* KPIs principales - HISTÓRICOS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrACotizaciones}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-700">{cotizaciones.length} total</Badge>
                </div>
                <p className="text-sm text-slate-500">Total Cotizado</p>
                <p className="text-2xl font-bold text-slate-900">${totalesHistoricos.totalCotizado.toLocaleString()}</p>
                {datosPorMes && (
                  <p className="text-xs text-blue-600 mt-1">
                    {MESES[mesSeleccionado!]}: ${datosPorMes.totalCotizadoMes.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrAProyectos}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Factory className="w-8 h-8 text-green-600" />
                  <Badge className="bg-green-100 text-green-700">{proyectos.length} activos</Badge>
                </div>
                <p className="text-sm text-slate-500">Total Vendido</p>
                <p className="text-2xl font-bold text-slate-900">${totalesHistoricos.totalVendido.toLocaleString()}</p>
                {datosPorMes && (
                  <p className="text-xs text-green-600 mt-1">
                    {MESES[mesSeleccionado!]}: ${datosPorMes.totalVendidoMes.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrACobranza}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                  <Badge className={totalesCobranza.totalVencido > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {totalesCobranza.cantidadVencidos} vencidas
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">Total Facturado</p>
                <p className="text-2xl font-bold text-slate-900">${totalesHistoricos.totalFacturado.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{totalesCobranza.cantidadPorCobrar} por cobrar</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                  <Badge className="bg-amber-100 text-amber-700">{totalesHistoricos.tasaConversion}%</Badge>
                </div>
                <p className="text-sm text-slate-500">Utilidad Real</p>
                <p className="text-2xl font-bold text-amber-600">${totalesHistoricos.totalUtilidad.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Tasa conversión: {totalesHistoricos.tasaConversion}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas rápidas */}
          {alertasRojas.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                  <AlertOctagon className="w-5 h-5" />
                  Alertas que requieren atención ({alertasRojas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertasRojas.slice(0, 5).map(alerta => (
                  <div 
                    key={alerta.id} 
                    className="flex items-center justify-between p-2 bg-white rounded border border-red-100"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{alerta.titulo}</p>
                        <p className="text-xs text-slate-500">{alerta.descripcion}</p>
                      </div>
                    </div>
                    {alerta.monto && (
                      <p className="text-sm font-medium text-slate-900">${alerta.monto.toLocaleString()}</p>
                    )}
                  </div>
                ))}
                {alertasRojas.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setVistaActiva('alertas')}>
                    Ver todas las alertas
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pendientes de hoy */}
          {pendientesHoy.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Pendientes para hoy ({pendientesHoy.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendientesHoy.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        p.prioridad === 'urgente' ? 'bg-red-500' :
                        p.prioridad === 'alta' ? 'bg-orange-500' :
                        p.prioridad === 'media' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.titulo}</p>
                        <p className="text-xs text-slate-500">{p.clienteNombre} • {p.responsable}</p>
                      </div>
                    </div>
                    <Badge className={
                      p.prioridad === 'urgente' ? 'bg-red-100 text-red-700' :
                      p.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {p.prioridad}
                    </Badge>
                  </div>
                ))}
                {pendientesHoy.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={onIrAPendientes}>
                    Ver todos ({pendientesHoy.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estado de Cartera y Producción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Cartera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Por Cobrar</span>
                    <span className="font-medium">${totalesCobranza.totalPorCobrar.toLocaleString()}</span>
                  </div>
                  <Progress value={totalesCobranza.totalPorCobrar > 0 ? 100 : 0} className="h-2 bg-slate-200" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-600">Vencido</span>
                    <span className="font-medium text-red-600">${totalesCobranza.totalVencido.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={totalesCobranza.totalPorCobrar > 0 
                      ? (totalesCobranza.totalVencido / totalesCobranza.totalPorCobrar) * 100 
                      : 0} 
                    className="h-2 bg-slate-200"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600">Pagado</span>
                    <span className="font-medium text-green-600">${totalesCobranza.totalPagado.toLocaleString()}</span>
                  </div>
                  <Progress value={100} className="h-2 bg-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-600" />
                  Producción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-600">{totalesHistoricos.proyectosFabricacion}</p>
                    <p className="text-xs text-slate-600">En Fabricación</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{totalesHistoricos.proyectosFabricados}</p>
                    <p className="text-xs text-slate-600">Fabricados</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{totalesHistoricos.proyectosEntregados}</p>
                    <p className="text-xs text-slate-600">Entregados</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{totalesHistoricos.proyectosFacturados}</p>
                    <p className="text-xs text-slate-600">Facturados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* === VISTA PIPELINE === */}
      {vistaActiva === 'pipeline' && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Pipeline de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineData.map((etapa, index) => {
              const Icon = etapa.icon;
              const isLast = index === pipelineData.length - 1;

              return (
                <div key={etapa.etapa} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full ${etapa.color} flex items-center justify-center text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-8 bg-slate-300 my-1" />
                      )}
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{etapa.etapa}</p>
                          <p className="text-sm text-slate-500">{etapa.descripcion}</p>
                          <p className="text-xs text-slate-400">{etapa.cantidad} registros</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">${etapa.monto.toLocaleString()}</p>
                          <Badge className={`${etapa.color} text-white`}>
                            {etapa.cantidad}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold text-blue-900">Total en Pipeline</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ${pipelineData.reduce((sum, e) => sum + e.monto, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === VISTA ALERTAS === */}
      {vistaActiva === 'alertas' && (
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" />
                Todas las Alertas ({alertasRojas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertasRojas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-slate-700">¡Sin alertas!</p>
                  <p className="text-sm text-slate-500">Todo está bajo control</p>
                </div>
              ) : (
                alertasRojas.map(alerta => (
                  <div 
                    key={alerta.id} 
                    className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {alerta.tipo === 'factura_vencida' && <DollarSign className="w-5 h-5 text-red-500" />}
                        {alerta.tipo === 'proyecto_estancado' && <Factory className="w-5 h-5 text-orange-500" />}
                        {alerta.tipo === 'seguimiento_cotizacion' && <Phone className="w-5 h-5 text-blue-500" />}
                        {alerta.tipo === 'cotizacion_sin_enviar' && <FileText className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{alerta.titulo}</p>
                        <p className="text-sm text-slate-500">{alerta.descripcion}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                            {alerta.dias} días
                          </Badge>
                          <span className="text-xs text-slate-400">{alerta.fecha}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {alerta.monto && (
                        <p className="text-lg font-bold text-slate-900">${alerta.monto.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* === VISTA CATÁLOGOS === */}
      {vistaActiva === 'catalogos' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{talleresCount}</p>
              <p className="text-sm text-slate-500">Talleres Guardados</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{clientesCount}</p>
              <p className="text-sm text-slate-500">Clientes Registrados</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{materialesCount}</p>
              <p className="text-sm text-slate-500">Materiales en Catálogo</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{procesosCount}</p>
              <p className="text-sm text-slate-500">Procesos Configurados</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
