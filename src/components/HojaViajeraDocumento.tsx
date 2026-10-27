// Documento imprimible de la hoja viajera de UNA pieza.
// Compartido por HojaViajeraView (Proyectos) y ProduccionView (Producción).
// Si un proceso ya tiene captura real se imprime el dato; si no, la
// columna sale en blanco para llenarla a mano en piso.
// Diseñada para caber en UNA hoja carta.

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
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2 mb-2">
        <div>
          <h1 className="text-lg font-bold leading-tight">HOJA VIAJERA</h1>
          <p className="text-xs text-slate-600">Soluciones Integrales Velso</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold">{proyecto.codigoProyecto}</p>
          <p className="text-[10px] text-slate-500">{fechaHoy}</p>
        </div>
      </div>

      {/* Datos del proyecto/pieza + imagen a la derecha (la imagen ya no
          empuja las columnas hacia abajo) */}
      <div className="flex gap-2 mb-2 items-start">
        <table className="flex-1 text-[11px] border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="px-2 py-1 bg-slate-100 font-semibold w-24">Pieza</td>
              <td className="px-2 py-1 font-bold">{pieza.nombre}</td>
              <td className="px-2 py-1 bg-slate-100 font-semibold w-24">Código pieza</td>
              <td className="px-2 py-1">{pieza.codigo || '—'}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="px-2 py-1 bg-slate-100 font-semibold">Cantidad</td>
              <td className="px-2 py-1">{pieza.cantidad} pzas</td>
              <td className="px-2 py-1 bg-slate-100 font-semibold">Proyecto</td>
              <td className="px-2 py-1">{proyecto.proyectoNombre}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="px-2 py-1 bg-slate-100 font-semibold">Cliente</td>
              <td className="px-2 py-1">{proyecto.clienteNombre}</td>
              <td className="px-2 py-1 bg-slate-100 font-semibold">Orden de compra</td>
              <td className="px-2 py-1">{proyecto.ordenCompra || '—'}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 bg-slate-100 font-semibold">Cotización</td>
              <td className="px-2 py-1">{proyecto.numeroCotizacion || '—'}</td>
              <td className="px-2 py-1 bg-slate-100 font-semibold">Material</td>
              <td className="px-2 py-1">
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

        {/* Imagen de la pieza en su propia zona, sin mover las columnas */}
        {pieza.imagen && (
          <div className="w-36 shrink-0 border border-slate-300 p-1 bg-white flex items-center justify-center">
            <img
              src={pieza.imagen}
              alt={pieza.nombre}
              className="max-h-28 max-w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Procesos: SIN tiempos cotizados a petición del usuario
          (los operadores no deben ver el tiempo esperado).
          Solo ruta de procesos + fecha/hora/reales para captura en piso */}
      <table className="w-full text-[11px] border border-slate-300 mb-2">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-2 py-1 text-left w-6">#</th>
            <th className="px-2 py-1 text-left">PROCESO</th>
            <th className="px-2 py-1 text-center w-20">FECHA</th>
            <th className="px-2 py-1 text-center w-16">HORA INICIO</th>
            <th className="px-2 py-1 text-center w-16">HORA FIN</th>
            <th className="px-2 py-1 text-center w-16">MIN REALES</th>
            <th className="px-2 py-1 text-center w-20">OPERADOR</th>
          </tr>
        </thead>
        <tbody>
          {(pieza.procesos || []).map((proc: any, idx: number) => {
            const r = real(proc);
            return (
              <tr key={proc.id || idx} className="border-b border-slate-200">
                <td className="px-2 py-3">{idx + 1}</td>
                <td className="px-2 py-3 font-medium">{proc.nombre}</td>
                <td className="px-2 py-3" />
                <td className="px-2 py-3" />
                <td className="px-2 py-3" />
                <td className="px-2 py-3 text-center font-semibold">
                  {r ? r.tiempoMinutosReal : ''}
                </td>
                <td className="px-2 py-3 text-center">
                  {r?.operadorNombre || ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Herramientas / dispositivos extra: en Producción solo TIEMPO;
          el costo se asigna en la sección de Proyectos */}
      <p className="text-[10px] font-bold text-slate-600 mb-0.5">
        HERRAMIENTAS O DISPOSITIVOS ESPECIALES (solo tiempo)
      </p>
      <table className="w-full text-[11px] border border-slate-300 mb-2">
        <thead>
          <tr className="bg-slate-600 text-white">
            <th className="px-2 py-1 text-left">HERRAMIENTA / DISPOSITIVO</th>
            <th className="px-2 py-1 text-center w-24">MIN UTILIZADOS</th>
          </tr>
        </thead>
        <tbody>
          {extras.map((e: any, idx: number) => (
            <tr key={e.id || idx} className="border-b border-slate-200">
              <td className="px-2 py-2 font-medium">{e.nombre}</td>
              <td className="px-2 py-2 text-center">{e.tiempoMinutosReal ?? ''}</td>
            </tr>
          ))}
          {/* Renglones en blanco para captura a mano */}
          {Array.from({ length: Math.max(0, 3 - extras.length) }).map((_, i) => (
            <tr key={`vacio-${i}`} className="border-b border-slate-200">
              <td className="px-2 py-2" />
              <td className="px-2 py-2" />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Captura: quién cargó la info al sistema y cuándo */}
      <table className="w-full text-[11px] border border-slate-300">
        <tbody>
          <tr className="border-b border-slate-300">
            <td className="px-2 py-2 bg-slate-100 font-semibold w-24">Capturó</td>
            <td className="px-2 py-2 w-1/3" />
            <td className="px-2 py-2 bg-slate-100 font-semibold w-24">Fecha de captura</td>
            <td className="px-2 py-2" />
          </tr>
          <tr>
            <td className="px-2 py-2 bg-slate-100 font-semibold align-top">Notas</td>
            <td className="px-2 py-2" colSpan={3}>
              <div className="h-10" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
