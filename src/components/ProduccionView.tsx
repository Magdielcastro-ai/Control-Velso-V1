import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Factory,
  Clock,
  Package,
  Search,
  ChevronRight,
  User,
  Building2,
} from 'lucide-react';
import type { ProyectoVenta } from '@/types/ventas';
import { procesosAplanados, minutosCotizados } from '@/utils/proyectoDatos';

interface ProduccionViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  // Abrir la vista dedicada del proyecto (captura, hojas viajeras, wizard
  // de piezas y marcar terminado se hacen DENTRO del proyecto)
  onVerProyecto: (proyecto: ProyectoVenta) => void;
}

type FiltroProduccion = 'todos' | 'en_fabricacion' | 'terminados';

// LISTA de producción: proyectos activos en piso. Al elegir uno se abre su
// vista dedicada (mismo esquema que Proyectos) para capturar sin confusiones.
export function ProduccionView({
  onVolver,
  proyectos,
  onVerProyecto,
}: ProduccionViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroProduccion>('en_fabricacion');

  // Proyectos en piso: en fabricación o terminados (fabricados) pendientes
  // de entrega — entregado/facturado ya salió del área de producción
  const proyectosPiso = proyectos.filter(p =>
    p.estado === 'en_fabricacion' || p.estado === 'fabricado'
  );

  const proyectosFiltrados = proyectosPiso.filter(p => {
    const matchBusqueda =
      p.proyectoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigoProyecto?.toLowerCase() || '').includes(busqueda.toLowerCase());
    const matchFiltro =
      filtro === 'todos' ||
      (filtro === 'en_fabricacion' && p.estado === 'en_fabricacion') ||
      (filtro === 'terminados' && p.estado === 'fabricado');
    return matchBusqueda && matchFiltro;
  });

  // Horas estimadas de un proyecto (desde las piezas)
  const horasEstimadas = (proyecto: ProyectoVenta) =>
    procesosAplanados(proyecto).reduce((sum, proc) => sum + minutosCotizados(proc), 0) / 60;

  const enFabricacion = proyectosPiso.filter(p => p.estado === 'en_fabricacion');
  const terminados = proyectosPiso.filter(p => p.estado === 'fabricado');
  const totalHorasPiso = enFabricacion.reduce((sum, p) => sum + horasEstimadas(p), 0);
  const totalPiezas = enFabricacion.reduce((sum, p) => sum + (p.piezas?.length || 0), 0);

  const tabs: { id: FiltroProduccion; label: string; count: number }[] = [
    { id: 'todos', label: 'Todos', count: proyectosPiso.length },
    { id: 'en_fabricacion', label: 'En fabricación', count: enFabricacion.length },
    { id: 'terminados', label: 'Terminados', count: terminados.length },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onVolver} className="border-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Control de Producción</h2>
            <p className="text-sm text-slate-500">Proyectos en piso</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-slate-500">En fabricación</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{enFabricacion.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-slate-500">Piezas</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalPiezas}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-slate-500">Horas estimadas</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalHorasPiso.toFixed(1)} h</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Todos / En fabricación / Terminados */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <Button
            key={t.id}
            variant={filtro === t.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltro(t.id)}
            className={filtro === t.id ? 'bg-slate-700' : 'border-slate-300'}
          >
            {t.label}
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
              {t.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proyecto, cliente o código..."
          className="pl-9"
        />
      </div>

      {/* Lista de proyectos: clic para abrir la vista dedicada */}
      <div className="space-y-3">
        {proyectosFiltrados.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <Factory className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No hay proyectos {filtro === 'terminados' ? 'terminados' : filtro === 'en_fabricacion' ? 'en fabricación' : 'en piso'}</p>
              <p className="text-sm">Los proyectos aparecen aquí cuando entran a producción</p>
            </CardContent>
          </Card>
        ) : (
          proyectosFiltrados.map((proyecto) => (
            <Card
              key={proyecto.id}
              className="border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onVerProyecto(proyecto)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      proyecto.estado === 'en_fabricacion' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Factory className={`w-5 h-5 ${
                        proyecto.estado === 'en_fabricacion' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{proyecto.codigoProyecto || 'Sin código'}</span>
                        <Badge className={proyecto.estado === 'en_fabricacion' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                          {proyecto.estado === 'en_fabricacion' ? 'En fabricación' : 'Terminado'}
                        </Badge>
                        {proyecto.tipoOrigen === 'urgencia' && (
                          <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50">URGENCIA</Badge>
                        )}
                        {proyecto.tipoOrigen === 'stock' && (
                          <Badge variant="outline" className="text-purple-700 border-purple-400 bg-purple-50">STOCK</Badge>
                        )}
                      </div>
                      <p className="font-medium text-slate-700 truncate mt-0.5">{proyecto.proyectoNombre}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {proyecto.clienteNombre}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {horasEstimadas(proyecto).toFixed(1)} h estimadas
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {proyecto.piezas?.length || 0} pieza{(proyecto.piezas?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        {proyecto.ordenCompra && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            PO: {proyecto.ordenCompra}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 shrink-0">
                    <span className="text-sm font-medium hidden sm:inline">Abrir</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
