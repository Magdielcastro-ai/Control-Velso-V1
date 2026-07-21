import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, Pencil, FlaskConical, ShieldCheck } from 'lucide-react';
import type { CostosAdicionalesProyecto } from '@/types/cotizacion';

interface CostosStepProps {
  costosAdicionales: CostosAdicionalesProyecto;
  onChangeCostosAdicionales: (datos: Partial<CostosAdicionalesProyecto>) => void;
}

const ITEMS_CONFIG = [
  { key: 'envio' as const, label: 'Envío / Entrega', icon: Truck },
  { key: 'diseno' as const, label: 'Diseño CAD / CAM', icon: Pencil },
  { key: 'estudioMaterial' as const, label: 'Estudio de Material', icon: FlaskConical },
  { key: 'pruebaDureza' as const, label: 'Prueba de Dureza', icon: ShieldCheck },
];

export function CostosStep({
  costosAdicionales,
  onChangeCostosAdicionales,
}: CostosStepProps) {
  // Normalizar costos adicionales para asegurar que tengan el formato correcto
  const normalizedCostos = {
    envio: Object.assign({ costo: 0, incluidoGratis: false }, costosAdicionales?.envio),
    diseno: Object.assign({ costo: 0, incluidoGratis: false }, costosAdicionales?.diseno),
    estudioMaterial: Object.assign({ costo: 0, incluidoGratis: false }, costosAdicionales?.estudioMaterial),
    pruebaDureza: Object.assign({ costo: 0, incluidoGratis: false }, costosAdicionales?.pruebaDureza),
  };

  const handleCostoChange = (key: keyof CostosAdicionalesProyecto, field: 'costo' | 'incluidoGratis', value: number | boolean) => {
    onChangeCostosAdicionales({
      [key]: { ...normalizedCostos[key], [field]: value },
    } as Partial<CostosAdicionalesProyecto>);
  };

  return (
    <div className="space-y-6">
      {/* Costos adicionales del proyecto */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">Valores Agregados del Proyecto</h3>
        
        {ITEMS_CONFIG.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-900">{label}</label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={normalizedCostos[key].costo}
                        onChange={(e) => handleCostoChange(key, 'costo', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        placeholder="Costo..."
                        disabled={normalizedCostos[key].incluidoGratis}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${key}-gratis`}
                        checked={normalizedCostos[key].incluidoGratis}
                        onCheckedChange={(checked) => handleCostoChange(key, 'incluidoGratis', checked === true)}
                      />
                      <label htmlFor={`${key}-gratis`} className="text-xs text-slate-600 cursor-pointer">
                        Incluido gratis
                      </label>
                    </div>
                  </div>
                  {normalizedCostos[key].incluidoGratis && normalizedCostos[key].costo > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Valor mostrado al cliente: ${normalizedCostos[key].costo.toFixed(2)} (sin costo real)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
