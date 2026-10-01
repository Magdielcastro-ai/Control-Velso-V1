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
  Search,
  ChevronRight,
  ChevronDown,
  User,
  Wrench,
  Save,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProyectoVenta } from '@/types/ventas';
import { procesosAplanados, materialesAplanados, minutosCotizados, buscarReal } from '@/utils/proyectoDatos';
import { HojaViajeraDocumento } from '@/components/HojaViajeraDocumento';

interface ProduccionViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  onGuardarHorasReales?: (proyecto: ProyectoVenta, procesosReales: any[]) => Promise<void> | void;
}

export function ProduccionView({
  onVolver,
  proyectos,
  onGuardarHorasReales,
}: ProduccionViewProps) {
  const [proyectoExpandido, setProyectoExpandido] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  // Línea de captura: minutos + operador + piezas hechas por esa persona
  type LineaCaptura = { minutos: string; operador: string; piezas: string };
  // Captura por proceso: { [proyectoId]: { [captureId]: { lineas } } }
  const [captura, setCaptura] = useState<Record<string, Record<string, { lineas: LineaCaptura[] }>>>({});
  const [guardando, setGuardando] = useState<string | null>(null);
  // Herramientas/dispositivos extra por pieza (afectan el costo real)
  interface ExtraCaptura {
    id: string;
    piezaId: string;
    piezaNombre: string;
    nombre: string;
    minutos: string;
    costo: string;
  }
  const [extras, setExtras] = useState<Record<string, ExtraCaptura[]>>({});
  const [extrasEliminados, setExtrasEliminados] = useState<Record<string, string[]>>({});
  // Pieza seleccionada para imprimir su hoja viajera (orden de producción)
  const [impresion, setImpresion] = useState<{ proyecto: ProyectoVenta; pieza: any } | null>(null);

  // Imprime la hoja viajera de una pieza directo desde producción
  const handleImprimirPieza = (proyecto: ProyectoVenta, pieza: any) => {
    setImpresion({ proyecto, pieza });
    document.body.classList.add('imprimiendo-hoja-viajera');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('imprimiendo-hoja-viajera');
      setImpresion(null);
    }, 100);
  };

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

  // ─── Captura de horas reales + operador, con líneas múltiples ───
  // Cada proceso puede tener varias líneas (varios operadores o varias
  // fechas); el real del proceso es la SUMA de sus líneas y NO afecta
  // las horas cotizadas. La llave es captureId (pieza:proceso).
  const registroGuardado = (proyecto: ProyectoVenta, proc: any): any | null =>
    buscarReal(proyecto.procesosReales, proc);

  const getLineas = (proyecto: ProyectoVenta, proc: any): LineaCaptura[] => {
    const editado = captura[proyecto.id]?.[proc.captureId];
    if (editado !== undefined) return editado.lineas;
    const guardado = registroGuardado(proyecto, proc);
    if (!guardado) return [{ minutos: '', operador: '', piezas: '' }];
    if (Array.isArray(guardado.lineas) && guardado.lineas.length > 0) {
      return guardado.lineas.map((l: any) => ({
        minutos: l.minutos != null ? String(l.minutos) : '',
        operador: l.operador || '',
        piezas: l.piezas != null ? String(l.piezas) : '',
      }));
    }
    return [{
      minutos: guardado.tiempoMinutosReal != null ? String(guardado.tiempoMinutosReal) : '',
      operador: guardado.operadorNombre || '',
      piezas: '',
    }];
  };

  // Escribe una línea arrancando desde lo guardado (no se pisan campos)
  const setLineas = (proyecto: ProyectoVenta, proc: any, lineas: LineaCaptura[]) => {
    setCaptura(prev => ({
      ...prev,
      [proyecto.id]: {
        ...(prev[proyecto.id] || {}),
        [proc.captureId]: { lineas },
      },
    }));
  };

  const actualizarLinea = (proyecto: ProyectoVenta, proc: any, idx: number, campo: 'minutos' | 'operador' | 'piezas', valor: string) => {
    const lineas = getLineas(proyecto, proc).map((l, i) => i === idx ? { ...l, [campo]: valor } : l);
    setLineas(proyecto, proc, lineas);
  };

  const agregarLinea = (proyecto: ProyectoVenta, proc: any) => {
    setLineas(proyecto, proc, [...getLineas(proyecto, proc), { minutos: '', operador: '', piezas: '' }]);
  };

  const quitarLinea = (proyecto: ProyectoVenta, proc: any, idx: number) => {
    const lineas = getLineas(proyecto, proc).filter((_, i) => i !== idx);
    setLineas(proyecto, proc, lineas.length > 0 ? lineas : [{ minutos: '', operador: '', piezas: '' }]);
  };

  const minutosCapturados = (proyecto: ProyectoVenta, proc: any): number =>
    getLineas(proyecto, proc).reduce((s, l) => s + (Number(l.minutos) || 0), 0);

  // Hay capturas sin guardar (difieren de lo persistido)
  const hayCambiosSinGuardar =
    Object.keys(captura).length > 0 ||
    Object.keys(extras).length > 0 ||
    Object.keys(extrasEliminados).length > 0;

  // Cambios pendientes por proyecto (para habilitar su botón Guardar)
  const hayCambiosEn = (proyectoId: string) =>
    !!captura[proyectoId] ||
    !!extras[proyectoId] ||
    (extrasEliminados[proyectoId]?.length ?? 0) > 0;

  const extrasDe = (proyectoId: string): ExtraCaptura[] => extras[proyectoId] || [];

  const extrasDePieza = (proyecto: ProyectoVenta, pieza: any): ExtraCaptura[] => {
    const enCaptura = extrasDe(proyecto.id).filter(e => e.piezaId === pieza.id);
    const guardados = (proyecto.procesosReales || [])
      .filter((g: any) => g.tipo === 'herramienta_extra' && g.piezaId === pieza.id)
      .filter((g: any) => !enCaptura.some(c => c.id === g.id))
      .map((g: any) => ({
        id: g.id,
        piezaId: g.piezaId,
        piezaNombre: g.piezaNombre || pieza.nombre,
        nombre: g.nombre || '',
        minutos: g.tiempoMinutosReal != null ? String(g.tiempoMinutosReal) : '',
        costo: g.costoTotalReal != null ? String(g.costoTotalReal) : '',
      }));
    return [...guardados, ...enCaptura];
  };

  const agregarExtra = (proyecto: ProyectoVenta, pieza: any) => {
    setExtras(prev => ({
      ...prev,
      [proyecto.id]: [
        ...extrasDe(proyecto.id),
        { id: `extra:${pieza.id}:${Date.now()}`, piezaId: pieza.id, piezaNombre: pieza.nombre, nombre: '', minutos: '', costo: '' },
      ],
    }));
  };

  const actualizarExtra = (proyecto: ProyectoVenta, pieza: any, extraId: string, campo: 'nombre' | 'minutos' | 'costo', valor: string) => {
    setExtras(prev => {
      const lista = [...extrasDe(proyecto.id)];
      const idx = lista.findIndex(e => e.id === extraId);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], [campo]: valor };
      } else {
        // El extra viene de lo guardado: sembrarlo en captura con el cambio
        const guardado = extrasDePieza(proyecto, pieza).find(e => e.id === extraId);
        if (guardado) lista.push({ ...guardado, [campo]: valor });
      }
      return { ...prev, [proyecto.id]: lista };
    });
  };

  const quitarExtra = (proyecto: ProyectoVenta, extraId: string) => {
    // Quitar de la captura local
    setExtras(prev => ({
      ...prev,
      [proyecto.id]: extrasDe(proyecto.id).filter(e => e.id !== extraId),
    }));
    // Si venía de lo ya guardado, marcarlo para eliminación al guardar
    const estabaGuardado = (proyecto.procesosReales || []).some((g: any) => g.id === extraId);
    if (estabaGuardado) {
      setExtrasEliminados(prev => ({
        ...prev,
        [proyecto.id]: [...(prev[proyecto.id] || []), extraId],
      }));
    }
  };

  const handleVolverSeguro = () => {
    if (hayCambiosSinGuardar) {
      const salir = confirm('Hay capturas sin guardar. ¿Salir sin guardar?\n\nAceptar = salir sin guardar · Cancelar = quedarse para guardar');
      if (!salir) return;
    }
    onVolver();
  };

  const handleGuardarHoras = async (proyecto: ProyectoVenta) => {
    if (!onGuardarHorasReales) return;

    // Nuevas entradas desde la captura (procesos cotizados con tiempo real)
    const nuevas = procesosAplanados(proyecto)
      .map((p: any) => {
        const lineas = getLineas(proyecto, p).filter(l => l.minutos !== '');
        if (lineas.length === 0) return null; // sin captura: no se envía
        const minutos = lineas.reduce((s, l) => s + (Number(l.minutos) || 0), 0);
        const operadores = [...new Set(lineas.map(l => l.operador.trim()).filter(Boolean))];
        const minCot = minutosCotizados(p);
        const costoCot = Number(p.costoTotal ?? p.costoTotalCotizado) || 0;
        // Costo real PROPORCIONAL al cotizado: mismos minutos = mismo costo.
        // Más minutos = más costo (baja utilidad); menos = sube.
        const costoTotalReal = minCot > 0 ? (minutos / minCot) * costoCot : costoCot;
        return {
          id: p.captureId,           // llave compuesta pieza:proceso
          procesoId: p.id,
          nombre: p.nombre,
          tipo: p.tipo,
          piezaId: p.piezaId || null,
          piezaNombre: p.piezaNombre,
          tiempoMinutosCotizado: minCot,
          tiempoMinutosReal: minutos,
          operadorNombre: operadores.join(' / '),
          lineas: lineas.map(l => ({
            minutos: Number(l.minutos) || 0,
            operador: l.operador.trim(),
            piezas: Number(l.piezas) || 0,
          })),
          piezasReal: lineas.reduce((s, l) => s + (Number(l.piezas) || 0), 0),
          costoPorHora: Number(p.costoPorHora) || 0,
          costoManoObra: Number(p.costoManoObra) || 0,
          costoTotalCotizado: costoCot,
          costoTotalReal,
        };
      })
      .filter(Boolean) as any[];

    // Extras (herramientas/dispositivos) capturados por pieza
    const extras = extrasDe(proyecto.id)
      .filter(e => e.nombre.trim() !== '')
      .map((e) => ({
        id: e.id,
        nombre: e.nombre.trim(),
        tipo: 'herramienta_extra',
        piezaId: e.piezaId,
        piezaNombre: e.piezaNombre,
        tiempoMinutosCotizado: 0,
        tiempoMinutosReal: Number(e.minutos) || 0,
        operadorNombre: '',
        costoPorHora: 0,
        costoManoObra: 0,
        costoTotalCotizado: 0,
        costoTotalReal: Number(e.costo) || 0,
      }));

    // Fusionar con lo ya guardado: no pisar procesos que no se tocaron
    // ni extras que no se eliminaron. Las entradas viejas (id plano) se
    // normalizan a llave compuesta para que no colisionen en el upsert.
    const eliminados = new Set(extrasEliminados[proyecto.id] || []);
    const clavesNuevas = new Set([...nuevas, ...extras].map(e => e.id));
    const claveDe = (e: any) => e.id?.includes(':') ? e.id : (e.piezaId ? `${e.piezaId}:${e.id}` : e.id);
    const existentesIntactos = (proyecto.procesosReales || [])
      .filter((e: any) => !clavesNuevas.has(claveDe(e)) && !eliminados.has(e.id))
      .map((e: any) => ({ ...e, id: claveDe(e) }));
    const procesosReales = [...existentesIntactos, ...nuevas, ...extras];

    if (nuevas.length === 0 && extras.length === 0 && eliminados.size === 0) {
      toast.error('Captura al menos una hora real o herramienta antes de guardar');
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
    setExtras(prev => {
      const nuevo = { ...prev };
      delete nuevo[proyecto.id];
      return nuevo;
    });
    setExtrasEliminados(prev => {
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
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-slate-600">
                                  {pieza.cantidad} pzas
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 border-slate-300 no-print"
                                  title="Imprimir hoja viajera de esta pieza"
                                  onClick={() => handleImprimirPieza(proyecto, pieza)}
                                >
                                  <Printer className="w-3.5 h-3.5 mr-1" />
                                  Hoja viajera
                                </Button>
                              </div>
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

                            {/* Procesos de la pieza: cotizado (fijo) + líneas reales */}
                            <div className="space-y-1.5">
                              {(pieza.procesos || []).map((proc: any) => {
                                const procConLlave = { ...proc, captureId: `${pieza.id}:${proc.id}`, piezaId: pieza.id, piezaNombre: pieza.nombre };
                                const regGuardado = registroGuardado(proyecto, procConLlave);
                                const lineas = getLineas(proyecto, procConLlave);
                                const totalCot = minutosCotizados(proc);
                                const totalReal = minutosCapturados(proyecto, procConLlave);
                                return (
                                  <div key={proc.id} className="p-2 bg-slate-50 rounded-lg space-y-1.5">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="text-sm text-slate-700 truncate">{proc.nombre}</span>
                                        {regGuardado && (
                                          <span className="text-[10px] text-green-600" title="Ya capturado — puedes corregirlo y volver a guardar">✓</span>
                                        )}
                                      </div>
                                      <span
                                        className="text-xs text-slate-500"
                                        title="Horas cotizadas — no modificables"
                                      >
                                        {proc.tiempoMinutosPorPieza
                                          ? `${proc.tiempoMinutosPorPieza} min/pza · ${totalCot} min totales`
                                          : `${totalCot} min`} cotizado
                                        {totalReal > 0 && (
                                          <span className={`ml-2 font-medium ${totalReal > totalCot ? 'text-red-600' : 'text-green-600'}`}>
                                            · {totalReal} min reales
                                          </span>
                                        )}
                                      </span>
                                    </div>

                                    {onGuardarHorasReales && (
                                      <div className="space-y-1">
                                        {lineas.map((linea, idx) => (
                                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                                            <Input
                                              type="number"
                                              min="0"
                                              placeholder="min reales"
                                              value={linea.minutos}
                                              onChange={(e) => actualizarLinea(proyecto, procConLlave, idx, 'minutos', e.target.value)}
                                              className="h-7 w-24 text-sm text-right"
                                            />
                                            <Input
                                              type="text"
                                              placeholder="Operador"
                                              value={linea.operador}
                                              onChange={(e) => actualizarLinea(proyecto, procConLlave, idx, 'operador', e.target.value)}
                                              className="h-7 w-28 text-sm"
                                            />
                                            <Input
                                              type="number"
                                              min="0"
                                              placeholder="pzas"
                                              title="Piezas que hizo esta persona en este proceso"
                                              value={linea.piezas}
                                              onChange={(e) => actualizarLinea(proyecto, procConLlave, idx, 'piezas', e.target.value)}
                                              className="h-7 w-16 text-sm text-right"
                                            />
                                            {lineas.length > 1 && (
                                              <button
                                                onClick={() => quitarLinea(proyecto, procConLlave, idx)}
                                                className="text-red-400 hover:text-red-600 text-xs px-1"
                                                title="Quitar línea"
                                              >
                                                ✕
                                              </button>
                                            )}
                                            {idx === lineas.length - 1 && (
                                              <button
                                                onClick={() => agregarLinea(proyecto, procConLlave)}
                                                className="text-blue-600 hover:text-blue-700 text-xs px-1"
                                                title="Agregar línea (otro operador u otra fecha)"
                                              >
                                                + línea
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Herramientas / dispositivos extra de la pieza */}
                            {onGuardarHorasReales && (
                              <div className="border border-dashed border-slate-300 rounded-lg p-2 space-y-1.5">
                                <p className="text-xs font-semibold text-slate-500">
                                  Herramientas o dispositivos extra (suman al costo)
                                </p>
                                {extrasDePieza(proyecto, pieza).map((extra) => (
                                  <div key={extra.id} className="flex items-center gap-2 flex-wrap">
                                    <Input
                                      placeholder="Herramienta / dispositivo"
                                      value={extra.nombre}
                                      onChange={(e) => actualizarExtra(proyecto, pieza, extra.id, 'nombre', e.target.value)}
                                      className="h-7 flex-1 min-w-[140px] text-sm"
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="min"
                                      value={extra.minutos}
                                      onChange={(e) => actualizarExtra(proyecto, pieza, extra.id, 'minutos', e.target.value)}
                                      className="h-7 w-20 text-sm text-right"
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="$ costo"
                                      value={extra.costo}
                                      onChange={(e) => actualizarExtra(proyecto, pieza, extra.id, 'costo', e.target.value)}
                                      className="h-7 w-24 text-sm text-right"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                      onClick={() => quitarExtra(proyecto, extra.id)}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-blue-600"
                                  onClick={() => agregarExtra(proyecto, pieza)}
                                >
                                  + Agregar herramienta
                                </Button>
                              </div>
                            )}
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

                      {/* Acciones — producción no navega a Proyectos;
                          Guardar solo se habilita cuando hay cambios */}
                      <div className="flex gap-2 flex-wrap">
                        {onGuardarHorasReales && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={guardando === proyecto.id || !hayCambiosEn(proyecto.id)}
                            title={hayCambiosEn(proyecto.id) ? 'Guardar capturas' : 'No hay cambios por guardar'}
                            onClick={() => handleGuardarHoras(proyecto)}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {guardando === proyecto.id ? 'Guardando...' : 'Guardar horas reales'}
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

      {/* Documento de impresión: hoja viajera de la pieza seleccionada */}
      {impresion && (
        <HojaViajeraDocumento
          proyecto={impresion.proyecto}
          pieza={impresion.pieza}
        />
      )}
    </div>
  );
}
