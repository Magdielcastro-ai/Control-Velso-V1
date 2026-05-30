import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronUp, Package } from 'lucide-react';
import type { PiezaCotizacion, Material, CatalogoMaterial } from '@/types/cotizacion';

interface MaterialesStepProps {
  piezas: PiezaCotizacion[];
  catalogo: CatalogoMaterial[];
  onAgregarMaterial: (piezaId: string, material: Omit<Material, 'id' | 'costoTotal'>) => void;
  onEliminarMaterial: (piezaId: string, materialId: string) => void;
}

export function MaterialesStep({
  piezas,
  catalogo,
  onAgregarMaterial,
  onEliminarMaterial,
}: MaterialesStepProps) {
  const [piezaExpandida, setPiezaExpandida] = useState<string>(piezas[0]?.id || '');

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Agrega materiales a cada pieza del proyecto
      </p>

      {piezas.map((pieza) => (
        <Card key={pieza.id} className="border-slate-200">
          <CardContent className="p-4">
            {/* Header de pieza */}
            <button
              onClick={() => setPiezaExpandida(piezaExpandida === pieza.id ? '' : pieza.id)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">{pieza.nombre}</span>
                <span className="text-xs text-slate-500">(×{pieza.cantidad})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {pieza.materiales.length} materiales
                </span>
                {piezaExpandida === pieza.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Contenido expandido */}
            {piezaExpandida === pieza.id && (
              <div className="space-y-3">
                {/* Lista de materiales de esta pieza */}
                {pieza.materiales.length > 0 && (
                  <div className="space-y-2">
                    {pieza.materiales.map((mat: Material) => (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">{mat.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {mat.cantidad} {mat.unidadMedida} × ${mat.costoUnitario.toFixed(2)} = ${mat.costoTotal.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminarMaterial(pieza.id, mat.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar material a esta pieza */}
                <AgregarMaterialForm
                  piezaId={pieza.id}
                  catalogo={catalogo}
                  onAgregar={onAgregarMaterial}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AgregarMaterialForm({
  piezaId,
  catalogo,
  onAgregar,
}: {
  piezaId: string;
  catalogo: CatalogoMaterial[];
  onAgregar: (piezaId: string, material: Omit<Material, 'id' | 'costoTotal'>) => void;
}) {
  const [materialSeleccionado, setMaterialSeleccionado] = useState<CatalogoMaterial | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [margen, setMargen] = useState(0);

  const handleAgregar = () => {
    if (!materialSeleccionado) return;
    onAgregar(piezaId, {
      nombre: materialSeleccionado.nombre,
      tipo: materialSeleccionado.tipo,
      forma: materialSeleccionado.forma,
      cantidad,
      costoUnitario: materialSeleccionado.costoUnitario,
      unidadMedida: materialSeleccionado.unidadMedida,
      margenPorcentaje: margen,
    });
    setMaterialSeleccionado(null);
    setCantidad(1);
    setMargen(0);
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[200px]">
        <Select
          value={materialSeleccionado?.id || ''}
          onValueChange={(id) => {
            const mat = catalogo.find(c => c.id === id);
            setMaterialSeleccionado(mat || null);
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Seleccionar material..." />
          </SelectTrigger>
          <SelectContent>
            {catalogo.map((mat) => (
              <SelectItem key={mat.id} value={mat.id}>
                {mat.nombre} - ${mat.costoUnitario}/{mat.unidadMedida}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="number"
        min={0.1}
        step={0.1}
        value={cantidad}
        onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
        placeholder="Cantidad"
        className="w-24 h-9"
      />
      <Input
        type="number"
        min={0}
        max={100}
        value={margen}
        onChange={(e) => setMargen(parseFloat(e.target.value) || 0)}
        placeholder="Margen %"
        className="w-24 h-9"
      />
      <Button
        onClick={handleAgregar}
        disabled={!materialSeleccionado}
        className="h-9 bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
