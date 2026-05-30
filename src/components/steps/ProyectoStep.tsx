import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { EspecificacionesProyecto } from '@/types/cotizacion';

interface ProyectoStepProps {
  proyecto: EspecificacionesProyecto;
  onChange: (datos: Partial<EspecificacionesProyecto>) => void;
}

export function ProyectoStep({ proyecto, onChange }: ProyectoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Nombre del Proyecto <span className="text-red-500">*</span>
        </label>
        <Input
          value={proyecto.nombre}
          onChange={(e) => onChange({ nombre: e.target.value })}
          placeholder="Ej: Soporte para maquinaria"
          className="h-12"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Descripción Detallada
        </label>
        <Textarea
          value={proyecto.descripcion}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          placeholder="Describe el trabajo que se va a realizar"
          className="min-h-[120px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Referencia de Dibujo
          </label>
          <Input
            value={proyecto.dibujo || ''}
            onChange={(e) => onChange({ dibujo: e.target.value })}
            placeholder="Número de plano o dibujo"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Notas Adicionales
        </label>
        <Textarea
          value={proyecto.notas || ''}
          onChange={(e) => onChange({ notas: e.target.value })}
          placeholder="Información adicional relevante para la cotización"
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}
