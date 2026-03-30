import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Settings, 
  DollarSign,
  Save,
  Edit,
  Search,
  Target
} from 'lucide-react';
import { CATALOGO_PROCESOS_VELSO, COSTOS_MANO_OBRA } from '@/types/cotizacion';
import type { CatalogoProceso } from '@/types/cotizacion';

interface CatalogoProcesosViewProps {
  onVolver: () => void;
  horasDisponibles: Record<string, number>;
  onActualizarHoras: (procesoId: string, horas: number) => void;
}

const categorias = [
  { value: 'indirecto', label: 'Costos Indirectos' },
  { value: 'mano_obra', label: 'Mano de Obra' },
  { value: 'servicio', label: 'Servicios' },
  { value: 'maquina', label: 'Máquinas' },
];

export function CatalogoProcesosView({ 
  onVolver, 
  horasDisponibles,
  onActualizarHoras 
}: CatalogoProcesosViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [editandoPrecio, setEditandoPrecio] = useState<string | null>(null);
  const [editandoHoras, setEditandoHoras] = useState<string | null>(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevasHoras, setNuevasHoras] = useState('');

  // Filtrar procesos
  const procesosFiltrados = CATALOGO_PROCESOS_VELSO.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' ? true : p.categoria === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  const handleActualizarPrecio = (id: string) => {
    const precio = parseFloat(nuevoPrecio);
    if (precio >= 0) {
      // Actualizar en localStorage
      const procesos = JSON.parse(localStorage.getItem('velso_procesos_custom') || '[]');
      const existente = procesos.findIndex((p: any) => p.id === id);
      if (existente >= 0) {
        procesos[existente].costoPorHora = precio;
      } else {
        const proceso = CATALOGO_PROCESOS_VELSO.find(p => p.id === id);
        if (proceso) {
          procesos.push({ ...proceso, costoPorHora: precio });
        }
      }
      localStorage.setItem('velso_procesos_custom', JSON.stringify(procesos));
    }
    setEditandoPrecio(null);
    setNuevoPrecio('');
  };

  const handleActualizarHoras = (id: string) => {
    const horas = parseFloat(nuevasHoras);
    if (horas >= 0) {
      onActualizarHoras(id, horas);
    }
    setEditandoHoras(null);
    setNuevasHoras('');
  };

  const getCostoReal = (proceso: CatalogoProceso) => {
    const custom = JSON.parse(localStorage.getItem('velso_procesos_custom') || '[]');
    const encontrado = custom.find((p: any) => p.id === proceso.id);
    return encontrado ? encontrado.costoPorHora : proceso.costoPorHora;
  };

  // Calcular totales
  const totalHorasDisponibles = Object.values(horasDisponibles).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Procesos</h2>
          <p className="text-slate-500">{CATALOGO_PROCESOS_VELSO.length} procesos configurados</p>
        </div>
      </div>

      {/* Resumen de horas */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-blue-600" />
            Horas Disponibles para Venta - Mes en Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATALOGO_PROCESOS_VELSO.filter(p => p.id !== 'otro').map((proceso) => (
              <div key={proceso.id} className="bg-white p-3 rounded-lg">
                <p className="text-xs text-slate-500">{proceso.nombre}</p>
                {editandoHoras === proceso.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={nuevasHoras}
                      onChange={(e) => setNuevasHoras(e.target.value)}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleActualizarHoras(proceso.id)}
                      className="h-8 px-2"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditandoHoras(proceso.id);
                      setNuevasHoras(horasDisponibles[proceso.id]?.toString() || '0');
                    }}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <span className="text-xl font-bold">{horasDisponibles[proceso.id]?.toFixed(2) || '0.00'}</span>
                    <span className="text-sm">h</span>
                    <Edit className="w-3 h-3 ml-1 text-slate-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-blue-800 font-medium">Total Horas Disponibles:</span>
              <span className="text-2xl font-bold text-blue-600">{totalHorasDisponibles.toFixed(2)}h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar proceso..."
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de procesos */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Procesos Configurados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proceso</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">$/Hora</TableHead>
                  <TableHead className="text-right">MO Incluida</TableHead>
                  <TableHead className="text-right">Horas/Mes</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procesosFiltrados.map((proceso) => (
                  <TableRow key={proceso.id}>
                    <TableCell className="font-medium">{proceso.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categorias.find(c => c.value === proceso.categoria)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editandoPrecio === proceso.id ? (
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
                            onClick={() => handleActualizarPrecio(proceso.id)}
                            className="h-8 px-2"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditandoPrecio(proceso.id);
                            setNuevoPrecio(getCostoReal(proceso).toString());
                          }}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <DollarSign className="w-4 h-4" />
                          {getCostoReal(proceso).toFixed(2)}
                          <Edit className="w-3 h-3 ml-1 text-slate-400" />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {proceso.requiereManoObra === 'mo_s' ? (
                        <span className="text-green-600">MO-S (${COSTOS_MANO_OBRA.mo_s}/h)</span>
                      ) : proceso.requiereManoObra === 'mo_e' ? (
                        <span className="text-blue-600">MO-E (${COSTOS_MANO_OBRA.mo_e}/h)</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">{horasDisponibles[proceso.id]?.toFixed(2) || '0.00'}h</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                      {proceso.descripcion}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> Las horas disponibles configuradas aquí se usan para calcular el cumplimiento 
          de objetivos en el Dashboard. El <strong>Código 07</strong> es el indicador principal para mantener 
          el taller activo.
        </p>
      </div>
    </div>
  );
}
