import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Package, Settings, ExternalLink, ChevronDown, ChevronUp, Pencil, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { PiezaCotizacion, Material, Proceso, CatalogoMaterial } from '@/types/cotizacion';
import { CATALOGO_PROCESOS_VELSO } from '@/types/cotizacion';

interface PiezasStepProps {
  piezas: PiezaCotizacion[];
  catalogoMateriales: CatalogoMaterial[];
  onAgregarPieza: (nombre: string, cantidad: number) => void;
  onEliminarPieza: (id: string) => void;
  onActualizarPieza: (id: string, datos: Partial<PiezaCotizacion>) => void;
  onAgregarMaterialACatalogo?: (material: Omit<CatalogoMaterial, 'id'>) => Promise<CatalogoMaterial | null>;
  onRecargarCatalogo?: () => void;
}

export function PiezasStep({
  piezas,
  catalogoMateriales,
  onAgregarPieza,
  onEliminarPieza,
  onActualizarPieza,
  onAgregarMaterialACatalogo,
  onRecargarCatalogo,
}: PiezasStepProps) {
  const [nuevaPiezaNombre, setNuevaPiezaNombre] = useState('');
  const [nuevaPiezaCantidad, setNuevaPiezaCantidad] = useState(1);
  const [piezaExpandida, setPiezaExpandida] = useState<string>(piezas[0]?.id || '');
  const [modalMaterialAbierto, setModalMaterialAbierto] = useState(false);
  const [piezaParaMaterial, setPiezaParaMaterial] = useState<string>('');

  const handleAgregarPieza = () => {
    if (!nuevaPiezaNombre.trim()) {
      toast.error('Ingresa un nombre para la pieza');
      return;
    }
    onAgregarPieza(nuevaPiezaNombre.trim(), nuevaPiezaCantidad);
    setNuevaPiezaNombre('');
    setNuevaPiezaCantidad(1);
  };

  return (
    <div className="space-y-6">
      {/* Lista de piezas */}
      <div className="space-y-4">
        {piezas.map((pieza) => (
          <PiezaCard
            key={pieza.id}
            pieza={pieza}
            expandida={piezaExpandida === pieza.id}
            onToggle={() => setPiezaExpandida(piezaExpandida === pieza.id ? '' : pieza.id)}
            onEliminar={() => {
              if (piezas.length > 1) onEliminarPieza(pieza.id);
              else toast.error('Debe haber al menos una pieza');
            }}
            onActualizar={onActualizarPieza}
            catalogoMateriales={catalogoMateriales}
            onAbrirModalMaterial={(piezaId) => {
              setPiezaParaMaterial(piezaId);
              setModalMaterialAbierto(true);
            }}
            onRecargarCatalogo={onRecargarCatalogo}
          />
        ))}
      </div>

      {/* Agregar nueva pieza */}
      <div className="flex gap-2">
        <Input
          value={nuevaPiezaNombre}
          onChange={(e) => setNuevaPiezaNombre(e.target.value)}
          placeholder="Nombre de la nueva pieza..."
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleAgregarPieza()}
        />
        <Input
          type="number"
          min={1}
          value={nuevaPiezaCantidad}
          onChange={(e) => setNuevaPiezaCantidad(parseInt(e.target.value) || 1)}
          className="w-20"
        />
        <Button onClick={handleAgregarPieza} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Resumen */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>{piezas.length}</strong> {piezas.length === 1 ? 'pieza' : 'piezas'} en total
        </p>
      </div>

      {/* Modal para agregar material nuevo */}
      <ModalNuevoMaterial
        abierto={modalMaterialAbierto}
        onCerrar={() => setModalMaterialAbierto(false)}
        onGuardar={async (material) => {
          if (onAgregarMaterialACatalogo) {
            const nuevo = await onAgregarMaterialACatalogo(material);
            if (nuevo && piezaParaMaterial) {
              toast.success('Material agregado al catálogo');
            }
          }
          setModalMaterialAbierto(false);
        }}
      />
    </div>
  );
}

function PiezaCard({
  pieza,
  expandida,
  onToggle,
  onEliminar,
  onActualizar,
  catalogoMateriales,
  onAbrirModalMaterial,
  onRecargarCatalogo,
}: {
  pieza: PiezaCotizacion;
  expandida: boolean;
  onToggle: () => void;
  onEliminar: () => void;
  onActualizar: (id: string, datos: Partial<PiezaCotizacion>) => void;
  catalogoMateriales: CatalogoMaterial[];
  onAbrirModalMaterial: (piezaId: string) => void;
  onRecargarCatalogo?: () => void;
}) {
  const [materialSeleccionado, setMaterialSeleccionado] = useState<CatalogoMaterial | null>(null);
  const [costoTotalMaterial, setCostoTotalMaterial] = useState(0);
  const [margenMaterial, setMargenMaterial] = useState(30);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<any>(null);
  const [tiempoProceso, setTiempoProceso] = useState(0);
  const [unidadTiempo, setUnidadTiempo] = useState<'minutos' | 'horas'>('minutos');
  const [tipoMO, setTipoMO] = useState<'mo_s' | 'mo_e'>('mo_s');
  const [nombreExterno, setNombreExterno] = useState('');
  const [costoExterno, setCostoExterno] = useState(0);
  const [margenExterno, setMargenExterno] = useState(30);
  const [editandoMaterial, setEditandoMaterial] = useState<string | null>(null);
  const [editandoProceso, setEditandoProceso] = useState<string | null>(null);

  // Calcular costo por pieza a partir del costo total
  const calcularCostoMaterial = () => {
    if (costoTotalMaterial <= 0 || pieza.cantidad <= 0) return 0;
    const costoPorPieza = costoTotalMaterial / pieza.cantidad;
    const costoConMargen = costoPorPieza * (1 + margenMaterial / 100);
    return costoConMargen;
  };

  const agregarMaterial = () => {
    if (!materialSeleccionado || costoTotalMaterial <= 0) return;
    const costoUnitarioConMargen = calcularCostoMaterial();
    const nuevo: Material = {
      id: crypto.randomUUID(),
      nombre: materialSeleccionado.nombre,
      tipo: materialSeleccionado.tipo,
      forma: materialSeleccionado.forma,
      cantidad: pieza.cantidad,
      costoUnitario: costoUnitarioConMargen,
      unidadMedida: materialSeleccionado.unidadMedida,
      unidad: materialSeleccionado.unidadCosto,
      margenPorcentaje: margenMaterial,
      costoTotal: costoUnitarioConMargen * pieza.cantidad,
    };
    onActualizar(pieza.id, {
      materiales: [...pieza.materiales, nuevo],
    });
    setMaterialSeleccionado(null);
    setCostoTotalMaterial(0);
    setMargenMaterial(30);
  };

  const actualizarMaterial = (materialId: string, campo: string, valor: number) => {
    const mats = pieza.materiales.map((m) => {
      if (m.id !== materialId) return m;
      if (campo === 'margenPorcentaje') {
        const nuevoCosto = (m.costoUnitario / (1 + m.margenPorcentaje / 100)) * (1 + valor / 100);
        return { ...m, margenPorcentaje: valor, costoUnitario: nuevoCosto, costoTotal: nuevoCosto * m.cantidad };
      }
      if (campo === 'costoUnitario') {
        return { ...m, costoUnitario: valor, costoTotal: valor * m.cantidad };
      }
      return m;
    });
    onActualizar(pieza.id, { materiales: mats });
  };

  const eliminarMaterial = (materialId: string) => {
    onActualizar(pieza.id, {
      materiales: pieza.materiales.filter((m) => m.id !== materialId),
    });
  };

  const agregarProceso = () => {
    if (!procesoSeleccionado || tiempoProceso <= 0) return;
    const tiempoMinutos = unidadTiempo === 'horas' ? tiempoProceso * 60 : tiempoProceso;
    const tiempoHoras = tiempoMinutos / 60;
    let costoMO = 0;
    if (procesoSeleccionado.categoria === 'maquina') {
      costoMO = tiempoHoras * (tipoMO === 'mo_s' ? 191.19 : 286.78);
    } else if (procesoSeleccionado.requiereManoObra === 'mo_s') {
      costoMO = tiempoHoras * 191.19;
    } else if (procesoSeleccionado.requiereManoObra === 'mo_e') {
      costoMO = tiempoHoras * 286.78;
    }
    const nuevo: Proceso = {
      id: crypto.randomUUID(),
      nombre: procesoSeleccionado.nombre,
      tipo: procesoSeleccionado.id,
      tiempoMinutos,
      costoPorHora: procesoSeleccionado.costoPorHora,
      costoManoObra: costoMO,
      costoTotal: tiempoHoras * procesoSeleccionado.costoPorHora + costoMO,
      descripcion: `${tiempoProceso} ${unidadTiempo}`,
      incluyeManoObra: costoMO > 0,
      tipoManoObraSeleccionada: costoMO > 0 ? tipoMO : undefined,
    };
    onActualizar(pieza.id, {
      procesos: [...pieza.procesos, nuevo],
    });
    setProcesoSeleccionado(null);
    setTiempoProceso(0);
  };

  const actualizarProceso = (procesoId: string, campo: string, valor: any) => {
    const procs = pieza.procesos.map((p) => {
      if (p.id !== procesoId) return p;
      return { ...p, [campo]: valor };
    });
    onActualizar(pieza.id, { procesos: procs });
  };

  const eliminarProceso = (procesoId: string) => {
    onActualizar(pieza.id, {
      procesos: pieza.procesos.filter((p) => p.id !== procesoId),
    });
  };

  const agregarProcesoExterno = () => {
    if (!nombreExterno.trim() || costoExterno <= 0) return;
    const costoConMargen = costoExterno * (1 + margenExterno / 100);
    const nuevo: Proceso = {
      id: crypto.randomUUID(),
      nombre: nombreExterno.trim(),
      tipo: 'otro',
      tiempoMinutos: 0,
      costoPorHora: 0,
      costoManoObra: 0,
      costoTotal: costoConMargen,
      descripcion: `Proveedor: $${costoExterno.toFixed(2)} + ${margenExterno}% = $${costoConMargen.toFixed(2)}`,
      incluyeManoObra: false,
    };
    onActualizar(pieza.id, {
      procesos: [...pieza.procesos, nuevo],
    });
    setNombreExterno('');
    setCostoExterno(0);
    setMargenExterno(30);
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Input
                  value={pieza.nombre}
                  onChange={(e) => onActualizar(pieza.id, { nombre: e.target.value })}
                  className="h-8 text-sm font-medium flex-1"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Cant:</span>
                  <Input
                    type="number"
                    min={1}
                    value={pieza.cantidad}
                    onChange={(e) => onActualizar(pieza.id, { cantidad: parseInt(e.target.value) || 1 })}
                    className="h-8 w-16 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {pieza.materiales.length} materiales · {pieza.procesos.length} procesos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {expandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEliminar}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contenido expandido */}
        {expandida && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Materiales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-900 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Materiales
                </h4>
                {catalogoMateriales.length === 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600">Catálogo vacío</span>
                    {onRecargarCatalogo && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onRecargarCatalogo}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Recargar
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de materiales agregados */}
              {pieza.materiales.length > 0 && (
                <div className="space-y-2 mb-3">
                  {pieza.materiales.map((mat) => (
                    <div key={mat.id} className="p-2 bg-slate-50 rounded-lg">
                      {editandoMaterial === mat.id ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-sm flex-1">{mat.nombre}</span>
                          <Input
                            type="number"
                            value={mat.costoUnitario}
                            onChange={(e) => actualizarMaterial(mat.id, 'costoUnitario', parseFloat(e.target.value) || 0)}
                            className="w-24 h-7 text-xs"
                          />
                          <Input
                            type="number"
                            value={mat.margenPorcentaje}
                            onChange={(e) => actualizarMaterial(mat.id, 'margenPorcentaje', parseFloat(e.target.value) || 0)}
                            className="w-16 h-7 text-xs"
                          />
                          <span className="text-xs">%</span>
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditandoMaterial(null)}>
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{mat.nombre}</p>
                            <p className="text-xs text-slate-500">
                              ${mat.costoUnitario.toFixed(2)} × {mat.cantidad} piezas = ${mat.costoTotal.toFixed(2)}
                              {mat.margenPorcentaje > 0 && ` (incluye ${mat.margenPorcentaje}% margen)`}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditandoMaterial(mat.id)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => eliminarMaterial(mat.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar material */}
              <div className="space-y-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <Select
                      value={materialSeleccionado?.id || ''}
                      onValueChange={(id) => {
                        const mat = catalogoMateriales.find(c => c.id === id);
                        setMaterialSeleccionado(mat || null);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogoMateriales.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id} className="text-xs">
                            {mat.nombre} - ${mat.costoUnitario}/{mat.unidadMedida}
                          </SelectItem>
                        ))}
                        {catalogoMateriales.length === 0 && (
                          <div className="p-2 text-xs text-slate-500">No hay materiales en catálogo</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {materialSeleccionado && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500">Costo TOTAL para {pieza.cantidad} piezas</label>
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={costoTotalMaterial}
                        onChange={(e) => setCostoTotalMaterial(parseFloat(e.target.value) || 0)}
                        placeholder="Costo total del material"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Margen %</label>
                      <Input
                        type="number"
                        min={0}
                        value={margenMaterial}
                        onChange={(e) => setMargenMaterial(parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                    <div className="pb-1">
                      <Button onClick={agregarMaterial} disabled={costoTotalMaterial <= 0} className="h-8 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {costoTotalMaterial > 0 && (
                  <p className="text-xs text-slate-500">
                    Costo por pieza: ${(costoTotalMaterial / pieza.cantidad).toFixed(2)} + {margenMaterial}% = ${calcularCostoMaterial().toFixed(2)}
                  </p>
                )}
              </div>
              {catalogoMateriales.length === 0 && onAbrirModalMaterial && (
                <button
                  onClick={() => onAbrirModalMaterial(pieza.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  + Agregar material nuevo al catálogo
                </button>
              )}
            </div>

            {/* Procesos de manufactura */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1">
                <Settings className="w-3 h-3" /> Procesos de Manufactura
              </h4>
              {pieza.procesos.filter(p => p.tipo !== 'otro').length > 0 && (
                <div className="space-y-1 mb-2">
                  {pieza.procesos.filter(p => p.tipo !== 'otro').map((proc) => (
                    <div key={proc.id} className="flex justify-between p-1.5 bg-slate-50 rounded text-sm">
                      <span>{proc.nombre} ({proc.descripcion || proc.tiempoMinutos + ' min'})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">${proc.costoTotal.toFixed(2)}</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-500" onClick={() => eliminarProceso(proc.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <Select
                      value={procesoSeleccionado?.id || ''}
                      onValueChange={(id) => {
                        const proc = CATALOGO_PROCESOS_VELSO.find(p => p.id === id);
                        setProcesoSeleccionado(proc || null);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar proceso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATALOGO_PROCESOS_VELSO.map((proc) => (
                          <SelectItem key={proc.id} value={proc.id} className="text-xs">
                            {proc.nombre} - ${proc.costoPorHora}/hr
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {procesoSeleccionado && (
                  <div className="flex gap-2 items-end">
                    <div>
                      <label className="text-xs text-slate-500">Tiempo</label>
                      <Input
                        type="number"
                        min={1}
                        value={tiempoProceso}
                        onChange={(e) => setTiempoProceso(parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Unidad</label>
                      <Select value={unidadTiempo} onValueChange={(v) => setUnidadTiempo(v as 'minutos' | 'horas')}>
                        <SelectTrigger className="h-8 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutos" className="text-xs">Minutos</SelectItem>
                          <SelectItem value="horas" className="text-xs">Horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {procesoSeleccionado?.categoria === 'maquina' && (
                      <Select value={tipoMO} onValueChange={(v) => setTipoMO(v as 'mo_s' | 'mo_e')}>
                        <SelectTrigger className="h-8 w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mo_s" className="text-xs">MO-S</SelectItem>
                          <SelectItem value="mo_e" className="text-xs">MO-E</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="pb-1">
                      <Button onClick={agregarProceso} disabled={tiempoProceso <= 0} className="h-8 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Procesos externos */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Procesos Externos
              </h4>
              {pieza.procesos.filter(p => p.tipo === 'otro').length > 0 && (
                <div className="space-y-1 mb-2">
                  {pieza.procesos.filter(p => p.tipo === 'otro').map((proc) => (
                    <div key={proc.id} className="flex justify-between p-1.5 bg-amber-50 rounded text-sm">
                      <div>
                        <span>{proc.nombre}</span>
                        <span className="text-xs text-slate-500 ml-2">{proc.descripcion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">${proc.costoTotal.toFixed(2)}</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-500" onClick={() => eliminarProceso(proc.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <Input
                  value={nombreExterno}
                  onChange={(e) => setNombreExterno(e.target.value)}
                  placeholder="Nombre del proceso externo"
                  className="flex-1 h-8 text-xs"
                />
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={costoExterno}
                  onChange={(e) => setCostoExterno(parseFloat(e.target.value) || 0)}
                  placeholder="Costo proveedor"
                  className="w-28 h-8 text-xs"
                />
                <Select value={String(margenExterno)} onValueChange={(v) => setMargenExterno(parseInt(v))}>
                  <SelectTrigger className="h-8 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-xs">5%</SelectItem>
                    <SelectItem value="15" className="text-xs">15%</SelectItem>
                    <SelectItem value="30" className="text-xs">30%</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={agregarProcesoExterno} disabled={!nombreExterno.trim() || costoExterno <= 0} className="h-8 bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {costoExterno > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Costo proveedor: ${costoExterno.toFixed(2)} + {margenExterno}% = ${(costoExterno * (1 + margenExterno / 100)).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModalNuevoMaterial({
  abierto,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (material: Omit<CatalogoMaterial, 'id'>) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('acero');
  const [costo, setCosto] = useState(0);
  const [unidad, setUnidad] = useState('kg');

  const handleGuardar = async () => {
    if (!nombre.trim() || costo <= 0) {
      toast.error('Completa todos los campos');
      return;
    }
    await onGuardar({
      nombre: nombre.trim(),
      tipo,
      forma: 'redondo',
      unidadMedida: 'mm',
      costoUnitario: costo,
      unidadCosto: unidad as 'kg' | 'pieza' | 'metro',
    });
    setNombre('');
    setCosto(0);
  };

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Material Nuevo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Acero inoxidable 304" />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acero">Acero</SelectItem>
                <SelectItem value="aluminio">Aluminio</SelectItem>
                <SelectItem value="bronce">Bronce</SelectItem>
                <SelectItem value="plastico">Plástico</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Costo Unitario</label>
              <Input type="number" min={0.01} step={0.01} value={costo} onChange={(e) => setCosto(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-sm font-medium">Unidad</label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pieza">pieza</SelectItem>
                  <SelectItem value="metro">metro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button onClick={handleGuardar} className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
