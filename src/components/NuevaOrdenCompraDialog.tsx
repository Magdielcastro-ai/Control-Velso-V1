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
import { Plus, Trash2, Building2 } from 'lucide-react';
import type { OrdenCompraItem, Proveedor } from '@/types/ordenesCompra';
import { materialesCotizadosDeProyecto } from '@/utils/proyectoDatos';
import type { ProyectoVenta } from '@/types/ventas';

interface ItemForm {
  nombre: string;
  cantidad: string;
  unidad: string;
  precioUnitario: string;
  referencia: string;
  materialId?: string;
}

interface NuevaOrdenCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedores: Proveedor[];
  proyectos: ProyectoVenta[];
  solicitanteDefault?: string;
  onCrearOrden: (datos: {
    proyectoId?: string;
    codigoProyecto?: string;
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
  }) => Promise<any>;
}

const itemVacio: ItemForm = { nombre: '', cantidad: '1', unidad: 'pieza', precioUnitario: '', referencia: '' };

// Código de taller para gastos internos — siempre activo.
// El 0007 de cada año está reservado para esto.
const CODIGO_TALLER_007 = `MAQ-${String(new Date().getFullYear() % 100).padStart(2, '0')}-0007`;
const VALOR_GASTOS_INTERNOS = '_gastos_internos';

export function NuevaOrdenCompraDialog({
  open,
  onOpenChange,
  proveedores,
  proyectos,
  solicitanteDefault,
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

  // Materiales cotizados del proyecto seleccionado (para precargar partidas)
  const proyectoSel = proyectoId && proyectoId !== VALOR_GASTOS_INTERNOS
    ? proyectos.find(p => p.id === proyectoId) || null
    : null;
  const materialesCotizados = useMemo(
    () => (proyectoSel ? materialesCotizadosDeProyecto(proyectoSel) : []),
    [proyectoSel]
  );

  // Al cambiar de proyecto: quitar partidas precargadas del proyecto anterior
  const handleCambiarProyecto = (valor: string) => {
    setProyectoId(valor);
    setItems(prev => prev.filter(it => !it.materialId).length > 0
      ? prev.filter(it => !it.materialId)
      : [{ ...itemVacio }]);
  };

  // Incluir/quitar un material cotizado como partida de la OC
  const itemDeMaterial = (materialId: string) => items.findIndex(it => it.materialId === materialId);

  const quitarItemSeguro = (idx: number) => {
    setItems(prev => {
      const nuevos = prev.filter((_, i) => i !== idx);
      return nuevos.length > 0 ? nuevos : [{ ...itemVacio }];
    });
  };

  const toggleMaterialCotizado = (m: any) => {
    const idx = itemDeMaterial(m.id);
    if (idx >= 0) {
      quitarItemSeguro(idx);
    } else {
      const nuevaPartida = {
        nombre: [
          m.nombreMaterial,
          m.forma && `forma ${m.forma}`,
          m.dimensionesTexto,
          `para ${m.piezaNombre}`,
        ].filter(Boolean).join(' · '),
        cantidad: '1',
        unidad: m.unidad || 'pieza',
        precioUnitario: m.costoTotalCotizado.toFixed(2),
        referencia: '',
        materialId: m.id,
      };
      setItems(prev => {
        // Si solo hay la línea vacía inicial, el primer material la SUSTITUYE
        const soloVacia = prev.length === 1 && prev[0].nombre.trim() === '';
        return soloVacia ? [nuevaPartida] : [...prev, nuevaPartida];
      });
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
    if (!proveedorId || !proyectoId) return;

    const proveedor = proveedores.find(p => p.id === proveedorId);
    const esGastosInternos = proyectoId === VALOR_GASTOS_INTERNOS;
    const proyecto = esGastosInternos ? null : proyectos.find(p => p.id === proyectoId);
    const codigoProyecto = esGastosInternos ? CODIGO_TALLER_007 : (proyecto?.codigoProyecto || '');

    setGuardando(true);
    const exito = await onCrearOrden({
      proyectoId: esGastosInternos ? undefined : proyectoId,
      codigoProyecto,
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
          referencia: it.referencia?.trim() || undefined,
          materialId: it.materialId,
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
      <DialogContent className="w-[95vw] max-w-[1100px] max-h-[94vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Building2 className="w-5 h-5 text-blue-600" />
            Nueva Orden de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 1. Proyecto — OBLIGATORIO (007 siempre activo) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Código de proyecto *</Label>
              <Select value={proyectoId} onValueChange={handleCambiarProyecto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el código..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VALOR_GASTOS_INTERNOS}>
                    {CODIGO_TALLER_007} · Gastos internos (taller)
                  </SelectItem>
                  {proyectos.filter(p => p.estado !== 'facturado').map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigoProyecto} · {p.proyectoNombre || p.clienteNombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Obligatorio: proyecto activo sin facturar, o {CODIGO_TALLER_007} para gastos internos
              </p>
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

          {/* 2. Proveedor — solo del catálogo (la alta es en la sección Proveedores) */}
          <div className="space-y-2">
            <Label>Proveedor *</Label>
            <Select value={proveedorId} onValueChange={setProveedorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proveedor del catálogo..." />
              </SelectTrigger>
              <SelectContent>
                {proveedores.length === 0 && (
                  <SelectItem value="_vacio" disabled>
                    No hay proveedores — agrégalos en la sección Proveedores
                  </SelectItem>
                )}
                {proveedores.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.numero} · {p.nombre}
                    {p.diasCredito ? ` · ${p.diasCredito} días crédito` : ' · Contado'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Materiales cotizados del proyecto: marcar para esta OC */}
          {proyectoSel && materialesCotizados.length > 0 && (
            <div className="space-y-2">
              <Label>Materiales cotizados en {proyectoSel.codigoProyecto}</Label>
              <p className="text-xs text-slate-400">
                Marca los materiales que van en esta OC (los que comparte el mismo proveedor van
                juntos). Descripción y costo quedan editables — ajusta si compras un solo tramo
                para varias piezas o piezas por separado.
              </p>
              <div className="border border-slate-200 rounded-lg divide-y max-h-[160px] overflow-y-auto">
                {materialesCotizados.map((m) => {
                  const incluido = itemDeMaterial(m.id) >= 0;
                  return (
                    <label key={m.id} className={`flex items-center gap-2 p-2 cursor-pointer ${incluido ? 'bg-blue-50/50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={incluido}
                        onChange={() => toggleMaterialCotizado(m)}
                        className="rounded border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">
                          {m.nombreMaterial}
                          <span className="text-xs text-slate-400 ml-1.5">para {m.piezaNombre}</span>
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">
                        Est. ${m.costoTotalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <Label>Partidas</Label>
            <p className="text-xs text-slate-400">
              Descripción libre y larga (como viene en la cotización del proveedor) + referencia
              de su cotización.
            </p>
            <div className="space-y-3">
              {items.map((it, idx) => {
                const totalFila = (parseFloat(it.cantidad) || 0) * (parseFloat(it.precioUnitario) || 0);
                return (
                  <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2">
                    {/* Descripción larga */}
                    <textarea
                      placeholder="Descripción completa del item (material, medidas, acabado, como viene en la cotización del proveedor...)"
                      value={it.nombre}
                      onChange={e => actualizarItem(idx, 'nombre', e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-200 p-2 min-h-[52px] bg-white"
                    />
                    {/* Números */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Cantidad</Label>
                        <Input
                          type="number"
                          min="0"
                          value={it.cantidad}
                          onChange={e => actualizarItem(idx, 'cantidad', e.target.value)}
                          className="h-8 text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Unidad</Label>
                        <Input
                          value={it.unidad}
                          onChange={e => actualizarItem(idx, 'unidad', e.target.value)}
                          className="h-8 text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Costo unitario</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={it.precioUnitario}
                          onChange={e => actualizarItem(idx, 'precioUnitario', e.target.value)}
                          className="h-8 text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Total</Label>
                        <p className="h-8 flex items-center justify-end font-semibold text-slate-900">
                          {formatearMoneda(totalFila)}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => quitarItem(idx)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Referencia de la cotización del proveedor */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-500 shrink-0">Ref. cotización proveedor:</Label>
                      <Input
                        placeholder="Ej. COT-4821 / folio del proveedor"
                        value={it.referencia}
                        onChange={e => actualizarItem(idx, 'referencia', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={agregarItem} className="border-slate-300">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agregar partida
            </Button>
          </div>

          {/* Banda tipo hoja: términos / entrega+IVA / totales en 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
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
                <Label>Solicitante</Label>
                <Input
                  placeholder="Nombre de quien solicita"
                  value={solicitanteNombre}
                  onChange={e => setSolicitanteNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Entrega estimada</Label>
                <Input
                  type="date"
                  value={fechaEntrega}
                  onChange={e => setFechaEntrega(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>IVA %</Label>
                <Input
                  type="number"
                  min="0"
                  value={ivaPorcentaje}
                  onChange={e => setIvaPorcentaje(e.target.value)}
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
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-1">
                <Checkbox
                  checked={certificadoCalidad}
                  onCheckedChange={v => setCertificadoCalidad(v === true)}
                />
                Certificado de calidad
              </label>
            </div>

            <div className="space-y-3">
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
              <div className="space-y-1.5">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Observaciones para el proveedor..."
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={guardando || !proveedorId || !proyectoId || items.every(it => !it.nombre.trim())}
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
