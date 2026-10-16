import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Download,
  ArrowLeft,
  Home,
  CheckCircle,
} from 'lucide-react';
import type { Cotizacion, Moneda } from '@/types/cotizacion';
import { formatearMoneda, getMonedaConfig } from '@/types/cotizacion';
import { numeroALetras } from '@/utils/numeroALetras';

interface CotizacionFinalStepProps {
  cotizacion: Cotizacion;
  moneda?: Moneda;
  onRegresar?: () => void;
  onSalir?: () => void;
}

export function CotizacionFinalStep({ cotizacion, moneda: _monedaProp, onRegresar, onSalir }: CotizacionFinalStepProps) {
  const cotizacionRef = useRef<HTMLDivElement>(null);
  // Usar la moneda de la cotización, no la prop (que siempre venía como MXN)
  const moneda = cotizacion.moneda || 'MXN';
  const monedaConfig = getMonedaConfig(moneda);

  // Imprime SOLO el documento (una sola hoja): se clona a <body> y todo
  // lo demás se oculta con display:none — la técnica de visibility dejaba
  // páginas extra en blanco
  const handlePrint = () => {
    const nodo = cotizacionRef.current;
    if (!nodo) return;

    const anterior = document.getElementById('cotizacion-print-root');
    anterior?.remove();

    const contenedor = document.createElement('div');
    contenedor.id = 'cotizacion-print-root';
    contenedor.appendChild(nodo.cloneNode(true));
    document.body.appendChild(contenedor);
    document.body.classList.add('imprimiendo-cotizacion');

    window.print();

    setTimeout(() => {
      contenedor.remove();
      document.body.classList.remove('imprimiendo-cotizacion');
    }, 500);
  };

  const handleGuardarPDF = () => {
    handlePrint();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6 no-print">
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
        <Button onClick={handleGuardarPDF} variant="outline" className="border-slate-300">
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

      {/* ═══ DOCUMENTO IMPRIMIBLE (compacto, 1 hoja carta) ═══ */}
      <div ref={cotizacionRef} className="area-impresion bg-white border border-slate-300 rounded-lg shadow-lg print:shadow-none print:border-0 print:rounded-none">
        <div className="p-5 print:p-0 text-slate-900">

          {/* ─── ENCABEZADO: logo + datos Velso | folio ─── */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-3">
              <img src="/logo-velso-pdf.png" alt="Logo Velso" className="w-24 h-auto object-contain" />
              <div>
                <h1 className="text-base font-bold leading-tight">
                  {cotizacion.datosTaller.nombre || 'Taller CNC'}
                </h1>
                {cotizacion.datosTaller.rfc && (
                  <p className="text-[10px] text-slate-500">RFC: {cotizacion.datosTaller.rfc}</p>
                )}
                {cotizacion.datosTaller.direccion && (
                  <p className="text-[10px] text-slate-600">{cotizacion.datosTaller.direccion}</p>
                )}
                <p className="text-[10px] text-slate-600">
                  {[cotizacion.datosTaller.telefono, cotizacion.datosTaller.email].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block text-sm font-bold px-3 py-0.5 border-2 border-blue-600 text-blue-600 rounded">
                COTIZACIÓN
              </span>
              <p className="text-xs text-slate-600 mt-1 font-medium">{cotizacion.numero}</p>
              <p className="text-[10px] text-slate-500">
                {new Date(cotizacion.fecha).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* ─── CLIENTE: una sola franja compacta ─── */}
          <div className="mb-2 text-[11px] border border-slate-200 rounded px-2 py-1.5 bg-slate-50 leading-snug">
            <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wide mr-2">Cliente:</span>
            <span className="font-semibold text-slate-900">
              {cotizacion.datosCliente.empresa || cotizacion.datosCliente.nombre}
            </span>
            {cotizacion.datosCliente.empresa && cotizacion.datosCliente.nombre !== cotizacion.datosCliente.empresa && (
              <span className="text-slate-600"> · Contacto: {cotizacion.datosCliente.nombre}</span>
            )}
            {cotizacion.datosCliente.direccion && (
              <span className="text-slate-600"> · {cotizacion.datosCliente.direccion}</span>
            )}
            {cotizacion.datosCliente.telefono && (
              <span className="text-slate-600"> · Tel: {cotizacion.datosCliente.telefono}</span>
            )}
            {cotizacion.datosCliente.email && (
              <span className="text-slate-600"> · {cotizacion.datosCliente.email}</span>
            )}
          </div>

          {/* ─── PROYECTO: recuadro ─── */}
          <div className="mb-2 border border-slate-300 rounded px-3 py-2">
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Proyecto</p>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">{cotizacion.proyecto.nombre}</h2>
                {cotizacion.proyecto.descripcion && (
                  <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-snug">{cotizacion.proyecto.descripcion}</p>
                )}
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Cantidad: {cotizacion.proyecto.cantidad} pzas
                  {cotizacion.proyecto.dibujo && ` · Dibujo: ${cotizacion.proyecto.dibujo}`}
                </p>
              </div>
              {/* Imagen del proyecto: solo si las piezas no llevan imagen individual */}
              {cotizacion.proyecto.imagen && !cotizacion.piezas.some((p) => p.imagen) && (
                <img
                  src={cotizacion.proyecto.imagen}
                  alt={cotizacion.proyecto.nombre}
                  className="max-h-28 max-w-[160px] object-contain rounded shrink-0"
                />
              )}
            </div>
          </div>

          {/* ─── ITEMS: recuadro con tabla compacta ─── */}
          <div className="mb-2 border border-slate-300 rounded px-2 py-1.5">
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Items</p>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left px-1.5 py-1 font-semibold text-slate-700 border-b border-slate-300 w-6">#</th>
                  <th className="text-left px-1.5 py-1 font-semibold text-slate-700 border-b border-slate-300">Descripción</th>
                  <th className="text-left px-1.5 py-1 font-semibold text-slate-700 border-b border-slate-300">Material</th>
                  <th className="text-right px-1.5 py-1 font-semibold text-slate-700 border-b border-slate-300 w-10">Cant.</th>
                  <th className="text-right px-1.5 py-1 font-semibold text-slate-700 border-b border-slate-300 w-24">Precio Unit.</th>
                  <th className="text-right px-1.5 py-1 font-semibold text-slate-700 border-b border-slate-300 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {cotizacion.piezas.map((pieza, idx) => {
                  const unitPrice = pieza.totalPieza;
                  const lineTotal = unitPrice * pieza.cantidad;
                  return (
                    <tr key={pieza.id} className="border-b border-slate-200">
                      <td className="px-1.5 py-1.5 text-slate-500 align-top">{idx + 1}</td>
                      <td className="px-1.5 py-1.5 align-top">
                        <div className="font-semibold text-slate-900 leading-tight">{pieza.nombre}</div>
                        {pieza.codigo && (
                          <div className="text-slate-500 text-[9px]">Código: {pieza.codigo}</div>
                        )}
                        {/* Imagen de la pieza (si no hay, no se imprime recuadro) */}
                        {pieza.imagen && (
                          <img
                            src={pieza.imagen}
                            alt={pieza.nombre}
                            className="mt-1 max-h-20 max-w-[110px] object-contain rounded"
                          />
                        )}
                        {pieza.descripcion && (
                          <div className="text-slate-600 text-[10px] mt-0.5 italic leading-snug">{pieza.descripcion}</div>
                        )}
                        {pieza.procesos.filter(p => p.tipo === 'otro').length > 0 && (
                          <div className="text-[9px] text-slate-500">
                            {pieza.procesos.filter(p => p.tipo === 'otro').map(p => p.nombre).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-1.5 py-1.5 align-top">
                        {pieza.material ? (
                          <div>
                            <div className="font-medium text-slate-800 leading-tight">{pieza.material.nombre}</div>
                            <div className="text-[9px] text-slate-500">
                              {pieza.material.tipo}
                              {pieza.material.forma && ` · ${pieza.material.forma}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Sin material</span>
                        )}
                      </td>
                      <td className="px-1.5 py-1.5 text-right align-top font-medium">{pieza.cantidad}</td>
                      <td className="px-1.5 py-1.5 text-right align-top">
                        <span className="font-medium">{formatearMoneda(unitPrice, moneda)}</span>
                      </td>
                      <td className="px-1.5 py-1.5 text-right align-top">
                        <span className="font-semibold text-slate-900">{formatearMoneda(lineTotal, moneda)}</span>
                      </td>
                    </tr>
                  );
                })}

                {/* Costos adicionales como filas de partida */}
                {renderCostoAdicionalRow(cotizacion.piezas.length + 1, 'Envío / Entrega', cotizacion.costosAdicionales.envio, moneda)}
                {renderCostoAdicionalRow(cotizacion.piezas.length + 2, 'Diseño CAD/CAM', cotizacion.costosAdicionales.diseno, moneda)}
                {renderCostoAdicionalRow(cotizacion.piezas.length + 3, 'Estudio de Material', cotizacion.costosAdicionales.estudioMaterial, moneda)}
                {renderCostoAdicionalRow(cotizacion.piezas.length + 4, 'Prueba de Dureza', cotizacion.costosAdicionales.pruebaDureza, moneda)}
              </tbody>
            </table>
          </div>

          {/* ─── TOTALES: bloque compacto a la derecha ─── */}
          <div className="flex justify-end mb-2">
            <div className="w-72 text-[11px]">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-800">{formatearMoneda(cotizacion.subtotal, moneda)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">IVA ({cotizacion.ivaPorcentaje}%)</span>
                <span className="font-medium text-slate-700">{formatearMoneda(cotizacion.iva, moneda)}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-blue-600 mt-1 pt-1">
                <span className="text-xs font-bold text-slate-900 uppercase">Total</span>
                <span className="text-lg font-extrabold text-blue-600">{formatearMoneda(cotizacion.total, moneda)}</span>
              </div>
              <p className="text-[9px] text-slate-500 text-right mt-0.5 leading-snug">
                {numeroALetras(cotizacion.total)} {monedaConfig.nombre.toLowerCase()}{' '}
                {((cotizacion.total % 1) * 100).toFixed(0).padStart(2, '0')}/100{' '}
                {moneda === 'MXN' ? 'M.N.' : 'USD'}
              </p>
              <p className="text-[8px] text-slate-400 text-right uppercase tracking-wider">
                Moneda: {monedaConfig.nombre} ({moneda})
              </p>
            </div>
          </div>

          {/* ─── CONDICIONES COMERCIALES: rejilla compacta ─── */}
          <div className="border border-slate-200 rounded px-3 py-2 text-[10px]">
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Condiciones Comerciales</p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 leading-snug">
              <div>
                <span className="text-slate-500">Validez: </span>
                <span className="font-semibold text-slate-800">{cotizacion.condiciones.validezDias} días</span>
              </div>
              <div>
                <span className="text-slate-500">Entrega: </span>
                <span className="font-semibold text-slate-800">{cotizacion.condiciones.tiempoEntregaDias} días hábiles</span>
              </div>
              <div>
                <span className="text-slate-500">Anticipo: </span>
                <span className="font-semibold text-slate-800">{cotizacion.condiciones.anticipoPorcentaje}%</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Forma de pago: </span>
                <span className="font-semibold text-slate-800">{cotizacion.condiciones.formaPago}</span>
              </div>
              <div>
                <span className="text-slate-500">Garantía: </span>
                <span className="font-semibold text-slate-800">{cotizacion.condiciones.garantia}</span>
              </div>
              {cotizacion.condiciones.notasLegales && (
                <div className="col-span-3">
                  <span className="text-slate-500">Notas: </span>
                  <span className="font-medium text-slate-700">{cotizacion.condiciones.notasLegales}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 0;
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
      <tr className="border-b border-slate-200">
        <td className="px-1.5 py-1.5 text-slate-500 align-top">{num}</td>
        <td className="px-1.5 py-1.5 align-top">
          <div className="font-semibold text-slate-900 leading-tight">{label}</div>
          <div className="text-[9px] text-green-600 font-medium">Incluido gratis</div>
        </td>
        <td className="px-1.5 py-1.5 align-top">—</td>
        <td className="px-1.5 py-1.5 text-right align-top">1</td>
        <td className="px-1.5 py-1.5 text-right align-top">
          <span className="line-through text-slate-400">{formatearMoneda(item.costo, moneda)}</span>
        </td>
        <td className="px-1.5 py-1.5 text-right align-top">
          <span className="font-semibold text-green-600">{formatearMoneda(0, moneda)}</span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-200">
      <td className="px-1.5 py-1.5 text-slate-500 align-top">{num}</td>
      <td className="px-1.5 py-1.5 align-top">
        <div className="font-semibold text-slate-900 leading-tight">{label}</div>
      </td>
      <td className="px-1.5 py-1.5 align-top">—</td>
      <td className="px-1.5 py-1.5 text-right align-top">1</td>
      <td className="px-1.5 py-1.5 text-right align-top">
        <span className="font-medium">{formatearMoneda(item.costo, moneda)}</span>
      </td>
      <td className="px-1.5 py-1.5 text-right align-top">
        <span className="font-semibold text-slate-900">{formatearMoneda(item.costo, moneda)}</span>
      </td>
    </tr>
  );
}
