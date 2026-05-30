import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import type { PiezaCotizacion, TipoProcesoVelso } from '@/types/cotizacion';
import { CATALOGO_PROCESOS_VELSO } from '@/types/cotizacion';

interface ProcesosStepProps {
  piezas: PiezaCotizacion[];
  onAgregarProceso: (
    piezaId: string,
    tipoProceso: TipoProcesoVelso,
    tiempoMinutos: number,
    descripcion?: string,
    tipoManoObra?: 'mo_s' | 'mo_e'
  ) => void;
  onEliminarProceso: (piezaId: string, procesoId: string) => void;
}

export function ProcesosStep({
  piezas,
  onAgregarProceso,
  onEliminarProceso,
}: ProcesosStepProps) {
  const [piezaExpandida, setPiezaExpandida] = useState<string>(piezas[0]?.id || '');

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Agrega procesos de manufactura a cada pieza
      </p>

      {piezas.map((pieza) => (
        <Card key={pieza.id} className="border-slate-200">
          <CardContent className="p-4">
            <button
              onClick={() => setPiezaExpandida(piezaExpandida === pieza.id ? '' : pieza.id)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">{pieza.nombre}</span>
                <span className="text-xs text-slate-500">(×{pieza.cantidad})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {pieza.procesos.length} procesos
                </span>
                {piezaExpandida === pieza.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {piezaExpandida === pieza.id && (
              <div className="space-y-3">
                {pieza.procesos.length > 0 && (
                  <div className="space-y-2">
                    {pieza.procesos.map((proc: Proceso) => (
                      <div
                        key={proc.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">{proc.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {proc.tiempoMinutos} min · ${proc.costoTotal.toFixed(2)}
                            {proc.incluyeManoObra && ` · MO: ${proc.tipoManoObraSeleccionada}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminarProceso(pieza.id, proc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <AgregarProcesoForm
                  piezaId={pieza.id}
                  onAgregar={onAgregarProceso}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AgregarProcesoForm({
  piezaId,
  onAgregar,
}: {
  piezaId: string;
  onAgregar: (
    piezaId: string,
    tipoProceso: TipoProcesoVelso,
    tiempoMinutos: number,
    descripcion?: string,
    tipoManoObra?: 'mo_s' | 'mo_e'
  ) => void;
}) {
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<TipoProcesoVelso | ''>('');
  const [tiempo, setTiempo] = useState(0);
  const [tipoManoObra, setTipoManoObra] = useState<'mo_s' | 'mo_e' | ''>('');

  const proceso = CATALOGO_PROCESOS_VELSO.find(p => p.id === procesoSeleccionado);
  const requiereMO = proceso?.categoria === 'maquina' || proceso?.requiereManoObra;

  const handleAgregar = () => {
    if (!procesoSeleccionado || tiempo <= 0) return;
    onAgregar(
      piezaId,
      procesoSeleccionado as TipoProcesoVelso,
      tiempo,
      undefined,
      tipoManoObra as 'mo_s' | 'mo_e' || undefined
    );
    setProcesoSeleccionado('');
    setTiempo(0);
    setTipoManoObra('');
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[200px]">
        <Select
          value={procesoSeleccionado}
          onValueChange={(val) => setProcesoSeleccionado(val as TipoProcesoVelso)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Seleccionar proceso..." />
          </SelectTrigger>
          <SelectContent>
            {CATALOGO_PROCESOS_VELSO.map((proc) => (
              <SelectItem key={proc.id} value={proc.id}>
                {proc.nombre} - ${proc.costoPorHora}/hr
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="number"
        min={1}
        value={tiempo}
        onChange={(e) => setTiempo(parseFloat(e.target.value) || 0)}
        placeholder="Minutos"
        className="w-24 h-9"
      />
      {requiereMO && (
        <Select
          value={tipoManoObra}
          onValueChange={(val) => setTipoManoObra(val as 'mo_s' | 'mo_e')}
        >
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="MO..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mo_s">MO Simple</SelectItem>
            <SelectItem value="mo_e">MO Especializada</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Button
        onClick={handleAgregar}
        disabled={!procesoSeleccionado || tiempo <= 0}
        className="h-9 bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
