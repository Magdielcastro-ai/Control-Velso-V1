import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Palette, Code, Wrench, Truck, MoreHorizontal, TrendingUp, Clock, Info } from 'lucide-react';
import type { CostosAdicionales } from '@/types/cotizacion';
import { CATALOGO_PROCESOS_VELSO, COSTOS_MANO_OBRA } from '@/types/cotizacion';

interface CostosStepProps {
  costos: CostosAdicionales;
  margenUtilidad: number;
  costoMateriales: number;
  costoProcesos: number;
  onChangeCostos: (costos: Partial<CostosAdicionales>) => void;
  onChangeMargen: (margen: number) => void;
}

// Costos por hora para los servicios adicionales
const COSTO_HORA_DISENO = 360.97; // hora_diseno
const COSTO_HORA_PROGRAMACION = 286.78; // MO-E (programación usa operador especializado)

export function CostosStep({ 
  costos, 
  margenUtilidad, 
  costoMateriales, 
  costoProcesos,
  onChangeCostos, 
  onChangeMargen 
}: CostosStepProps) {
  // Calcular totales a partir de horas
  // Los valores en costos son los montos calculados, pero internamente guardamos las horas
  // Vamos a usar un estado local para las horas
  const [horas, setHoras] = useState({
    disenoCAD: 0,
    programacionCNC: 0,
    setup: 0,
  });

  // Inicializar horas desde los costos existentes (convertir montos a horas)
  useState(() => {
    setHoras({
      disenoCAD: costos.disenoCAD > 0 ? costos.disenoCAD / COSTO_HORA_DISENO : 0,
      programacionCNC: costos.programacionCNC > 0 ? costos.programacionCNC / COSTO_HORA_PROGRAMACION : 0,
      setup: costos.setup > 0 ? costos.setup / (COSTOS_MANO_OBRA.mo_e + 100) : 0, // Aproximado
    });
  });

  const handleHorasChange = (tipo: keyof typeof horas, horasValor: number) => {
    setHoras(prev => ({ ...prev, [tipo]: horasValor }));
    
    // Calcular el costo según el tipo
    let costoCalculado = 0;
    switch (tipo) {
      case 'disenoCAD':
        costoCalculado = horasValor * COSTO_HORA_DISENO;
        break;
      case 'programacionCNC':
        costoCalculado = horasValor * COSTO_HORA_PROGRAMACION;
        break;
      case 'setup':
        // Setup = MO-E + hora máquina (usamos CNC Vertical como referencia)
        const costoHoraMaquina = CATALOGO_PROCESOS_VELSO.find(p => p.id === 'cnc_vertical')?.costoPorHora || 338.47;
        costoCalculado = horasValor * (COSTOS_MANO_OBRA.mo_e + costoHoraMaquina);
        break;
    }
    
    onChangeCostos({ [tipo]: costoCalculado });
  };

  const totalAdicionales = Object.values(costos).reduce((sum, v) => sum + v, 0);
  const costoDirecto = costoMateriales + costoProcesos + totalAdicionales;
  const margenValor = costoDirecto * (margenUtilidad / 100);
  const subtotal = costoDirecto + margenValor;

  // Calcular horas actuales para mostrar
  const horasDiseno = costos.disenoCAD / COSTO_HORA_DISENO;
  const horasProgramacion = costos.programacionCNC / COSTO_HORA_PROGRAMACION;
  const costoHoraMaquinaRef = CATALOGO_PROCESOS_VELSO.find(p => p.id === 'cnc_vertical')?.costoPorHora || 338.47;
  const horasSetup = costos.setup > 0 ? costos.setup / (COSTOS_MANO_OBRA.mo_e + costoHoraMaquinaRef) : 0;

  const costosItems = [
    { 
      key: 'disenoCAD' as keyof CostosAdicionales, 
      label: 'Diseño CAD/CAM', 
      icon: Palette,
      costoHora: COSTO_HORA_DISENO,
      horasActuales: horasDiseno,
      descripcion: `$${COSTO_HORA_DISENO.toFixed(2)}/hora`
    },
    { 
      key: 'programacionCNC' as keyof CostosAdicionales, 
      label: 'Programación CNC', 
      icon: Code,
      costoHora: COSTO_HORA_PROGRAMACION,
      horasActuales: horasProgramacion,
      descripcion: `$${COSTO_HORA_PROGRAMACION.toFixed(2)}/hora (MO-E)`
    },
    { 
      key: 'setup' as keyof CostosAdicionales, 
      label: 'Setup y Preparación', 
      icon: Wrench,
      costoHora: COSTOS_MANO_OBRA.mo_e + costoHoraMaquinaRef,
      horasActuales: horasSetup,
      descripcion: `MO-E ($${COSTOS_MANO_OBRA.mo_e.toFixed(2)}) + Máquina ($${costoHoraMaquinaRef.toFixed(2)})`
    },
    { 
      key: 'transporte' as keyof CostosAdicionales, 
      label: 'Transporte/Envío', 
      icon: Truck,
      costoHora: 0,
      horasActuales: 0,
      descripcion: 'Monto fijo'
    },
    { 
      key: 'otro' as keyof CostosAdicionales, 
      label: 'Otros Costos', 
      icon: MoreHorizontal,
      costoHora: 0,
      horasActuales: 0,
      descripcion: 'Monto fijo'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Costos Adicionales</h2>
        <p className="text-slate-600">Configura costos extras en horas y margen de utilidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costos adicionales */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Costos Adicionales (en horas)
              </span>
              <span className="text-sm font-normal text-slate-600">
                Total: <span className="font-semibold text-slate-900">${totalAdicionales.toFixed(2)}</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {costosItems.map((item) => {
              const esPorHoras = item.key === 'disenoCAD' || item.key === 'programacionCNC' || item.key === 'setup';
              const costoActual = costos[item.key];
              
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={item.key} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-slate-500" />
                      {item.label}
                    </Label>
                    {esPorHoras && (
                      <Badge variant="outline" className="text-xs">
                        <Info className="w-3 h-3 mr-1" />
                        {item.descripcion}
                      </Badge>
                    )}
                  </div>
                  
                  {esPorHoras ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">Horas</Label>
                        <Input
                          id={`${item.key}_horas`}
                          type="number"
                          min={0}
                          step={0.5}
                          value={item.horasActuales.toFixed(1)}
                          onChange={(e) => handleHorasChange(item.key as keyof typeof horas, parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          className="border-slate-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Costo calculado</Label>
                        <Input
                          type="text"
                          value={`$${costoActual.toFixed(2)}`}
                          disabled
                          className="border-slate-300 bg-slate-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <Input
                      id={item.key}
                      type="number"
                      min={0}
                      step={10}
                      value={costoActual}
                      onChange={(e) => onChangeCostos({ [item.key]: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="border-slate-300"
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Margen de utilidad */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Margen de Utilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {margenUtilidad}%
              </div>
              <p className="text-slate-600">Margen aplicado sobre costos directos</p>
            </div>

            <div className="space-y-4">
              <Slider
                value={[margenUtilidad]}
                onValueChange={([value]) => onChangeMargen(value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Materiales:</span>
                <span className="font-medium">${costoMateriales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Procesos:</span>
                <span className="font-medium">${costoProcesos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Costos adicionales:</span>
                <span className="font-medium">${totalAdicionales.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-slate-600">Costo directo:</span>
                <span className="font-semibold">${costoDirecto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Margen ({margenUtilidad}%):
                </span>
                <span className="font-medium text-green-600">
                  +${margenValor.toFixed(2)}
                </span>
              </div>
              <div className="border-t-2 border-green-600 pt-2 flex justify-between">
                <span className="font-bold text-slate-900">Subtotal:</span>
                <span className="font-bold text-green-600">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-sm text-slate-500">
              <p>Los costos adicionales se calculan automáticamente:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                <li>Diseño CAD: $360.97/hora</li>
                <li>Programación CNC: $286.78/hora (MO-E)</li>
                <li>Setup: MO-E + Hora Máquina CNC</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
