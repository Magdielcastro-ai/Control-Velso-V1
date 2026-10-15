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
  puedeCrear?: boolean;      // solo admin/superadmin
  puedeAutorizar?: boolean;  // solo finanzas/superadmin
  puedeGestionarPagos?: boolean; // finanzas/superadmin: registrar factura y marcar pagada
  usuarioNombre?: string;    // firma de la autorización
  onCambiarEstado?: (id: string, estado: OrdenCompra['estado'], autorizadoPor?: string) => void;
  onRegistrarFactura?: (id: string, numeroFactura: string, fechaFacturacion: string, diasCredito: number) => Promise<boolean> | void;
  onMarcarPagada?: (id: string, pagadaPor: string) => Promise<boolean> | void;
  onEliminar?: (id: string) => void;
  onCrearOrden?: (datos: any) => Promise<any>;
}

// Ciclo de vida de la OC: solo pendiente y autorizada.
// Los estados viejos quedan mapeados por compatibilidad visual.
const estadoConfig: Record<
  string,
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
    label: 'Autorizada',
    colorClasses: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle2,
  },
  recibida: {
    label: 'Autorizada',
    colorClasses: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle2,
  },
  cancelada: {
    label: 'Pendiente',
    colorClasses: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
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

// Autorizada incluye los estados viejos equivalentes (pagada/recibida)
const esAutorizada = (estado: string) =>
  ['autorizada', 'pagada', 'recibida'].includes(estado);

export function OrdenesCompraView({
  onVolver,
  ordenes,
  proyectos,
  proveedores = [],
  datosTaller,
  solicitanteDefault,
  puedeCrear = false,
  puedeAutorizar = false,
  puedeGestionarPagos = false,
  usuarioNombre = '',
  onCambiarEstado,
  onRegistrarFactura,
  onMarcarPagada,
  onEliminar,
  onCrearOrden,
}: OrdenesCompraViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [vencimientoFiltro, setVencimientoFiltro] = useState<string>('todas');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompra | null>(null);
  const [dialogoDetalle, setDialogoDetalle] = useState(false);
  const [dialogoNueva, setDialogoNueva] = useState(false);
  const [ordenDocumento, setOrdenDocumento] = useState<OrdenCompra | null>(null);
  // Registro de factura del proveedor
  const [ocFactura, setOcFactura] = useState<OrdenCompra | null>(null);
  const [numeroFacturaInput, setNumeroFacturaInput] = useState('');
  const [fechaFacturacionInput, setFechaFacturacionInput] = useState(new Date().toISOString().split('T')[0]);

  // Semana actual (lunes a domingo) para filtros de vencimiento
  const inicioSemana = (offsetSemanas: number) => {
    const d = new Date();
    const diaSemana = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - diaSemana + offsetSemanas * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const enSemana = (fechaStr: string, offset: number) => {
    const ini = inicioSemana(offset);
    const fin = new Date(ini);
    fin.setDate(fin.getDate() + 7);
    const f = new Date(fechaStr + 'T00:00:00');
    return f >= ini && f < fin;
  };

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
      proyectoNombreDisplay: proyectoNombreMap[oc.proyectoId || '']
        ? `${oc.codigoProyecto ? oc.codigoProyecto + ' · ' : ''}${proyectoNombreMap[oc.proyectoId || '']}`
        : oc.codigoProyecto
          ? `${oc.codigoProyecto} · Gastos internos`
          : 'Sin proyecto',
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
      // Filtro de vencimiento de pago (las no pagadas se acumulan)
      let matchVencimiento = true;
      if (vencimientoFiltro !== 'todas') {
        const facturadaSinPagar = !!oc.numeroFactura && !oc.pagada;
        if (vencimientoFiltro === 'vencidas') {
          matchVencimiento = facturadaSinPagar && !!oc.fechaVencimiento &&
            new Date(oc.fechaVencimiento + 'T00:00:00') < inicioSemana(0);
        } else if (vencimientoFiltro === 'esta_semana') {
          matchVencimiento = facturadaSinPagar && !!oc.fechaVencimiento &&
            (enSemana(oc.fechaVencimiento, 0) || new Date(oc.fechaVencimiento + 'T00:00:00') < inicioSemana(0));
        } else if (vencimientoFiltro === 'proxima_semana') {
          matchVencimiento = facturadaSinPagar && !!oc.fechaVencimiento && enSemana(oc.fechaVencimiento, 1);
        }
      }
      return matchEstado && matchBusqueda && matchVencimiento;
    });
  }, [ordenesConNombreProyecto, busqueda, estadoFiltro, vencimientoFiltro]);

  // Cuentas por pagar: facturas registradas sin pagar (se acumulan solas)
  const cuentasPorPagar = useMemo(() => {
    const sinPagar = ordenes.filter(o => o.numeroFactura && !o.pagada && o.fechaVencimiento);
    const suma = (lista: typeof sinPagar) => lista.reduce((s, o) => s + (o.total || 0), 0);
    const vencidas = sinPagar.filter(o => new Date(o.fechaVencimiento! + 'T00:00:00') < inicioSemana(0));
    const estaSemana = sinPagar.filter(o => enSemana(o.fechaVencimiento!, 0));
    const proximaSemana = sinPagar.filter(o => enSemana(o.fechaVencimiento!, 1));
    return {
      vencidas: { cantidad: vencidas.length, monto: suma(vencidas) },
      estaSemana: { cantidad: estaSemana.length, monto: suma(estaSemana) },
      proximaSemana: { cantidad: proximaSemana.length, monto: suma(proximaSemana) },
      total: { cantidad: sinPagar.length, monto: suma(sinPagar) },
    };
  }, [ordenes]);

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
        {onCrearOrden && puedeCrear && (
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

      {/* Cuentas por pagar a proveedores (semana actual y siguiente) */}
      {cuentasPorPagar.total.cantidad > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Vencidas (acumuladas)</p>
              <p className="text-xl font-bold text-red-700">
                ${cuentasPorPagar.vencidas.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-red-500">{cuentasPorPagar.vencidas.cantidad} facturas</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-600">Vencen esta semana</p>
              <p className="text-xl font-bold text-amber-700">
                ${cuentasPorPagar.estaSemana.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-amber-500">{cuentasPorPagar.estaSemana.cantidad} facturas</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Próxima semana</p>
              <p className="text-xl font-bold text-blue-700">
                ${cuentasPorPagar.proximaSemana.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-500">{cuentasPorPagar.proximaSemana.cantidad} facturas</p>
            </CardContent>
          </Card>
          <Card className="border-slate-300 bg-slate-50">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Total por pagar</p>
              <p className="text-xl font-bold text-slate-900">
                ${cuentasPorPagar.total.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500">{cuentasPorPagar.total.cantidad} facturas activas</p>
            </CardContent>
          </Card>
        </div>
      )}

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
          </SelectContent>
        </Select>
        <Select value={vencimientoFiltro} onValueChange={setVencimientoFiltro}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Vencimiento de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos los vencimientos</SelectItem>
            <SelectItem value="vencidas">Vencidas (acumuladas)</SelectItem>
            <SelectItem value="esta_semana">Vencen esta semana</SelectItem>
            <SelectItem value="proxima_semana">Vencen próxima semana</SelectItem>
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                        {oc.pagada && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Pagada
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{oc.proyectoNombreDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{oc.proveedor}</span>
                      </div>
                      {oc.numeroFactura && (
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600">
                            Fact. {oc.numeroFactura}
                            {oc.fechaVencimiento && !oc.pagada && (
                              <span className={`ml-1 font-medium ${
                                new Date(oc.fechaVencimiento + 'T00:00:00') < inicioSemana(0)
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                              }`}>
                                · vence {formatearFecha(oc.fechaVencimiento)}
                              </span>
                            )}
                            {oc.pagada && oc.fechaPago && (
                              <span className="ml-1 text-green-600">· pagada {formatearFecha(oc.fechaPago)}</span>
                            )}
                          </span>
                        </div>
                      )}
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
                      {/* Registrar factura (finanzas) cuando está autorizada y sin pagar */}
                      {puedeGestionarPagos && esAutorizada(oc.estado) && !oc.pagada && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOcFactura(oc);
                            setNumeroFacturaInput(oc.numeroFactura || '');
                            setFechaFacturacionInput(oc.fechaFacturacion || new Date().toISOString().split('T')[0]);
                          }}
                          className="h-8 text-xs text-violet-600 border-violet-300"
                          title="Registrar factura del proveedor"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Factura
                        </Button>
                      )}
                      {/* Marcar pagada (finanzas) cuando hay factura registrada */}
                      {puedeGestionarPagos && oc.numeroFactura && !oc.pagada && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`¿Marcar la factura ${oc.numeroFactura} de ${oc.numeroOc} como PAGADA?`)) {
                              onMarcarPagada?.(oc.id, usuarioNombre);
                            }
                          }}
                          className="h-8 text-xs text-green-700 border-green-300"
                          title="Marcar como pagada"
                        >
                          <DollarSign className="w-3.5 h-3.5 mr-1" />
                          Pagada
                        </Button>
                      )}
                      {/* Imprimir: permitido siempre (aunque no esté autorizada) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOrdenDocumento(oc)}
                        className="h-8 w-8 p-0"
                        title="Ver documento imprimible"
                      >
                        <Printer className="w-4 h-4 text-slate-600" />
                      </Button>
                      {/* Autorizar: botón visible, solo finanzas/superadmin (queda firmado) */}
                      {puedeAutorizar && oc.estado === 'pendiente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-blue-600 border-blue-300"
                          onClick={() => {
                            if (confirm(`¿Autorizar la orden ${oc.numeroOc}? Quedará firmada por ti (${usuarioNombre}).`)) {
                              onCambiarEstado?.(oc.id, 'autorizada', usuarioNombre);
                            }
                          }}
                        >
                          Autorizar
                        </Button>
                      )}
                      {onCambiarEstado && (
                        <Select
                          value={oc.estado}
                          onValueChange={(val) => {
                            // Autorizar es exclusivo de finanzas (queda firmado)
                            if (val === 'autorizada' && !puedeAutorizar) return;
                            onCambiarEstado(oc.id, val as OrdenCompra['estado'], val === 'autorizada' ? usuarioNombre : undefined);
                          }}
                        >
                          <SelectTrigger className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-slate-100 rounded-md">
                            <CheckCircle2 className="w-4 h-4 text-slate-500" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="autorizada" disabled={!puedeAutorizar}>
                              Autorizada{puedeAutorizar ? '' : ' (solo finanzas)'}
                            </SelectItem>
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
        {/* Tamaño hoja carta, igual que el wizard (sm: para ganarle al
            sm:max-w-lg que trae DialogContent por defecto) */}
        <DialogContent className="w-[95vw] sm:max-w-[1100px] max-h-[94vh] overflow-y-auto">
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
                    {proyectoNombreMap[ordenSeleccionada.proyectoId || '']
                      ? `${ordenSeleccionada.codigoProyecto ? ordenSeleccionada.codigoProyecto + ' · ' : ''}${proyectoNombreMap[ordenSeleccionada.proyectoId || '']}`
                      : ordenSeleccionada.codigoProyecto
                        ? `${ordenSeleccionada.codigoProyecto} · Gastos internos`
                        : 'Sin proyecto'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Proveedor</span>
                  <span className="text-slate-900">{ordenSeleccionada.proveedor}</span>
                </div>
                {ordenSeleccionada.autorizadaPor && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Autorizada por</span>
                    <span className="text-slate-900">
                      {ordenSeleccionada.autorizadaPor}
                      {ordenSeleccionada.autorizadaFecha && (
                        <span className="text-slate-400 text-xs ml-1">
                          · {new Date(ordenSeleccionada.autorizadaFecha).toLocaleDateString('es-MX')}
                        </span>
                      )}
                    </span>
                  </div>
                )}
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
                          <td className="px-3 py-2 text-slate-900">
                            {item.nombre}
                            {item.referencia && (
                              <span className="block text-xs text-blue-600">
                                Ref. cot. proveedor: {item.referencia}
                              </span>
                            )}
                          </td>
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
      {onCrearOrden && puedeCrear && (
        <NuevaOrdenCompraDialog
          open={dialogoNueva}
          onOpenChange={setDialogoNueva}
          proveedores={proveedores}
          proyectos={proyectos}
          solicitanteDefault={solicitanteDefault}
          onCrearOrden={onCrearOrden}
        />
      )}

      {/* Diálogo: Registrar factura del proveedor (calcula vencimiento por crédito) */}
      <Dialog open={ocFactura !== null} onOpenChange={(open) => { if (!open) setOcFactura(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Registrar factura · {ocFactura?.numeroOc}
            </DialogTitle>
          </DialogHeader>
          {ocFactura && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-slate-500">
                Proveedor: <span className="font-medium text-slate-800">{ocFactura.proveedor}</span>
                {' · '}
                {(() => {
                  const prov = proveedores.find(p => p.id === ocFactura.proveedorId);
                  const dias = prov?.diasCredito || 0;
                  return dias > 0 ? `Crédito ${dias} días` : 'Contado';
                })()}
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Número de factura *</label>
                <Input
                  value={numeroFacturaInput}
                  onChange={(e) => setNumeroFacturaInput(e.target.value)}
                  placeholder="Ej. FAC-2026-118"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha de facturación *</label>
                <Input
                  type="date"
                  value={fechaFacturacionInput}
                  onChange={(e) => setFechaFacturacionInput(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={!numeroFacturaInput.trim() || !fechaFacturacionInput}
                onClick={async () => {
                  const prov = proveedores.find(p => p.id === ocFactura.proveedorId);
                  const ok = await onRegistrarFactura?.(
                    ocFactura.id,
                    numeroFacturaInput.trim(),
                    fechaFacturacionInput,
                    prov?.diasCredito || 0
                  );
                  if (ok !== false) setOcFactura(null);
                }}
              >
                Guardar factura y calcular vencimiento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
