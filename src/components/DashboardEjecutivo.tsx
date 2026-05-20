// src/components/DashboardEjecutivo.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
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
  Users,
  Package,
  ChevronRight,
  Eye
} from 'lucide-react';
import type { Pendiente, Alerta, Cobranza } from '@/types/pendientes';
import type { ProyectoVenta } from '@/types/ventas';
import type { CotizacionGuardada } from '@/types/cotizacion';

interface DashboardEjecutivoProps {
  onVolver: () => void;
  pendientesHoy: Pendiente[];
  alertasRojas: Alerta[];
  proyectos: ProyectoVenta[];
  cotizaciones: CotizacionGuardada[];
  cobranzas: Cobranza[];
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
  horasDisponibles: Record<string, number>;
  onIrAPendientes: () => void;
  onIrACobranza: () => void;
  onIrAProyectos: () => void;
  onIrACotizaciones: () => void;
}

export function DashboardEjecutivo({
  onVolver,
  pendientesHoy,
  alertasRojas,
  proyectos,
  cotizaciones,
  cobranzas,
  totalesCobranza,
  horasDisponibles,
  onIrAPendientes,
  onIrACobranza,
  onIrAProyectos,
  onIrACotizaciones,
}: DashboardEjecutivoProps) {
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'pipeline' | 'alertas'>('resumen');

  // Métricas calculadas
  const proyectosPorEstado = {
    en_fabricacion: proyectos.filter(p => p.estado === 'en_fabricacion').length,
    fabricado: proyectos.filter(p => p.estado === 'fabricado').length,
    entregado: proyectos.filter(p => p.estado === 'entregado').length,
    facturado: proyectos.filter(p => p.estado === 'facturado').length,
  };

  const cotizacionesPorEstado = {
    borrador: cotizaciones.filter(c => c.estado === 'borrador').length,
    enviada: cotizaciones.filter(c => c.estado === 'enviada').length,
  };

  const totalVendidoMes = proyectos
    .filter(p => {
      const fecha = new Date(p.fechaVenta);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    })
    .reduce((sum, p) => sum + p.totalCotizado, 0);

  const totalFacturadoMes = proyectos
    .filter(p => {
      if (!p.fechaFacturado) return false;
      const fecha = new Date(p.fechaFacturado);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    })
    .reduce((sum, p) => sum + (p.totalFacturado || 0), 0);

  // Pipeline de ventas (cotizaciones → proyectos)
  const pipelineData = [
    { 
      etapa: 'Leads / Borrador', 
      cantidad: cotizacionesPorEstado.borrador, 
      monto: cotizaciones
        .filter(c => c.estado === 'borrador')
        .reduce((sum, c) => sum + c.total, 0),
      color: 'bg-slate-500',
      icon: FileText
    },
    { 
      etapa: 'Cotizado / Enviado', 
      cantidad: cotizacionesPorEstado.enviada, 
      monto: cotizaciones
        .filter(c => c.estado === 'enviada')
        .reduce((sum, c) => sum + c.total, 0),
      color: 'bg-blue-500',
      icon: Phone
    },
    { 
      etapa: 'Autorizado / En Fabricación', 
      cantidad: proyectosPorEstado.en_fabricacion, 
      monto: proyectos
        .filter(p => p.estado === 'en_fabricacion')
        .reduce((sum, p) => sum + p.totalCotizado, 0),
      color: 'bg-orange-500',
      icon: Factory
    },
    { 
      etapa: 'Fabricado', 
      cantidad: proyectosPorEstado.fabricado, 
      monto: proyectos
        .filter(p => p.estado === 'fabricado')
        .reduce((sum, p) => sum + p.totalCotizado, 0),
      color: 'bg-yellow-500',
      icon: Package
    },
    { 
      etapa: 'Entregado', 
      cantidad: proyectosPorEstado.entregado, 
      monto: proyectos
        .filter(p => p.estado === 'entregado')
        .reduce((sum, p) => sum + p.totalCotizado, 0),
      color: 'bg-purple-500',
      icon: Truck
    },
    { 
      etapa: 'Facturado', 
      cantidad: proyectosPorEstado.facturado, 
      monto: proyectos
        .filter(p => p.estado === 'facturado')
        .reduce((sum, p) => sum + (p.totalFacturado || p.totalCotizado), 0),
      color: 'bg-green-500',
      icon: DollarSign
    },
  ];

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
            <p className="text-sm text-slate-500">Visión completa del negocio</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* === VISTA RESUMEN === */}
      {vistaActiva === 'resumen' && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrAProyectos}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Factory className="w-8 h-8 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-700">{proyectos.length} activos</Badge>
                </div>
                <p className="text-sm text-slate-500">Proyectos Activos</p>
                <p className="text-2xl font-bold text-slate-900">${totalVendidoMes.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Vendido este mes</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrACobranza}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <Badge className={totalesCobranza.totalVencido > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {totalesCobranza.cantidadVencidos} vencidas
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">Por Cobrar</p>
                <p className="text-2xl font-bold text-slate-900">${totalesCobranza.totalPorCobrar.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{totalesCobranza.cantidadPorCobrar} facturas pendientes</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrACotizaciones}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-8 h-8 text-orange-600" />
                  <Badge className="bg-orange-100 text-orange-700">{cotizaciones.length} total</Badge>
                </div>
                <p className="text-sm text-slate-500">Cotizaciones</p>
                <p className="text-2xl font-bold text-slate-900">${cotizaciones.reduce((sum, c) => sum + c.total, 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">{cotizacionesPorEstado.enviada} esperando respuesta</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrAPendientes}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-purple-600" />
                  <Badge className={pendientesHoy.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {pendientesHoy.length} hoy
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-2xl font-bold text-slate-900">{pendientesHoy.length}</p>
                <p className="text-xs text-slate-400">{alertasRojas.length} alertas rojas</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas rápidas */}
          {alertasRojas.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                  <AlertOctagon className="w-5 h-5" />
                  Alertas que requieren atención
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
                    <div className="text-right">
                      {alerta.monto && (
                        <p className="text-sm font-medium text-slate-900">${alerta.monto.toLocaleString()}</p>
                      )}
                      <p className="text-xs text-red-600">{alerta.dias} días</p>
                    </div>
                  </div>
                ))}
                {alertasRojas.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setVistaActiva('alertas')}>
                    Ver todas las alertas ({alertasRojas.length})
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
                  Pendientes para hoy
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

          {/* Estado de cobranza */}
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
                    <span className="text-green-600">Pagado (mes)</span>
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
                    <p className="text-2xl font-bold text-orange-600">{proyectosPorEstado.en_fabricacion}</p>
                    <p className="text-xs text-slate-600">En Fabricación</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{proyectosPorEstado.fabricado}</p>
                    <p className="text-xs text-slate-600">Fabricados</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{proyectosPorEstado.entregado}</p>
                    <p className="text-xs text-slate-600">Entregados</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{proyectosPorEstado.facturado}</p>
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
                    {/* Icono y barra */}
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full ${etapa.color} flex items-center justify-center text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-8 bg-slate-300 my-1" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{etapa.etapa}</p>
                          <p className="text-sm text-slate-500">{etapa.cantidad} proyectos / cotizaciones</p>
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

            {/* Total del pipeline */}
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
                      <Button size="sm" variant="outline" className="mt-2">
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
