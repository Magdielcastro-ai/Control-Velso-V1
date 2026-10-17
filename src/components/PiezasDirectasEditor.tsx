import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Package, Save } from 'lucide-react';
import { CATALOGO_PROCESOS_VELSO, COSTOS_MANO_OBRA } from '@/types/cotizacion';
import type { TipoProcesoVelso } from '@/types/cotizacion';

interface PiezasDirectasEditorProps {
  piezas: any[];
  onGuardar: (piezas: any[]) => Promise<boolean> | void;
}

// Editor de piezas para PROYECTOS DIRECTOS (urgencia/stock): no hay
// cotización de origen, así que las piezas y procesos se capturan a mano.
// Es la estructura que leen Producción y la hoja viajera.
export function PiezasDirectasEditor({ piezas, onGuardar }: PiezasDirectasEditorProps) {
  const [lista, setLista] = useState<any[]>(piezas || []);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const marcar = (nueva: any[]) => {
    setLista(nueva);
    setSucio(true);
  };

  const agregarPieza = () => {
    marcar([...lista, {
      id: crypto.randomUUID(),
      nombre: '',
      cantidad: 1,
      material: null,
      procesos: [],
      costosAdicionales: {},
      subtotalPieza: 0,
      utilidadPieza: 0,
      ivaPieza: 0,
      totalPieza: 0,
    }]);
  };

  const actualizarPieza = (id: string, datos: any) => {
    marcar(lista.map(p => p.id === id ? { ...p, ...datos } : p));
  };

  const eliminarPieza = (id: string) => {
    marcar(lista.filter(p => p.id !== id));
  };

  const agregarProceso = (piezaId: string, tipoProceso: TipoProcesoVelso) => {
    const catalogo = CATALOGO_PROCESOS_VELSO.find(c => c.id === tipoProceso);
    if (!catalogo) return;
    const pieza = lista.find(p => p.id === piezaId);
    if (!pieza) return;
    const conMO = catalogo.requiereManoObra !== 'ninguna';
    const tasaMO = conMO ? COSTOS_MANO_OBRA[catalogo.requiereManoObra as 'mo_s' | 'mo_e'] : 0;
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: catalogo.nombre,
      tipo: catalogo.id,
      tiempoMinutosPorPieza: 0,
      tiempoMinutos: 0,
      costoPorHora: catalogo.costoPorHora,
      costoManoObraPorHora: tasaMO,
      costoManoObra: 0,
      costoTotal: 0,
      incluyeManoObra: conMO,
      tipoManoObraSeleccionada: conMO ? catalogo.requiereManoObra : undefined,
    };
    actualizarPieza(piezaId, { procesos: [...pieza.procesos, nuevo] });
  };

  const actualizarProceso = (piezaId: string, procesoId: string, minutos: number) => {
    const pieza = lista.find(p => p.id === piezaId);
    if (!pieza) return;
    actualizarPieza(piezaId, {
      procesos: pieza.procesos.map((pr: any) =>
        pr.id === procesoId ? { ...pr, tiempoMinutosPorPieza: minutos } : pr
      ),
    });
  };

  const eliminarProceso = (piezaId: string, procesoId: string) => {
    const pieza = lista.find(p => p.id === piezaId);
    if (!pieza) return;
    actualizarPieza(piezaId, {
      procesos: pieza.procesos.filter((pr: any) => pr.id !== procesoId),
    });
  };

  const handleGuardar = async () => {
    // Al guardar se calculan los totales de cada proceso:
    // tiempoMinutos = min/pieza × cantidad, costoTotal con máquina + MO
    const finales = lista
      .filter(p => p.nombre.trim() !== '')
      .map(p => ({
        ...p,
        cantidad: Math.max(1, Number(p.cantidad) || 1),
        procesos: p.procesos.map((pr: any) => {
          const total = (Number(pr.tiempoMinutosPorPieza) || 0) * (Number(p.cantidad) || 1);
          const horas = total / 60;
          const costoMO = horas * (pr.costoManoObraPorHora || 0);
          return {
            ...pr,
            tiempoMinutos: total,
            costoManoObra: costoMO,
            costoTotal: horas * ((pr.costoPorHora || 0) + (pr.costoManoObraPorHora || 0)),
          };
        }),
      }));
    setGuardando(true);
    await onGuardar(finales);
    setGuardando(false);
    setSucio(false);
  };

  return (
    <div className="mb-4 pb-4 border-b border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Piezas del Proyecto ({lista.length})
        </h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={agregarPieza} className="h-7 text-xs border-slate-300">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Agregar pieza
          </Button>
          <Button
            size="sm"
            onClick={handleGuardar}
            disabled={!sucio || guardando}
            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {guardando ? 'Guardando…' : 'Guardar piezas'}
          </Button>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">
          Sin piezas. Agrega las piezas que se van a fabricar para que Producción pueda registrar tiempos.
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((pieza) => (
            <div key={pieza.id} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={pieza.nombre}
                  onChange={(e) => actualizarPieza(pieza.id, { nombre: e.target.value })}
                  placeholder="Nombre de la pieza"
                  className="h-8 text-sm flex-1 min-w-[180px]"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Cant:</span>
                  <Input
                    type="number"
                    min={1}
                    value={pieza.cantidad}
                    onChange={(e) => actualizarPieza(pieza.id, { cantidad: Number(e.target.value) })}
                    className="h-8 text-sm w-20"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => eliminarPieza(pieza.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Procesos de la pieza */}
              <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                {pieza.procesos.map((proc: any) => (
                  <div key={proc.id} className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-slate-700 flex-1 min-w-[140px]">{proc.nombre}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={proc.tiempoMinutosPorPieza}
                        onChange={(e) => actualizarProceso(pieza.id, proc.id, Number(e.target.value))}
                        className="h-7 text-xs w-20"
                      />
                      <span className="text-xs text-slate-400">min/pza</span>
                    </div>
                    <span className="text-xs text-slate-500 w-24 text-right">
                      = {(Number(proc.tiempoMinutosPorPieza) || 0) * (Number(pieza.cantidad) || 1)} min tot
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminarProceso(pieza.id, proc.id)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Select onValueChange={(v) => agregarProceso(pieza.id, v as TipoProcesoVelso)}>
                  <SelectTrigger className="h-7 text-xs w-56">
                    <SelectValue placeholder="+ Agregar proceso" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATALOGO_PROCESOS_VELSO.filter(c => c.categoria !== 'indirecto').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
