import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Package, ArrowRight } from 'lucide-react';
import type { PiezaCotizacion } from '@/types/cotizacion';

interface PiezasStepProps {
  piezas: PiezaCotizacion[];
  tipo: 'pieza_unica' | 'proyecto';
  onAgregarPieza: (nombre: string, cantidad: number) => void;
  onEliminarPieza: (id: string) => void;
  onActualizarPieza: (id: string, datos: Partial<PiezaCotizacion>) => void;
  onCambiarTipo: (tipo: 'pieza_unica' | 'proyecto') => void;
}

export function PiezasStep({
  piezas,
  tipo,
  onAgregarPieza,
  onEliminarPieza,
  onActualizarPieza,
  onCambiarTipo,
}: PiezasStepProps) {
  const [nuevaPiezaNombre, setNuevaPiezaNombre] = useState('');
  const [nuevaPiezaCantidad, setNuevaPiezaCantidad] = useState(1);

  const handleAgregar = () => {
    if (!nuevaPiezaNombre.trim()) return;
    onAgregarPieza(nuevaPiezaNombre.trim(), nuevaPiezaCantidad);
    setNuevaPiezaNombre('');
    setNuevaPiezaCantidad(1);
  };

  return (
    <div className="space-y-6">
      {/* Selector de tipo */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => onCambiarTipo('pieza_unica')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tipo === 'pieza_unica'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pieza Única
        </button>
        <button
          onClick={() => onCambiarTipo('proyecto')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tipo === 'proyecto'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Proyecto (varias piezas)
        </button>
      </div>

      {/* Lista de piezas */}
      <div className="space-y-3">
        {piezas.map((pieza, index) => (
          <Card key={pieza.id} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      value={pieza.nombre}
                      onChange={(e) => onActualizarPieza(pieza.id, { nombre: e.target.value })}
                      className="h-8 text-sm font-medium"
                      placeholder={`Pieza ${index + 1}`}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Cant:</span>
                      <Input
                        type="number"
                        min={1}
                        value={pieza.cantidad}
                        onChange={(e) => onActualizarPieza(pieza.id, { cantidad: parseInt(e.target.value) || 1 })}
                        className="h-8 w-16 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {pieza.materiales.length} materiales · {pieza.procesos.length} procesos
                  </p>
                </div>
                {piezas.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEliminarPieza(pieza.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agregar nueva pieza (solo para proyectos) */}
      {tipo === 'proyecto' && (
        <div className="flex gap-2">
          <Input
            value={nuevaPiezaNombre}
            onChange={(e) => setNuevaPiezaNombre(e.target.value)}
            placeholder="Nombre de la nueva pieza..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
          />
          <Input
            type="number"
            min={1}
            value={nuevaPiezaCantidad}
            onChange={(e) => setNuevaPiezaCantidad(parseInt(e.target.value) || 1)}
            className="w-20"
          />
          <Button onClick={handleAgregar} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Resumen rápido */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>{piezas.length}</strong> {piezas.length === 1 ? 'pieza' : 'piezas'} en total
        </p>
      </div>
    </div>
  );
}
