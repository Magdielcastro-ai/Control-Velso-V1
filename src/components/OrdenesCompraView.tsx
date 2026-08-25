import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  Package,
  Calendar,
  Building2,
  Eye,
  Trash2,
  Hash,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  Boxes,
  FileText,
  Plus,
  Printer,
} from 'lucide-react';
import type { OrdenCompra, Proveedor } from '@/types/ordenesCompra';
import type { ProyectoVenta } from '@/types/ventas';
import { NuevaOrdenCompraDialog } from '@/components/NuevaOrdenCompraDialog';
import { OrdenCompraDocumento, type DatosTallerOC } from '@/components/OrdenCompraDocumento';

export interface OrdenesCompraViewProps {
  onVolver: () => void;
  ordenes: OrdenCompra[];
  proyectos: ProyectoVenta[];
  proveedores?: Proveedor[];
  datosTaller?: DatosTallerOC;
  solicitanteDefault?: string;
  onCambiarEstado?: (id: string, estado: OrdenCompra['estado']) => void;
  onEliminar?: (id: string) => void;
  onCrearOrden?: (datos: any) => Promise<boolean>;
  onCrearProveedor?: (datos: any) => Promise<Proveedor | null>;
}

const estadoConfig: Record<
  OrdenCompra['estado'],
  { label: string; colorClasses: string; icon: typeof Clock }
> = {
  pendiente: {
    label: 'Pendiente',
    colorClasses: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  autorizada: {
    label: 'Autorizada',
    colorClasses: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle2,
  },
  pagada: {
    label: 'Pagada',
    colorClasses: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: CreditCard,
  },
  recibida: {
    label: 'Recibida',
    colorClasses: 'bg-green-100 text-green-700 border-green-200',
    icon: Truck,
  },
  cancelada: {
    label: 'Cancelada',
    colorClasses: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
};

function formatearMoneda(monto: number) {
  return `$${monto.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatearFecha(fechaStr: string) {
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function OrdenesCompraView({
  onVolver,
  ordenes,
  proyectos,
  proveedores = [],
  datosTaller,
  solicitanteDefault,
  onCambiarEstado,
  onEliminar,
  onCrearOrden,
  onCrearProveedor,
}: OrdenesCompraViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompra | null>(null);
  const [dialogoDetalle, setDialogoDetalle] = useState(false);
  const [dialogoNueva, setDialogoNueva] = useState(false);
  const [ordenDocumento, setOrdenDocumento] = useState<OrdenCompra | null>(null);

  const proveedorMap = useMemo(() => {
    const map: Record<string, Proveedor> = {};
    proveedores.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [proveedores]);

  // Mapeo rápido de proyectoId -> nombre
  const proyectoNombreMap = useMemo(() => {
    const map: Record<string, string> = {};
    proyectos.forEach((p) => {
      map[p.id] = p.proyectoNombre;
    });
    return map;
  }, [proyectos]);

  const ordenesConNombreProyecto = useMemo(() => {
    return ordenes.map((oc) => ({
      ...oc,
      proyectoNombreDisplay: proyectoNombreMap[oc.proyectoId || ''] || 'Sin proyecto',
    }));
  }, [ordenes, proyectoNombreMap]);

  const ordenesFiltradas = useMemo(() => {
    const busquedaLower = busqueda.toLowerCase().trim();
    return ordenesConNombreProyecto.filter((oc) => {
      const matchEstado =
        estadoFiltro === 'todos' ? true : oc.estado === estadoFiltro;
      const matchBusqueda = busquedaLower
        ? oc.numeroOc.toLowerCase().includes(busquedaLower) ||
          (oc.proveedor || '').toLowerCase().includes(busquedaLower) ||
          oc.proyectoNombreDisplay.toLowerCase().includes(busquedaLower)
        : true;
      return matchEstado && matchBusqueda;
    });
  }, [ordenesConNombreProyecto, busqueda, estadoFiltro]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = ordenes.length;
    const pendientes = ordenes.filter((o) => o.estado === 'pendiente').length;
    const autorizadas = ordenes.filter((o) => o.estado === 'autorizada').length;
    const pagadas = ordenes.filter((o) => o.estado === 'pagada').length;
    const recibidas = ordenes.filter((o) => o.estado === 'recibida').length;
    const canceladas = ordenes.filter((o) => o.estado === 'cancelada').length;
    const totalMonto = ordenes.reduce((sum, o) => sum + (o.total || 0), 0);
    const montoPendiente = ordenes
      .filter((o) => o.estado === 'pendiente')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const montoRecibido = ordenes
      .filter((o) => o.estado === 'recibida')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      total,
      pendientes,
      autorizadas,
      pagadas,
      recibidas,
      canceladas,
      totalMonto,
      montoPendiente,
      montoRecibido,
    };
  }, [ordenes]);

  const abrirDetalle = (oc: OrdenCompra) => {
    setOrdenSeleccionada(oc);
    setDialogoDetalle(true);
  };

  const handleEliminar = (id: string) => {
    if (!onEliminar) return;
    if (!confirm('¿Estás seguro de eliminar esta orden de compra?')) return;
    onEliminar(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Órdenes de Compra</h2>
          <p className="text-slate-500">
            {stats.total} órdenes · {stats.pendientes} pendientes · {stats.recibidas} recibidas
          </p>
        </div>
        {onCrearOrden && (
          <Button onClick={() => setDialogoNueva(true)} className="bg-blue-600 hover:bg-blue-700 w-fit">
            <Plus className="w-4 h-4 mr-2" />
            Nueva OC
          </Button>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total OC</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-xl font-bold text-amber-600">{stats.pendientes}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Autorizadas</p>
            <p className="text-xl font-bold text-blue-600">{stats.autorizadas}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Recibidas</p>
            <p className="text-xl font-bold text-green-600">{stats.recibidas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número, proveedor o proyecto..."
              className="pl-10"
            />
          </div>
        </div>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="autorizada">Autorizada</SelectItem>
            <SelectItem value="pagada">Pagada</SelectItem>
            <SelectItem value="recibida">Recibida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de órdenes de compra */}
      <div className="space-y-3">
        {ordenesFiltradas.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron órdenes de compra</p>
            </CardContent>
          </Card>
        ) : (
          ordenesFiltradas.map((oc) => {
            const config = estadoConfig[oc.estado];
            const EstadoIcon = config.icon;
            return (
              <Card
                key={oc.id}
                className="border-slate-200 hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Número + Proyecto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                          {oc.numeroOc}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${config.colorClasses}`}
                        >
                          <EstadoIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{oc.proyectoNombreDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{oc.proveedor}</span>
                      </div>
                    </div>

                    {/* Fecha + Total */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatearFecha(oc.fechaOc)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-slate-700" />
                        <span className="text-lg font-bold text-slate-900">
                          {formatearMoneda(oc.total || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirDetalle(oc)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOrdenDocumento(oc)}
                        className="h-8 w-8 p-0"
                        title="Ver documento imprimible"
                      >
                        <Printer className="w-4 h-4 text-slate-600" />
                      </Button>
                      {onCambiarEstado && (
                        <Select
                          value={oc.estado}
                          onValueChange={(val) =>
                            onCambiarEstado(oc.id, val as OrdenCompra['estado'])
                          }
                        >
                          <SelectTrigger className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-slate-100 rounded-md">
                            <CheckCircle2 className="w-4 h-4 text-slate-500" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="autorizada">Autorizada</SelectItem>
                            <SelectItem value="pagada">Pagada</SelectItem>
                            <SelectItem value="recibida">Recibida</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {onEliminar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(oc.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de detalle de OC */}
      <Dialog open={dialogoDetalle} onOpenChange={setDialogoDetalle}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-blue-600" />
              Detalle de Orden de Compra
            </DialogTitle>
          </DialogHeader>

          {ordenSeleccionada && (
            <div className="space-y-6 pt-2">
              {/* Header del detalle */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Número OC</span>
                  <span className="font-semibold text-slate-900">
                    {ordenSeleccionada.numeroOc}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Estado</span>
                  <Badge
                    variant="outline"
                    className={estadoConfig[ordenSeleccionada.estado].colorClasses}
                  >
                    {(() => {
                      const C = estadoConfig[ordenSeleccionada.estado].icon;
                      return <C className="w-3 h-3 mr-1" />;
                    })()}
                    {estadoConfig[ordenSeleccionada.estado].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Proyecto</span>
                  <span className="text-slate-900">
                    {proyectoNombreMap[ordenSeleccionada.proyectoId || ''] || 'Sin proyecto'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Proveedor</span>
                  <span className="text-slate-900">{ordenSeleccionada.proveedor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Fecha emisión</span>
                  <span className="text-slate-900">
                    {formatearFecha(ordenSeleccionada.fechaOc)}
                  </span>
                </div>
                {ordenSeleccionada.fechaEntrega && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Entrega esperada</span>
                    <span className="text-slate-900">
                      {formatearFecha(ordenSeleccionada.fechaEntrega)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tabla de items */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-slate-500" />
                  Items
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Item</th>
                        <th className="px-3 py-2 text-right font-medium">Cant.</th>
                        <th className="px-3 py-2 text-right font-medium">Unidad</th>
                        <th className="px-3 py-2 text-right font-medium">P. Unitario</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordenSeleccionada.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-slate-900">{item.nombre}</td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {item.cantidad}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {item.unidad}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {formatearMoneda(item.precioUnitario)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">
                            {formatearMoneda(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">
                    {formatearMoneda(ordenSeleccionada.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    IVA ({ordenSeleccionada.ivaPorcentaje}%)
                  </span>
                  <span className="text-slate-900">
                    {formatearMoneda(ordenSeleccionada.iva)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Total con IVA</span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatearMoneda(ordenSeleccionada.total || 0)}
                  </span>
                </div>
              </div>

              {/* Notas */}
              {ordenSeleccionada.notas && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">Notas</p>
                  <p className="text-sm text-amber-900">{ordenSeleccionada.notas}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo: Nueva OC */}
      {onCrearOrden && onCrearProveedor && (
        <NuevaOrdenCompraDialog
          open={dialogoNueva}
          onOpenChange={setDialogoNueva}
          proveedores={proveedores}
          proyectos={proyectos}
          solicitanteDefault={solicitanteDefault}
          onCrearProveedor={onCrearProveedor}
          onCrearOrden={onCrearOrden}
        />
      )}

      {/* Documento imprimible */}
      <OrdenCompraDocumento
        open={ordenDocumento !== null}
        onOpenChange={(open) => { if (!open) setOrdenDocumento(null); }}
        orden={ordenDocumento}
        proveedor={ordenDocumento?.proveedorId ? proveedorMap[ordenDocumento.proveedorId] : undefined}
        datosTaller={datosTaller || { nombre: 'Soluciones Integrales Velso' }}
      />
    </div>
  );
}
