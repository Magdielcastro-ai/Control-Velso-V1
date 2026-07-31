import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Download, 
  ArrowLeft,
  Home,
  CheckCircle,
  Factory,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Percent,
  ShieldCheck,
  StickyNote,
  CalendarDays,
} from 'lucide-react';
import type { Cotizacion, Moneda } from '@/types/cotizacion';
import { formatearMoneda, getMonedaConfig } from '@/types/cotizacion';

interface CotizacionFinalStepProps {
  cotizacion: Cotizacion;
  moneda?: Moneda;
  onRegresar?: () => void;
  onSalir?: () => void;
}

export function CotizacionFinalStep({ cotizacion, moneda = 'MXN', onRegresar, onSalir }: CotizacionFinalStepProps) {
  const cotizacionRef = useRef<HTMLDivElement>(null);
  const monedaConfig = getMonedaConfig(moneda);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">¡Cotización Generada!</h2>
        <p className="text-slate-600">Tu cotización está lista para enviar o imprimir</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 no-print">
        {onRegresar && (
          <Button onClick={onRegresar} variant="outline" className="border-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Regresar
          </Button>
        )}
        <Button onClick={handlePrint} variant="outline" className="border-slate-300">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
        <Button onClick={handlePrint} variant="outline" className="border-slate-300">
          <Download className="w-4 h-4 mr-2" />
          Guardar PDF
        </Button>
        {onSalir && (
          <Button onClick={onSalir} variant="outline" className="border-slate-300">
            <Home className="w-4 h-4 mr-2" />
            Salir
          </Button>
        )}
      </div>

      <Card ref={cotizacionRef} className="border-slate-300 shadow-lg print:shadow-none">
        <CardContent className="p-8">
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

          {/* ─── TABLA DE PARTIDAS ─── */}
          <div className="mb-8 print:mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 print:mb-2">
              Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-100">
                    <th className="text-left p-2.5 font-semibold text-slate-700 border-b-2 border-slate-300 print:p-2 w-10">
                      #
                    </th>
                    <th className="text-left p-2.5 font-semibold text-slate-700 border-b-2 border-slate-300 print:p-2">
                      Descripción
                    </th>
                    <th className="text-left p-2.5 font-semibold text-slate-700 border-b-2 border-slate-300 print:p-2">
                      Material
                    </th>
                    <th className="text-right p-2.5 font-semibold text-slate-700 border-b-2 border-slate-300 print:p-2 w-16">
                      Cant.
                    </th>
                    <th className="text-right p-2.5 font-semibold text-slate-700 border-b-2 border-slate-300 print:p-2 w-28">
                      Precio Unit.
                    </th>
                    <th className="text-right p-2.5 font-semibold text-slate-700 border-b-2 border-slate-300 print:p-2 w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.piezas.map((pieza, idx) => {
                    const unitPrice = pieza.totalPieza;
                    const lineTotal = unitPrice * pieza.cantidad;
                    return (
                      <tr
                        key={pieza.id}
                        className="border-b border-slate-200 hover:bg-slate-50 print:hover:bg-transparent"
                      >
                        <td className="p-2.5 text-slate-500 align-top print:p-2">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 align-top print:p-2">
                          <div className="font-semibold text-slate-900">
                            {pieza.nombre}
                          </div>
                          {pieza.codigo && (
                            <div className="text-slate-500 text-xs mt-0.5">
                              Código: {pieza.codigo}
                            </div>
                          )}
                          {pieza.procesos.filter(p => p.tipo === 'otro').length > 0 && (
                            <div className="text-xs text-slate-500 mt-1">
                              <span className="font-medium text-slate-600">Procesos externos:</span>{' '}
                              {pieza.procesos
                                .filter(p => p.tipo === 'otro')
                                .map(p => p.nombre)
                                .join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 align-top print:p-2">
                          {pieza.material ? (
                            <div>
                              <div className="font-medium text-slate-800">
                                {pieza.material.nombre}
                              </div>
                              <div className="text-xs text-slate-500">
                                {pieza.material.tipo}
                                {pieza.material.forma && ` · ${pieza.material.forma}`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Sin material</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right align-top font-medium print:p-2">
                          {pieza.cantidad}
                        </td>
                        <td className="p-2.5 text-right align-top print:p-2">
                          <span className="font-medium">{formatearMoneda(unitPrice, moneda)}</span>
                        </td>
                        <td className="p-2.5 text-right align-top print:p-2">
                          <span className="font-semibold text-slate-900">
                            {formatearMoneda(lineTotal, moneda)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* ─── Costos Adicionales como filas de partida ─── */}
                  {renderCostoAdicionalRow(
                    cotizacion.piezas.length + 1,
                    'Envío / Entrega',
                    cotizacion.costosAdicionales.envio,
                    moneda
                  )}
                  {renderCostoAdicionalRow(
                    cotizacion.piezas.length + 2,
                    'Diseño CAD/CAM',
                    cotizacion.costosAdicionales.diseno,
                    moneda
                  )}
                  {renderCostoAdicionalRow(
                    cotizacion.piezas.length + 3,
                    'Estudio de Material',
                    cotizacion.costosAdicionales.estudioMaterial,
                    moneda
                  )}
                  {renderCostoAdicionalRow(
                    cotizacion.piezas.length + 4,
                    'Prueba de Dureza',
                    cotizacion.costosAdicionales.pruebaDureza,
                    moneda
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── RESUMEN DE TOTALES ─── */}
          <div className="border-t-2 border-slate-300 pt-6 mb-8 print:border-t print:pt-4">
            <div className="w-full md:w-1/2 ml-auto print:w-3/5">
              {/* Subtotal */}
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {formatearMoneda(cotizacion.subtotal, moneda)}
                </span>
              </div>

              {/* IVA */}
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-slate-600">
                  IVA ({cotizacion.ivaPorcentaje}%)
                </span>
                <span className="font-medium text-slate-700">
                  {formatearMoneda(cotizacion.iva, moneda)}
                </span>
              </div>

              {/* Línea separadora antes del total */}
              <div className="border-t-2 border-blue-600 my-3" />

              {/* TOTAL destacado */}
              <div className="flex justify-between items-center py-2">
                <span className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Total
                </span>
                <span className="text-2xl font-extrabold text-blue-600 print:text-xl">
                  {formatearMoneda(cotizacion.total, moneda)}
                </span>
              </div>

              {/* Monto en letras */}
              <p className="text-xs text-slate-500 text-right mt-2 leading-relaxed">
                {numeroALetras(cotizacion.total)} {monedaConfig.nombre.toLowerCase()}{' '}
                {((cotizacion.total % 1) * 100).toFixed(0).padStart(2, '0')}/100{' '}
                <span className="font-medium text-slate-600">M.N.</span>
              </p>

              {/* Indicación de moneda */}
              <p className="text-[10px] text-slate-400 text-right mt-1 uppercase tracking-wider">
                Moneda: {monedaConfig.nombre} ({moneda})
              </p>
            </div>
          </div>

          {/* ─── CONDICIONES COMERCIALES ─── */}
          <div className="bg-slate-50 p-6 rounded-lg print:bg-transparent print:border print:border-slate-200 print:p-4 print:rounded-none">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 print:mb-3">
              Condiciones Comerciales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm print:gap-3">
              {/* Validez */}
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Validez</p>
                  <p className="font-semibold text-slate-800">
                    {cotizacion.condiciones.validezDias} días
                  </p>
                </div>
              </div>

              {/* Tiempo de entrega */}
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Tiempo de entrega</p>
                  <p className="font-semibold text-slate-800">
                    {cotizacion.condiciones.tiempoEntregaDias} días hábiles
                  </p>
                </div>
              </div>

              {/* Forma de pago */}
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Forma de pago</p>
                  <p className="font-semibold text-slate-800">
                    {cotizacion.condiciones.formaPago}
                  </p>
                </div>
              </div>

              {/* Anticipo */}
              <div className="flex items-start gap-3">
                <Percent className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Anticipo</p>
                  <p className="font-semibold text-slate-800">
                    {cotizacion.condiciones.anticipoPorcentaje}%
                  </p>
                </div>
              </div>

              {/* Garantía */}
              <div className="flex items-start gap-3 md:col-span-2">
                <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Garantía</p>
                  <p className="font-semibold text-slate-800">
                    {cotizacion.condiciones.garantia}
                  </p>
                </div>
              </div>

              {/* Notas adicionales */}
              {cotizacion.condiciones.notasLegales && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <StickyNote className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Notas adicionales</p>
                    <p className="font-medium text-slate-700">
                      {cotizacion.condiciones.notasLegales}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-slate-500 print:mt-6 print:pt-4">
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

/* ─── Helper: Renderizar fila de costo adicional ─── */
function renderCostoAdicionalRow(
  num: number,
  label: string,
  item: { costo: number; incluidoGratis: boolean },
  moneda: Moneda = 'MXN'
): import('react').ReactNode {
  if (!item || item.costo <= 0) return null;

  if (item.incluidoGratis) {
    return (
      <tr className="border-b border-slate-200 hover:bg-slate-50 print:hover:bg-transparent">
        <td className="p-2.5 text-slate-500 align-top print:p-2">{num}</td>
        <td className="p-2.5 align-top print:p-2">
          <div className="font-semibold text-slate-900">{label}</div>
          <div className="text-xs text-green-600 font-medium">Incluido gratis</div>
        </td>
        <td className="p-2.5 align-top print:p-2">—</td>
        <td className="p-2.5 text-right align-top print:p-2">1</td>
        <td className="p-2.5 text-right align-top print:p-2">
          <span className="line-through text-slate-400">{formatearMoneda(item.costo, moneda)}</span>
        </td>
        <td className="p-2.5 text-right align-top print:p-2">
          <span className="font-semibold text-green-600">{formatearMoneda(0, moneda)}</span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 print:hover:bg-transparent">
      <td className="p-2.5 text-slate-500 align-top print:p-2">{num}</td>
      <td className="p-2.5 align-top print:p-2">
        <div className="font-semibold text-slate-900">{label}</div>
      </td>
      <td className="p-2.5 align-top print:p-2">—</td>
      <td className="p-2.5 text-right align-top print:p-2">1</td>
      <td className="p-2.5 text-right align-top print:p-2">
        <span className="font-medium">{formatearMoneda(item.costo, moneda)}</span>
      </td>
      <td className="p-2.5 text-right align-top print:p-2">
        <span className="font-semibold text-slate-900">{formatearMoneda(item.costo, moneda)}</span>
      </td>
    </tr>
  );
}

/* ─── Helper: Número a letras (simplificado) ─── */
function numeroALetras(num: number): string {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const n = Math.floor(num);
  if (n === 0) return 'cero';
  if (n === 100) return 'cien';
  if (n === 1000) return 'mil';
  if (n === 1000000) return 'un millón';

  let result = '';
  let resto = n;

  // Millones
  const millones = Math.floor(resto / 1000000);
  if (millones > 0) {
    result += millones === 1 ? 'un millón ' : `${numeroALetras(millones)} millones `;
    resto %= 1000000;
  }

  // Miles
  const miles = Math.floor(resto / 1000);
  if (miles > 0) {
    result += miles === 1 ? 'mil ' : `${numeroALetras(miles)} mil `;
    resto %= 1000;
  }

  // Centenas
  const c = Math.floor(resto / 100);
  if (c > 0) {
    result += centenas[c] + ' ';
    resto %= 100;
  }

  // Decenas y unidades
  if (resto >= 10 && resto < 20) {
    result += especiales[resto - 10];
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    if (d > 0) {
      result += decenas[d];
      if (u > 0) {
        result += d === 2 ? 'i' : ' y ';
        result += unidades[u];
      }
    } else if (u > 0) {
      result += unidades[u];
    }
  }

  return result.trim();
}
