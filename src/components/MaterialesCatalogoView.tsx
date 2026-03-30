import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Search,
  Trash2,
  Edit,
  Circle,
  Square,
  LayoutGrid,
  Layers,
  DollarSign,
  Save
} from 'lucide-react';
import type { CatalogoMaterial, FormaMaterial, UnidadMedida } from '@/types/cotizacion';

interface MaterialesCatalogoViewProps {
  onVolver: () => void;
  catalogo: CatalogoMaterial[];
  onAgregar: (material: Omit<CatalogoMaterial, 'id'>) => void;
  onEliminar: (id: string) => void;
  onActualizarPrecio: (id: string, nuevoPrecio: number) => void;
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
  { value: 'otro', label: 'Otro', icon: Package },
];

export function MaterialesCatalogoView({ 
  onVolver, 
  catalogo, 
  onAgregar, 
  onEliminar,
  onActualizarPrecio
}: MaterialesCatalogoViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [formaFiltro, setFormaFiltro] = useState<FormaMaterial | 'todas'>('todas');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoPrecio, setEditandoPrecio] = useState<string | null>(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  // Formulario nuevo material
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    tipo: 'aluminio' as string,
    forma: 'redondo' as FormaMaterial,
    unidadMedida: 'mm' as UnidadMedida,
    diametro: undefined as number | undefined,
    lado: undefined as number | undefined,
    largo: undefined as number | undefined,
    ancho: undefined as number | undefined,
    espesor: undefined as number | undefined,
    costoUnitario: 0,
    unidadCosto: 'kg' as 'kg' | 'pieza' | 'metro',
  });

  // Filtrar materiales
  const materialesFiltrados = catalogo.filter(m => {
    const matchBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          m.tipo.toLowerCase().includes(busqueda.toLowerCase());
    const matchForma = formaFiltro === 'todas' ? true : m.forma === formaFiltro;
    const matchTipo = tipoFiltro === 'todos' ? true : m.tipo === tipoFiltro;
    return matchBusqueda && matchForma && matchTipo;
  });

  const handleAgregar = () => {
    if (!nuevoMaterial.nombre || nuevoMaterial.costoUnitario <= 0) return;
    onAgregar(nuevoMaterial);
    setNuevoMaterial({
      nombre: '',
      tipo: 'aluminio',
      forma: 'redondo',
      unidadMedida: 'mm',
      diametro: undefined,
      lado: undefined,
      largo: undefined,
      ancho: undefined,
      espesor: undefined,
      costoUnitario: 0,
      unidadCosto: 'kg',
    });
    setMostrarFormulario(false);
  };

  const handleActualizarPrecio = (id: string) => {
    const precio = parseFloat(nuevoPrecio);
    if (precio > 0) {
      onActualizarPrecio(id, precio);
    }
    setEditandoPrecio(null);
    setNuevoPrecio('');
  };

  // Formatear dimensiones
  const formatearDimensiones = (m: CatalogoMaterial) => {
    const unidad = m.unidadMedida === 'mm' ? 'mm' : '"';
    if (m.forma === 'redondo' && m.diametro) {
      return `Ø${m.diametro}${unidad}${m.largo ? ` × ${m.largo}${unidad}` : ''}`;
    } else if (m.forma === 'cuadrado' && m.lado) {
      return `${m.lado}${unidad} × ${m.lado}${unidad}${m.largo ? ` × ${m.largo}${unidad}` : ''}`;
    } else if ((m.forma === 'placa' || m.forma === 'placa_rectificada') && m.largo && m.ancho) {
      return `${m.largo}${unidad} × ${m.ancho}${unidad}${m.espesor ? ` × ${m.espesor}${unidad}` : ''}`;
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Materiales</h2>
          <p className="text-slate-500">{catalogo.length} materiales registrados</p>
        </div>
        <Button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {mostrarFormulario ? 'Cancelar' : 'Nuevo Material'}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar material..."
              className="pl-10"
            />
          </div>
        </div>
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposMaterial.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formaFiltro} onValueChange={(v) => setFormaFiltro(v as FormaMaterial | 'todas')}>
          <SelectTrigger className="w-[180px]">
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

      {/* Formulario nuevo material */}
      {mostrarFormulario && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-blue-600" />
              Agregar Nuevo Material al Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Material</Label>
                <Input
                  value={nuevoMaterial.nombre}
                  onChange={(e) => setNuevoMaterial(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Aluminio 6061"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={nuevoMaterial.tipo}
                  onValueChange={(v) => setNuevoMaterial(prev => ({ ...prev, tipo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposMaterial.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label>Forma</Label>
                <ToggleGroup
                  type="single"
                  value={nuevoMaterial.forma}
                  onValueChange={(v) => v && setNuevoMaterial(prev => ({ ...prev, forma: v as FormaMaterial }))}
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

              <div className="space-y-2">
                <Label>Unidad de Medida</Label>
                <ToggleGroup
                  type="single"
                  value={nuevoMaterial.unidadMedida}
                  onValueChange={(v) => v && setNuevoMaterial(prev => ({ ...prev, unidadMedida: v as UnidadMedida }))}
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

              {/* Campos de dimensiones según forma */}
              {nuevoMaterial.forma === 'redondo' && (
                <>
                  <div className="space-y-2">
                    <Label>Diámetro ({nuevoMaterial.unidadMedida})</Label>
                    <Input
                      type="number"
                      step={nuevoMaterial.unidadMedida === 'mm' ? 0.1 : 0.001}
                      value={nuevoMaterial.diametro || ''}
                      onChange={(e) => setNuevoMaterial(prev => ({ ...prev, diametro: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ej: 25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Largo ({nuevoMaterial.unidadMedida})</Label>
                    <Input
                      type="number"
                      step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                      value={nuevoMaterial.largo || ''}
                      onChange={(e) => setNuevoMaterial(prev => ({ ...prev, largo: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ej: 1000"
                    />
                  </div>
                </>
              )}

              {nuevoMaterial.forma === 'cuadrado' && (
                <>
                  <div className="space-y-2">
                    <Label>Lado ({nuevoMaterial.unidadMedida})</Label>
                    <Input
                      type="number"
                      step={nuevoMaterial.unidadMedida === 'mm' ? 0.1 : 0.001}
                      value={nuevoMaterial.lado || ''}
                      onChange={(e) => setNuevoMaterial(prev => ({ ...prev, lado: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ej: 25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Largo ({nuevoMaterial.unidadMedida})</Label>
                    <Input
                      type="number"
                      step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                      value={nuevoMaterial.largo || ''}
                      onChange={(e) => setNuevoMaterial(prev => ({ ...prev, largo: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ej: 1000"
                    />
                  </div>
                </>
              )}

              {(nuevoMaterial.forma === 'placa' || nuevoMaterial.forma === 'placa_rectificada') && (
                <>
                  <div className="space-y-2">
                    <Label>Largo ({nuevoMaterial.unidadMedida})</Label>
                    <Input
                      type="number"
                      step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                      value={nuevoMaterial.largo || ''}
                      onChange={(e) => setNuevoMaterial(prev => ({ ...prev, largo: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ej: 1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ancho ({nuevoMaterial.unidadMedida})</Label>
                    <Input
                      type="number"
                      step={nuevoMaterial.unidadMedida === 'mm' ? 1 : 0.1}
                      value={nuevoMaterial.ancho || ''}
                      onChange={(e) => setNuevoMaterial(prev => ({ ...prev, ancho: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ej: 500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Espesor ({nuevoMaterial.unidadMedida})</Label>
                    <Input
                      type="number"
                      step={nuevoMaterial.unidadMedida === 'mm' ? 0.1 : 0.001}
                      value={nuevoMaterial.espesor || ''}
                      onChange={(e) => setNuevoMaterial(prev => ({ ...prev, espesor: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ej: 6"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Costo Unitario ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={nuevoMaterial.costoUnitario}
                  onChange={(e) => setNuevoMaterial(prev => ({ ...prev, costoUnitario: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Unidad de Costo</Label>
                <Select
                  value={nuevoMaterial.unidadCosto}
                  onValueChange={(v) => setNuevoMaterial(prev => ({ ...prev, unidadCosto: v as 'kg' | 'pieza' | 'metro' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Por Kilogramo</SelectItem>
                    <SelectItem value="pieza">Por Pieza</SelectItem>
                    <SelectItem value="metro">Por Metro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleAgregar}
              disabled={!nuevoMaterial.nombre || nuevoMaterial.costoUnitario <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar en Catálogo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabla de materiales */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Materiales del Catálogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materialesFiltrados.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron materiales</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Dimensiones</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialesFiltrados.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div className="font-medium">{material.nombre}</div>
                        <div className="text-xs text-slate-500">{tiposMaterial.find(t => t.value === material.tipo)?.label}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {formasMaterial.find(f => f.value === material.forma)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatearDimensiones(material)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editandoPrecio === material.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              className="w-24 h-8"
                              value={nuevoPrecio}
                              onChange={(e) => setNuevoPrecio(e.target.value)}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleActualizarPrecio(material.id)}
                              className="h-8 px-2"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditandoPrecio(material.id);
                              setNuevoPrecio(material.costoUnitario.toString());
                            }}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            <DollarSign className="w-4 h-4" />
                            {material.costoUnitario.toFixed(2)}/{material.unidadCosto}
                            <Edit className="w-3 h-3 ml-1 text-slate-400" />
                          </button>
                        )}
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
