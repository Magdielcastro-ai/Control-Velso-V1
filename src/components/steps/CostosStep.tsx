import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Palette, Code, Wrench, Truck, MoreHorizontal, TrendingUp } from 'lucide-react';
import type { CostosAdicionales } from '@/types/cotizacion';

interface CostosStepProps {
  costos: CostosAdicionales;
  margenUtilidad: number;
  onChangeCostos: (costos: Partial<CostosAdicionales>) => void;
  onChangeMargen: (margen: number) => void;
}

export function CostosStep({ costos, margenUtilidad, onChangeCostos, onChangeMargen }: CostosStepProps) {
  const costosItems = [
    { key: 'disenoCAD' as keyof CostosAdicionales, label: 'Diseño CAD/CAM', icon: Palette },
    { key: 'programacionCNC' as keyof CostosAdicionales, label: 'Programación CNC', icon: Code },
    { key: 'setup' as keyof CostosAdicionales, label: 'Setup y Preparación', icon: Wrench },
    { key: 'transporte' as keyof CostosAdicionales, label: 'Transporte/Envío', icon: Truck },
    { key: 'otro' as keyof CostosAdicionales, label: 'Otros Costos', icon: MoreHorizontal },
  ];

  const totalAdicionales = Object.values(costos).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Costos Adicionales</h2>
        <p className="text-slate-600">Configura costos extras y margen de utilidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costos adicionales */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Costos Adicionales
              </span>
              <span className="text-sm font-normal text-slate-600">
                Total: <span className="font-semibold text-slate-900">${totalAdicionales.toFixed(2)}</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {costosItems.map((item) => (
              <div key={item.key} className="space-y-2">
                <Label htmlFor={item.key} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-slate-500" />
                  {item.label}
                </Label>
                <Input
                  id={item.key}
                  type="number"
                  min={0}
                  step={10}
                  value={costos[item.key]}
                  onChange={(e) => onChangeCostos({ [item.key]: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="border-slate-300"
                />
              </div>
            ))}
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
                <span className="text-slate-600">Costo directo:</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Margen ({margenUtilidad}%):</span>
                <span className="font-medium text-green-600">+$0.00</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold">$0.00</span>
              </div>
            </div>

            <div className="text-sm text-slate-500">
              <p>El margen de utilidad se aplica sobre la suma de:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Costo de materiales</li>
                <li>Costo de procesos</li>
                <li>Costos adicionales</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
