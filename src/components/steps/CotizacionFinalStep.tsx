import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Download, 
  Share2, 
  CheckCircle,
  Factory,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import type { Cotizacion } from '@/types/cotizacion';

interface CotizacionFinalStepProps {
  cotizacion: Cotizacion;
  onNuevaCotizacion: () => void;
}

export function CotizacionFinalStep({ cotizacion, onNuevaCotizacion }: CotizacionFinalStepProps) {
  const cotizacionRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const costoMateriales = cotizacion.materiales.reduce((sum, m) => sum + m.costoTotal, 0);
  const costoProcesos = cotizacion.procesos.reduce((sum, p) => sum + p.costoTotal, 0);
  const costosAdicionales = Object.values(cotizacion.costosAdicionales).reduce((sum, v) => sum + v, 0);
  const costoDirecto = costoMateriales + costoProcesos + costosAdicionales;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">¡Cotización Generada!</h2>
        <p className="text-slate-600">Tu cotización está lista para enviar o imprimir</p>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap justify-center gap-3 no-print">
        <Button onClick={handlePrint} variant="outline" className="border-slate-300">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
        <Button onClick={handlePrint} variant="outline" className="border-slate-300">
          <Download className="w-4 h-4 mr-2" />
          Guardar PDF
        </Button>
        <Button onClick={onNuevaCotizacion} className="bg-blue-600 hover:bg-blue-700">
          <Share2 className="w-4 h-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Documento de cotización */}
      <Card ref={cotizacionRef} className="border-slate-300 shadow-lg print:shadow-none">
        <CardContent className="p-8">
          {/* Encabezado */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Factory className="w-10 h-10 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {cotizacion.datosTaller.nombre || 'Taller CNC'}
                  </h1>
                  {cotizacion.datosTaller.rfc && (
                    <p className="text-sm text-slate-500">RFC: {cotizacion.datosTaller.rfc}</p>
                  )}
                </div>
              </div>
              {cotizacion.datosTaller.direccion && (
                <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {cotizacion.datosTaller.direccion}
                </p>
              )}
              <div className="flex gap-4 mt-2">
                {cotizacion.datosTaller.telefono && (
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {cotizacion.datosTaller.telefono}
                  </p>
                )}
                {cotizacion.datosTaller.email && (
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {cotizacion.datosTaller.email}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-lg px-4 py-2 border-2 border-blue-600 text-blue-600">
                COTIZACIÓN
              </Badge>
              <p className="text-sm text-slate-500 mt-2">{cotizacion.numero}</p>
              <p className="text-sm text-slate-500">
                <Calendar className="w-4 h-4 inline mr-1" />
                {new Date(cotizacion.fecha).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Cliente */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Cliente
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold text-slate-900">
                {cotizacion.datosCliente.nombre}
                {cotizacion.datosCliente.empresa && ` - ${cotizacion.datosCliente.empresa}`}
              </p>
              {cotizacion.datosCliente.direccion && (
                <p className="text-sm text-slate-600">{cotizacion.datosCliente.direccion}</p>
              )}
              <div className="flex gap-4 mt-1">
                {cotizacion.datosCliente.telefono && (
                  <p className="text-sm text-slate-600">{cotizacion.datosCliente.telefono}</p>
                )}
                {cotizacion.datosCliente.email && (
                  <p className="text-sm text-slate-600">{cotizacion.datosCliente.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Proyecto */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Proyecto
            </h3>
            <div className="border-l-4 border-blue-600 pl-4">
              <h2 className="text-xl font-bold text-slate-900">{cotizacion.proyecto.nombre}</h2>
              <p className="text-slate-700 mt-2 whitespace-pre-wrap">{cotizacion.proyecto.descripcion}</p>
              <div className="flex gap-4 mt-3">
                <Badge variant="secondary">Cantidad: {cotizacion.proyecto.cantidad} pzas</Badge>
                {cotizacion.proyecto.dibujo && (
                  <Badge variant="outline">Dibujo: {cotizacion.proyecto.dibujo}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Materiales */}
          {cotizacion.materiales.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Materiales
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Material</th>
                    <th className="text-left p-2">Forma</th>
                    <th className="text-left p-2">Dimensiones</th>
                    <th className="text-right p-2">Cantidad</th>
                    <th className="text-right p-2">Margen</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.materiales.map((m) => {
                    // Formatear dimensiones
                    let dimensionesStr = '';
                    const unidad = m.unidadMedida === 'mm' ? 'mm' : '"';
                    if (m.forma === 'redondo' && m.diametro) {
                      dimensionesStr = `Ø${m.diametro}${unidad}`;
                      if (m.largo) dimensionesStr += ` × ${m.largo}${unidad}`;
                    } else if (m.forma === 'cuadrado' && m.lado) {
                      dimensionesStr = `${m.lado}${unidad} × ${m.lado}${unidad}`;
                      if (m.largo) dimensionesStr += ` × ${m.largo}${unidad}`;
                    } else if ((m.forma === 'placa' || m.forma === 'placa_rectificada') && m.largo && m.ancho) {
                      dimensionesStr = `${m.largo}${unidad} × ${m.ancho}${unidad}`;
                      if (m.espesor) dimensionesStr += ` × ${m.espesor}${unidad}`;
                    }
                    
                    return (
                      <tr key={m.id} className="border-b">
                        <td className="p-2">{m.nombre}</td>
                        <td className="p-2">
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {m.forma === 'redondo' ? 'Redondo' : 
                             m.forma === 'cuadrado' ? 'Cuadrado' : 
                             m.forma === 'placa' ? 'Placa' : 
                             m.forma === 'placa_rectificada' ? 'Placa Rect.' : 'Otro'}
                          </span>
                        </td>
                        <td className="p-2 text-xs">{dimensionesStr}</td>
                        <td className="p-2 text-right">{m.cantidad} {m.unidad}</td>
                        <td className="p-2 text-right">
                          {m.margenPorcentaje > 0 ? (
                            <span className="text-green-600">{m.margenPorcentaje}%</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2 text-right font-medium">${m.costoTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="p-2 text-right font-medium">Subtotal Materiales:</td>
                    <td className="p-2 text-right font-bold">${costoMateriales.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Procesos */}
          {cotizacion.procesos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Procesos y Operaciones
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Proceso</th>
                    <th className="text-right p-2">Tiempo</th>
                    <th className="text-right p-2">$/Hora Máq.</th>
                    <th className="text-right p-2">$/Hora MO</th>
                    <th className="text-right p-2">Costo Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.procesos.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">
                        {p.nombre}
                        {p.descripcion && <p className="text-xs text-slate-500">{p.descripcion}</p>}
                      </td>
                      <td className="p-2 text-right">
                        {Math.floor(p.tiempoMinutos / 60) > 0 && `${Math.floor(p.tiempoMinutos / 60)}h `}
                        {p.tiempoMinutos % 60}m
                      </td>
                      <td className="p-2 text-right">${p.costoPorHora.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        {p.costoManoObra > 0 ? (
                          <span className="text-green-600">${p.costoManoObra.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-2 text-right font-medium">${p.costoTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="p-2 text-right font-medium">Subtotal Procesos:</td>
                    <td className="p-2 text-right font-bold">${costoProcesos.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Costos adicionales */}
          {(costosAdicionales > 0) && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Costos Adicionales
              </h3>
              <div className="space-y-1">
                {cotizacion.costosAdicionales.disenoCAD > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Diseño CAD/CAM</span>
                    <span>${cotizacion.costosAdicionales.disenoCAD.toFixed(2)}</span>
                  </div>
                )}
                {cotizacion.costosAdicionales.programacionCNC > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Programación CNC</span>
                    <span>${cotizacion.costosAdicionales.programacionCNC.toFixed(2)}</span>
                  </div>
                )}
                {cotizacion.costosAdicionales.setup > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Setup y Preparación</span>
                    <span>${cotizacion.costosAdicionales.setup.toFixed(2)}</span>
                  </div>
                )}
                {cotizacion.costosAdicionales.transporte > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Transporte/Envío</span>
                    <span>${cotizacion.costosAdicionales.transporte.toFixed(2)}</span>
                  </div>
                )}
                {cotizacion.costosAdicionales.otro > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Otros Costos</span>
                    <span>${cotizacion.costosAdicionales.otro.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Totales */}
          <div className="border-t-2 border-slate-300 pt-6 mb-8">
            <div className="w-full md:w-1/2 ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Costo Directo:</span>
                <span>${costoDirecto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Margen ({cotizacion.margenUtilidad}%):</span>
                <span className="text-green-600">+${(cotizacion.subtotal - costoDirecto).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">${cotizacion.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">IVA ({cotizacion.ivaPorcentaje}%):</span>
                <span>${cotizacion.iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t-2 border-blue-600 pt-2">
                <span>TOTAL:</span>
                <span className="text-blue-600">${cotizacion.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Condiciones */}
          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Condiciones Comerciales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Validez de la cotización:</p>
                <p className="font-medium">{cotizacion.condiciones.validezDias} días</p>
              </div>
              <div>
                <p className="text-slate-600">Tiempo de entrega:</p>
                <p className="font-medium">{cotizacion.condiciones.tiempoEntregaDias} días hábiles</p>
              </div>
              <div>
                <p className="text-slate-600">Forma de pago:</p>
                <p className="font-medium">{cotizacion.condiciones.formaPago}</p>
              </div>
              <div>
                <p className="text-slate-600">Anticipo:</p>
                <p className="font-medium">{cotizacion.condiciones.anticipoPorcentaje}%</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-600">Garantía:</p>
                <p className="font-medium">{cotizacion.condiciones.garantia}</p>
              </div>
              {cotizacion.condiciones.notasLegales && (
                <div className="md:col-span-2">
                  <p className="text-slate-600">Notas adicionales:</p>
                  <p className="font-medium">{cotizacion.condiciones.notasLegales}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pie de página */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-slate-500">
            <p>Esta cotización fue generada con Presupuesto Pro CNC</p>
            <p className="mt-1">Documento válido únicamente con firma y sello del taller</p>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
