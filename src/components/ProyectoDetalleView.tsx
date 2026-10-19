import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Trash2,
  TrendingUp,
  Truck,
  Receipt,
  Package,
  Clock,
  DollarSign,
  User,
  Hash,
  ShoppingCart,
  ClipboardList,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ProyectoVenta } from '@/types/ventas';
import { procesosAplanados, minutosCotizados } from '@/utils/proyectoDatos';
import type { OrdenCompra, Proveedor } from '@/types/ordenesCompra';
import { OrdenCompraDocumento, type DatosTallerOC } from '@/components/OrdenCompraDocumento';

interface ProyectoDetalleViewProps {
  proyecto: ProyectoVenta;
  onVolver: () => void;
  userRol?: string;
  ordenesCompra?: OrdenCompra[];
  proveedores?: Proveedor[];
  datosTallerOC?: DatosTallerOC;
  clientes?: { id: string; nombreEmpresa: string }[];
  onMarcarFabricado?: (id: string) => void;
  onMarcarEntregado?: (id: string) => void;
  onMarcarFacturado?: (id: string, numeroFactura: string, totalFacturado: number) => void;
  onEliminarProyecto?: (id: string) => void;
  onEliminarOC?: (id: string) => void;
  onVerControlCodigos?: (proyecto: ProyectoVenta) => void;
  onVerHojaViajera?: (proyecto: ProyectoVenta) => void;
  onGenerarCotizacionDesdeProyecto?: (proyecto: ProyectoVenta) => void;
  onRegistrarPo?: (id: string, numeroPo: string) => Promise<boolean> | void;
  onVenderStock?: (
    proyectoId: string,
    ventas: { piezaId: string; cantidad: number }[],
    clienteId?: string,
    clienteNombre?: string
  ) => Promise<string | null> | void;
}

const estadoConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  en_fabricacion: { label: 'EN FABRICACIÓN', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  fabricado: { label: 'FABRICADO', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  entregado: { label: 'ENTREGADO', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  facturado: { label: 'FACTURADO', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

const estadoOCConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  autorizada: { label: 'Autorizada', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  pagada: { label: 'Pagada', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  recibida: { label: 'Recibida', color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelada: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Vista de DETALLE de un proyecto/código. La lista de Proyectos solo muestra
// códigos; todo lo operativo (OCs, hoja viajera, control de códigos, estados,
// PO, venta de stock) se hace AQUÍ para evitar confusiones entre proyectos.
export function ProyectoDetalleView({
  proyecto,
  onVolver,
  userRol = 'vendedor',
  ordenesCompra = [],
  proveedores = [],
  datosTallerOC,
  clientes = [],
  onMarcarFabricado,
  onMarcarEntregado,
  onMarcarFacturado,
  onEliminarProyecto,
  onEliminarOC,
  onVerControlCodigos,
  onVerHojaViajera,
  onGenerarCotizacionDesdeProyecto,
  onRegistrarPo,
  onVenderStock,
}: ProyectoDetalleViewProps) {
  const isAdmin = userRol === 'admin' || userRol === 'superadmin';
  const esDirecto = proyecto.tipoOrigen === 'urgencia' || proyecto.tipoOrigen === 'stock';

  // Diálogos
  const [ocDocumento, setOcDocumento] = useState<OrdenCompra | null>(null);
  const [dialogoFacturar, setDialogoFacturar] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [montoFactura, setMontoFactura] = useState('');
  const [dialogoPo, setDialogoPo] = useState(false);
  const [poInput, setPoInput] = useState('');
  const [registrandoPo, setRegistrandoPo] = useState(false);
  const [dialogoStock, setDialogoStock] = useState(false);
  const [stockVentas, setStockVentas] = useState<Record<string, string>>({});
  const [stockClienteId, setStockClienteId] = useState(proyecto.clienteId || '');
  const [vendiendoStock, setVendiendoStock] = useState(false);

  // Vendedor (solo admin)
  const [vendedorNombre, setVendedorNombre] = useState<string>('');
  useEffect(() => {
    if (!isAdmin || !proyecto.usuarioId) return;
    supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', proyecto.usuarioId)
      .single()
      .then(({ data }) => setVendedorNombre(data?.nombre || ''));
  }, [isAdmin, proyecto.usuarioId]);

  const ocs = ordenesCompra
    .filter(oc => oc.proyectoId === proyecto.id || (proyecto.codigoProyecto && oc.codigoProyecto === proyecto.codigoProyecto))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const horasTotales = (procesosAplanados(proyecto).reduce((sum, p) => sum + minutosCotizados(p), 0) / 60).toFixed(1);
  const estadoCfg = estadoConfig[proyecto.estado] || estadoConfig.en_fabricacion;

  const handleFacturar = () => {
    if (!numeroFactura || !montoFactura || !onMarcarFacturado) return;
    onMarcarFacturado(proyecto.id, numeroFactura, parseFloat(montoFactura));
    setNumeroFactura('');
    setMontoFactura('');
    setDialogoFacturar(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 no-print">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Proyectos
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{proyecto.codigoProyecto || 'Sin código'}</h2>
          <p className="text-slate-500">{proyecto.proyectoNombre}</p>
        </div>
      </div>

      {/* Info del proyecto */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="outline" className={`${estadoCfg.color} border-current`}>
              {estadoCfg.label}
            </Badge>
            {proyecto.tipoOrigen === 'urgencia' && (
              <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50">URGENCIA</Badge>
            )}
            {proyecto.tipoOrigen === 'stock' && (
              <Badge variant="outline" className="text-purple-700 border-purple-400 bg-purple-50">STOCK</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Cliente</p>
              <p className="font-semibold">{proyecto.clienteNombre || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 flex items-center gap-1"><FileText className="w-3 h-3" /> Orden de Compra</p>
              <p className="font-semibold">{proyecto.ordenCompra || 'Pendiente'}</p>
            </div>
            <div>
              <p className="text-slate-500 flex items-center gap-1"><Hash className="w-3 h-3" /> Cotización</p>
              <p className="font-semibold">{proyecto.numeroCotizacion || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha</p>
              <p className="font-semibold">{new Date(proyecto.fechaVenta).toLocaleDateString('es-MX')}</p>
            </div>
            <div>
              <p className="text-slate-500 flex items-center gap-1"><Package className="w-3 h-3" /> Piezas</p>
              <p className="font-semibold">{proyecto.piezas?.length || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Horas cotizadas</p>
              <p className="font-semibold">{horasTotales}h</p>
            </div>
            <div>
              <p className="text-slate-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total cotizado</p>
              <p className="font-semibold">${proyecto.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            {proyecto.numeroFactura && (
              <div>
                <p className="text-slate-500 flex items-center gap-1"><Receipt className="w-3 h-3" /> Factura</p>
                <p className="font-semibold text-purple-600">{proyecto.numeroFactura}</p>
              </div>
            )}
            {isAdmin && vendedorNombre && (
              <div>
                <p className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Vendedor</p>
                <p className="font-semibold text-blue-600">{vendedorNombre}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acciones del proyecto */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Acciones</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {esDirecto && !proyecto.cotizacionId && onGenerarCotizacionDesdeProyecto && (
              <Button
                size="sm"
                onClick={() => onGenerarCotizacionDesdeProyecto(proyecto)}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4 mr-1" />
                Generar Cotización
              </Button>
            )}

            {proyecto.tipoOrigen === 'stock' && (proyecto.piezas?.length || 0) > 0 && onVenderStock && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStockVentas({});
                  setStockClienteId(proyecto.clienteId || '');
                  setDialogoStock(true);
                }}
                className="border-purple-400 text-purple-700 hover:bg-purple-50"
              >
                <Package className="w-4 h-4 mr-1" />
                Vender de Stock
              </Button>
            )}

            {esDirecto && !proyecto.ordenCompra && onRegistrarPo && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setPoInput(''); setDialogoPo(true); }}
                className="border-blue-400 text-blue-700 hover:bg-blue-50"
              >
                <ClipboardList className="w-4 h-4 mr-1" />
                Registrar PO
              </Button>
            )}

            {onVerHojaViajera && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerHojaViajera(proyecto)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <ClipboardList className="w-4 h-4 mr-1" />
                Hoja Viajera
              </Button>
            )}

            {onVerControlCodigos && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerControlCodigos(proyecto)}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Control de Códigos
              </Button>
            )}

            {proyecto.estado === 'en_fabricacion' && onMarcarFabricado && (
              <Button size="sm" onClick={() => onMarcarFabricado(proyecto.id)} className="bg-amber-600 hover:bg-amber-700">
                <Package className="w-4 h-4 mr-1" />
                Marcar Fabricado
              </Button>
            )}

            {proyecto.estado === 'fabricado' && onMarcarEntregado && (
              <Button size="sm" onClick={() => onMarcarEntregado(proyecto.id)} className="bg-cyan-600 hover:bg-cyan-700">
                <Truck className="w-4 h-4 mr-1" />
                Marcar Entregado
              </Button>
            )}

            {proyecto.estado === 'entregado' && onMarcarFacturado && (
              <Button
                size="sm"
                onClick={() => {
                  setMontoFactura(proyecto.totalCotizado.toString());
                  setDialogoFacturar(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Receipt className="w-4 h-4 mr-1" />
                Facturar
              </Button>
            )}

            {onEliminarProyecto && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onEliminarProyecto(proyecto.id); onVolver(); }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de ventas parciales (stock) */}
      {proyecto.tipoOrigen === 'stock' && (proyecto.stockVendido?.length || 0) > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Ventas realizadas de este stock</h3>
            <div className="space-y-1">
              {proyecto.stockVendido!.map((v, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 text-sm bg-purple-50 border border-purple-100 rounded px-3 py-1.5">
                  <span className="font-medium text-purple-800">{v.codigoDestino}</span>
                  <span className="text-xs text-slate-500">{new Date(v.fecha).toLocaleDateString('es-MX')}</span>
                  <span className="text-xs text-slate-600">
                    {v.piezas.map((pv: any) => `${pv.cantidad}× ${pv.nombre || 'pieza'}`).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Órdenes de Compra del proyecto */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Órdenes de Compra ({ocs.length})
          </h3>
          {ocs.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No hay órdenes de compra para este proyecto</p>
          ) : (
            <div className="space-y-2">
              {ocs.map((oc) => {
                const ocEstado = estadoOCConfig[oc.estado] || estadoOCConfig.pendiente;
                return (
                  <div
                    key={oc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-sm">{oc.numeroOc}</span>
                      <Badge variant="outline" className={`${ocEstado.color} border-current text-xs`}>
                        {ocEstado.label}
                      </Badge>
                      <span className="text-sm text-slate-600">{oc.proveedor || 'Sin proveedor'}</span>
                      {oc.concepto && <span className="text-xs text-slate-400">{oc.concepto}</span>}
                      <span className="text-sm font-medium text-slate-700">
                        ${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setOcDocumento(oc)} className="text-xs h-7">
                        <Eye className="w-3 h-3 mr-1" />
                        Ver orden
                      </Button>
                      {onEliminarOC && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminarOC(oc.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo: facturar */}
      <Dialog open={dialogoFacturar} onOpenChange={setDialogoFacturar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Facturar Proyecto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <p className="text-sm text-slate-600">{proyecto.proyectoNombre}</p>
            </div>
            <div className="space-y-2">
              <Label>Número de Factura *</Label>
              <Input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder="Ej: FAC-2024-001" />
            </div>
            <div className="space-y-2">
              <Label>Total Facturado *</Label>
              <Input type="number" value={montoFactura} onChange={(e) => setMontoFactura(e.target.value)} placeholder="0.00" />
              <p className="text-xs text-slate-500">
                Total cotizado: ${proyecto.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button onClick={handleFacturar} disabled={!numeroFactura || !montoFactura} className="w-full bg-purple-600 hover:bg-purple-700">
              <Receipt className="w-4 h-4 mr-2" />
              Facturar Proyecto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo: registrar PO del cliente (proyectos directos) */}
      <Dialog open={dialogoPo} onOpenChange={setDialogoPo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Orden de Compra del Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-600">
              Al registrar la PO el proyecto queda formalizado: a partir de aquí
              impacta en las métricas de vendido y se habilita la facturación.
            </p>
            <div className="space-y-2">
              <Label>Número de PO del cliente *</Label>
              <Input value={poInput} onChange={(e) => setPoInput(e.target.value)} placeholder="Ej: PO-4500123" />
            </div>
            <Button
              onClick={async () => {
                if (!poInput.trim() || !onRegistrarPo) return;
                setRegistrandoPo(true);
                await onRegistrarPo(proyecto.id, poInput.trim());
                setRegistrandoPo(false);
                setDialogoPo(false);
              }}
              disabled={!poInput.trim() || registrandoPo}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {registrandoPo ? 'Registrando…' : 'Registrar PO'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo: venta parcial de stock */}
      <Dialog open={dialogoStock} onOpenChange={setDialogoStock}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vender de Stock — {proyecto.codigoProyecto}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-600">
              Se crea un proyecto nuevo con código propio (un código por factura)
              con las cantidades vendidas. El remanente queda en {proyecto.codigoProyecto}.
            </p>
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Select value={stockClienteId || 'sin-cliente'} onValueChange={(v) => setStockClienteId(v === 'sin-cliente' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-cliente">Sin cliente asignado</SelectItem>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombreEmpresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidades a vender</Label>
              <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                {(proyecto.piezas || []).map((pz: any) => (
                  <div key={pz.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pz.nombre}</p>
                      <p className="text-xs text-slate-500">Disponible: {pz.cantidad}</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={pz.cantidad}
                      value={stockVentas[pz.id] ?? ''}
                      onChange={(e) => setStockVentas(prev => ({ ...prev, [pz.id]: e.target.value }))}
                      placeholder="0"
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={async () => {
                if (!onVenderStock) return;
                const ventas = Object.entries(stockVentas)
                  .map(([piezaId, cantidad]) => ({ piezaId, cantidad: Math.floor(Number(cantidad) || 0) }))
                  .filter(v => v.cantidad > 0);
                if (ventas.length === 0) return;
                setVendiendoStock(true);
                const cliente = clientes.find(c => c.id === stockClienteId);
                await onVenderStock(proyecto.id, ventas, cliente?.id, cliente?.nombreEmpresa);
                setVendiendoStock(false);
                setDialogoStock(false);
              }}
              disabled={vendiendoStock || !Object.values(stockVentas).some(v => Number(v) > 0)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {vendiendoStock ? 'Registrando…' : 'Registrar Venta de Stock'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documento imprimible de la OC */}
      <OrdenCompraDocumento
        open={ocDocumento !== null}
        onOpenChange={(open) => { if (!open) setOcDocumento(null); }}
        orden={ocDocumento}
        proveedor={ocDocumento?.proveedorId ? proveedores.find(p => p.id === ocDocumento.proveedorId) : undefined}
        datosTaller={datosTallerOC || { nombre: 'Soluciones Integrales Velso' }}
      />
    </div>
  );
}
