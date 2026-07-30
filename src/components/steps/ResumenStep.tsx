import { Card, CardContent } from '@/components/ui/card';
import type { Cotizacion, PiezaCotizacion, Proceso } from '@/types/cotizacion';

interface ResumenStepProps {
  cotizacion: Cotizacion;
}

export function ResumenStep({ cotizacion }: ResumenStepProps) {
  const { piezas, costosAdicionales, margenUtilidad, ivaPorcentaje, datosCliente, proyecto, condiciones } = cotizacion;

  const costosGenerales = Object.values(costosAdicionales)
    .filter((item: any) => !item.incluidoGratis)
    .reduce((sum: number, item: any) => sum + (item.costo || 0), 0);

  const formatearDimensiones = (pieza: PiezaCotizacion) => {
    if (!pieza.material) return '';
    const m = pieza.material;
    const partes: string[] = [];
    if (m.largo) partes.push(`L:${m.largo}${m.unidadMedida || 'mm'}`);
    if (m.longitud) partes.push(`Long:${m.longitud}${m.unidadMedida || 'mm'}`);
    if (m.ancho) partes.push(`A:${m.ancho}${m.unidadMedida || 'mm'}`);
    if (m.espesor) partes.push(`E:${m.espesor}${m.unidadMedida || 'mm'}`);
    if (m.diametro) partes.push(`\u00D8:${m.diametro}${m.unidadMedida || 'mm'}`);
    if (m.lado) partes.push(`${m.lado}${m.unidadMedida || 'mm'}`);
    if (m.diametro_exterior) partes.push(`\u00D8ext:${m.diametro_exterior}${m.unidadMedida || 'mm'}`);
    if (m.diametro_interior) partes.push(`\u00D8int:${m.diametro_interior}${m.unidadMedida || 'mm'}`);
    if (m.lado_a) partes.push(`La:${m.lado_a}${m.unidadMedida || 'mm'}`);
    if (m.lado_b) partes.push(`Lb:${m.lado_b}${m.unidadMedida || 'mm'}`);
    if (m.dimensiones_libre) partes.push(m.dimensiones_libre);
    return partes.join(' \u00D7 ');
  };

  const formatearTiempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    if (horas > 0 && mins > 0) return `${horas}h ${mins}m`;
    if (horas > 0) return `${horas}h`;
    return `${mins}m`;
  };

  // Calcular totales correctamente
  const subtotalPiezasSinUtilidad = piezas.reduce((sum, p) => sum + (p.subtotalPieza * p.cantidad), 0);
  const utilidadTotal = piezas.reduce((sum, p) => sum + (p.utilidadPieza * p.cantidad), 0);
  const subtotalConUtilidad = subtotalPiezasSinUtilidad + utilidadTotal + costosGenerales;
  const ivaTotal = subtotalConUtilidad * (ivaPorcentaje / 100);
  const totalGeneral = subtotalConUtilidad + ivaTotal;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">{proyecto.nombre || 'Cotizaci\u00F3n'}</h2>
        <p className="text-sm text-slate-600">Cliente: {datosCliente.empresa || 'Sin empresa'}</p>
        {datosCliente.nombre && (
          <p className="text-sm text-slate-500">Contacto: {datosCliente.nombre}</p>
        )}
      </div>

      {/* Desglose por pieza */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Desglose de Piezas</h3>

        {piezas.map((pieza: PiezaCotizacion, index: number) => {
          const costoMaterial = pieza.material ? pieza.material.costoUnitario * (1 + (pieza.material.margenPorcentaje || 30) / 100) : 0;
          const costoProcesos = pieza.procesos.reduce((sum: number, p: Proceso) => {
            if (p.tipo === 'otro') {
              const costoBase = p.costoTotalIngresado || 0;
              const margen = p.margenPorcentaje || 30;
              return sum + (costoBase * (1 + margen / 100));
            }
            return sum + (p.costoTotal / pieza.cantidad);
          }, 0);
          const costosAdicPieza = Object.values(pieza.costosAdicionales)
            .filter((item: any) => !item.incluidoGratis)
            .reduce((sum: number, item: any) => sum + (item.costo || 0), 0) / pieza.cantidad;
          
          const costoDirectoPieza = costoMaterial + costoProcesos + costosAdicPieza;
          const utilidadPieza = pieza.totalPieza - pieza.subtotalPieza;

          return (
            <Card key={pieza.id} className="border-slate-200">
              <CardContent className="p-4">
                {/* Nombre y cantidad */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <h4 className="font-semibold text-slate-900">
                    {index + 1}. {pieza.nombre}
                  </h4>
                  <span className="text-sm font-medium text-slate-600">
                    Cantidad: {pieza.cantidad}
                  </span>
                </div>

                {/* Material */}
                {pieza.material && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">Material</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">
                        {pieza.material.nombre} ({formatearDimensiones(pieza)})
                      </span>
                      <span className="font-medium">${costoMaterial.toFixed(2)}/pz</span>
                    </div>
                  </div>
                )}

                {/* Procesos */}
                {pieza.procesos.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">Procesos</p>
                    <div className="space-y-1">
                      {pieza.procesos.map((proceso: Proceso) => (
                        <div key={proceso.id} className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">
                            {proceso.nombre}
                            <span className="text-slate-400 text-xs ml-1">
                              ({formatearTiempo(proceso.tiempoMinutosPorPieza)} por pieza)
                            </span>
                          </span>
                          <span className="text-slate-600">
                            ${(proceso.costoTotal / pieza.cantidad).toFixed(2)}/pz
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-1 mt-1 border-t border-slate-50">
                      <span className="text-slate-600">Total procesos</span>
                      <span>${costoProcesos.toFixed(2)}/pz</span>
                    </div>
                  </div>
                )}

                {/* Costos adicionales por pieza */}
                {costosAdicPieza > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Costos adicionales</span>
                    <span>${costosAdicPieza.toFixed(2)}/pz</span>
                  </div>
                )}

                {/* Resumen de costos por pieza - SIN IVA aquí */}
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Costo directo</span>
                    <span className="font-medium">${costoDirectoPieza.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Utilidad ({margenUtilidad}%)</span>
                    <span>${utilidadPieza.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-700 pt-1 border-t border-slate-100">
                    <span>Total por pieza (con utilidad)</span>
                    <span>${pieza.totalPieza.toFixed(2)}</span>
                  </div>
                  {pieza.cantidad > 1 && (
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Total {pieza.cantidad} piezas</span>
                      <span>${(pieza.totalPieza * pieza.cantidad).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Costos adicionales del proyecto */}
      {costosGenerales > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Costos Adicionales del Proyecto</h3>
          {Object.entries(costosAdicionales).map(([key, item]: [string, any]) => {
            if (item.incluidoGratis || item.costo === 0) return null;
            const labels: Record<string, string> = {
              envio: 'Env\u00EDo / Entrega',
              diseno: 'Dise\u00F1o CAD / CAM',
              estudioMaterial: 'Estudio de Material',
              pruebaDureza: 'Prueba de Dureza',
            };
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-slate-600">{labels[key] || key}</span>
                <span>${item.costo.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Totales globales */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3">Resumen General</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Costo directo piezas</span>
              <span>${subtotalPiezasSinUtilidad.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Utilidad ({margenUtilidad}%)</span>
              <span>${utilidadTotal.toFixed(2)}</span>
            </div>
            {costosGenerales > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Costos adicionales</span>
                <span>${costosGenerales.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium text-blue-700 pt-1 border-t border-blue-200">
              <span>Subtotal (antes de IVA)</span>
              <span>${subtotalConUtilidad.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>IVA ({ivaPorcentaje}%)</span>
              <span>${ivaTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t-2 border-blue-200 pt-2">
              <span className="text-slate-900">TOTAL</span>
              <span className="text-blue-600">${totalGeneral.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condiciones comerciales */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold text-slate-800">Condiciones Comerciales</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Validez de oferta:</span>
            <span className="font-medium">{condiciones.validezDias} días</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tiempo de entrega:</span>
            <span className="font-medium">{condiciones.tiempoEntregaDias} días hábiles</span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-slate-500">Forma de pago:</span>
            <span className="font-medium">{condiciones.formaPago}</span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-slate-500">Garantía:</span>
            <span className="font-medium">{condiciones.garantia}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
