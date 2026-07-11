// src/components/HomeVelso.tsx
// v2.1 - Forzar rebuild

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Factory, 
  Users, 
  FileText, 
  Package, 
  Settings, 
  DollarSign, 
  BarChart3,
  Plus,
  Activity,
  CheckSquare,
  LayoutDashboard,
  ClipboardList
} from 'lucide-react';

interface HomeVelsoProps {
  onDashboard: () => void;
  onClientes: () => void;
  onProyectos: () => void;
  onMateriales: () => void;
  onProcesos: () => void;
  onCotizaciones: () => void;
  onNuevaCotizacion: () => void;
  onDiagnostico: () => void;
  // NUEVOS PROPS VELSO OS v2
  onPendientes: () => void;
  onCobranza: () => void;
  onDashboardEjecutivo: () => void;
  onProduccion: () => void;
  alertasCount: number;
  pendientesCount: number;
  cobranzaVencidaCount: number;
}

export function HomeVelso({
  onDashboard,
  onClientes,
  onProyectos,
  onMateriales,
  onProcesos,
  onCotizaciones,
  onNuevaCotizacion,
  onDiagnostico,
  // NUEVOS
  onPendientes,
  onCobranza,
  onDashboardEjecutivo,
  onProduccion,
  alertasCount,
  pendientesCount,
  cobranzaVencidaCount,
}: HomeVelsoProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Factory className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">VELSO OS</h1>
        <p className="text-slate-500">Sistema Integral de Control</p>
        <p className="text-xs text-slate-400 mt-1">v2.0 - Dashboard Ejecutivo</p>
      </div>

      {/* Botón principal: Nueva Cotización */}
      <button
        onClick={onNuevaCotizacion}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-lg group"
      >
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-lg">Nueva Cotización</h3>
          <p className="text-blue-100 text-sm">Iniciar proceso de cotización completo</p>
        </div>
        <div className="ml-auto">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* NUEVO: Dashboard Ejecutivo - Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="border-blue-200 hover:shadow-lg transition-all cursor-pointer bg-blue-50/50"
          onClick={onDashboardEjecutivo}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Dashboard Ejecutivo</h3>
                  <p className="text-sm text-slate-500">Pipeline, alertas, utilidades, cobranza</p>
                </div>
              </div>
              {alertasCount > 0 && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  {alertasCount} alertas
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pendientes */}
        <Card 
          className="border-orange-200 hover:shadow-lg transition-all cursor-pointer"
          onClick={onPendientes}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Mis Pendientes</h3>
                  <p className="text-sm text-slate-500">Tareas del día y seguimientos</p>
                </div>
              </div>
              {pendientesCount > 0 && (
                <Badge className="bg-orange-600 text-white">
                  {pendientesCount} hoy
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cobranza */}
        <Card 
          className="border-green-200 hover:shadow-lg transition-all cursor-pointer"
          onClick={onCobranza}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Cobranza</h3>
                  <p className="text-sm text-slate-500">Facturas por cobrar y vencidas</p>
                </div>
              </div>
              {cobranzaVencidaCount > 0 && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  {cobranzaVencidaCount} vencidas
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Ventas */}
        <Card 
          className="border-slate-200 hover:shadow-lg transition-all cursor-pointer"
          onClick={onDashboard}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Dashboard Ventas</h3>
                <p className="text-sm text-slate-500">Horas cotizadas vs meta mensual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de módulos secundarios */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card 
          className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
          onClick={onClientes}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Users className="w-8 h-8 text-slate-600" />
              <h3 className="font-medium text-slate-900 text-sm">Clientes</h3>
              <p className="text-xs text-slate-500">Catálogo y contactos</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
          onClick={onProyectos}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <ClipboardList className="w-8 h-8 text-slate-600" />
              <h3 className="font-medium text-slate-900 text-sm">Proyectos</h3>
              <p className="text-xs text-slate-500">Ventas y seguimiento</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-slate-200 hover:shadow-md transition-all cursor-pointer bg-blue-50"
          onClick={onProduccion}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Factory className="w-8 h-8 text-blue-600" />
              <h3 className="font-medium text-blue-900 text-sm">Producción</h3>
              <p className="text-xs text-blue-600">Tiempos y trazabilidad</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
          onClick={onCotizaciones}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <FileText className="w-8 h-8 text-slate-600" />
              <h3 className="font-medium text-slate-900 text-sm">Cotizaciones</h3>
              <p className="text-xs text-slate-500">Historial y estados</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
          onClick={onMateriales}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Package className="w-8 h-8 text-slate-600" />
              <h3 className="font-medium text-slate-900 text-sm">Materiales</h3>
              <p className="text-xs text-slate-500">Catálogo de insumos</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
          onClick={onProcesos}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Settings className="w-8 h-8 text-slate-600" />
              <h3 className="font-medium text-slate-900 text-sm">Procesos</h3>
              <p className="text-xs text-slate-500">Catálogo y costos</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
          onClick={onDiagnostico}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Activity className="w-8 h-8 text-slate-600" />
              <h3 className="font-medium text-slate-900 text-sm">Diagnóstico</h3>
              <p className="text-xs text-slate-500">Estado de Supabase</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          VELSO Soluciones de Maquinado CNC • {new Date().getFullYear()}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Sistema VELSO OS v2.0
        </p>
      </div>
    </div>
  );
}
