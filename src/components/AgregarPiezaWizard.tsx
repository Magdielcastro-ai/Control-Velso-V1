import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Trash2, Package } from 'lucide-react';
import { CATALOGO_PROCESOS_VELSO, COSTOS_MANO_OBRA } from '@/types/cotizacion';
import type { CatalogoMaterial, TipoProcesoVelso } from '@/types/cotizacion';

interface AgregarPiezaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogoMateriales: CatalogoMaterial[];
  onGuardar: (pieza: any) => Promise<void> | void;
  // Si se captura un material nuevo (nombre + costo), se guarda también al
  // catálogo para que se autoalimente y aparezca en próximas piezas
  onAgregarMaterialACatalogo?: (material: any) => Promise<any> | void;
}

interface ProcesoDraft {
  id: string;
  nombre: string;
  tipo: TipoProcesoVelso | 'externo';
  minutosPorPieza: number;
  // externos
  costoPorPieza?: number;
}

// Wizard "Agregar Pieza" para proyectos directos en Producción:
// 1) nombre + cantidad · 2) material del catálogo O nuevo con su costo ·
// 3) procesos internos y externos con sus tiempos.
// Se puede guardar SIN procesos: la hoja viajera sale en blanco para
// llenarla a mano en piso y cargar los datos después.
export function AgregarPiezaWizard({ open, onOpenChange, catalogoMateriales, onGuardar, onAgregarMaterialACatalogo }: AgregarPiezaWizardProps) {
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [materialId, setMaterialId] = useState('');
  // Material nuevo capturado a mano (nombre + costo)
  const [materialNuevo, setMaterialNuevo] = useState(false);
  const [nuevoMatNombre, setNuevoMatNombre] = useState('');
  const [nuevoMatTipo, setNuevoMatTipo] = useState('');
  const [nuevoMatCosto, setNuevoMatCosto] = useState('');
  const [procesos, setProcesos] = useState<ProcesoDraft[]>([]);
  const [externoNombre, setExternoNombre] = useState('');
  const [externoMinutos, setExternoMinutos] = useState('');
  const [externoCosto, setExternoCosto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const limpiar = () => {
    setPaso(1);
    setNombre('');
    setCantidad(1);
    setMaterialId('');
    setMaterialNuevo(false);
    setNuevoMatNombre('');
    setNuevoMatTipo('');
    setNuevoMatCosto('');
    setProcesos([]);
    setExternoNombre('');
    setExternoMinutos('');
    setExternoCosto('');
  };

  const agregarProcesoInterno = (tipo: TipoProcesoVelso) => {
    const cat = CATALOGO_PROCESOS_VELSO.find(c => c.id === tipo);
    if (!cat) return;
    setProcesos(prev => [...prev, { id: crypto.randomUUID(), nombre: cat.nombre, tipo, minutosPorPieza: 0 }]);
  };

  const agregarProcesoExterno = () => {
    if (!externoNombre.trim()) return;
    setProcesos(prev => [...prev, {
      id: crypto.randomUUID(),
      nombre: externoNombre.trim(),
      tipo: 'externo',
      minutosPorPieza: Number(externoMinutos) || 0,
      costoPorPieza: Number(externoCosto) || 0,
    }]);
    setExternoNombre('');
    setExternoMinutos('');
    setExternoCosto('');
  };

  const handleGuardar = async () => {
    const cant = Math.max(1, cantidad);

    // Material: del catálogo o capturado nuevo con su costo
    let material: any = null;
    if (materialNuevo && nuevoMatNombre.trim()) {
      const costoUnitario = Number(nuevoMatCosto) || 0;
      material = {
        id: crypto.randomUUID(),
        nombre: nuevoMatNombre.trim(),
        tipo: nuevoMatTipo.trim() || 'Otro',
        forma: 'otro',
        unidadMedida: 'mm',
        cantidad: 1,
        unidad: 'pieza',
        costoUnitario,
        margenPorcentaje: 30,
        costoTotal: costoUnitario,
      };
      // Autoalimentar el catálogo con el material nuevo
      if (onAgregarMaterialACatalogo) {
        try {
          await onAgregarMaterialACatalogo({
            nombre: material.nombre,
            tipo: material.tipo,
            forma: material.forma,
            unidadMedida: material.unidadMedida,
            costoUnitario,
            unidadCosto: 'pieza',
          });
        } catch (e) {
          console.warn('[Wizard] No se pudo guardar el material al catálogo:', e);
        }
      }
    } else {
      const materialCat = catalogoMateriales.find(m => m.id === materialId);
      if (materialCat) {
        material = {
          ...materialCat,
          id: crypto.randomUUID(),
          cantidad: 1,
          unidad: materialCat.unidadCosto,
          margenPorcentaje: 30,
          costoTotal: materialCat.costoUnitario,
        };
      }
    }

    const procesosFinales = procesos.map(p => {
      if (p.tipo === 'externo') {
        const costoPorPieza = p.costoPorPieza || 0;
        return {
          id: p.id,
          nombre: p.nombre,
          tipo: 'otro',
          tiempoMinutosPorPieza: p.minutosPorPieza,
          tiempoMinutos: p.minutosPorPieza * cant,
          costoPorHora: 0,
          costoManoObraPorHora: 0,
          costoManoObra: 0,
          costoTotal: costoPorPieza * cant,
          costoTotalIngresado: costoPorPieza,
          incluyeManoObra: false,
          descripcion: 'Proceso externo',
        };
      }
      const cat = CATALOGO_PROCESOS_VELSO.find(c => c.id === p.tipo)!;
      const conMO = cat.requiereManoObra !== 'ninguna';
      const tasaMO = conMO ? COSTOS_MANO_OBRA[cat.requiereManoObra as 'mo_s' | 'mo_e'] : 0;
      const total = p.minutosPorPieza * cant;
      const horas = total / 60;
      const costoMO = horas * tasaMO;
      return {
        id: p.id,
        nombre: cat.nombre,
        tipo: cat.id,
        tiempoMinutosPorPieza: p.minutosPorPieza,
        tiempoMinutos: total,
        costoPorHora: cat.costoPorHora,
        costoManoObraPorHora: tasaMO,
        costoManoObra: costoMO,
        costoTotal: horas * (cat.costoPorHora + tasaMO),
        incluyeManoObra: conMO,
        tipoManoObraSeleccionada: conMO ? cat.requiereManoObra : undefined,
      };
    });

    const pieza = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      cantidad: cant,
      material,
      procesos: procesosFinales,
      costosAdicionales: {},
      subtotalPieza: 0,
      utilidadPieza: 0,
      ivaPieza: 0,
      totalPieza: 0,
      fechaRegistro: new Date().toISOString(),
    };

    setGuardando(true);
    await onGuardar(pieza);
    setGuardando(false);
    limpiar();
    onOpenChange(false);
  };

  const pasoValido =
    (paso === 1 && nombre.trim() !== '' && cantidad >= 1) ||
    paso === 2 ||
    paso === 3;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) limpiar(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Pieza — paso {paso} de 3</DialogTitle>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= paso ? 'bg-green-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        {paso === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la pieza *</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Buje de bronce 3in"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            {/* Alternar: del catálogo o capturar material nuevo con su costo */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={!materialNuevo ? 'default' : 'outline'}
                onClick={() => setMaterialNuevo(false)}
                className={!materialNuevo ? 'bg-blue-600' : 'border-slate-300'}
              >
                Del catálogo
              </Button>
              <Button
                type="button"
                size="sm"
                variant={materialNuevo ? 'default' : 'outline'}
                onClick={() => setMaterialNuevo(true)}
                className={materialNuevo ? 'bg-blue-600' : 'border-slate-300'}
              >
                Material nuevo (con costo)
              </Button>
            </div>

            {!materialNuevo ? (
              <div className="space-y-2">
                <Label>Material (opcional, del catálogo)</Label>
                <Select value={materialId || 'sin-material'} onValueChange={(v) => setMaterialId(v === 'sin-material' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-material">Sin material / se define después</SelectItem>
                    {catalogoMateriales.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre} — {m.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  El material de la compra real se registra después con la orden de compra.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nombre del material *</Label>
                  <Input
                    value={nuevoMatNombre}
                    onChange={(e) => setNuevoMatNombre(e.target.value)}
                    placeholder="Ej: Bronce SAE 63 redondo 3in"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo (opcional)</Label>
                    <Input
                      value={nuevoMatTipo}
                      onChange={(e) => setNuevoMatTipo(e.target.value)}
                      placeholder="Ej: Bronce"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo por pieza ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={nuevoMatCosto}
                      onChange={(e) => setNuevoMatCosto(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Si ya tienes el costo, captúralo aquí. El material nuevo también se guarda en el catálogo para próximas piezas.
                </p>
              </div>
            )}
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Procesos internos</Label>
              <Select onValueChange={(v) => agregarProcesoInterno(v as TipoProcesoVelso)}>
                <SelectTrigger>
                  <SelectValue placeholder="+ Agregar proceso interno" />
                </SelectTrigger>
                <SelectContent>
                  {CATALOGO_PROCESOS_VELSO.filter(c => c.categoria !== 'indirecto').map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de procesos agregados */}
            {procesos.length > 0 && (
              <div className="border rounded-lg divide-y">
                {procesos.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.nombre}
                        {p.tipo === 'externo' && <span className="text-xs text-purple-600 ml-1">(externo)</span>}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={p.minutosPorPieza || ''}
                      onChange={(e) => setProcesos(prev => prev.map(x =>
                        x.id === p.id ? { ...x, minutosPorPieza: Number(e.target.value) || 0 } : x
                      ))}
                      placeholder="min/pza"
                      className="h-7 w-24 text-sm text-right"
                    />
                    <span className="text-xs text-slate-400">min/pza</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                      onClick={() => setProcesos(prev => prev.filter(x => x.id !== p.id))}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Proceso externo */}
            <div className="space-y-2 border border-dashed border-purple-200 rounded-lg p-3">
              <Label className="text-purple-700">Proceso externo (opcional)</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  value={externoNombre}
                  onChange={(e) => setExternoNombre(e.target.value)}
                  placeholder="Ej: Tratamiento térmico"
                  className="h-8 flex-1 min-w-[140px] text-sm"
                />
                <Input
                  type="number"
                  min={0}
                  value={externoMinutos}
                  onChange={(e) => setExternoMinutos(e.target.value)}
                  placeholder="min/pza"
                  className="h-8 w-24 text-sm"
                />
                <Input
                  type="number"
                  min={0}
                  value={externoCosto}
                  onChange={(e) => setExternoCosto(e.target.value)}
                  placeholder="$/pza"
                  className="h-8 w-24 text-sm"
                />
                <Button size="sm" variant="outline" onClick={agregarProcesoExterno} disabled={!externoNombre.trim()} className="h-8">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navegación del wizard */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setPaso(p => Math.max(1, p - 1))}
            disabled={paso === 1}
            className="border-slate-300"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          {paso < 3 ? (
            <Button
              onClick={() => setPaso(p => p + 1)}
              disabled={!pasoValido}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleGuardar}
              disabled={guardando}
              className="bg-green-600 hover:bg-green-700"
            >
              <Package className="w-4 h-4 mr-1" />
              {guardando ? 'Guardando…' : 'Guardar Pieza'}
            </Button>
          )}
        </div>
        {paso === 3 && procesos.length === 0 && (
          <p className="text-xs text-slate-400 text-center">
            Sin procesos: la hoja viajera saldrá en blanco para llenarla a mano en piso y cargar los datos después.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
