import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Package, Settings, ExternalLink, ChevronDown, ChevronUp, Pencil, RefreshCw, Check, RotateCcw, Circle, Square, LayoutGrid, Hexagon, Octagon, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { PiezaCotizacion, Material, CatalogoMaterial, Proceso } from '@/types/cotizacion';
import { CATALOGO_PROCESOS_VELSO } from '@/types/cotizacion';

interface PiezasStepProps {
  piezas: PiezaCotizacion[];
  catalogoMateriales: CatalogoMaterial[];
  onAgregarPieza: (nombre: string, cantidad?: number) => void;
  onEliminarPieza: (piezaId: string) => void;
  onActualizarPieza: (piezaId: string, datos: Partial<PiezaCotizacion>) => void;
  onAsignarMaterial: (piezaId: string, material: Omit<Material, 'id'>) => void;
  onEliminarMaterial: (piezaId: string) => void;
  onAgregarMaterialACatalogo?: (material: Omit<CatalogoMaterial, 'id'>) => Promise<CatalogoMaterial | null>;
  onRecargarCatalogo?: () => void;
}

const FORMAS = [
  { id: 'redondo', label: 'Redondo', icon: Circle },
  { id: 'cuadrado', label: 'Cuadrado', icon: Square },
  { id: 'barra_hueca', label: 'Barra Hueca', icon: Hexagon },
  { id: 'barra_cromada', label: 'Barra Cromada', icon: Circle },
  { id: 'placa', label: 'Placa', icon: LayoutGrid },
  { id: 'angulo', label: 'Ángulo', icon: Octagon },
  { id: 'otro', label: 'Otro', icon: HelpCircle },
] as const;

type FormaId = typeof FORMAS[number]['id'];

const DIMENSIONES_CONFIG: Record<FormaId, { key: string; label: string; placeholder: string; type?: string }[]> = {
  redondo: [
    { key: 'diametro', label: 'Diámetro', placeholder: 'mm' },
    { key: 'longitud', label: 'Longitud', placeholder: 'mm' },
  ],
  cuadrado: [
    { key: 'lado', label: 'Lado', placeholder: 'mm' },
    { key: 'longitud', label: 'Longitud', placeholder: 'mm' },
  ],
  barra_hueca: [
    { key: 'diametro_exterior', label: 'Diámetro Exterior', placeholder: 'mm' },
    { key: 'diametro_interior', label: 'Diámetro Interior', placeholder: 'mm' },
    { key: 'longitud', label: 'Longitud', placeholder: 'mm' },
  ],
  barra_cromada: [
    { key: 'diametro', label: 'Diámetro', placeholder: 'mm' },
    { key: 'longitud', label: 'Longitud', placeholder: 'mm' },
  ],
  placa: [
    { key: 'largo', label: 'Largo', placeholder: 'mm' },
    { key: 'ancho', label: 'Ancho', placeholder: 'mm' },
    { key: 'espesor', label: 'Espesor', placeholder: 'mm' },
  ],
  angulo: [
    { key: 'lado_a', label: 'Lado A', placeholder: 'mm' },
    { key: 'lado_b', label: 'Lado B', placeholder: 'mm' },
    { key: 'espesor', label: 'Espesor', placeholder: 'mm' },
    { key: 'longitud', label: 'Longitud', placeholder: 'mm' },
  ],
  otro: [
    { key: 'descripcion', label: 'Descripción', placeholder: 'Describe el material...', type: 'text' },
    { key: 'dimensiones_libre', label: 'Dimensiones', placeholder: 'Ej: 50x30x10 mm', type: 'text' },
  ],
};

export function PiezasStep({
  piezas,
  catalogoMateriales,
  onAgregarPieza,
  onEliminarPieza,
  onActualizarPieza,
  onAsignarMaterial,
  onEliminarMaterial,
  onAgregarMaterialACatalogo,
  onRecargarCatalogo,
}: PiezasStepProps) {
  const [nuevaPiezaNombre, setNuevaPiezaNombre] = useState('');
  const [nuevaPiezaCantidad, setNuevaPiezaCantidad] = useState(1);
  const [piezaExpandida, setPiezaExpandida] = useState<string>(piezas[0]?.id || '');

  const handleAgregarPieza = () => {
    if (!nuevaPiezaNombre.trim()) {
      toast.error('Ingresa un nombre para la pieza');
      return;
    }
    onAgregarPieza(nuevaPiezaNombre.trim(), nuevaPiezaCantidad);
    setNuevaPiezaNombre('');
    setNuevaPiezaCantidad(1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {piezas.map((pieza) => (
          <PiezaCard
            key={pieza.id}
            pieza={pieza}
            expandida={piezaExpandida === pieza.id}
            catalogoMateriales={catalogoMateriales}
            onToggle={() => setPiezaExpandida(piezaExpandida === pieza.id ? '' : pieza.id)}
            onEliminar={() => {
              if (piezas.length > 1) onEliminarPieza(pieza.id);
              else toast.error('Debe haber al menos una pieza');
            }}
            onActualizar={onActualizarPieza}
            onAsignarMaterial={onAsignarMaterial}
            onEliminarMaterial={onEliminarMaterial}
            onAgregarMaterialACatalogo={onAgregarMaterialACatalogo}
            onRecargarCatalogo={onRecargarCatalogo}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={nuevaPiezaNombre}
          onChange={(e) => setNuevaPiezaNombre(e.target.value)}
          placeholder="Nombre de la nueva pieza..."
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleAgregarPieza()}
        />
        <Input
          type="number"
          min={1}
          value={nuevaPiezaCantidad}
          onChange={(e) => setNuevaPiezaCantidad(parseInt(e.target.value) || 1)}
          className="w-20"
        />
        <Button onClick={handleAgregarPieza} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>{piezas.length}</strong> {piezas.length === 1 ? 'pieza' : 'piezas'} en total
        </p>
      </div>
    </div>
  );
}

function PiezaCard({
  pieza,
  expandida,
  catalogoMateriales,
  onToggle,
  onEliminar,
  onActualizar,
  onAsignarMaterial,
  onEliminarMaterial,
  onAgregarMaterialACatalogo,
  onRecargarCatalogo,
}: {
  pieza: PiezaCotizacion;
  expandida: boolean;
  catalogoMateriales: CatalogoMaterial[];
  onToggle: () => void;
  onEliminar: () => void;
  onActualizar: (id: string, datos: Partial<PiezaCotizacion>) => void;
  onAsignarMaterial: (piezaId: string, material: Omit<Material, 'id'>) => void;
  onEliminarMaterial: (piezaId: string) => void;
  onAgregarMaterialACatalogo?: (material: Omit<CatalogoMaterial, 'id'>) => Promise<CatalogoMaterial | null>;
  onRecargarCatalogo?: () => void;
}) {
  const [editandoMaterial, setEditandoMaterial] = useState(false);

  const [formaSeleccionada, setFormaSeleccionada] = useState<FormaId>('redondo');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [dimensiones, setDimensiones] = useState<Record<string, string>>({});
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [precioBase, setPrecioBase] = useState(0);
  const [margen, setMargen] = useState(0);
  const [unidadMedida, setUnidadMedida] = useState<'mm' | 'in'>('mm');
  const [nombreMaterial, setNombreMaterial] = useState('');
  const [guardarEnCatalogo, setGuardarEnCatalogo] = useState(false);
  const [unidadCosto, setUnidadCosto] = useState<'kg' | 'pieza' | 'metro'>('kg');

  const tieneMaterial = !!pieza.material;

  const tiposDisponibles = catalogoMateriales
    .filter(m => m.forma === formaSeleccionada)
    .map(m => m.tipo)
    .filter((v, i, a) => a.indexOf(v) === i);

  const handleFormaChange = (forma: FormaId) => {
    setFormaSeleccionada(forma);
    setTipoSeleccionado('');
    setNombreMaterial('');
    setDimensiones({});
    setPrecioUnitario('');
    setPrecioBase(0);
    setGuardarEnCatalogo(false);
  };

  const handleTipoChange = (tipo: string) => {
    setTipoSeleccionado(tipo);
    const materialCat = catalogoMateriales.find(
      m => m.forma === formaSeleccionada && m.tipo === tipo
    );
    if (materialCat) {
      setNombreMaterial(materialCat.nombre);
      setPrecioBase(materialCat.costoUnitario);
      setPrecioUnitario(materialCat.costoUnitario.toString());
      setUnidadMedida(materialCat.unidadMedida || 'mm');
      setUnidadCosto(materialCat.unidadCosto || 'kg');
      const dims: Record<string, string> = {};
      if (materialCat.diametro) dims.diametro = materialCat.diametro.toString();
      if (materialCat.lado) dims.lado = materialCat.lado.toString();
      if (materialCat.largo) dims.largo = materialCat.largo.toString();
      if (materialCat.ancho) dims.ancho = materialCat.ancho.toString();
      if (materialCat.espesor) dims.espesor = materialCat.espesor.toString();
      setDimensiones(dims);
      setGuardarEnCatalogo(false);
    } else {
      setNombreMaterial(tipo);
      setGuardarEnCatalogo(true);
    }
  };

  const handleGuardarMaterial = () => {
    if (!tipoSeleccionado) {
      toast.error('Selecciona un tipo de material');
      return;
    }
    if (!precioUnitario || parseFloat(precioUnitario) <= 0) {
      toast.error('Ingresa un precio unitario válido');
      return;
    }

    const config = DIMENSIONES_CONFIG[formaSeleccionada];
    const dimsNumericas: Record<string, number | string> = {};
    for (const dim of config) {
      if (dim.type === 'text') {
        dimsNumericas[dim.key] = dimensiones[dim.key] || '';
      } else {
        const val = parseFloat(dimensiones[dim.key] || '');
        if (isNaN(val) || val <= 0) {
          toast.error(`Ingresa ${dim.label} válido`);
          return;
        }
        dimsNumericas[dim.key] = val;
      }
    }

    const materialCat = catalogoMateriales.find(
      m => m.forma === formaSeleccionada && m.tipo === tipoSeleccionado
    );

    const costoTotalMaterial = parseFloat(precioUnitario);
    const nombreFinal = nombreMaterial.trim() || tipoSeleccionado;

    onAsignarMaterial(pieza.id, {
      nombre: nombreFinal,
      tipo: tipoSeleccionado,
      forma: formaSeleccionada,
      cantidad: pieza.cantidad,
      costoUnitario: costoTotalMaterial / pieza.cantidad,
      unidadMedida: unidadMedida,
      unidad: unidadCosto,
      margenPorcentaje: margen,
      costoTotal: costoTotalMaterial,
      ...dimsNumericas,
    } as Omit<Material, 'id'>);

    // Guardar en catálogo si es material nuevo y el usuario lo solicitó
    if (guardarEnCatalogo && onAgregarMaterialACatalogo && !materialCat) {
      onAgregarMaterialACatalogo({
        nombre: nombreFinal,
        tipo: tipoSeleccionado,
        forma: formaSeleccionada,
        unidadMedida: unidadMedida,
        costoUnitario: costoTotalMaterial / pieza.cantidad,
        unidadCosto: unidadCosto,
        ...dimsNumericas,
      } as Omit<CatalogoMaterial, 'id'>).then(() => {
        toast.success('Material guardado en catálogo');
      }).catch(() => {
        toast.error('No se pudo guardar en catálogo');
      });
    }

    setEditandoMaterial(false);
    resetForm();
  };

  const handleEliminarMaterial = () => {
    onEliminarMaterial(pieza.id);
    setEditandoMaterial(false);
  };

  const resetForm = () => {
    setFormaSeleccionada('redondo');
    setTipoSeleccionado('');
    setNombreMaterial('');
    setDimensiones({});
    setPrecioUnitario('');
    setPrecioBase(0);
    setMargen(0);
    setGuardarEnCatalogo(false);
  };

  const iniciarEdicion = () => {
    if (pieza.material) {
      setFormaSeleccionada(pieza.material.forma as FormaId);
      setTipoSeleccionado(pieza.material.tipo);
      setNombreMaterial(pieza.material.nombre);
      setPrecioUnitario(pieza.material.costoUnitario.toString());
      setPrecioBase(pieza.material.costoUnitario);
      setMargen(pieza.material.margenPorcentaje);
      setUnidadMedida(pieza.material.unidadMedida);
      setUnidadCosto(pieza.material.unidad as 'kg' | 'pieza' | 'metro');
      const dims: Record<string, string> = {};
      const config = DIMENSIONES_CONFIG[pieza.material.forma as FormaId] || [];
      for (const dim of config) {
        const val = (pieza.material as any)[dim.key];
        if (val !== undefined && val !== null) {
          dims[dim.key] = val.toString();
        }
      }
      setDimensiones(dims);
      setGuardarEnCatalogo(false);
    }
    setEditandoMaterial(true);
  };

  const formatearDimensiones = (material: Material) => {
    const forma = material.forma as FormaId;
    const config = DIMENSIONES_CONFIG[forma];
    if (!config) return '';

    const partes = config
      .filter(d => d.type !== 'text')
      .map(d => {
        const val = (material as any)[d.key];
        return val ? `${d.label}: ${val}${material.unidadMedida}` : null;
      })
      .filter(Boolean);

    if (forma === 'otro') {
      return (material as any).descripcion || (material as any).dimensiones_libre || '';
    }
    return partes.join(' × ');
  };

  const dimensionesConfig = DIMENSIONES_CONFIG[formaSeleccionada] || [];

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Input
                  value={pieza.nombre}
                  onChange={(e) => onActualizar(pieza.id, { nombre: e.target.value })}
                  className="h-8 text-sm font-medium flex-1"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Cant:</span>
                  <Input
                    type="number"
                    min={1}
                    value={pieza.cantidad}
                    onChange={(e) => onActualizar(pieza.id, { cantidad: parseInt(e.target.value) || 1 })}
                    className="h-8 w-16 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">
                  {tieneMaterial ? '1 material' : 'Sin material'} · {pieza.procesos.length} procesos
                </span>
                {pieza.subtotalPieza > 0 && (
                  <span className="text-xs font-medium text-blue-600">
                    ${(pieza.subtotalPieza / pieza.cantidad).toFixed(2)}/pieza · ${pieza.subtotalPieza.toFixed(2)} total
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {expandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEliminar}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {expandida && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-900 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Material
                </h4>
                {onRecargarCatalogo && (
                  <div className="flex items-center gap-2">
                    {catalogoMateriales.length === 0 && (
                      <span className="text-xs text-amber-600">Catálogo vacío</span>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onRecargarCatalogo}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Recargar
                    </Button>
                  </div>
                )}
              </div>

              {tieneMaterial && !editandoMaterial ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{pieza.material!.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {FORMAS.find(f => f.id === pieza.material!.forma)?.label} · {pieza.material!.tipo}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatearDimensiones(pieza.material!)}
                      </p>
                      <p className="text-sm font-semibold text-blue-700 mt-1">
                        Costo total: ${pieza.material!.costoTotal.toFixed(2)}
                        <span className="text-xs text-slate-500 ml-1">
                          (${(pieza.material!.costoTotal / pieza.cantidad).toFixed(2)} por pieza)
                        </span>
                        {pieza.material!.margenPorcentaje > 0 && (
                          <span className="text-xs text-green-600 ml-1">(+{pieza.material!.margenPorcentaje}% margen)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={iniciarEdicion}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={handleEliminarMaterial}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : editandoMaterial ? (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Forma del Material</label>
                    <div className="flex flex-wrap gap-2">
                      {FORMAS.map((forma) => {
                        const Icon = forma.icon;
                        return (
                          <button
                            key={forma.id}
                            type="button"
                            onClick={() => handleFormaChange(forma.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              formaSeleccionada === forma.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {forma.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                      Tipo de Material ({FORMAS.find(f => f.id === formaSeleccionada)?.label})
                    </label>
                    {/* Input de tipo siempre visible */}
                    <Input
                      value={tipoSeleccionado}
                      onChange={(e) => handleTipoChange(e.target.value)}
                      placeholder="Escribe o selecciona el tipo (ej: Acero H13)"
                      className="h-8 text-xs mb-2"
                    />
                    {/* Select solo como ayuda cuando hay tipos en catálogo */}
                    {tiposDisponibles.length > 0 && (
                      <Select value={tipoSeleccionado} onValueChange={handleTipoChange}>
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue placeholder="Seleccionar del catálogo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposDisponibles.map((tipo) => (
                            <SelectItem key={tipo} value={tipo} className="text-xs">
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {tiposDisponibles.length === 0 && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        No hay materiales registrados para esta forma. Escribe el tipo arriba.
                      </div>
                    )}
                  </div>

                  {/* Nombre del material (editable) */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                      Nombre del Material
                    </label>
                    <Input
                      value={nombreMaterial}
                      onChange={(e) => setNombreMaterial(e.target.value)}
                      placeholder="Ej: Acero H13 Redondo 3in"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Guardar en catálogo */}
                  {guardarEnCatalogo && onAgregarMaterialACatalogo && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`guardar-catalogo-${pieza.id}`}
                        checked={guardarEnCatalogo}
                        onChange={(e) => setGuardarEnCatalogo(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`guardar-catalogo-${pieza.id}`} className="text-xs text-blue-600">
                        Guardar este material en el catálogo para futuras cotizaciones
                      </label>
                    </div>
                  )}

                  {tipoSeleccionado && dimensionesConfig.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Dimensiones</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {dimensionesConfig.map(dim => (
                          <div key={dim.key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {dim.label} ({dim.placeholder})
                            </label>
                            <Input
                              type={dim.type || 'number'}
                              step={dim.type === 'text' ? undefined : '0.1'}
                              value={dimensiones[dim.key] || ''}
                              onChange={(e) => setDimensiones(prev => ({ ...prev, [dim.key]: e.target.value }))}
                              placeholder={dim.placeholder}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tipoSeleccionado && (
                    <div className="space-y-3">
                      {/* Selector mm / in */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">Unidad de medida:</span>
                        <button
                          onClick={() => setUnidadMedida('mm')}
                          className={`text-xs px-2 py-1 rounded ${unidadMedida === 'mm' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500'}`}
                        >
                          mm
                        </button>
                        <button
                          onClick={() => setUnidadMedida('in')}
                          className={`text-xs px-2 py-1 rounded ${unidadMedida === 'in' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500'}`}
                        >
                          in (pulgadas)
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo Total del Material
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={precioUnitario}
                              onChange={(e) => setPrecioUnitario(e.target.value)}
                              className={`w-full border rounded-lg pl-8 pr-10 py-2 ${
                                parseFloat(precioUnitario) !== precioBase ? 'border-amber-400 bg-amber-50' : ''
                              }`}
                            />
                            {parseFloat(precioUnitario) !== precioBase && precioBase > 0 && (
                              <button
                                type="button"
                                onClick={() => { setPrecioUnitario(precioBase.toString()); }}
                                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                title="Restaurar precio del catálogo"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Precio catálogo: ${precioBase.toFixed(2)}
                            {parseFloat(precioUnitario) !== precioBase && (
                              <span className="text-amber-600 ml-1">(modificado para esta pieza)</span>
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Margen %
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={margen}
                            onChange={(e) => setMargen(parseFloat(e.target.value) || 0)}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-blue-600 font-medium">Costo Total Material</p>
                          <p className="text-xl font-bold text-blue-800">
                            ${(parseFloat(precioUnitario) || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            ${((parseFloat(precioUnitario) || 0) / pieza.cantidad).toFixed(2)} por pieza
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleGuardarMaterial}
                      disabled={!tipoSeleccionado || !precioUnitario}
                      className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {tieneMaterial ? 'Actualizar Material' : 'Asignar Material'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditandoMaterial(false); resetForm(); }}
                      className="h-8 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { resetForm(); setEditandoMaterial(true); }}
                  className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Material a esta Pieza
                </button>
              )}
            </div>

            <ProcesosPieza
              pieza={pieza}
              onActualizar={onActualizar}
            />

            <ProcesosExternosPieza
              pieza={pieza}
              onActualizar={onActualizar}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProcesosPieza({
  pieza,
  onActualizar,
}: {
  pieza: PiezaCotizacion;
  onActualizar: (id: string, datos: Partial<PiezaCotizacion>) => void;
}) {
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<CatalogoProceso | null>(null);
  const [tiempoProceso, setTiempoProceso] = useState(0);
  const [unidadTiempo, setUnidadTiempo] = useState<'minutos' | 'horas'>('minutos');
  const [tipoMO, setTipoMO] = useState<'mo_s' | 'mo_e'>('mo_s');
  const [editandoProceso, setEditandoProceso] = useState<string | null>(null);

  const agregarProceso = () => {
    if (!procesoSeleccionado || tiempoProceso <= 0) return;
    const catalogoItem = CATALOGO_PROCESOS_VELSO.find(p => p.id === procesoSeleccionado.id);
    if (!catalogoItem) return;

    const tiempoMinutosPorPieza = unidadTiempo === 'horas' ? tiempoProceso * 60 : tiempoProceso;
    const tiempoMinutos = tiempoMinutosPorPieza * pieza.cantidad;
    const tiempoHoras = tiempoMinutos / 60;
    let costoMO = 0;
    if (catalogoItem.categoria === 'maquina') {
      costoMO = tiempoHoras * (tipoMO === 'mo_s' ? 191.19 : 286.78);
    } else if (catalogoItem.requiereManoObra === 'mo_s') {
      costoMO = tiempoHoras * 191.19;
    } else if (catalogoItem.requiereManoObra === 'mo_e') {
      costoMO = tiempoHoras * 286.78;
    }

    const nuevoProceso: Proceso = {
      id: crypto.randomUUID(),
      nombre: catalogoItem.nombre,
      tipo: catalogoItem.id,
      tiempoMinutosPorPieza,
      tiempoMinutos,
      costoPorHora: catalogoItem.costoPorHora,
      costoManoObraPorHora: tipoMO === 'mo_e' ? 286.78 : 191.19,
      costoManoObra: costoMO,
      costoTotal: tiempoHoras * catalogoItem.costoPorHora + costoMO,
      descripcion: `${tiempoProceso} ${unidadTiempo} por pieza × ${pieza.cantidad} pzas = ${tiempoMinutos} min total`,
      incluyeManoObra: costoMO > 0,
      tipoManoObraSeleccionada: costoMO > 0 ? tipoMO : undefined,
    };

    onActualizar(pieza.id, { procesos: [...pieza.procesos, nuevoProceso] });
    setProcesoSeleccionado(null);
    setTiempoProceso(0);
  };

  const eliminarProceso = (procesoId: string) => {
    onActualizar(pieza.id, {
      procesos: pieza.procesos.filter((p: Proceso) => p.id !== procesoId),
    });
  };

  const actualizarProceso = (procesoId: string, campo: string, valor: any) => {
    const procs = pieza.procesos.map((p: Proceso) => {
      if (p.id !== procesoId) return p;
      return { ...p, [campo]: valor };
    });
    onActualizar(pieza.id, { procesos: procs });
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1">
        <Settings className="w-3 h-3" /> Procesos de Manufactura
      </h4>
      {pieza.procesos.filter((p: Proceso) => p.tipo !== 'otro').length > 0 && (
        <div className="space-y-1 mb-2">
          {pieza.procesos.filter((p: Proceso) => p.tipo !== 'otro').map((proc: Proceso) => (
            <div key={proc.id} className="p-2 bg-slate-50 rounded-lg">
              {editandoProceso === proc.id ? (
                <div className="flex gap-2 items-center">
                  <span className="text-sm flex-1">{proc.nombre}</span>
                  <Input
                    type="number"
                    value={proc.tiempoMinutos}
                    onChange={(e) => actualizarProceso(proc.id, 'tiempoMinutos', parseFloat(e.target.value) || 0)}
                    className="w-20 h-7 text-xs"
                  />
                  <span className="text-xs">min</span>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditandoProceso(null)}>
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-sm">{proc.nombre} ({proc.descripcion || proc.tiempoMinutos + ' min'})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-sm">${proc.costoTotal.toFixed(2)}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setEditandoProceso(proc.id)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-500" onClick={() => eliminarProceso(proc.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <div className="flex gap-2 items-end">
          <div className="flex-1 min-w-[150px]">
            <Select
              value={procesoSeleccionado?.id || ''}
              onValueChange={(id) => {
                const proc = CATALOGO_PROCESOS_VELSO.find(p => p.id === id);
                setProcesoSeleccionado(proc || null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Seleccionar proceso..." />
              </SelectTrigger>
              <SelectContent>
                {CATALOGO_PROCESOS_VELSO.map((proc) => (
                  <SelectItem key={proc.id} value={proc.id} className="text-xs">
                    {proc.nombre} - ${proc.costoPorHora}/hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {procesoSeleccionado && (
          <div className="space-y-2">
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-slate-500">Tiempo por pieza</label>
                <Input
                  type="number"
                  min={1}
                  value={tiempoProceso}
                  onChange={(e) => setTiempoProceso(parseFloat(e.target.value) || 0)}
                  className="w-24 h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Unidad</label>
                <Select value={unidadTiempo} onValueChange={(v) => setUnidadTiempo(v as 'minutos' | 'horas')}>
                  <SelectTrigger className="h-8 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutos" className="text-xs">Minutos</SelectItem>
                    <SelectItem value="horas" className="text-xs">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {procesoSeleccionado?.categoria === 'maquina' && (
                <Select value={tipoMO} onValueChange={(v) => setTipoMO(v as 'mo_s' | 'mo_e')}>
                  <SelectTrigger className="h-8 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mo_s" className="text-xs">MO-S</SelectItem>
                    <SelectItem value="mo_e" className="text-xs">MO-E</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="pb-1">
                <Button onClick={agregarProceso} disabled={tiempoProceso <= 0} className="h-8 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {tiempoProceso > 0 && (
              <p className="text-xs text-slate-500">
                Tiempo total: {(unidadTiempo === 'horas' ? tiempoProceso * 60 : tiempoProceso) * pieza.cantidad} min
                {' '}({tiempoProceso} {unidadTiempo} × {pieza.cantidad} piezas)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProcesosExternosPieza({
  pieza,
  onActualizar,
}: {
  pieza: PiezaCotizacion;
  onActualizar: (id: string, datos: Partial<PiezaCotizacion>) => void;
}) {
  const [nombreExterno, setNombreExterno] = useState('');
  const [costoExterno, setCostoExterno] = useState(0);
  const [margenExterno, setMargenExterno] = useState(30);

  const agregarProcesoExterno = () => {
    if (!nombreExterno.trim() || costoExterno <= 0) return;
    const costoConMargen = costoExterno * (1 + margenExterno / 100);
    const nuevo: Proceso = {
      id: crypto.randomUUID(),
      nombre: nombreExterno.trim(),
      tipo: 'otro',
      tiempoMinutosPorPieza: 0,
      tiempoMinutos: 0,
      costoPorHora: 0,
      costoManoObraPorHora: 0,
      costoManoObra: 0,
      costoTotal: costoConMargen,
      descripcion: `Proveedor: $${costoExterno.toFixed(2)} + ${margenExterno}% = $${costoConMargen.toFixed(2)} (total ${pieza.cantidad} pzas)`,
      incluyeManoObra: false,
      costoTotalIngresado: costoConMargen,
    };
    onActualizar(pieza.id, { procesos: [...pieza.procesos, nuevo] });
    setNombreExterno('');
    setCostoExterno(0);
    setMargenExterno(30);
  };

  const eliminarProceso = (procesoId: string) => {
    onActualizar(pieza.id, {
      procesos: pieza.procesos.filter((p: Proceso) => p.id !== procesoId),
    });
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1">
        <ExternalLink className="w-3 h-3" /> Procesos Externos
      </h4>
      {pieza.procesos.filter((p: Proceso) => p.tipo === 'otro').length > 0 && (
        <div className="space-y-1 mb-2">
          {pieza.procesos.filter((p: Proceso) => p.tipo === 'otro').map((proc: Proceso) => (
            <div key={proc.id} className="flex justify-between p-1.5 bg-amber-50 rounded text-sm">
              <div>
                <span>{proc.nombre}</span>
                <span className="text-xs text-slate-500 ml-2">{proc.descripcion}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">${proc.costoTotal.toFixed(2)}</span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-500" onClick={() => eliminarProceso(proc.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <Input
          value={nombreExterno}
          onChange={(e) => setNombreExterno(e.target.value)}
          placeholder="Nombre del proceso externo"
          className="flex-1 h-8 text-xs"
        />
        <Input
          type="number"
          min={0.01}
          step={0.01}
          value={costoExterno}
          onChange={(e) => setCostoExterno(parseFloat(e.target.value) || 0)}
          placeholder="Costo total"
          className="w-28 h-8 text-xs"
        />
        <Select value={String(margenExterno)} onValueChange={(v) => setMargenExterno(parseInt(v))}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5" className="text-xs">5%</SelectItem>
            <SelectItem value="15" className="text-xs">15%</SelectItem>
            <SelectItem value="30" className="text-xs">30%</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={agregarProcesoExterno} disabled={!nombreExterno.trim() || costoExterno <= 0} className="h-8 bg-amber-600 hover:bg-amber-700">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {costoExterno > 0 && (
        <p className="text-xs text-slate-500 mt-1">
          Costo total: ${(costoExterno * (1 + margenExterno / 100)).toFixed(2)}
          {' '}
          (${((costoExterno * (1 + margenExterno / 100)) / pieza.cantidad).toFixed(2)} por pieza)
        </p>
      )}
    </div>
  );
}

// Tipo local para el select de procesos
interface CatalogoProceso {
  id: string;
  nombre: string;
  costoPorHora: number;
  categoria: string;
  requiereManoObra: string;
}
