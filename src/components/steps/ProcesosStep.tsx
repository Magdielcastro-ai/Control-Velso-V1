import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Settings, Clock, DollarSign, Cog, Info, User } from 'lucide-react';
import type { Proceso, TipoProcesoVelso } from '@/types/cotizacion';
import { CATALOGO_PROCESOS_VELSO, COSTOS_MANO_OBRA } from '@/types/cotizacion';

interface ProcesosStepProps {
  procesos: Proceso[];
  onAgregar: (tipoProceso: TipoProcesoVelso, tiempoMinutos: number, descripcion?: string, tipoManoObra?: 'mo_s' | 'mo_e') => void;
  onEliminar: (id: string) => void;
}

export function ProcesosStep({ procesos, onAgregar, onEliminar }: ProcesosStepProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoProcesoVelso>('torno_cnc');
  const [tiempo, setTiempo] = useState(30);
  const [unidadTiempo, setUnidadTiempo] = useState<'minutos' | 'horas'>('minutos');
  const [tipoManoObra, setTipoManoObra] = useState<'mo_s' | 'mo_e'>('mo_e');
  const [descripcion, setDescripcion] = useState('');

  const handleAgregar = () => {
    // Convertir a minutos si es necesario
    const tiempoEnMinutos = unidadTiempo === 'horas' ? tiempo * 60 : tiempo;
    onAgregar(tipoSeleccionado, tiempoEnMinutos, descripcion || undefined, tipoManoObra);
    setDescripcion('');
  };

  const procesoSeleccionado = CATALOGO_PROCESOS_VELSO.find(p => p.id === tipoSeleccionado);

  const totalProcesos = procesos.reduce((sum, p) => sum + p.costoTotal, 0);
  const totalTiempo = procesos.reduce((sum, p) => sum + p.tiempoMinutos, 0);

  // Agrupar procesos por categoría para mostrar
  const procesosPorCategoria = {
    indirecto: CATALOGO_PROCESOS_VELSO.filter(p => p.categoria === 'indirecto'),
    mano_obra: CATALOGO_PROCESOS_VELSO.filter(p => p.categoria === 'mano_obra'),
    servicio: CATALOGO_PROCESOS_VELSO.filter(p => p.categoria === 'servicio'),
    maquina: CATALOGO_PROCESOS_VELSO.filter(p => p.categoria === 'maquina'),
  };

  // Calcular costo estimado en tiempo real
  const calcularCostoEstimado = () => {
    if (!procesoSeleccionado) return 0;
    const tiempoHoras = unidadTiempo === 'minutos' ? tiempo / 60 : tiempo;
    const costoMaquina = tiempoHoras * procesoSeleccionado.costoPorHora;
    
    // Para máquinas, usar el tipo de mano de obra seleccionado
    let costoMO = 0;
    if (procesoSeleccionado.categoria === 'maquina') {
      costoMO = tiempoHoras * COSTOS_MANO_OBRA[tipoManoObra];
    } else if (procesoSeleccionado.requiereManoObra !== 'ninguna') {
      costoMO = tiempoHoras * COSTOS_MANO_OBRA[procesoSeleccionado.requiereManoObra];
    }
    
    return costoMaquina + costoMO;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Procesos y Operaciones</h2>
        <p className="text-slate-600">Selecciona procesos del catálogo Velso con costos predefinidos</p>
      </div>

      {/* Formulario para agregar proceso */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-blue-600" />
            Agregar Proceso del Catálogo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Tipo de Proceso</Label>
              <Select
                value={tipoSeleccionado}
                onValueChange={(value) => setTipoSeleccionado(value as TipoProcesoVelso)}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="codigo_07" disabled className="font-semibold text-slate-400">
                    --- Costos Indirectos ---
                  </SelectItem>
                  {procesosPorCategoria.indirecto.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} - ${p.costoPorHora.toFixed(2)}/h
                    </SelectItem>
                  ))}
                  
                  <SelectItem value="mo_s" disabled className="font-semibold text-slate-400">
                    --- Mano de Obra ---
                  </SelectItem>
                  {procesosPorCategoria.mano_obra.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} - ${p.costoPorHora.toFixed(2)}/h
                    </SelectItem>
                  ))}
                  
                  <SelectItem value="hora_diseno" disabled className="font-semibold text-slate-400">
                    --- Servicios ---
                  </SelectItem>
                  {procesosPorCategoria.servicio.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} - ${p.costoPorHora.toFixed(2)}/h
                    </SelectItem>
                  ))}
                  
                  <SelectItem value="torno_convencional" disabled className="font-semibold text-slate-400">
                    --- Máquinas ---
                  </SelectItem>
                  {procesosPorCategoria.maquina.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} - ${p.costoPorHora.toFixed(2)}/h
                    </SelectItem>
                  ))}
                  
                  <SelectItem value="otro" disabled className="font-semibold text-slate-400">
                    --- Otros ---
                  </SelectItem>
                  <SelectItem value="otro">Otro Proceso (costo manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info del proceso seleccionado */}
            {procesoSeleccionado && (
              <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800">{procesoSeleccionado.descripcion}</p>
                    {procesoSeleccionado.categoria === 'maquina' && (
                      <p className="text-blue-600 mt-1">
                        Selecciona el tipo de operador (MO-S o MO-E) para calcular el costo total.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Selector de unidad de tiempo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Unidad de Tiempo
              </Label>
              <ToggleGroup
                type="single"
                value={unidadTiempo}
                onValueChange={(value) => value && setUnidadTiempo(value as 'minutos' | 'horas')}
                className="w-full"
              >
                <ToggleGroupItem value="minutos" className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                  Minutos
                </ToggleGroupItem>
                <ToggleGroupItem value="horas" className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                  Horas
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Campo de tiempo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Tiempo ({unidadTiempo})
              </Label>
              <Input
                type="number"
                min={0.01}
                step={unidadTiempo === 'horas' ? 0.5 : 1}
                value={tiempo}
                onChange={(e) => setTiempo(parseFloat(e.target.value) || 0)}
                className="border-slate-300"
                placeholder={unidadTiempo === 'minutos' ? 'Ej: 30' : 'Ej: 1.5'}
              />
            </div>

            {/* Selector de tipo de mano de obra (solo para máquinas) */}
            {procesoSeleccionado?.categoria === 'maquina' && (
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Tipo de Operador
                </Label>
                <ToggleGroup
                  type="single"
                  value={tipoManoObra}
                  onValueChange={(value) => value && setTipoManoObra(value as 'mo_s' | 'mo_e')}
                  className="w-full"
                >
                  <ToggleGroupItem value="mo_s" className="flex-1 data-[state=on]:bg-green-600 data-[state=on]:text-white">
                    <div className="text-left">
                      <div className="font-medium">MO-S (Sencillo)</div>
                      <div className="text-xs opacity-80">${COSTOS_MANO_OBRA.mo_s.toFixed(2)}/h</div>
                    </div>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="mo_e" className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                    <div className="text-left">
                      <div className="font-medium">MO-E (Especializado)</div>
                      <div className="text-xs opacity-80">${COSTOS_MANO_OBRA.mo_e.toFixed(2)}/h</div>
                    </div>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {/* Costo estimado */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Costo Estimado
              </Label>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 font-medium">Costo calculado:</span>
                  <span className="text-2xl font-bold text-green-600">${calcularCostoEstimado().toFixed(2)}</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {unidadTiempo === 'minutos' ? tiempo : tiempo * 60} minutos × 
                  (${procesoSeleccionado?.costoPorHora.toFixed(2)}/h máquina
                  {procesoSeleccionado?.categoria === 'maquina' && ` + $${COSTOS_MANO_OBRA[tipoManoObra].toFixed(2)}/h ${tipoManoObra.toUpperCase()}`}
                  )
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descripción adicional (opcional)</Label>
              <Input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles específicos de este proceso..."
                className="border-slate-300"
              />
            </div>
          </div>

          <Button 
            onClick={handleAgregar}
            disabled={tiempo <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Proceso
          </Button>
        </CardContent>
      </Card>

      {/* Tabla de procesos */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Procesos Agregados
            </span>
            <div className="flex gap-4 text-sm font-normal">
              <span className="text-slate-600">
                Tiempo total: <span className="font-semibold text-slate-900">{Math.floor(totalTiempo / 60)}h {totalTiempo % 60}m</span>
              </span>
              <span className="text-slate-600">
                Costo total: <span className="font-semibold text-slate-900">${totalProcesos.toFixed(2)}</span>
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {procesos.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Cog className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay procesos agregados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proceso</TableHead>
                    <TableHead className="text-right">Tiempo</TableHead>
                    <TableHead className="text-right">$/Hora Máq.</TableHead>
                    <TableHead className="text-right">Operador</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procesos.map((proceso) => (
                    <TableRow key={proceso.id}>
                      <TableCell className="font-medium">
                        {proceso.nombre}
                        {proceso.descripcion && proceso.descripcion !== CATALOGO_PROCESOS_VELSO.find(p => p.id === proceso.tipo)?.descripcion && (
                          <p className="text-xs text-slate-500">{proceso.descripcion}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.floor(proceso.tiempoMinutos / 60) > 0 && `${Math.floor(proceso.tiempoMinutos / 60)}h `}
                        {proceso.tiempoMinutos % 60}m
                      </TableCell>
                      <TableCell className="text-right">${proceso.costoPorHora.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {proceso.costoManoObra > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${proceso.costoManoObra === COSTOS_MANO_OBRA.mo_e ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                            <span className="text-xs">
                              {proceso.costoManoObra === COSTOS_MANO_OBRA.mo_e ? 'MO-E' : 'MO-S'}
                            </span>
                            <span className="text-green-600">${proceso.costoManoObra.toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">${proceso.costoTotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminar(proceso.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leyenda */}
      <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
        <p className="font-medium mb-2">Notas del catálogo:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Selecciona <strong>Minutos</strong> para tiempos cortos o <strong>Horas</strong> para tiempos largos</li>
          <li>Para máquinas, elige entre <span className="text-green-600 font-medium">MO-S (Sencillo)</span> o <span className="text-blue-600 font-medium">MO-E (Especializado)</span></li>
          <li>El <strong>Código 07</strong> es un costo indirecto que se asigna proporcionalmente</li>
        </ul>
      </div>
    </div>
  );
}
