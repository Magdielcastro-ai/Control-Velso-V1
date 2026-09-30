// Documento imprimible de la hoja viajera de UNA pieza.
// Compartido por HojaViajeraView (Proyectos) y ProduccionView (Producción).
// Si un proceso ya tiene captura real se imprime el dato; si no, la
// columna sale en blanco para llenarla a mano en piso.

interface HojaViajeraDocumentoProps {
  proyecto: {
    codigoProyecto: string;
    proyectoNombre: string;
    clienteNombre: string;
    ordenCompra?: string;
    numeroCotizacion?: string;
  };
  pieza: any;
  realDe?: (procesoId: string) => any | null;
}

export function HojaViajeraDocumento({ proyecto, pieza, realDe }: HojaViajeraDocumentoProps) {
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const real = (id: string) => (realDe ? realDe(id) : null);

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
          {(pieza.procesos || []).map((proc: any, idx: number) => {
            const r = real(proc.id);
            return (
              <tr key={proc.id || idx} className="border-b border-slate-200">
                <td className="px-2 py-3">{idx + 1}</td>
                <td className="px-2 py-3 font-medium">{proc.nombre}</td>
                <td className="px-2 py-3 text-right">{proc.tiempoMinutosPorPieza ?? '—'}</td>
                <td className="px-2 py-3 text-right">{proc.tiempoMinutos ?? '—'}</td>
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
          {/* Fila de totales */}
          <tr className="bg-slate-100 font-semibold">
            <td className="px-2 py-2" colSpan={2}>TOTALES</td>
            <td className="px-2 py-2 text-right">
              {(pieza.procesos || []).reduce((s: number, p: any) => s + (Number(p.tiempoMinutosPorPieza) || 0), 0)}
            </td>
            <td className="px-2 py-2 text-right">
              {(pieza.procesos || []).reduce((s: number, p: any) => s + (Number(p.tiempoMinutos) || 0), 0)}
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
  );
}
