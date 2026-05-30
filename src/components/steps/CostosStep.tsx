import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import type { PiezaCotizacion, CostosAdicionales } from '@/types/cotizacion';

interface CostosStepProps {
  piezas: PiezaCotizacion[];
  costosGenerales: CostosAdicionales;
  margenUtilidad: number;
  onChangeCostosPieza: (piezaId: string, datos: Partial<CostosAdicionales>) => void;
  onChangeCostosGenerales: (datos: Partial<CostosAdicionales>) => void;
  onChangeMargen: (margen: number) => void;
}

export function CostosStep({
  piezas,
  costosGenerales,
  margenUtilidad,
  onChangeCostosPieza,
  onChangeCostosGenerales,
  onChangeMargen,
}: CostosStepProps) {
  const [piezaExpandida, setPiezaExpandida] = useState<string>(piezas[0]?.id || '');

  const costosLabels: { key: keyof CostosAdicionales; label: string }[] = [
    { key: 'disenoCAD', label: 'Diseño CAD' },
    { key: 'programacionCNC', label: 'Programación CNC' },
    { key: 'setup', label: 'Setup / Preparación' },
    { key: 'transporte', label: 'Transporte' },
    { key: 'otro', label: 'Otros' },
  ];

  return (
    <div className="space-y-6">
      {/* Margen de utilidad */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          Margen de Utilidad (%)
        </label>
        <Input
          type="number"
          min={0}
          max={100}
          value={margenUtilidad}
          onChange={(e) => onChangeMargen(parseFloat(e.target.value) || 0)}
          className="w-32 bg-white"
        />
        <p className="text-xs text-blue-600 mt-1">
          Actual: {margenUtilidad}%
        </p>
      </div>

      {/* Costos por pieza */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">Costos adicionales por pieza</h3>

        {piezas.map((pieza) => (
          <Card key={pieza.id} className="border-slate-200">
            <CardContent className="p-4">
              <button
                onClick={() => setPiezaExpandida(piezaExpandida === pieza.id ? '' : pieza.id)}
                className="w-full flex items-center justify-between mb-2"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-900">{pieza.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    ${Object.values(pieza.costosAdicionales).reduce((a: number, b: number) => a + b, 0).toFixed(2)}
                  </span>
                  {piezaExpandida === pieza.id ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {piezaExpandida === pieza.id && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {costosLabels.map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-slate-500">{label}</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={(pieza.costosAdicionales as any)[key] || 0}
                        onChange={(e) =>
                          onChangeCostosPieza(pieza.id, { [key]: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Costos generales del proyecto */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">Costos generales del proyecto</h3>
        <div className="grid grid-cols-2 gap-3">
          {costosLabels.map(({ key, label }) => (
            <div key={`gen-${key}`}>
              <label className="text-xs text-slate-500">{label}</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={costosGenerales[key] || 0}
                onChange={(e) =>
                  onChangeCostosGenerales({ [key]: parseFloat(e.target.value) || 0 })
                }
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
