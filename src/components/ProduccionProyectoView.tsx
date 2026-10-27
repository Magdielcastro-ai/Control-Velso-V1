import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Package,
  Clock,
  Printer,
  Save,
  Wrench,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProyectoVenta } from '@/types/ventas';
import { procesosAplanados, minutosCotizados, buscarReal } from '@/utils/proyectoDatos';
import { HojaViajeraDocumento } from '@/components/HojaViajeraDocumento';
import { AgregarPiezaWizard } from '@/components/AgregarPiezaWizard';
import { EditarProcesosPiezaDialog } from '@/components/EditarProcesosPiezaDialog';
import type { CatalogoMaterial } from '@/types/cotizacion';

interface ProduccionProyectoViewProps {
  proyecto: ProyectoVenta;
  onVolver: () => void;
  onGuardarHorasReales?: (proyecto: ProyectoVenta, procesosReales: any[]) => Promise<void> | void;
  // Captura de piezas (proyectos directos) — wizard con material y procesos
  onActualizarPiezasProyecto?: (id: string, piezas: any[]) => Promise<boolean> | void;
  catalogoMateriales?: CatalogoMaterial[];
  // Material nuevo capturado en el wizard → se guarda al catálogo
  onAgregarMaterialACatalogo?: (material: any) => Promise<any> | void;
  // Marcar fabricado se hace DESDE Producción
  onMarcarFabricado?: (id: string) => void;
}

// Línea de captura: minutos + operador + piezas hechas por esa persona
type LineaCaptura = { minutos: string; operador: string; piezas: string };

interface ExtraCaptura {
  id: string;
  piezaId: string;
  piezaNombre: string;
  nombre: string;
  minutos: string;
  costo: string;
}

// Vista DEDICADA de un proyecto en Producción: captura de horas reales,
// herramientas extra, hoja viajera imprimible y (en proyectos directos)
// el wizard para agregar piezas. Los proyectos se marcan como fabricados
// desde aquí — no desde Proyectos.
export function ProduccionProyectoView({
  proyecto,
  onVolver,
  onGuardarHorasReales,
  onActualizarPiezasProyecto,
  catalogoMateriales = [],
  onAgregarMaterialACatalogo,
  onMarcarFabricado,
}: ProduccionProyectoViewProps) {
  const esDirecto = proyecto.tipoOrigen === 'urgencia' || proyecto.tipoOrigen === 'stock';
  // Solo editable mientras esté EN FABRICACIÓN (terminado = solo lectura)
  const editable = proyecto.estado === 'en_fabricacion' && !!onGuardarHorasReales;

  const [captura, setCaptura] = useState<Record<string, { lineas: LineaCaptura[] }>>({});
  const [extras, setExtras] = useState<ExtraCaptura[]>([]);
  const [extrasEliminados, setExtrasEliminados] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [wizardPieza, setWizardPieza] = useState(false);
  const [editandoPieza, setEditandoPieza] = useState<any | null>(null);
  const [impresion, setImpresion] = useState<any | null>(null);

  // Imprime la hoja viajera de una pieza (orden de producción)
  const handleImprimirPieza = (pieza: any) => {
    setImpresion(pieza);
    document.body.classList.add('imprimiendo-hoja-viajera');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('imprimiendo-hoja-viajera');
      setImpresion(null);
    }, 100);
  };

  // ─── Captura de horas reales + operador, con líneas múltiples ───
  const registroGuardado = (proc: any): any | null => buscarReal(proyecto.procesosReales, proc);

  const getLineas = (proc: any): LineaCaptura[] => {
    const editado = captura[proc.captureId];
    if (editado !== undefined) return editado.lineas;
    const guardado = registroGuardado(proc);
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

  const setLineas = (proc: any, lineas: LineaCaptura[]) => {
    setCaptura(prev => ({ ...prev, [proc.captureId]: { lineas } }));
  };

  const actualizarLinea = (proc: any, idx: number, campo: 'minutos' | 'operador' | 'piezas', valor: string) => {
    setLineas(proc, getLineas(proc).map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };

  const agregarLinea = (proc: any) => {
    setLineas(proc, [...getLineas(proc), { minutos: '', operador: '', piezas: '' }]);
  };

  const quitarLinea = (proc: any, idx: number) => {
    const lineas = getLineas(proc).filter((_, i) => i !== idx);
    setLineas(proc, lineas.length > 0 ? lineas : [{ minutos: '', operador: '', piezas: '' }]);
  };

  const minutosCapturados = (proc: any): number =>
    getLineas(proc).reduce((s, l) => s + (Number(l.minutos) || 0), 0);

  const hayCambiosSinGuardar =
    Object.keys(captura).length > 0 || extras.length > 0 || extrasEliminados.length > 0;

  const extrasDePieza = (pieza: any): ExtraCaptura[] => {
    const guardados = (proyecto.procesosReales || [])
      .filter((g: any) => g.tipo === 'herramienta_extra' && g.piezaId === pieza.id)
      .filter((g: any) => !extras.some(c => c.id === g.id))
      .map((g: any) => ({
        id: g.id,
        piezaId: g.piezaId,
        piezaNombre: g.piezaNombre || pieza.nombre,
        nombre: g.nombre || '',
        minutos: g.tiempoMinutosReal != null ? String(g.tiempoMinutosReal) : '',
        costo: g.costoTotalReal != null ? String(g.costoTotalReal) : '',
      }));
    return [...guardados, ...extras.filter(e => e.piezaId === pieza.id)];
  };

  const agregarExtra = (pieza: any) => {
    setExtras(prev => [...prev, {
      id: `extra:${pieza.id}:${Date.now()}`,
      piezaId: pieza.id,
      piezaNombre: pieza.nombre,
      nombre: '', minutos: '', costo: '',
    }]);
  };

  const actualizarExtra = (pieza: any, extraId: string, campo: 'nombre' | 'minutos' | 'costo', valor: string) => {
    const idx = extras.findIndex(e => e.id === extraId);
    if (idx >= 0) {
      setExtras(prev => prev.map(e => e.id === extraId ? { ...e, [campo]: valor } : e));
    } else {
      const guardado = extrasDePieza(pieza).find(e => e.id === extraId);
      if (guardado) setExtras(prev => [...prev, { ...guardado, [campo]: valor }]);
    }
  };

  const quitarExtra = (extraId: string) => {
    setExtras(prev => prev.filter(e => e.id !== extraId));
    const estabaGuardado = (proyecto.procesosReales || []).some((g: any) => g.id === extraId);
    if (estabaGuardado) setExtrasEliminados(prev => [...prev, extraId]);
  };

  const handleVolverSeguro = () => {
    if (hayCambiosSinGuardar) {
      const salir = confirm('Hay capturas sin guardar. ¿Salir sin guardar?\n\nAceptar = salir sin guardar · Cancelar = quedarse para guardar');
      if (!salir) return;
    }
    onVolver();
  };

  const handleGuardarHoras = async () => {
    if (!onGuardarHorasReales) return;

    const nuevas = procesosAplanados(proyecto)
      .map((p: any) => {
        const lineas = getLineas(p).filter(l => l.minutos !== '');
        if (lineas.length === 0) return null;
        const minutos = lineas.reduce((s, l) => s + (Number(l.minutos) || 0), 0);
        const operadores = [...new Set(lineas.map(l => l.operador.trim()).filter(Boolean))];
        const minCot = minutosCotizados(p);
        const costoCot = Number(p.costoTotal ?? p.costoTotalCotizado) || 0;
        // Costo real PROPORCIONAL al cotizado: mismos minutos = mismo costo
        const costoTotalReal = minCot > 0 ? (minutos / minCot) * costoCot : costoCot;
        return {
          id: p.captureId,
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

    const extrasFinales = extras
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
        // En Producción solo se captura tiempo; el costo se asigna en Proyectos
        costoTotalReal: 0,
      }));

    // Fusionar con lo ya guardado: no pisar procesos que no se tocaron
    const eliminados = new Set(extrasEliminados);
    const clavesNuevas = new Set([...nuevas, ...extrasFinales].map(e => e.id));
    const claveDe = (e: any) => e.id?.includes(':') ? e.id : (e.piezaId ? `${e.piezaId}:${e.id}` : e.id);
    const existentesIntactos = (proyecto.procesosReales || [])
      .filter((e: any) => !clavesNuevas.has(claveDe(e)) && !eliminados.has(e.id))
      .map((e: any) => ({ ...e, id: claveDe(e) }));
    const procesosReales = [...existentesIntactos, ...nuevas, ...extrasFinales];

    if (nuevas.length === 0 && extrasFinales.length === 0 && eliminados.size === 0) {
      toast.error('Captura al menos una hora real o herramienta antes de guardar');
      return;
    }

    setGuardando(true);
    await onGuardarHorasReales(proyecto, procesosReales);
    setCaptura({});
    setExtras([]);
    setExtrasEliminados([]);
    setGuardando(false);
  };

  // Agregar pieza con wizard: la NUEVA queda hasta arriba (las más
  // recientes primero, las antiguas se recorren hacia abajo)
  const handleAgregarPieza = async (pieza: any) => {
    if (!onActualizarPiezasProyecto) return;
    await onActualizarPiezasProyecto(proyecto.id, [pieza, ...(proyecto.piezas || [])]);
    toast.success(`Pieza "${pieza.nombre}" agregada al proyecto`);
  };

  // Guardar procesos editados de una pieza existente (urgencia/stock):
  // agregar/quitar procesos y ajustar minutos conforme se fabrica. Los ids
  // existentes se conservan para no perder las capturas reales
  const handleGuardarProcesosPieza = async (pieza: any, procesos: any[]) => {
    if (!onActualizarPiezasProyecto) return;
    const nuevasPiezas = (proyecto.piezas || []).map((pz: any) =>
      pz.id === pieza.id ? { ...pz, procesos } : pz
    );
    await onActualizarPiezasProyecto(proyecto.id, nuevasPiezas);
    toast.success(`Procesos de "${pieza.nombre}" actualizados`);
  };

  // Alerta del navegador si hay capturas sin guardar
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

  const piezas = proyecto.piezas || [];
  const horasEstimadas = procesosAplanados(proyecto).reduce((sum, proc) => sum + minutosCotizados(proc), 0) / 60;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleVolverSeguro} className="border-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{proyecto.codigoProyecto || proyecto.proyectoNombre}</h2>
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
            <p className="text-sm text-slate-500">
              {proyecto.proyectoNombre} · {proyecto.clienteNombre} · {piezas.length} pieza{piezas.length !== 1 ? 's' : ''} · {horasEstimadas.toFixed(1)}h estimadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Agregar pieza (wizard) — proyectos directos, solo en fabricación */}
          {esDirecto && editable && onActualizarPiezasProyecto && (
            <Button size="sm" onClick={() => setWizardPieza(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Pieza
            </Button>
          )}
          {/* Marcar fabricado: se hace DESDE Producción */}
          {proyecto.estado === 'en_fabricacion' && onMarcarFabricado && (
            <Button
              size="sm"
              onClick={() => {
                if (hayCambiosSinGuardar) {
                  toast.error('Guarda las capturas pendientes antes de marcar como fabricado');
                  return;
                }
                if (confirm(`¿Marcar ${proyecto.codigoProyecto} como TERMINADO?\n\nDespués de esto los tiempos quedan bloqueados.`)) {
                  onMarcarFabricado(proyecto.id);
                  onVolver();
                }
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Package className="w-4 h-4 mr-1" />
              Marcar Terminado
            </Button>
          )}
        </div>
      </div>

      {/* Piezas del proyecto */}
      {piezas.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Este proyecto no tiene piezas registradas.</p>
            {esDirecto && editable && (
              <p className="text-sm">Usa el botón "Agregar Pieza" para registrar la primera.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {piezas.map((pieza: any) => (
            <Card key={pieza.id} className="border-slate-200">
              <CardContent className="p-3 space-y-3">
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
                    {/* Editar procesos de la pieza (urgencia/stock, en fabricación) */}
                    {esDirecto && editable && onActualizarPiezasProyecto && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-blue-300 text-blue-700 hover:bg-blue-50 no-print"
                        title="Agregar, quitar o ajustar procesos de esta pieza"
                        onClick={() => setEditandoPieza(pieza)}
                      >
                        <Wrench className="w-3.5 h-3.5 mr-1" />
                        Procesos
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-slate-300 no-print"
                      title="Imprimir hoja viajera de esta pieza"
                      onClick={() => handleImprimirPieza(pieza)}
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Hoja viajera
                    </Button>
                  </div>
                </div>

                {/* Imagen de la pieza */}
                {pieza.imagen && (
                  <img
                    src={pieza.imagen}
                    alt={pieza.nombre}
                    className="max-h-36 object-contain rounded border border-slate-200 bg-white"
                  />
                )}

                {/* Material de la pieza */}
                {pieza.material && (
                  <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-100 rounded p-2">
                    <Package className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-amber-900">{pieza.material.nombre}</span>
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
                    const regGuardado = registroGuardado(procConLlave);
                    const lineas = getLineas(procConLlave);
                    const totalCot = minutosCotizados(proc);
                    const totalReal = minutosCapturados(procConLlave);
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
                          <span className="text-xs text-slate-500" title="Horas cotizadas — no modificables">
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

                        {editable && (
                          <div className="space-y-1">
                            {lineas.map((linea, idx) => (
                              <div key={idx} className="flex items-center gap-2 flex-wrap">
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="min reales"
                                  value={linea.minutos}
                                  onChange={(e) => actualizarLinea(procConLlave, idx, 'minutos', e.target.value)}
                                  className="h-7 w-24 text-sm text-right"
                                />
                                <Input
                                  type="text"
                                  placeholder="Operador"
                                  value={linea.operador}
                                  onChange={(e) => actualizarLinea(procConLlave, idx, 'operador', e.target.value)}
                                  className="h-7 w-28 text-sm"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="pzas"
                                  title="Piezas que hizo esta persona en este proceso"
                                  value={linea.piezas}
                                  onChange={(e) => actualizarLinea(procConLlave, idx, 'piezas', e.target.value)}
                                  className="h-7 w-16 text-sm text-right"
                                />
                                {lineas.length > 1 && (
                                  <button
                                    onClick={() => quitarLinea(procConLlave, idx)}
                                    className="text-red-400 hover:text-red-600 text-xs px-1"
                                    title="Quitar línea"
                                  >
                                    ✕
                                  </button>
                                )}
                                {idx === lineas.length - 1 && (
                                  <button
                                    onClick={() => agregarLinea(procConLlave)}
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

                {/* Herramientas / dispositivos extra de la pieza:
                    en Producción SOLO se captura el TIEMPO — el costo se
                    asigna después en la sección de Proyectos */}
                {editable && (
                  <div className="border border-dashed border-slate-300 rounded-lg p-2 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500">
                      Herramientas o dispositivos extra (solo tiempo; el costo se asigna en Proyectos)
                    </p>
                    {extrasDePieza(pieza).map((extra) => (
                      <div key={extra.id} className="flex items-center gap-2 flex-wrap">
                        <Input
                          placeholder="Herramienta / dispositivo"
                          value={extra.nombre}
                          onChange={(e) => actualizarExtra(pieza, extra.id, 'nombre', e.target.value)}
                          className="h-7 flex-1 min-w-[140px] text-sm"
                        />
                        <Input
                          type="number"
                          min="0"
                          placeholder="min"
                          value={extra.minutos}
                          onChange={(e) => actualizarExtra(pieza, extra.id, 'minutos', e.target.value)}
                          className="h-7 w-20 text-sm text-right"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                          onClick={() => quitarExtra(extra.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-blue-600"
                      onClick={() => agregarExtra(pieza)}
                    >
                      + Agregar herramienta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Guardar: solo habilitado cuando hay cambios */}
      {editable && (
        <div className="flex gap-2 flex-wrap no-print">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={guardando || !hayCambiosSinGuardar}
            title={hayCambiosSinGuardar ? 'Guardar capturas' : 'No hay cambios por guardar'}
            onClick={handleGuardarHoras}
          >
            <Save className="w-3 h-3 mr-1" />
            {guardando ? 'Guardando...' : 'Guardar horas reales'}
          </Button>
        </div>
      )}
      {!editable && proyecto.estado !== 'en_fabricacion' && (
        <p className="text-xs text-slate-400 text-center no-print">
          <Clock className="w-3 h-3 inline mr-1" />
          Proyecto terminado — los tiempos quedaron bloqueados. Solo un admin puede regresarlo a fabricación desde Proyectos.
        </p>
      )}

      {/* Wizard: agregar pieza (proyectos directos) */}
      <AgregarPiezaWizard
        open={wizardPieza}
        onOpenChange={setWizardPieza}
        catalogoMateriales={catalogoMateriales}
        onGuardar={handleAgregarPieza}
        onAgregarMaterialACatalogo={onAgregarMaterialACatalogo}
      />

      {/* Diálogo: editar procesos de una pieza existente */}
      <EditarProcesosPiezaDialog
        pieza={editandoPieza}
        open={editandoPieza !== null}
        onOpenChange={(open) => { if (!open) setEditandoPieza(null); }}
        onGuardar={async (procesos) => {
          if (editandoPieza) await handleGuardarProcesosPieza(editandoPieza, procesos);
        }}
      />

      {/* Documento de impresión: hoja viajera de la pieza seleccionada */}
      {impresion && (
        <HojaViajeraDocumento proyecto={proyecto} pieza={impresion} />
      )}
    </div>
  );
}
