import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronUp, Package, RefreshCw } from 'lucide-react';
import type { PiezaCotizacion, Material, CatalogoMaterial } from '@/types/cotizacion';

interface MaterialesStepProps {
  piezas: PiezaCotizacion[];
  catalogo: CatalogoMaterial[];
  onAgregarMaterial: (piezaId: string, material: Omit<Material, 'id'>) => void;
  onEliminarMaterial: (piezaId: string) => void;
  onRecargarCatalogo?: () => void;
}

export function MaterialesStep({
  piezas,
  catalogo,
  onAgregarMaterial,
  onEliminarMaterial,
  onRecargarCatalogo,
}: MaterialesStepProps) {
  const [piezaExpandida, setPiezaExpandida] = useState<string>(piezas[0]?.id || '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Agrega materiales a cada pieza del proyecto
        </p>
        {catalogo.length === 0 && onRecargarCatalogo && (
          <Button variant="outline" size="sm" onClick={onRecargarCatalogo}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Recargar catálogo
          </Button>
        )}
      </div>

      {piezas.map((pieza) => (
        <Card key={pieza.id} className="border-slate-200">
          <CardContent className="p-4">
            {/* Header de pieza - clickable para expandir */}
            <div
              onClick={() => setPiezaExpandida(piezaExpandida === pieza.id ? '' : pieza.id)}
              className="w-full flex items-center justify-between mb-3 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">{pieza.nombre}</span>
                <span className="text-xs text-slate-500">(×{pieza.cantidad})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {pieza.material ? '1 material' : 'Sin material'}
                </span>
                {piezaExpandida === pieza.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Contenido expandido */}
            {piezaExpandida === pieza.id && (
              <div className="space-y-3">
                {/* Lista de materiales de esta pieza */}
                {pieza.material && (
                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{pieza.material.nombre}</p>
                        <p className="text-xs text-slate-500">
                          Costo total: ${pieza.material.costoTotal.toFixed(2)}
                          {' '}
                          ({(pieza.material.costoTotal / pieza.cantidad).toFixed(2)} por pieza)
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEliminarMaterial(pieza.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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
  onAgregar: (piezaId: string, material: Omit<Material, 'id'>) => void;
}) {
  const [materialSeleccionado, setMaterialSeleccionado] = useState<CatalogoMaterial | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [margen, setMargen] = useState(0);
  const [usarInputLibre, setUsarInputLibre] = useState(false);
  const [nombreLibre, setNombreLibre] = useState('');
  const [costoLibre, setCostoLibre] = useState(0);

  const handleAgregar = () => {
    if (usarInputLibre) {
      if (!nombreLibre.trim() || costoLibre <= 0) return;
      onAgregar(piezaId, {
        nombre: nombreLibre.trim(),
        tipo: 'otro',
        forma: 'otro' as any,
        cantidad,
        costoUnitario: costoLibre / cantidad,
        unidadMedida: 'mm',
        unidad: 'kg',
        margenPorcentaje: margen,
        costoTotal: costoLibre,
      });
      setNombreLibre('');
      setCostoLibre(0);
    } else {
      if (!materialSeleccionado) return;
      const costoTotalCalculado = cantidad * materialSeleccionado.costoUnitario;
      onAgregar(piezaId, {
        nombre: materialSeleccionado.nombre,
        tipo: materialSeleccionado.tipo,
        forma: materialSeleccionado.forma,
        cantidad,
        costoUnitario: materialSeleccionado.costoUnitario,
        unidadMedida: materialSeleccionado.unidadMedida,
        unidad: materialSeleccionado.unidadCosto,
        margenPorcentaje: margen,
        costoTotal: costoTotalCalculado,
      });
      setMaterialSeleccionado(null);
    }
    setCantidad(1);
    setMargen(0);
  };

  if (catalogo.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-500 p-3 bg-amber-50 rounded border border-amber-200">
          ⚠️ No hay materiales en el catálogo. Puedes agregar uno manualmente:
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input
            value={nombreLibre}
            onChange={(e) => setNombreLibre(e.target.value)}
            placeholder="Nombre del material"
            className="flex-1 min-w-[150px]"
          />
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={costoLibre}
            onChange={(e) => setCostoLibre(parseFloat(e.target.value) || 0)}
            placeholder="Costo total"
            className="w-28"
          />
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={cantidad}
            onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
            placeholder="Cantidad"
            className="w-20"
          />
          <Button
            onClick={handleAgregar}
            disabled={!nombreLibre.trim() || costoLibre <= 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setUsarInputLibre(false)}
          className={`text-xs px-2 py-1 rounded ${!usarInputLibre ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}
        >
          Del catálogo
        </button>
        <button
          onClick={() => setUsarInputLibre(true)}
          className={`text-xs px-2 py-1 rounded ${usarInputLibre ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}
        >
          Manual
        </button>
      </div>

      {usarInputLibre ? (
        <div className="flex flex-wrap gap-2 items-end">
          <Input
            value={nombreLibre}
            onChange={(e) => setNombreLibre(e.target.value)}
            placeholder="Nombre del material"
            className="flex-1 min-w-[150px]"
          />
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={costoLibre}
            onChange={(e) => setCostoLibre(parseFloat(e.target.value) || 0)}
            placeholder="Costo total"
            className="w-28"
          />
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={cantidad}
            onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
            placeholder="Cantidad"
            className="w-20"
          />
          <Button
            onClick={handleAgregar}
            disabled={!nombreLibre.trim() || costoLibre <= 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <Select
              value={materialSeleccionado?.id || ''}
              onValueChange={(id) => {
                const mat = catalogo.find(c => c.id === id);
                setMaterialSeleccionado(mat || null);
              }}
            >
              <SelectTrigger className="h-9 cursor-pointer">
                <SelectValue placeholder="Seleccionar material..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {catalogo.map((mat) => (
                  <SelectItem key={mat.id} value={mat.id} className="cursor-pointer">
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
      )}
    </div>
  );
}
