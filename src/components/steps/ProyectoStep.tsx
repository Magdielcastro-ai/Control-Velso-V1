import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Hash, ImageIcon, AlignLeft } from 'lucide-react';
import type { EspecificacionesProyecto } from '@/types/cotizacion';

interface ProyectoStepProps {
  datos: EspecificacionesProyecto;
  onChange: (datos: Partial<EspecificacionesProyecto>) => void;
}

export function ProyectoStep({ datos, onChange }: ProyectoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Especificaciones del Proyecto</h2>
        <p className="text-slate-600">Describe el trabajo que se va a realizar</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            Detalles del Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreProyecto">
              Nombre del Proyecto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombreProyecto"
              value={datos.nombre}
              onChange={(e) => onChange({ nombre: e.target.value })}
              placeholder="Ej: Piezas de aluminio para ensamble"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">
              <AlignLeft className="w-4 h-4 inline mr-1" />
              Descripción Detallada
            </Label>
            <Textarea
              id="descripcion"
              value={datos.descripcion}
              onChange={(e) => onChange({ descripcion: e.target.value })}
              placeholder="Describe las características del trabajo: dimensiones, tolerancias, acabados, etc."
              className="border-slate-300 min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">
                <Hash className="w-4 h-4 inline mr-1" />
                Cantidad de Piezas
              </Label>
              <Input
                id="cantidad"
                type="number"
                min={1}
                value={datos.cantidad}
                onChange={(e) => onChange({ cantidad: parseInt(e.target.value) || 1 })}
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dibujo">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Referencia de Dibujo
              </Label>
              <Input
                id="dibujo"
                value={datos.dibujo || ''}
                onChange={(e) => onChange({ dibujo: e.target.value })}
                placeholder="Número de plano o dibujo"
                className="border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea
              id="notas"
              value={datos.notas || ''}
              onChange={(e) => onChange({ notas: e.target.value })}
              placeholder="Información adicional relevante para la cotización"
              className="border-slate-300 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
