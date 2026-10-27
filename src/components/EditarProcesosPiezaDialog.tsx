import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { CATALOGO_PROCESOS_VELSO, COSTOS_MANO_OBRA } from '@/types/cotizacion';
import type { TipoProcesoVelso } from '@/types/cotizacion';

interface EditarProcesosPiezaDialogProps {
  pieza: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (procesos: any[]) => Promise<void> | void;
}

// Editar los procesos de una pieza YA existente en proyectos directos
// (urgencia/stock): agregar/quitar procesos y ajustar minutos conforme se
// fabrica. Conserva los ids de los procesos existentes para no perder la
// liga con los tiempos reales ya capturados (llave pieza:proceso).
export function EditarProcesosPiezaDialog({ pieza, open, onOpenChange, onGuardar }: EditarProcesosPiezaDialogProps) {
  const [procesos, setProcesos] = useState<any[]>([]);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargado, setCargado] = useState<any | null>(null);
  const [externoNombre, setExternoNombre] = useState('');
  const [externoMinutos, setExternoMinutos] = useState('');
  const [externoCosto, setExternoCosto] = useState('');

  // Sembrar la lista al abrir con otra pieza
  if (pieza && cargado !== pieza.id) {
    setCargado(pieza.id);
    setProcesos((pieza.procesos || []).map((p: any) => ({ ...p })));
    setSucio(false);
  }

  const marcar = (nueva: any[]) => {
    setProcesos(nueva);
    setSucio(true);
  };

  const agregarInterno = (tipo: TipoProcesoVelso) => {
    const cat = CATALOGO_PROCESOS_VELSO.find(c => c.id === tipo);
    if (!cat) return;
    const conMO = cat.requiereManoObra !== 'ninguna';
    const tasaMO = conMO ? COSTOS_MANO_OBRA[cat.requiereManoObra as 'mo_s' | 'mo_e'] : 0;
    marcar([...procesos, {
      id: crypto.randomUUID(),
      nombre: cat.nombre,
      tipo: cat.id,
      tiempoMinutosPorPieza: 0,
      tiempoMinutos: 0,
      costoPorHora: cat.costoPorHora,
      costoManoObraPorHora: tasaMO,
      costoManoObra: 0,
      costoTotal: 0,
      incluyeManoObra: conMO,
      tipoManoObraSeleccionada: conMO ? cat.requiereManoObra : undefined,
    }]);
  };

  const agregarExterno = () => {
    if (!externoNombre.trim()) return;
    marcar([...procesos, {
      id: crypto.randomUUID(),
      nombre: externoNombre.trim(),
      tipo: 'otro',
      tiempoMinutosPorPieza: Number(externoMinutos) || 0,
      tiempoMinutos: 0,
      costoPorHora: 0,
      costoManoObraPorHora: 0,
      costoManoObra: 0,
      costoTotal: 0,
      costoTotalIngresado: Number(externoCosto) || 0,
      incluyeManoObra: false,
      descripcion: 'Proceso externo',
    }]);
    setExternoNombre('');
    setExternoMinutos('');
    setExternoCosto('');
  };

  const handleGuardar = async () => {
    const cant = Number(pieza?.cantidad) || 1;
    const finales = procesos.map(pr => {
      const total = (Number(pr.tiempoMinutosPorPieza) || 0) * cant;
      if (pr.tipo === 'otro') {
        return {
          ...pr,
          tiempoMinutos: total,
          costoTotal: (Number(pr.costoTotalIngresado) || 0) * cant,
        };
      }
      const horas = total / 60;
      const costoMO = horas * (pr.costoManoObraPorHora || 0);
      return {
        ...pr,
        tiempoMinutos: total,
        costoManoObra: costoMO,
        costoTotal: horas * ((pr.costoPorHora || 0) + (pr.costoManoObraPorHora || 0)),
      };
    });
    setGuardando(true);
    await onGuardar(finales);
    setGuardando(false);
    setSucio(false);
    setCargado(null);
    onOpenChange(false);
  };

  const handleCerrar = (o: boolean) => {
    if (!o) setCargado(null);
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Procesos de {pieza?.nombre}
            <span className="text-sm font-normal text-slate-500 ml-2">({pieza?.cantidad} pzas)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Procesos actuales */}
          <div className="space-y-2">
            {procesos.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-3">Sin procesos — agrega el primero abajo</p>
            )}
            {procesos.map((pr, idx) => (
              <div key={pr.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-700 flex-1 min-w-[140px]">
                  {pr.nombre}
                  {pr.tipo === 'otro' && <span className="text-xs text-purple-600 ml-1">(externo)</span>}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={pr.tiempoMinutosPorPieza || ''}
                  onChange={(e) => marcar(procesos.map((x, i) =>
                    i === idx ? { ...x, tiempoMinutosPorPieza: Number(e.target.value) || 0 } : x
                  ))}
                  placeholder="min/pza"
                  className="h-8 w-24 text-sm text-right"
                />
                <span className="text-xs text-slate-400">min/pza</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                  title="Quitar proceso"
                  onClick={() => {
                    if (pr.tiempoMinutosReal || confirm('¿Quitar este proceso? Si ya tiene horas reales capturadas, esas capturas quedarán sin proceso visible.')) {
                      marcar(procesos.filter((_, i) => i !== idx));
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Agregar proceso interno */}
          <div className="space-y-2">
            <Label>Agregar proceso interno</Label>
            <Select onValueChange={(v) => agregarInterno(v as TipoProcesoVelso)}>
              <SelectTrigger>
                <SelectValue placeholder="+ Seleccionar proceso del catálogo" />
              </SelectTrigger>
              <SelectContent>
                {CATALOGO_PROCESOS_VELSO.filter(c => c.categoria !== 'indirecto').map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agregar proceso externo */}
          <div className="space-y-2 border border-dashed border-purple-200 rounded-lg p-3">
            <Label className="text-purple-700">Agregar proceso externo</Label>
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
              <Button size="sm" variant="outline" onClick={agregarExterno} disabled={!externoNombre.trim()} className="h-8">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleGuardar}
            disabled={!sucio || guardando}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-1" />
            {guardando ? 'Guardando…' : 'Guardar procesos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
