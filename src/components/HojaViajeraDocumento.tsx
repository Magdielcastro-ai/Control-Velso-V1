// Documento imprimible de la hoja viajera de UNA pieza.
// Compartido por HojaViajeraView (Proyectos) y ProduccionView (Producción).
// Si un proceso ya tiene captura real se imprime el dato; si no, la
// columna sale en blanco para llenarla a mano en piso.

import { buscarReal } from '@/utils/proyectoDatos';

interface HojaViajeraDocumentoProps {
  proyecto: {
    codigoProyecto: string;
    proyectoNombre: string;
    clienteNombre: string;
    ordenCompra?: string;
    numeroCotizacion?: string;
    procesosReales?: any[];
  };
  pieza: any;
}

export function HojaViajeraDocumento({ proyecto, pieza }: HojaViajeraDocumentoProps) {
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  // Registro real del proceso (llave compuesta pieza:proceso, con
  // tolerancia al formato viejo) — si existe se imprime, si no, en blanco
  const real = (proc: any) =>
    buscarReal(proyecto.procesosReales, {
      captureId: `${pieza.id}:${proc.id}`,
      piezaId: pieza.id,
      id: proc.id,
    });

  // Herramientas/dispositivos extra capturados para esta pieza
  const extras = (proyecto.procesosReales || []).filter(
    (e: any) => e.tipo === 'herramienta_extra' && e.piezaId === pieza.id
  );

  return (
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
            <td className="px-2 py-1.5 font-bold">{pieza.nombre}</td>
            <td className="px-2 py-1.5 bg-slate-100 font-semibold w-28">Código pieza</td>
            <td className="px-2 py-1.5">{pieza.codigo || '—'}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="px-2 py-1.5 bg-slate-100 font-semibold">Cantidad</td>
            <td className="px-2 py-1.5">{pieza.cantidad} pzas</td>
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
            <td className="px-2 py-1.5">{proyecto.numeroCotizacion || '—'}</td>
            <td className="px-2 py-1.5 bg-slate-100 font-semibold">Material</td>
            <td className="px-2 py-1.5">
              {pieza.material?.nombre || '—'}
              <span className="text-slate-500">
                {' '}
                {[
                  pieza.material?.diametro && `⌀${pieza.material.diametro}`,
                  pieza.material?.longitud && `× ${pieza.material.longitud}`,
                  pieza.material?.largo && `largo ${pieza.material.largo}`,
                  pieza.material?.ancho && `ancho ${pieza.material.ancho}`,
                  pieza.material?.espesor && `esp. ${pieza.material.espesor}`,
                  pieza.material?.unidadMedida,
                ].filter(Boolean).join(' ')}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Procesos: cotizado fijo + fecha/hora por proceso + reales si ya se capturaron */}
      <table className="w-full text-xs border border-slate-300 mb-3">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-2 py-1.5 text-left w-6">#</th>
            <th className="px-2 py-1.5 text-left">PROCESO</th>
            <th className="px-2 py-1.5 text-right w-16">MIN/PZA COT.</th>
            <th className="px-2 py-1.5 text-right w-16">MIN TOTAL COT.</th>
            <th className="px-2 py-1.5 text-center w-20">FECHA</th>
            <th className="px-2 py-1.5 text-center w-16">HORA INICIO</th>
            <th className="px-2 py-1.5 text-center w-16">HORA FIN</th>
            <th className="px-2 py-1.5 text-center w-16">MIN REALES</th>
            <th className="px-2 py-1.5 text-center w-20">OPERADOR</th>
          </tr>
        </thead>
        <tbody>
          {(pieza.procesos || []).map((proc: any, idx: number) => {
            const r = real(proc);
            return (
              <tr key={proc.id || idx} className="border-b border-slate-200">
                <td className="px-2 py-4">{idx + 1}</td>
                <td className="px-2 py-4 font-medium">{proc.nombre}</td>
                <td className="px-2 py-4 text-right">{proc.tiempoMinutosPorPieza ?? '—'}</td>
                <td className="px-2 py-4 text-right">{proc.tiempoMinutos ?? '—'}</td>
                <td className="px-2 py-4" />
                <td className="px-2 py-4" />
                <td className="px-2 py-4" />
                <td className="px-2 py-4 text-center font-semibold">
                  {r ? r.tiempoMinutosReal : ''}
                </td>
                <td className="px-2 py-4 text-center">
                  {r?.operadorNombre || ''}
                </td>
              </tr>
            );
          })}
          {/* Fila de totales */}
          <tr className="bg-slate-100 font-semibold">
            <td className="px-2 py-2" colSpan={2}>TOTALES</td>
            <td className="px-2 py-2 text-right">
              {(pieza.procesos || []).reduce((s: number, p: any) => s + (Number(p.tiempoMinutosPorPieza) || 0), 0)}
            </td>
            <td className="px-2 py-2 text-right">
              {(pieza.procesos || []).reduce((s: number, p: any) => s + (Number(p.tiempoMinutos) || 0), 0)}
            </td>
            <td className="px-2 py-2" colSpan={5} />
          </tr>
        </tbody>
      </table>

      {/* Herramientas / dispositivos extra con su tiempo y costo */}
      <p className="text-xs font-bold text-slate-600 mb-1">
        HERRAMIENTAS O DISPOSITIVOS ESPECIALES (suman al costo)
      </p>
      <table className="w-full text-xs border border-slate-300 mb-3">
        <thead>
          <tr className="bg-slate-600 text-white">
            <th className="px-2 py-1.5 text-left">HERRAMIENTA / DISPOSITIVO</th>
            <th className="px-2 py-1.5 text-center w-24">MIN UTILIZADOS</th>
            <th className="px-2 py-1.5 text-center w-24">COSTO $</th>
          </tr>
        </thead>
        <tbody>
          {extras.map((e: any, idx: number) => (
            <tr key={e.id || idx} className="border-b border-slate-200">
              <td className="px-2 py-3 font-medium">{e.nombre}</td>
              <td className="px-2 py-3 text-center">{e.tiempoMinutosReal ?? ''}</td>
              <td className="px-2 py-3 text-center">
                {e.costoTotalReal ? `$${Number(e.costoTotalReal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : ''}
              </td>
            </tr>
          ))}
          {/* Renglones en blanco para captura a mano */}
          {Array.from({ length: Math.max(0, 3 - extras.length) }).map((_, i) => (
            <tr key={`vacio-${i}`} className="border-b border-slate-200">
              <td className="px-2 py-3" />
              <td className="px-2 py-3" />
              <td className="px-2 py-3" />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Captura: quién cargó la info al sistema y cuándo */}
      <table className="w-full text-xs border border-slate-300">
        <tbody>
          <tr className="border-b border-slate-300">
            <td className="px-2 py-3 bg-slate-100 font-semibold w-28">Capturó</td>
            <td className="px-2 py-3 w-1/3" />
            <td className="px-2 py-3 bg-slate-100 font-semibold w-28">Fecha de captura</td>
            <td className="px-2 py-3" />
          </tr>
          <tr>
            <td className="px-2 py-3 bg-slate-100 font-semibold align-top">Notas</td>
            <td className="px-2 py-3" colSpan={3}>
              <div className="h-12" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
