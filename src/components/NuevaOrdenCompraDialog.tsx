import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Trash2, Building2, UserPlus } from 'lucide-react';
import type { OrdenCompraItem, Proveedor } from '@/types/ordenesCompra';
import type { ProyectoVenta } from '@/types/ventas';

interface ItemForm {
  nombre: string;
  cantidad: string;
  unidad: string;
  precioUnitario: string;
}

interface NuevaOrdenCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedores: Proveedor[];
  proyectos: ProyectoVenta[];
  solicitanteDefault?: string;
  onCrearProveedor: (datos: {
    nombre: string;
    tipo?: string;
    domicilio?: string;
    telefono?: string;
    email?: string;
    contacto?: string;
  }) => Promise<Proveedor | null>;
  onCrearOrden: (datos: {
    proyectoId?: string;
    proveedor?: string;
    proveedorId?: string;
    concepto?: string;
    items: OrdenCompraItem[];
    subtotal: number;
    ivaPorcentaje: number;
    iva: number;
    total: number;
    fechaEntrega?: string;
    terminosPago?: 'contado' | 'credito';
    moneda?: 'MXN' | 'USD';
    certificadoCalidad?: boolean;
    solicitanteNombre?: string;
    solicitanteCodigo?: string;
    notas?: string;
  }) => Promise<boolean>;
}

const itemVacio: ItemForm = { nombre: '', cantidad: '1', unidad: 'pieza', precioUnitario: '' };

export function NuevaOrdenCompraDialog({
  open,
  onOpenChange,
  proveedores,
  proyectos,
  solicitanteDefault,
  onCrearProveedor,
  onCrearOrden,
}: NuevaOrdenCompraDialogProps) {
  const [proveedorId, setProveedorId] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [concepto, setConcepto] = useState('');
  const [items, setItems] = useState<ItemForm[]>([{ ...itemVacio }]);
  const [ivaPorcentaje, setIvaPorcentaje] = useState('16');
  const [terminosPago, setTerminosPago] = useState<'contado' | 'credito'>('contado');
  const [moneda, setMoneda] = useState<'MXN' | 'USD'>('MXN');
  const [certificadoCalidad, setCertificadoCalidad] = useState(false);
  const [solicitanteNombre, setSolicitanteNombre] = useState(solicitanteDefault || '');
  const [solicitanteCodigo, setSolicitanteCodigo] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Formulario rápido de nuevo proveedor
  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false);
  const [nuevoProv, setNuevoProv] = useState({
    nombre: '', tipo: '', domicilio: '', telefono: '', email: '', contacto: '',
  });

  const totales = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const cant = parseFloat(it.cantidad) || 0;
      const precio = parseFloat(it.precioUnitario) || 0;
      return sum + cant * precio;
    }, 0);
    const ivaPct = parseFloat(ivaPorcentaje) || 0;
    const iva = subtotal * (ivaPct / 100);
    return { subtotal, iva, total: subtotal + iva };
  }, [items, ivaPorcentaje]);

  const actualizarItem = (idx: number, campo: keyof ItemForm, valor: string) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  };

  const agregarItem = () => setItems(prev => [...prev, { ...itemVacio }]);
  const quitarItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleCrearProveedor = async () => {
    if (!nuevoProv.nombre.trim()) return;
    const creado = await onCrearProveedor(nuevoProv);
    if (creado) {
      setProveedorId(creado.id);
      setMostrarNuevoProveedor(false);
      setNuevoProv({ nombre: '', tipo: '', domicilio: '', telefono: '', email: '', contacto: '' });
    }
  };

  const limpiar = () => {
    setProveedorId('');
    setProyectoId('');
    setConcepto('');
    setItems([{ ...itemVacio }]);
    setIvaPorcentaje('16');
    setTerminosPago('contado');
    setMoneda('MXN');
    setCertificadoCalidad(false);
    setSolicitanteCodigo('');
    setFechaEntrega('');
    setNotas('');
  };

  const handleGuardar = async () => {
    const itemsValidos = items.filter(it => it.nombre.trim() !== '');
    if (itemsValidos.length === 0) return;

    const proveedor = proveedores.find(p => p.id === proveedorId);

    setGuardando(true);
    const exito = await onCrearOrden({
      proyectoId: proyectoId && proyectoId !== '_ninguno' ? proyectoId : undefined,
      proveedor: proveedor?.nombre || '',
      proveedorId: proveedorId || undefined,
      concepto: concepto || undefined,
      items: itemsValidos.map((it, idx) => {
        const cantidad = parseFloat(it.cantidad) || 0;
        const precioUnitario = parseFloat(it.precioUnitario) || 0;
        return {
          id: `item-${Date.now()}-${idx}`,
          nombre: it.nombre.trim(),
          cantidad,
          unidad: it.unidad || 'pieza',
          precioUnitario,
          total: cantidad * precioUnitario,
        };
      }),
      subtotal: totales.subtotal,
      ivaPorcentaje: parseFloat(ivaPorcentaje) || 0,
      iva: totales.iva,
      total: totales.total,
      fechaEntrega: fechaEntrega || undefined,
      terminosPago,
      moneda,
      certificadoCalidad,
      solicitanteNombre: solicitanteNombre || undefined,
      solicitanteCodigo: solicitanteCodigo || undefined,
      notas: notas || undefined,
    });
    setGuardando(false);

    if (exito) {
      limpiar();
      onOpenChange(false);
    }
  };

  const formatearMoneda = (monto: number) =>
    `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Building2 className="w-5 h-5 text-blue-600" />
            Nueva Orden de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Proveedor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Proveedor</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMostrarNuevoProveedor(!mostrarNuevoProveedor)}
                className="text-blue-600 h-7"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                {mostrarNuevoProveedor ? 'Cancelar' : 'Nuevo proveedor'}
              </Button>
            </div>

            {mostrarNuevoProveedor ? (
              <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder="Nombre del proveedor *"
                    value={nuevoProv.nombre}
                    onChange={e => setNuevoProv(p => ({ ...p, nombre: e.target.value }))}
                  />
                  <Input
                    placeholder="Tipo (ej. materiales, servicios)"
                    value={nuevoProv.tipo}
                    onChange={e => setNuevoProv(p => ({ ...p, tipo: e.target.value }))}
                  />
                  <Input
                    placeholder="Domicilio"
                    value={nuevoProv.domicilio}
                    onChange={e => setNuevoProv(p => ({ ...p, domicilio: e.target.value }))}
                  />
                  <Input
                    placeholder="Teléfono"
                    value={nuevoProv.telefono}
                    onChange={e => setNuevoProv(p => ({ ...p, telefono: e.target.value }))}
                  />
                  <Input
                    placeholder="Email"
                    value={nuevoProv.email}
                    onChange={e => setNuevoProv(p => ({ ...p, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Contacto"
                    value={nuevoProv.contacto}
                    onChange={e => setNuevoProv(p => ({ ...p, contacto: e.target.value }))}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCrearProveedor}
                  disabled={!nuevoProv.nombre.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Guardar proveedor
                </Button>
              </div>
            ) : (
              <Select value={proveedorId} onValueChange={setProveedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.length === 0 && (
                    <SelectItem value="_vacio" disabled>
                      No hay proveedores — crea uno nuevo
                    </SelectItem>
                  )}
                  {proveedores.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.numero} · {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Proyecto + Concepto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Proyecto (opcional)</Label>
              <Select value={proyectoId} onValueChange={setProyectoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_ninguno">Sin proyecto</SelectItem>
                  {proyectos.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigoProyecto} · {p.proyectoNombre || p.clienteNombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Concepto</Label>
              <Input
                placeholder="Ej. Compra de material Bronce SAE 63"
                value={concepto}
                onChange={e => setConcepto(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <Label>Partidas</Label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Descripción</th>
                    <th className="px-2 py-2 text-right font-medium w-20">Cant.</th>
                    <th className="px-2 py-2 text-right font-medium w-24">Unidad</th>
                    <th className="px-2 py-2 text-right font-medium w-28">Costo unit.</th>
                    <th className="px-2 py-2 text-right font-medium w-28">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const totalFila = (parseFloat(it.cantidad) || 0) * (parseFloat(it.precioUnitario) || 0);
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-1.5">
                          <Input
                            placeholder="Descripción del item"
                            value={it.nombre}
                            onChange={e => actualizarItem(idx, 'nombre', e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min="0"
                            value={it.cantidad}
                            onChange={e => actualizarItem(idx, 'cantidad', e.target.value)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={it.unidad}
                            onChange={e => actualizarItem(idx, 'unidad', e.target.value)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={it.precioUnitario}
                            onChange={e => actualizarItem(idx, 'precioUnitario', e.target.value)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-slate-900">
                          {formatearMoneda(totalFila)}
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => quitarItem(idx)}
                              className="h-7 w-7 p-0 text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={agregarItem} className="border-slate-300">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agregar partida
            </Button>
          </div>

          {/* Totales + IVA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>IVA %</Label>
              <Input
                type="number"
                min="0"
                value={ivaPorcentaje}
                onChange={e => setIvaPorcentaje(e.target.value)}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatearMoneda(totales.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IVA</span>
                <span className="font-medium">{formatearMoneda(totales.iva)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-blue-600">{formatearMoneda(totales.total)}</span>
              </div>
            </div>
          </div>

          {/* Términos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Términos de pago</Label>
              <Select value={terminosPago} onValueChange={v => setTerminosPago(v as 'contado' | 'credito')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={v => setMoneda(v as 'MXN' | 'USD')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Entrega estimada</Label>
              <Input
                type="date"
                value={fechaEntrega}
                onChange={e => setFechaEntrega(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <Checkbox
                  checked={certificadoCalidad}
                  onCheckedChange={v => setCertificadoCalidad(v === true)}
                />
                Certificado de calidad
              </label>
            </div>
          </div>

          {/* Solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Solicitante</Label>
              <Input
                placeholder="Nombre de quien solicita"
                value={solicitanteNombre}
                onChange={e => setSolicitanteNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Código solicitante</Label>
              <Input
                placeholder="Ej. VLS-01"
                value={solicitanteCodigo}
                onChange={e => setSolicitanteCodigo(e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Observaciones para el proveedor..."
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={guardando || items.every(it => !it.nombre.trim())}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {guardando ? 'Guardando...' : 'Crear orden de compra'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
