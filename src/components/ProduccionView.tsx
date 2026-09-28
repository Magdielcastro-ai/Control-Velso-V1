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
  TrendingUp,
  Search,
  ChevronRight,
  ChevronDown,
  User,
  ClipboardList,
  Wrench,
} from 'lucide-react';
import type { ProyectoVenta } from '@/types/ventas';
import { procesosAplanados, materialesAplanados, minutosCotizados } from '@/utils/proyectoDatos';

interface ProduccionViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  onVerDetalle?: (proyecto: ProyectoVenta) => void;
  onVerHojaViajera?: (proyecto: ProyectoVenta) => void;
}

export function ProduccionView({
  onVolver,
  proyectos,
  onVerDetalle,
  onVerHojaViajera,
}: ProduccionViewProps) {
  const [proyectoExpandido, setProyectoExpandido] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Proyectos activos en piso: en fabricación o fabricados pendientes de entrega
  const proyectosEnFabricacion = proyectos.filter(p =>
    p.estado === 'en_fabricacion' || p.estado === 'fabricado'
  );

  const proyectosFiltrados = proyectosEnFabricacion.filter(p => {
    const matchBusqueda = p.proyectoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.clienteNombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchBusqueda;
  });

  // Horas estimadas de un proyecto (desde las piezas de la cotización)
  const horasEstimadas = (proyecto: ProyectoVenta) =>
    procesosAplanados(proyecto).reduce((sum, proc) => sum + minutosCotizados(proc), 0) / 60;

  const totalHorasPiso = proyectosEnFabricacion.reduce((sum, p) => sum + horasEstimadas(p), 0);
  const totalPiezas = proyectosEnFabricacion.reduce((sum, p) => sum + (p.piezas?.length || 0), 0);

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
      <div className="grid grid-cols-3 gap-3">
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
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalHorasPiso.toFixed(1)} h
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
            <p className="text-sm">Los proyectos aparecerán aquí cuando se conviertan a orden</p>
          </div>
        ) : (
          proyectosFiltrados.map((proyecto) => {
            const expandido = proyectoExpandido === proyecto.id;
            const piezas = proyecto.piezas || [];
            const materiales = materialesAplanados(proyecto);

            return (
              <Card key={proyecto.id} className="border-slate-200">
                <CardContent className="p-4">
                  {/* Header del proyecto */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setProyectoExpandido(expandido ? null : proyecto.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-900">{proyecto.proyectoNombre}</span>
                        <Badge className={proyecto.estado === 'en_fabricacion' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                          {proyecto.estado === 'en_fabricacion' ? 'En fabricación' : 'Fabricado'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {proyecto.clienteNombre}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {horasEstimadas(proyecto).toFixed(1)} h estimadas
                        </span>
                        <span>{piezas.length} pieza{piezas.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {expandido ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* Detalle expandido: piezas con material y procesos de la cotización */}
                  {expandido && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                      {piezas.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          Este proyecto no tiene piezas detalladas.
                        </p>
                      ) : (
                        piezas.map((pieza: any) => (
                          <div key={pieza.id} className="border border-slate-200 rounded-lg p-3 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <span className="font-medium text-slate-900">{pieza.nombre}</span>
                                {pieza.codigo && (
                                  <span className="text-xs text-slate-400 ml-2">{pieza.codigo}</span>
                                )}
                              </div>
                              <Badge variant="outline" className="text-slate-600">
                                {pieza.cantidad} pzas
                              </Badge>
                            </div>

                            {/* Material de la pieza */}
                            {pieza.material && (
                              <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-100 rounded p-2">
                                <Package className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium text-amber-900">
                                    {pieza.material.nombre}
                                  </span>
                                  <span className="text-amber-700 text-xs ml-2">
                                    {[
                                      pieza.material.diametro && `⌀${pieza.material.diametro}`,
                                      pieza.material.longitud && `× ${pieza.material.longitud}`,
                                      pieza.material.ancho && `${pieza.material.ancho}×${pieza.material.largo}`,
                                      pieza.material.espesor && `esp. ${pieza.material.espesor}`,
                                      pieza.material.unidadMedida,
                                    ].filter(Boolean).join(' ')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Procesos de la pieza */}
                            <div className="space-y-1.5">
                              {(pieza.procesos || []).map((proc: any) => (
                                <div
                                  key={proc.id}
                                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-sm text-slate-700">{proc.nombre}</span>
                                  </div>
                                  <span className="text-sm text-slate-600">
                                    {proc.tiempoMinutosPorPieza
                                      ? `${proc.tiempoMinutosPorPieza} min/pza`
                                      : `${minutosCotizados(proc)} min`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}

                      {/* Materiales consolidados (si hay a nivel proyecto) */}
                      {materiales.length > 0 && piezas.length === 0 && (
                        <div className="space-y-1.5">
                          {materiales.map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-sm">
                              <Package className="w-3.5 h-3.5 text-amber-600" />
                              <span>{m.nombre}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex gap-2">
                        {onVerHojaViajera && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-slate-300"
                            onClick={() => onVerHojaViajera(proyecto)}
                          >
                            <ClipboardList className="w-3 h-3 mr-1" />
                            Hoja viajera
                          </Button>
                        )}
                        {onVerDetalle && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-slate-300"
                            onClick={() => onVerDetalle(proyecto)}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Cotización vs real
                          </Button>
                        )}
                      </div>
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
