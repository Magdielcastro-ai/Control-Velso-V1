import { useState, useEffect } from 'react';
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
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProyectoVenta } from '@/types/ventas';
import { procesosAplanados, materialesAplanados, minutosCotizados } from '@/utils/proyectoDatos';

interface ProduccionViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  onVerDetalle?: (proyecto: ProyectoVenta) => void;
  onVerHojaViajera?: (proyecto: ProyectoVenta) => void;
  onGuardarHorasReales?: (proyecto: ProyectoVenta, procesosReales: any[]) => Promise<void> | void;
}

export function ProduccionView({
  onVolver,
  proyectos,
  onVerDetalle,
  onVerHojaViajera,
  onGuardarHorasReales,
}: ProduccionViewProps) {
  const [proyectoExpandido, setProyectoExpandido] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  // Captura por proceso: { [proyectoId]: { [procesoId]: { minutos, operador } } }
  const [captura, setCaptura] = useState<Record<string, Record<string, { minutos: string; operador: string }>>>({});
  const [guardando, setGuardando] = useState<string | null>(null);

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

  // ─── Captura de horas reales + operador ───
  // Las horas cotizadas son de solo lectura; las reales se capturan,
  // pueden guardarse parcialmente y corregirse las ya guardadas.
  const registroGuardado = (proyecto: ProyectoVenta, procesoId: string): any | null => {
    return (proyecto.procesosReales || []).find((p: any) => p.id === procesoId) || null;
  };

  const getCaptura = (proyecto: ProyectoVenta, procesoId: string): { minutos: string; operador: string } => {
    const editado = captura[proyecto.id]?.[procesoId];
    if (editado !== undefined) return editado;
    const guardado = registroGuardado(proyecto, procesoId);
    return {
      minutos: guardado?.tiempoMinutosReal != null ? String(guardado.tiempoMinutosReal) : '',
      operador: guardado?.operadorNombre || '',
    };
  };

  const actualizarCaptura = (proyectoId: string, procesoId: string, campo: 'minutos' | 'operador', valor: string) => {
    setCaptura(prev => {
      const actual = prev[proyectoId]?.[procesoId] || { minutos: '', operador: '' };
      // Rellenar el otro campo con lo ya guardado para no pisarlo
      return {
        ...prev,
        [proyectoId]: {
          ...(prev[proyectoId] || {}),
          [procesoId]: { ...actual, [campo]: valor },
        },
      };
    });
  };

  // Hay capturas sin guardar (difieren de lo persistido)
  const hayCambiosSinGuardar = Object.keys(captura).length > 0;

  const handleVolverSeguro = () => {
    if (hayCambiosSinGuardar) {
      const salir = confirm('Hay capturas sin guardar. ¿Salir sin guardar?\n\nAceptar = salir sin guardar · Cancelar = quedarse para guardar');
      if (!salir) return;
    }
    onVolver();
  };

  const handleGuardarHoras = async (proyecto: ProyectoVenta) => {
    if (!onGuardarHorasReales) return;
    const procesosReales = procesosAplanados(proyecto)
      .map((p: any) => {
        const cap = getCaptura(proyecto, p.id);
        if (cap.minutos === '') return null; // sin captura: no se envía
        const minutos = Number(cap.minutos) || 0;
        return {
          id: p.id,
          nombre: p.nombre,
          tipo: p.tipo,
          piezaId: p.piezaId || null,
          piezaNombre: p.piezaNombre,
          tiempoMinutosCotizado: minutosCotizados(p),
          tiempoMinutosReal: minutos,
          operadorNombre: cap.operador.trim(),
          costoPorHora: Number(p.costoPorHora) || 0,
          costoManoObra: Number(p.costoManoObra) || 0,
          costoTotalCotizado: Number(p.costoTotal ?? p.costoTotalCotizado) || 0,
          costoTotalReal: (minutos / 60) * (Number(p.costoPorHora) || 0) + (Number(p.costoManoObra) || 0),
        };
      })
      .filter(Boolean);

    if (procesosReales.length === 0) {
      toast.error('Captura al menos una hora real antes de guardar');
      return;
    }

    setGuardando(proyecto.id);
    await onGuardarHorasReales(proyecto, procesosReales);
    // Limpiar la captura local de este proyecto (ya quedó persistida)
    setCaptura(prev => {
      const nuevo = { ...prev };
      delete nuevo[proyecto.id];
      return nuevo;
    });
    setGuardando(null);
  };

  // Alerta del navegador si hay capturas sin guardar y se cierra/recarga
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hayCambiosSinGuardar) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hayCambiosSinGuardar]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleVolverSeguro} className="border-slate-300">
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

                            {/* Procesos de la pieza: cotizado (fijo) + captura real + operador */}
                            <div className="space-y-1.5">
                              {(pieza.procesos || []).map((proc: any) => {
                                const regGuardado = registroGuardado(proyecto, proc.id);
                                const cap = getCaptura(proyecto, proc.id);
                                return (
                                  <div
                                    key={proc.id}
                                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg gap-2 flex-wrap"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="text-sm text-slate-700 truncate">{proc.nombre}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className="text-sm text-slate-500"
                                        title="Horas cotizadas — no modificables"
                                      >
                                        {proc.tiempoMinutosPorPieza
                                          ? `${proc.tiempoMinutosPorPieza} min/pza`
                                          : `${minutosCotizados(proc)} min`} cotizado
                                      </span>
                                      {onGuardarHorasReales && (
                                        <>
                                          <Input
                                            type="number"
                                            min="0"
                                            placeholder="min reales"
                                            value={cap.minutos}
                                            onChange={(e) => actualizarCaptura(proyecto.id, proc.id, 'minutos', e.target.value)}
                                            className="h-7 w-24 text-sm text-right"
                                          />
                                          <Input
                                            type="text"
                                            placeholder="Operador"
                                            value={cap.operador}
                                            onChange={(e) => actualizarCaptura(proyecto.id, proc.id, 'operador', e.target.value)}
                                            className="h-7 w-28 text-sm"
                                          />
                                          {regGuardado && (
                                            <span className="text-[10px] text-green-600" title="Ya capturado — puedes corregirlo y volver a guardar">
                                              ✓
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
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
                      <div className="flex gap-2 flex-wrap">
                        {onGuardarHorasReales && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={guardando === proyecto.id}
                            onClick={() => handleGuardarHoras(proyecto)}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {guardando === proyecto.id ? 'Guardando...' : 'Guardar horas reales'}
                          </Button>
                        )}
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
