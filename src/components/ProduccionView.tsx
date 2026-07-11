import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Factory,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  Package,
  TrendingUp,
  Search,
  ChevronRight,
  ChevronDown,
  User,
} from 'lucide-react';
import type { ProyectoVenta } from '@/types/ventas';
import type { RegistroProduccion } from '@/types/produccion';

interface ProduccionViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  registros: RegistroProduccion[];
  onIniciarProceso?: (registroId: string) => void;
  onCompletarProceso?: (registroId: string, tiempoRealMinutos: number) => void;
  onVerDetalle?: (proyecto: ProyectoVenta) => void;
}

export function ProduccionView({
  onVolver,
  proyectos,
  registros,
  onIniciarProceso,
  onCompletarProceso,
  onVerDetalle,
}: ProduccionViewProps) {
  const [proyectoExpandido, setProyectoExpandido] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Filtrar proyectos en fabricación
  const proyectosEnFabricacion = proyectos.filter(p =>
    p.estado === 'en_fabricacion' || p.estado === 'fabricado'
  );

  const proyectosFiltrados = proyectosEnFabricacion.filter(p => {
    const matchBusqueda = p.proyectoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.clienteNombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchBusqueda;
  });

  // Calcular progreso de un proyecto
  const calcularProgreso = (proyectoId: string) => {
    const regs = registros.filter(r => r.proyectoId === proyectoId);
    if (regs.length === 0) return 0;
    const completados = regs.filter(r => r.estado === 'completado').length;
    return Math.round((completados / regs.length) * 100);
  };

  // Obtener registros de un proyecto
  const getRegistrosProyecto = (proyectoId: string) => {
    return registros.filter(r => r.proyectoId === proyectoId);
  };

  // Agrupar registros por pieza
  const getPiezasDeProyecto = (proyectoId: string) => {
    const regs = getRegistrosProyecto(proyectoId);
    const piezasMap = new Map<string, { nombre: string; registros: RegistroProduccion[] }>();

    for (const r of regs) {
      if (!piezasMap.has(r.piezaId)) {
        piezasMap.set(r.piezaId, { nombre: r.piezaNombre, registros: [] });
      }
      piezasMap.get(r.piezaId)!.registros.push(r);
    }

    return Array.from(piezasMap.entries()).map(([id, data]) => ({
      id,
      nombre: data.nombre,
      registros: data.registros,
    }));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-slate-100 text-slate-600';
      case 'en_proceso': return 'bg-blue-100 text-blue-600';
      case 'pausado': return 'bg-amber-100 text-amber-600';
      case 'completado': return 'bg-green-100 text-green-600';
      case 'retrasado': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En proceso';
      case 'pausado': return 'Pausado';
      case 'completado': return 'Completado';
      case 'retrasado': return 'Retrasado';
      default: return estado;
    }
  };

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
            <p className="text-sm text-slate-500">Proyectos en fabricación</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-slate-500">En fabricación</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {proyectosEnFabricacion.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-slate-500">En proceso</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {registros.filter(r => r.estado === 'en_proceso').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-slate-500">Completados hoy</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {registros.filter(r => {
                if (r.estado !== 'completado' || !r.fechaFin) return false;
                const hoy = new Date().toISOString().split('T')[0];
                return r.fechaFin.startsWith(hoy);
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-slate-500">Retrasados</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {registros.filter(r => r.estado === 'retrasado').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proyecto o cliente..."
          className="pl-9"
        />
      </div>

      {/* Lista de proyectos */}
      <div className="space-y-3">
        {proyectosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Factory className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No hay proyectos en fabricación</p>
            <p className="text-sm">Los proyectos aparecerán aquí cuando se conviertan a venta</p>
          </div>
        ) : (
          proyectosFiltrados.map((proyecto) => {
            const progreso = calcularProgreso(proyecto.id);
            const piezas = getPiezasDeProyecto(proyecto.id);
            const expandido = proyectoExpandido === proyecto.id;

            return (
              <Card key={proyecto.id} className="border-slate-200">
                <CardContent className="p-4">
                  {/* Header del proyecto */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setProyectoExpandido(expandido ? null : proyecto.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-900">{proyecto.proyectoNombre}</span>
                        <Badge className={getEstadoColor(proyecto.estado)}>
                          {proyecto.estado === 'en_fabricacion' ? 'En fabricación' : 'Fabricado'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {proyecto.clienteNombre}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {piezas.reduce((sum, p) => sum + p.registros.filter(r => r.estado === 'completado').length, 0)} / {piezas.reduce((sum, p) => sum + p.registros.length, 0)} procesos
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-900">{progreso}%</span>
                      </div>
                      {expandido ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Progreso */}
                  <Progress value={progreso} className="h-2 mt-3" />

                  {/* Detalle expandido */}
                  {expandido && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                      {piezas.map((pieza) => (
                        <div key={pieza.id}>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">
                            {pieza.nombre}
                          </h4>
                          <div className="space-y-2">
                            {pieza.registros.map((registro) => (
                              <div
                                key={registro.id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className={getEstadoColor(registro.estado)}>
                                    {getEstadoLabel(registro.estado)}
                                  </Badge>
                                  <span className="text-sm text-slate-700">
                                    {registro.procesoNombre}
                                  </span>
                                  {registro.operadorNombre && (
                                    <span className="text-xs text-slate-500">
                                      ({registro.operadorNombre})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right text-sm">
                                    {registro.estado === 'completado' ? (
                                      <>
                                        <span className="text-slate-600">
                                          {registro.tiempoRealMinutos} min
                                        </span>
                                        {registro.tiempoEstimadoMinutos > 0 && (
                                          <span className={`text-xs ml-1 ${
                                            registro.tiempoRealMinutos > registro.tiempoEstimadoMinutos
                                              ? 'text-red-500'
                                              : 'text-green-500'
                                          }`}>
                                            ({Math.round((registro.tiempoRealMinutos / registro.tiempoEstimadoMinutos - 1) * 100)}%)
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-slate-400">
                                        Est: {registro.tiempoEstimadoMinutos} min
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    {registro.estado === 'pendiente' && onIniciarProceso && (
                                      <Button
                                        size="sm"
                                        className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => onIniciarProceso(registro.id)}
                                      >
                                        <Play className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {registro.estado === 'en_proceso' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => {
                                            const tiempo = prompt('Tiempo real en minutos:');
                                            if (tiempo && onCompletarProceso) {
                                              onCompletarProceso(registro.id, parseInt(tiempo));
                                            }
                                          }}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Terminar
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {onVerDetalle && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => onVerDetalle(proyecto)}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Ver comparativa cotización vs real
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
