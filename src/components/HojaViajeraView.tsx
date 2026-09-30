import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Printer, 
  Package, 
  Clock, 
  Factory,
  Hash,
  
  
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { ProyectoVenta } from '@/types/ventas';

interface HojaViajeraViewProps {
  proyecto: ProyectoVenta;
  onVolver: () => void;
}

export function HojaViajeraView({ proyecto, onVolver }: HojaViajeraViewProps) {
  const [piezaExpandida, setPiezaExpandida] = useState<string | null>(null);
  const [piezaAImprimir, setPiezaAImprimir] = useState<any | null>(null);

  const togglePieza = (piezaId: string) => {
    setPiezaExpandida(piezaExpandida === piezaId ? null : piezaId);
  };

  // Imprime la hoja viajera de UNA pieza con espacios en blanco
  // para capturar las horas reales a mano en piso
  const handleImprimirPieza = (pieza: any) => {
    setPiezaAImprimir(pieza);
    document.body.classList.add('imprimiendo-hoja-viajera');
    // Esperar a que React pinte el área de impresión
    setTimeout(() => {
      window.print();
      document.body.classList.remove('imprimiendo-hoja-viajera');
      setPiezaAImprimir(null);
    }, 100);
  };

  const handleImprimir = () => {
    window.print();
  };

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Registro real capturado en producción para un proceso (si existe)
  const realDe = (procesoId: string): any | null =>
    (proyecto.procesosReales || []).find((p: any) => p.id === procesoId) || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 no-print">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Hoja Viajera</h2>
          <p className="text-slate-500">
            {proyecto.codigoProyecto} · {proyecto.proyectoNombre}
          </p>
        </div>
        <Button onClick={handleImprimir} variant="outline" className="border-slate-300">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Info del Proyecto */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Código Proyecto</p>
              <p className="font-semibold text-lg">{proyecto.codigoProyecto}</p>
            </div>
            <div>
              <p className="text-slate-500">Cliente</p>
              <p className="font-semibold">{proyecto.clienteNombre}</p>
            </div>
            <div>
              <p className="text-slate-500">Orden de Compra</p>
              <p className="font-semibold">{proyecto.ordenCompra}</p>
            </div>
            <div>
              <p className="text-slate-500">Cotización</p>
              <p className="font-semibold">{proyecto.numeroCotizacion}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Piezas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Piezas del Proyecto ({proyecto.piezas?.length || 0})
        </h3>

        {proyecto.piezas?.map((pieza) => (
          <Card key={pieza.id} className="border-slate-200">
            <CardContent className="p-0">
              {/* Header de la pieza - siempre visible */}
              <div className="w-full p-4 flex items-center justify-between">
                <button
                  onClick={() => togglePieza(pieza.id)}
                  className="flex items-center gap-3 flex-1 text-left hover:bg-slate-50 transition-colors rounded-lg py-1"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{pieza.nombre}</span>
                      {pieza.codigo && (
                        <Badge variant="outline" className="text-xs">
                          <Hash className="w-3 h-3 mr-1" />
                          {pieza.codigo}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      Cantidad: {pieza.cantidad} piezas
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {pieza.procesos?.length || 0} procesos
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300 no-print"
                    onClick={() => handleImprimirPieza(pieza)}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Imprimir hoja
                  </Button>
                  <button onClick={() => togglePieza(pieza.id)} className="no-print">
                    {piezaExpandida === pieza.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Detalle de la pieza - expandible */}
              {piezaExpandida === pieza.id && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  {/* Material */}
                  {pieza.material && (
                    <div className="py-3">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Factory className="w-4 h-4" />
                        Material
                      </h4>
                      <div className="bg-slate-50 rounded-lg p-3 text-sm">
                        <p className="font-medium">{pieza.material.nombre}</p>
                        <p className="text-slate-500">
                          {pieza.material.tipo} · {pieza.material.forma}
                        </p>
                        <div className="mt-1 text-slate-500">
                          {pieza.material.diametro && <span>Ø{pieza.material.diametro}" </span>}
                          {pieza.material.largo && <span>Largo: {pieza.material.largo}" </span>}
                          {pieza.material.longitud && <span>Long: {pieza.material.longitud}" </span>}
                          {pieza.material.ancho && <span>Ancho: {pieza.material.ancho}" </span>}
                          {pieza.material.espesor && <span>Esp: {pieza.material.espesor}" </span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Procesos */}
                  {pieza.procesos && pieza.procesos.length > 0 && (
                    <div className="py-3">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Procesos de Manufactura
                      </h4>
                      <div className="space-y-2">
                        {pieza.procesos.map((proceso) => {
                          const real = realDe(proceso.id);
                          return (
                            <div
                              key={proceso.id}
                              className="bg-slate-50 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-sm">{proceso.nombre}</p>
                                <p className="text-xs text-slate-500">
                                  {proceso.tiempoMinutosPorPieza} min/pieza cotizado
                                </p>
                                {real && (
                                  <p className="text-xs text-green-700 mt-0.5">
                                    Real: {real.tiempoMinutosReal} min
                                    {real.operadorNombre ? ` · ${real.operadorNombre}` : ''}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">
                                  Total: {proceso.tiempoMinutos} min
                                </p>
                                <p className="text-xs text-slate-500">
                                  ({(proceso.tiempoMinutos / 60).toFixed(1)} hrs)
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Resumen de tiempos */}
                  <div className="py-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tiempo total por pieza:</span>
                      <span className="font-semibold">
                        {(pieza.procesos?.reduce((sum, p) => sum + p.tiempoMinutosPorPieza, 0) || 0)} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-slate-500">Tiempo total ({pieza.cantidad} piezas):</span>
                      <span className="font-semibold">
                        {(pieza.procesos?.reduce((sum, p) => sum + p.tiempoMinutos, 0) || 0)} min
                        ({((pieza.procesos?.reduce((sum, p) => sum + p.tiempoMinutos, 0) || 0) / 60).toFixed(1)} hrs)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── ÁREA DE IMPRESIÓN: hoja viajera de UNA pieza ─── */}
      {piezaAImprimir && (
        <div className="area-impresion hidden print:block text-slate-900">
          {/* Encabezado */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-3">
            <div>
              <h1 className="text-xl font-bold">HOJA VIAJERA</h1>
              <p className="text-sm text-slate-600">Soluciones Integrales Velso</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{proyecto.codigoProyecto}</p>
              <p className="text-xs text-slate-500">{fechaHoy}</p>
            </div>
          </div>

          {/* Datos del proyecto y la pieza */}
          <table className="w-full text-xs border border-slate-300 mb-3">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-1.5 bg-slate-100 font-semibold w-28">Pieza</td>
                <td className="px-2 py-1.5 font-bold">{piezaAImprimir.nombre}</td>
                <td className="px-2 py-1.5 bg-slate-100 font-semibold w-28">Código pieza</td>
                <td className="px-2 py-1.5">{piezaAImprimir.codigo || '—'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-1.5 bg-slate-100 font-semibold">Cantidad</td>
                <td className="px-2 py-1.5">{piezaAImprimir.cantidad} pzas</td>
                <td className="px-2 py-1.5 bg-slate-100 font-semibold">Proyecto</td>
                <td className="px-2 py-1.5">{proyecto.proyectoNombre}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-1.5 bg-slate-100 font-semibold">Cliente</td>
                <td className="px-2 py-1.5">{proyecto.clienteNombre}</td>
                <td className="px-2 py-1.5 bg-slate-100 font-semibold">Orden de compra</td>
                <td className="px-2 py-1.5">{proyecto.ordenCompra || '—'}</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 bg-slate-100 font-semibold">Cotización</td>
                <td className="px-2 py-1.5">{proyecto.numeroCotizacion}</td>
                <td className="px-2 py-1.5 bg-slate-100 font-semibold">Material</td>
                <td className="px-2 py-1.5">
                  {piezaAImprimir.material?.nombre || '—'}
                  <span className="text-slate-500">
                    {' '}
                    {[
                      piezaAImprimir.material?.diametro && `⌀${piezaAImprimir.material.diametro}`,
                      piezaAImprimir.material?.longitud && `× ${piezaAImprimir.material.longitud}`,
                      piezaAImprimir.material?.largo && `largo ${piezaAImprimir.material.largo}`,
                      piezaAImprimir.material?.ancho && `ancho ${piezaAImprimir.material.ancho}`,
                      piezaAImprimir.material?.espesor && `esp. ${piezaAImprimir.material.espesor}`,
                      piezaAImprimir.material?.unidadMedida,
                    ].filter(Boolean).join(' ')}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Procesos: cotizado fijo + reales si ya se capturaron, si no en blanco */}
          <table className="w-full text-xs border border-slate-300 mb-3">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-2 py-1.5 text-left w-8">#</th>
                <th className="px-2 py-1.5 text-left">PROCESO</th>
                <th className="px-2 py-1.5 text-right w-20">MIN/PZA COT.</th>
                <th className="px-2 py-1.5 text-right w-20">MIN TOTAL COT.</th>
                <th className="px-2 py-1.5 text-center w-20">HORA INICIO</th>
                <th className="px-2 py-1.5 text-center w-20">HORA FIN</th>
                <th className="px-2 py-1.5 text-center w-20">MIN REALES</th>
                <th className="px-2 py-1.5 text-center w-24">OPERADOR</th>
              </tr>
            </thead>
            <tbody>
              {(piezaAImprimir.procesos || []).map((proc: any, idx: number) => {
                const real = realDe(proc.id);
                return (
                  <tr key={proc.id || idx} className="border-b border-slate-200">
                    <td className="px-2 py-3">{idx + 1}</td>
                    <td className="px-2 py-3 font-medium">{proc.nombre}</td>
                    <td className="px-2 py-3 text-right">{proc.tiempoMinutosPorPieza ?? '—'}</td>
                    <td className="px-2 py-3 text-right">{proc.tiempoMinutos ?? '—'}</td>
                    <td className="px-2 py-3" />
                    <td className="px-2 py-3" />
                    {/* Si ya se capturó en producción se imprime el dato real; si no, en blanco */}
                    <td className="px-2 py-3 text-center font-semibold">
                      {real ? real.tiempoMinutosReal : ''}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {real?.operadorNombre || ''}
                    </td>
                  </tr>
                );
              })}
              {/* Fila de totales */}
              <tr className="bg-slate-100 font-semibold">
                <td className="px-2 py-2" colSpan={2}>TOTALES</td>
                <td className="px-2 py-2 text-right">
                  {(piezaAImprimir.procesos || []).reduce((s: number, p: any) => s + (Number(p.tiempoMinutosPorPieza) || 0), 0)}
                </td>
                <td className="px-2 py-2 text-right">
                  {(piezaAImprimir.procesos || []).reduce((s: number, p: any) => s + (Number(p.tiempoMinutos) || 0), 0)}
                </td>
                <td className="px-2 py-2" colSpan={4} />
              </tr>
            </tbody>
          </table>

          {/* Captura manual */}
          <table className="w-full text-xs border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-3 bg-slate-100 font-semibold w-28">Operador</td>
                <td className="px-2 py-3 w-1/3" />
                <td className="px-2 py-3 bg-slate-100 font-semibold w-28">Fecha</td>
                <td className="px-2 py-3" />
              </tr>
              <tr>
                <td className="px-2 py-3 bg-slate-100 font-semibold align-top">Notas</td>
                <td className="px-2 py-3" colSpan={3}>
                  <div className="h-16" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
