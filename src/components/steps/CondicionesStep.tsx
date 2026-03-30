import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CreditCard, Percent, Shield, FileText } from 'lucide-react';
import type { CondicionesComerciales } from '@/types/cotizacion';

interface CondicionesStepProps {
  datos: CondicionesComerciales;
  onChange: (datos: Partial<CondicionesComerciales>) => void;
}

export function CondicionesStep({ datos, onChange }: CondicionesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Condiciones Comerciales</h2>
        <p className="text-slate-600">Define los términos y condiciones de la cotización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              Vigencia y Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="validez" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Validez de la Cotización (días)
              </Label>
              <Input
                id="validez"
                type="number"
                min={1}
                value={datos.validezDias}
                onChange={(e) => onChange({ validezDias: parseInt(e.target.value) || 1 })}
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entrega" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Tiempo de Entrega (días hábiles)
              </Label>
              <Input
                id="entrega"
                type="number"
                min={1}
                value={datos.tiempoEntregaDias}
                onChange={(e) => onChange({ tiempoEntregaDias: parseInt(e.target.value) || 1 })}
                className="border-slate-300"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Forma de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formaPago" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                Condiciones de Pago
              </Label>
              <Input
                id="formaPago"
                value={datos.formaPago}
                onChange={(e) => onChange({ formaPago: e.target.value })}
                placeholder="Ej: 50% anticipo, 50% contra entrega"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anticipo" className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-slate-500" />
                Porcentaje de Anticipo
              </Label>
              <Input
                id="anticipo"
                type="number"
                min={0}
                max={100}
                value={datos.anticipoPorcentaje}
                onChange={(e) => onChange({ anticipoPorcentaje: parseInt(e.target.value) || 0 })}
                className="border-slate-300"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              Garantía y Notas Legales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="garantia" className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                Garantía
              </Label>
              <Input
                id="garantia"
                value={datos.garantia}
                onChange={(e) => onChange({ garantia: e.target.value })}
                placeholder="Ej: 30 días contra defectos de fabricación"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notasLegales" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Notas Legales Adicionales
              </Label>
              <Textarea
                id="notasLegales"
                value={datos.notasLegales || ''}
                onChange={(e) => onChange({ notasLegales: e.target.value })}
                placeholder="Cualquier otra condición legal o comercial relevante..."
                className="border-slate-300 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
