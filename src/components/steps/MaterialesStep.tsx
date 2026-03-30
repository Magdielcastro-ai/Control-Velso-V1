import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, Box, TrendingUp, DollarSign, Search, Circle, Square, LayoutGrid, Layers } from 'lucide-react';
import type { Material, CatalogoMaterial, FormaMaterial, UnidadMedida } from '@/types/cotizacion';
import { useCatalogoMateriales } from '@/hooks/useCatalogoMateriales';

interface MaterialesStepProps {
  materiales: Material[];
  onAgregar: (material: Omit<Material, 'id' | 'costoTotal'>) => void;
  onEliminar: (id: string) => void;
}

const tiposMaterial = [
  { value: 'aluminio', label: 'Aluminio' },
  { value: 'acero', label: 'Acero' },
  { value: 'acero_inoxidable', label: 'Acero Inoxidable' },
  { value: 'laton', label: 'Latón' },
  { value: 'plastico', label: 'Plástico' },
  { value: 'madera', label: 'Madera' },
  { value: 'otro', label: 'Otro' },
];

const formasMaterial: { value: FormaMaterial; label: string; icon: typeof Circle }[] = [
  { value: 'redondo', label: 'Redondo', icon: Circle },
  { value: 'cuadrado', label: 'Cuadrado', icon: Square },
  { value: 'placa', label: 'Placa', icon: LayoutGrid },
  { value: 'placa_rectificada', label: 'Placa Rectificada', icon: Layers },
  { value: 'otro', label: 'Otro', icon: Box },
];

const margenes = [
  { value: 0, label: 'Sin margen' },
  { value: 5, label: '5%' },
  { value: 10, label: '10%' },
  { value: 15, label: '15%' },
  { value: 30, label: '30%' },
];

export function MaterialesStep({ materiales, onAgregar, onEliminar }: MaterialesStepProps) {
  const { 
    catalogo, 
    cargado, 
    agregarAlCatalogo
  } = useCatalogoMateriales();

  const [modo, setModo] = useState<'catalogo' | 'nuevo'>('catalogo');
  const [busqueda, setBusqueda] = useState('');
  const [formaFiltro, setFormaFiltro] = useState<FormaMaterial | 'todas'>('todas');
  const [materialSeleccionado, setMaterialSeleccionado] = useState<CatalogoMaterial | null>(null);

  // Estado para nuevo material
  const [nuevoMaterial, setNuevoMaterial] = useState<Partial<Material>>({
    nombre: '',
    tipo: 'aluminio',
    forma: 'redondo',
    unidadMedida: 'mm',
    cantidad: 1,
    unidad: 'kg',
    costoUnitario: 0,
    margenPorcentaje: 0,
    diametro: undefined,
    lado: undefined,
    largo: undefined,
    ancho: undefined,
    espesor: undefined,
  });

  // Filtrar materiales del catálogo
  const materialesFiltrados = catalogo.filter(m => {
    const matchBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          m.tipo.toLowerCase().includes(busqueda.toLowerCase());
    const matchForma = formaFiltro === 'todas' ? true : m.forma === formaFiltro;
    return matchBusqueda && matchForma;
  });

  // Seleccionar material del catálogo
  const seleccionarMaterialCatalogo = (mat: CatalogoMaterial) => {
    setMaterialSeleccionado(mat);
    setNuevoMaterial({
      nombre: mat.nombre,
      tipo: mat.tipo,
      forma: mat.forma,
      unidadMedida: mat.unidadMedida,
      diametro: mat.diametro,
      lado: mat.lado,
      largo: mat.largo,
      ancho: mat.ancho,
      espesor: mat.espesor,
      cantidad: 1,
      unidad: mat.unidadCosto,
      costoUnitario: mat.costoUnitario,
      margenPorcentaje: 0,
    });
  };

  // Agregar material a la cotización
  const handleAgregar = () => {
    if (!nuevoMaterial.nombre || !nuevoMaterial.costoUnitario || nuevoMaterial.costoUnitario <= 0) return;
    
    const materialCompleto: Omit<Material, 'id' | 'costoTotal'> = {
      nombre: nuevoMaterial.nombre || '',
      tipo: nuevoMaterial.tipo || 'otro',
      forma: nuevoMaterial.forma || 'otro',
      unidadMedida: nuevoMaterial.unidadMedida || 'mm',
      cantidad: nuevoMaterial.cantidad || 1,
      unidad: nuevoMaterial.unidad || 'kg',
      costoUnitario: nuevoMaterial.costoUnitario || 0,
      margenPorcentaje: nuevoMaterial.margenPorcentaje || 0,
      diametro: nuevoMaterial.diametro,
      lado: nuevoMaterial.lado,
      largo: nuevoMaterial.largo,
      ancho: nuevoMaterial.ancho,
      espesor: nuevoMaterial.espesor,
    };

    onAgregar(materialCompleto);

    // Si es un material nuevo (no del catálogo), agregarlo al catálogo
    if (modo === 'nuevo') {
      agregarAlCatalogo({
        nombre: materialCompleto.nombre,
        tipo: materialCompleto.tipo,
        forma: materialCompleto.forma,
        unidadMedida: materialCompleto.unidadMedida,
        diametro: materialCompleto.diametro,
        lado: materialCompleto.lado,
        largo: materialCompleto.largo,
        ancho: materialCompleto.ancho,
        espesor: materialCompleto.espesor,
        costoUnitario: materialCompleto.costoUnitario,
        unidadCosto: materialCompleto.unidad,
      });
    }

    // Resetear
    setMaterialSeleccionado(null);
    setNuevoMaterial({
      nombre: '',
      tipo: 'aluminio',
      forma: 'redondo',
      unidadMedida: 'mm',
      cantidad: 1,
      unidad: 'kg',
      costoUnitario: 0,
      margenPorcentaje: 0,
      diametro: undefined,
      lado: undefined,
      largo: undefined,
      ancho: undefined,
      espesor: undefined,
    });
  };

  // Calcular costo estimado
  const calcularCostoEstimado = () => {
    const costoBase = (nuevoMaterial.cantidad || 0) * (nuevoMaterial.costoUnitario || 0);
    const factorMargen = 1 + ((nuevoMaterial.margenPorcentaje || 0) / 100);
    return costoBase * factorMargen;
  };

  const costoBase = (nuevoMaterial.cantidad || 0) * (nuevoMaterial.costoUnitario || 0);
  const margenValor = calcularCostoEstimado() - costoBase;

  const totalMateriales = materiales.reduce((sum, m) => sum + m.costoTotal, 0);

  // Renderizar campos de dimensiones según la forma
  const renderCamposDimensiones = () => {
    const forma = nuevoMaterial.forma;
    const unidad = nuevoMaterial.unidadMedida === 'mm' ? 'mm' : '"';

    switch (forma) {
      case 'redondo':
        return (
          <>
            <div className="space-y-2">
              <Label>Diámetro ({unidad})</Label>
              <Input
                type="number"
                step={nuevoMaterial.unidadMedida === 'mm' ? 0.1 : 0.001}
                value={nuevoMaterial.diametro || ''}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, diametro: parseFloat(e.target.value) || undefined }))}
                placeholder={`Ej: ${nuevoMaterial.unidadMedida === 'mm' ? '25' : '1'}`}
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Largo ({unidad})</Label>
              <Input
                type="number"
                step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                value={nuevoMaterial.largo || ''}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, largo: parseFloat(e.target.value) || undefined }))}
                placeholder={`Ej: ${nuevoMaterial.unidadMedida === 'mm' ? '1000' : '12'}`}
                className="border-slate-300"
              />
            </div>
          </>
        );
      case 'cuadrado':
        return (
          <>
            <div className="space-y-2">
              <Label>Lado ({unidad})</Label>
              <Input
                type="number"
                step={nuevoMaterial.unidadMedida === 'mm' ? 0.1 : 0.001}
                value={nuevoMaterial.lado || ''}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, lado: parseFloat(e.target.value) || undefined }))}
                placeholder={`Ej: ${nuevoMaterial.unidadMedida === 'mm' ? '25' : '1'}`}
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Largo ({unidad})</Label>
              <Input
                type="number"
                step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                value={nuevoMaterial.largo || ''}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, largo: parseFloat(e.target.value) || undefined }))}
                placeholder={`Ej: ${nuevoMaterial.unidadMedida === 'mm' ? '1000' : '12'}`}
                className="border-slate-300"
              />
            </div>
          </>
        );
      case 'placa':
      case 'placa_rectificada':
        return (
          <>
            <div className="space-y-2">
              <Label>Largo ({unidad})</Label>
              <Input
                type="number"
                step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                value={nuevoMaterial.largo || ''}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, largo: parseFloat(e.target.value) || undefined }))}
                placeholder={`Ej: ${nuevoMaterial.unidadMedida === 'mm' ? '1000' : '24'}`}
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Ancho ({unidad})</Label>
              <Input
                type="number"
                step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                value={nuevoMaterial.ancho || ''}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, ancho: parseFloat(e.target.value) || undefined }))}
                placeholder={`Ej: ${nuevoMaterial.unidadMedida === 'mm' ? '500' : '12'}`}
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Espesor ({unidad})</Label>
              <Input
                type="number"
                step={nuevoMaterial.unidadMedida === 'mm' ? 0.1 : 0.001}
                value={nuevoMaterial.espesor || ''}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, espesor: parseFloat(e.target.value) || undefined }))}
                placeholder={`Ej: ${nuevoMaterial.unidadMedida === 'mm' ? '6' : '0.25'}`}
                className="border-slate-300"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (!cargado) {
    return <div className="text-center py-8">Cargando catálogo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Materiales</h2>
        <p className="text-slate-600">Selecciona del catálogo o crea un nuevo material</p>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2">
        <Button
          variant={modo === 'catalogo' ? 'default' : 'outline'}
          onClick={() => setModo('catalogo')}
          className={modo === 'catalogo' ? 'bg-blue-600' : ''}
        >
          <Search className="w-4 h-4 mr-2" />
          Del Catálogo
        </Button>
        <Button
          variant={modo === 'nuevo' ? 'default' : 'outline'}
          onClick={() => setModo('nuevo')}
          className={modo === 'nuevo' ? 'bg-blue-600' : ''}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Material
        </Button>
      </div>

      {/* Modo Catálogo */}
      {modo === 'catalogo' && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5 text-blue-600" />
              Buscar en Catálogo ({catalogo.length} materiales)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[200px]">
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar material..."
                  className="border-slate-300"
                />
              </div>
              <Select value={formaFiltro} onValueChange={(v) => setFormaFiltro(v as FormaMaterial | 'todas')}>
                <SelectTrigger className="w-[180px] border-slate-300">
                  <SelectValue placeholder="Todas las formas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las formas</SelectItem>
                  {formasMaterial.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de materiales */}
            <div className="max-h-[200px] overflow-y-auto border rounded-lg">
              {materialesFiltrados.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  No se encontraron materiales
                </div>
              ) : (
                <div className="divide-y">
                  {materialesFiltrados.map((mat) => {
                    const FormaIcon = formasMaterial.find(f => f.value === mat.forma)?.icon || Box;
                    return (
                      <button
                        key={mat.id}
                        onClick={() => seleccionarMaterialCatalogo(mat)}
                        className={`w-full p-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                          materialSeleccionado?.id === mat.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <FormaIcon className="w-5 h-5 text-slate-400" />
                        <div className="flex-1">
                          <div className="font-medium">{mat.nombre}</div>
                          <div className="text-xs text-slate-500">
                            {mat.forma} • {mat.unidadMedida === 'mm' ? 'Métrico' : 'Imperial'} • ${mat.costoUnitario}/{mat.unidadCosto}
                          </div>
                        </div>
                        {materialSeleccionado?.id === mat.id && (
                          <Badge className="bg-blue-600">Seleccionado</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de material */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {modo === 'catalogo' ? <Package className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
            {modo === 'catalogo' && materialSeleccionado ? 'Material Seleccionado' : 'Nuevo Material'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nombre */}
            <div className="space-y-2 md:col-span-2">
              <Label>Nombre del Material</Label>
              <Input
                value={nuevoMaterial.nombre}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Aluminio 6061"
                className="border-slate-300"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Material</Label>
              <Select
                value={nuevoMaterial.tipo}
                onValueChange={(value) => setNuevoMaterial(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposMaterial.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forma */}
            <div className="space-y-2 md:col-span-2">
              <Label>Forma</Label>
              <ToggleGroup
                type="single"
                value={nuevoMaterial.forma}
                onValueChange={(value) => value && setNuevoMaterial(prev => ({ ...prev, forma: value as FormaMaterial }))}
                className="w-full justify-start flex-wrap"
              >
                {formasMaterial.map((f) => {
                  const Icon = f.icon;
                  return (
                    <ToggleGroupItem 
                      key={f.value} 
                      value={f.value}
                      className="data-[state=on]:bg-blue-600 data-[state=on]:text-white px-3"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {f.label}
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </div>

            {/* Unidad de medida */}
            <div className="space-y-2">
              <Label>Unidad de Medida</Label>
              <ToggleGroup
                type="single"
                value={nuevoMaterial.unidadMedida}
                onValueChange={(value) => value && setNuevoMaterial(prev => ({ ...prev, unidadMedida: value as UnidadMedida }))}
                className="w-full"
              >
                <ToggleGroupItem value="mm" className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                  Milímetros (mm)
                </ToggleGroupItem>
                <ToggleGroupItem value="in" className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                  Pulgadas (in)
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Dimensiones según forma */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderCamposDimensiones()}
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={nuevoMaterial.cantidad}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 0 }))}
                className="border-slate-300"
              />
            </div>

            {/* Unidad de costo */}
            <div className="space-y-2">
              <Label>Unidad de Costo</Label>
              <Select
                value={nuevoMaterial.unidad}
                onValueChange={(value) => setNuevoMaterial(prev => ({ ...prev, unidad: value as 'kg' | 'pieza' | 'metro' }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                  <SelectItem value="pieza">Piezas</SelectItem>
                  <SelectItem value="metro">Metros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Costo Unitario */}
            <div className="space-y-2">
              <Label>Costo Unitario ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={nuevoMaterial.costoUnitario}
                onChange={(e) => setNuevoMaterial(prev => ({ ...prev, costoUnitario: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className="border-slate-300"
              />
            </div>

            {/* Margen */}
            <div className="space-y-2 md:col-span-3">
              <Label className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Margen sobre el material
              </Label>
              <ToggleGroup
                type="single"
                value={(nuevoMaterial.margenPorcentaje || 0).toString()}
                onValueChange={(value) => value && setNuevoMaterial(prev => ({ ...prev, margenPorcentaje: parseInt(value) }))}
                className="w-full justify-start flex-wrap"
              >
                {margenes.map((m) => (
                  <ToggleGroupItem 
                    key={m.value} 
                    value={m.value.toString()}
                    className="data-[state=on]:bg-green-600 data-[state=on]:text-white px-4"
                  >
                    {m.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Costo estimado */}
            <div className="space-y-2 md:col-span-3">
              <Label className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Costo Estimado
              </Label>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Costo base:</span>
                    <span className="font-medium">${costoBase.toFixed(2)}</span>
                  </div>
                  {(nuevoMaterial.margenPorcentaje || 0) > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">+ Margen ({nuevoMaterial.margenPorcentaje}%):</span>
                        <span className="font-medium text-green-600">+${margenValor.toFixed(2)}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-300"></div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-semibold">Total:</span>
                    <span className="text-xl font-bold text-green-600">${calcularCostoEstimado().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleAgregar}
            disabled={!nuevoMaterial.nombre || !nuevoMaterial.costoUnitario || nuevoMaterial.costoUnitario <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {modo === 'nuevo' ? 'Agregar Material y Guardar en Catálogo' : 'Agregar Material a Cotización'}
          </Button>
        </CardContent>
      </Card>

      {/* Tabla de materiales agregados */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Materiales en Cotización
            </span>
            <span className="text-sm font-normal text-slate-600">
              Total: <span className="font-semibold text-slate-900">${totalMateriales.toFixed(2)}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materiales.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay materiales agregados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Dimensiones</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiales.map((material) => {
                    // Formatear dimensiones
                    let dimensionesStr = '';
                    const unidad = material.unidadMedida === 'mm' ? 'mm' : '"';
                    if (material.forma === 'redondo' && material.diametro) {
                      dimensionesStr = `Ø${material.diametro}${unidad}`;
                      if (material.largo) dimensionesStr += ` × ${material.largo}${unidad}`;
                    } else if (material.forma === 'cuadrado' && material.lado) {
                      dimensionesStr = `${material.lado}${unidad} × ${material.lado}${unidad}`;
                      if (material.largo) dimensionesStr += ` × ${material.largo}${unidad}`;
                    } else if ((material.forma === 'placa' || material.forma === 'placa_rectificada') && material.largo && material.ancho) {
                      dimensionesStr = `${material.largo}${unidad} × ${material.ancho}${unidad}`;
                      if (material.espesor) dimensionesStr += ` × ${material.espesor}${unidad}`;
                    }
                    
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formasMaterial.find(f => f.value === material.forma)?.label || material.forma}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{dimensionesStr}</TableCell>
                        <TableCell className="text-right">{material.cantidad} {material.unidad}</TableCell>
                        <TableCell className="text-right">${material.costoUnitario.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {material.margenPorcentaje > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span className="text-green-600">{material.margenPorcentaje}%</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">${material.costoTotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEliminar(material.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
