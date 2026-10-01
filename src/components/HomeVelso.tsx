// src/components/HomeVelso.tsx
// Home organizado por categorías

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Factory,
  Users,
  FileText,
  Package,
  Settings,
  DollarSign,
  Plus,
  Activity,
  CheckSquare,
  LayoutDashboard,
  ClipboardList,
  Shield,
  Building2,
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
  onPendientes: () => void;
  onCobranza: () => void;
  onProduccion: () => void;
  onPiezasCatalogo: () => void;
  onOrdenesCompra: () => void;
  onProveedores: () => void;
  onAdminUsuarios?: () => void;
  esAdmin?: boolean;
  alertasCount: number;
  pendientesCount: number;
  cobranzaVencidaCount: number;
}

interface ModuloCard {
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
  onClick: () => void;
  colorIcono: string;
  badge?: number;
  badgeColor?: string;
  badgeLabel?: string;
}

function TarjetaModulo({ modulo }: { modulo: ModuloCard }) {
  const Icono = modulo.icono;
  return (
    <Card
      className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
      onClick={modulo.onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${modulo.colorIcono}`}>
            <Icono className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-slate-900 text-sm truncate">{modulo.titulo}</h3>
            <p className="text-xs text-slate-500 truncate">{modulo.descripcion}</p>
          </div>
          {modulo.badge !== undefined && modulo.badge > 0 && (
            <Badge className={`${modulo.badgeColor || 'bg-slate-600'} text-white shrink-0`}>
              {modulo.badge} {modulo.badgeLabel}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SeccionCategoria({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
        {titulo}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
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
  onPendientes,
  onCobranza,
  onProduccion,
  onPiezasCatalogo,
  onOrdenesCompra,
  onProveedores,
  onAdminUsuarios,
  esAdmin = false,
  alertasCount,
  pendientesCount,
  cobranzaVencidaCount,
}: HomeVelsoProps) {
  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Factory className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">VELSO OS</h1>
        <p className="text-slate-500">Sistema Integral de Control</p>
      </div>

      {/* ─── PANEL ─── */}
      <SeccionCategoria titulo="Panel">
        {esAdmin && (
          <TarjetaModulo modulo={{
            titulo: 'Dashboard',
            descripcion: 'Pipeline, ventas, producción y cobranza',
            icono: LayoutDashboard,
            onClick: onDashboard,
            colorIcono: 'bg-blue-600',
            badge: alertasCount,
            badgeColor: 'bg-red-600 animate-pulse',
            badgeLabel: 'alertas',
          }} />
        )}
        <TarjetaModulo modulo={{
          titulo: 'Cobranza',
          descripcion: 'Facturas por cobrar y vencidas',
          icono: DollarSign,
          onClick: onCobranza,
          colorIcono: 'bg-green-600',
          badge: cobranzaVencidaCount,
          badgeColor: 'bg-red-600 animate-pulse',
          badgeLabel: 'vencidas',
        }} />
        <TarjetaModulo modulo={{
          titulo: 'Mis Pendientes',
          descripcion: 'Bullet journal e impresión',
          icono: CheckSquare,
          onClick: onPendientes,
          colorIcono: 'bg-orange-500',
          badge: pendientesCount,
          badgeColor: 'bg-orange-600',
          badgeLabel: 'hoy',
        }} />
      </SeccionCategoria>

      {/* ─── VENTAS ─── */}
      <SeccionCategoria titulo="Ventas">
        {/* Botón principal: Nueva Cotización */}
        <button
          onClick={onNuevaCotizacion}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-lg sm:col-span-2 lg:col-span-2 group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Nueva Cotización</h3>
            <p className="text-blue-100 text-xs">Iniciar proceso de cotización completo</p>
          </div>
          <Plus className="w-5 h-5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
        <TarjetaModulo modulo={{
          titulo: 'Cotizaciones',
          descripcion: 'Historial y estados',
          icono: FileText,
          onClick: onCotizaciones,
          colorIcono: 'bg-slate-600',
        }} />
      </SeccionCategoria>

      {/* ─── OPERACIÓN ─── */}
      <SeccionCategoria titulo="Operación">
        <TarjetaModulo modulo={{
          titulo: 'Proyectos',
          descripcion: 'Ventas y seguimiento',
          icono: ClipboardList,
          onClick: onProyectos,
          colorIcono: 'bg-indigo-600',
        }} />
        <TarjetaModulo modulo={{
          titulo: 'Órdenes de Compra',
          descripcion: 'Gastos e insumos',
          icono: Package,
          onClick: onOrdenesCompra,
          colorIcono: 'bg-cyan-600',
        }} />
        <TarjetaModulo modulo={{
          titulo: 'Producción',
          descripcion: 'Tiempos y trazabilidad',
          icono: Factory,
          onClick: onProduccion,
          colorIcono: 'bg-blue-500',
        }} />
      </SeccionCategoria>

      {/* ─── CATÁLOGOS ─── */}
      <SeccionCategoria titulo="Catálogos">
        <TarjetaModulo modulo={{
          titulo: 'Clientes',
          descripcion: 'Empresas y contactos',
          icono: Users,
          onClick: onClientes,
          colorIcono: 'bg-violet-600',
        }} />
        <TarjetaModulo modulo={{
          titulo: 'Piezas',
          descripcion: 'Catálogo de piezas',
          icono: Package,
          onClick: onPiezasCatalogo,
          colorIcono: 'bg-slate-600',
        }} />
        <TarjetaModulo modulo={{
          titulo: 'Materiales',
          descripcion: 'Catálogo de insumos',
          icono: Package,
          onClick: onMateriales,
          colorIcono: 'bg-amber-600',
        }} />
        <TarjetaModulo modulo={{
          titulo: 'Procesos',
          descripcion: 'Catálogo y costos',
          icono: Settings,
          onClick: onProcesos,
          colorIcono: 'bg-teal-600',
        }} />
        <TarjetaModulo modulo={{
          titulo: 'Proveedores',
          descripcion: 'Catálogo y días de crédito',
          icono: Building2,
          onClick: onProveedores,
          colorIcono: 'bg-cyan-700',
        }} />
      </SeccionCategoria>

      {/* ─── SISTEMA ─── */}
      <SeccionCategoria titulo="Sistema">
        <TarjetaModulo modulo={{
          titulo: 'Diagnóstico',
          descripcion: 'Estado de Supabase',
          icono: Activity,
          onClick: onDiagnostico,
          colorIcono: 'bg-slate-500',
        }} />
        {esAdmin && onAdminUsuarios && (
          <TarjetaModulo modulo={{
            titulo: 'Administración de Usuarios',
            descripcion: 'Roles y accesos',
            icono: Shield,
            onClick: onAdminUsuarios,
            colorIcono: 'bg-red-600',
          }} />
        )}
      </SeccionCategoria>

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
