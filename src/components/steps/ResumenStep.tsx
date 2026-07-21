import { Card, CardContent } from '@/components/ui/card';
import type { Cotizacion, PiezaCotizacion, Proceso } from '@/types/cotizacion';

interface ResumenStepProps {
  cotizacion: Cotizacion;
}

export function ResumenStep({ cotizacion }: ResumenStepProps) {
  const { piezas, costosAdicionales, subtotal, iva, total, margenUtilidad, ivaPorcentaje } = cotizacion;

  const costosGenerales = Object.values(costosAdicionales)
    .filter((item: any) => !item.incluidoGratis)
    .reduce((sum: number, item: any) => sum + (item.costo || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
          {cotizacion.tipo === 'pieza_unica' ? 'Pieza Única' : 'Proyecto'}
        </span>
        <span className="text-xs text-slate-500">
          {piezas.length} {piezas.length === 1 ? 'pieza' : 'piezas'}
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">Desglose por pieza</h3>

        {piezas.map((pieza: PiezaCotizacion, index: number) => {
          const costoMats = pieza.material ? pieza.material.costoTotal : 0;
          const costoProcs = pieza.procesos.reduce((sum: number, p: Proceso) => sum + p.costoTotal, 0);
          const costosAdic = Object.values(pieza.costosAdicionales)
            .filter((item: any) => !item.incluidoGratis)
            .reduce((sum: number, item: any) => sum + (item.costo || 0), 0);
          const costoDirecto = costoMats + costoProcs + costosAdic;

          return (
            <Card key={pieza.id} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">
                    {index + 1}. {pieza.nombre}
                  </h4>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Cant: {pieza.cantidad}</span>
                    {pieza.cantidad > 1 && (
                      <p className="text-xs font-medium text-blue-600">
                        ${(pieza.subtotalPieza / pieza.cantidad).toFixed(2)}/pieza
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  {pieza.material && (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Material: {pieza.material.nombre} ({pieza.material.tipo})
                      </span>
                      <div className="text-right">
                        <span>${costoMats.toFixed(2)}</span>
                        {pieza.cantidad > 1 && (
                          <span className="text-xs text-slate-400 ml-1">
                            ({(costoMats / pieza.cantidad).toFixed(2)}/pz)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Procesos ({pieza.procesos.length})</span>
                    <div className="text-right">
                      <span>${costoProcs.toFixed(2)}</span>
                      {pieza.cantidad > 1 && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({(costoProcs / pieza.cantidad).toFixed(2)}/pz)
                        </span>
                      )}
                    </div>
                  </div>
                  {(costosAdic as number) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Costos adicionales</span>
                      <span>${(costosAdic as number).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-slate-900 pt-1 border-t border-slate-100">
                    <span>Costo directo</span>
                    <div className="text-right">
                      <span>${costoDirecto.toFixed(2)}</span>
                      {pieza.cantidad > 1 && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({(costoDirecto / pieza.cantidad).toFixed(2)}/pz)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Utilidad ({margenUtilidad}%)</span>
                    <div className="text-right">
                      <span>${(pieza.subtotalPieza - costoDirecto).toFixed(2)}</span>
                      {pieza.cantidad > 1 && (
                        <span className="text-xs text-green-400 ml-1">
                          ({((pieza.subtotalPieza - costoDirecto) / pieza.cantidad).toFixed(2)}/pz)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-blue-600 font-medium">
                    <span>Subtotal (antes de IVA)</span>
                    <div className="text-right">
                      <span>${pieza.subtotalPieza.toFixed(2)}</span>
                      {pieza.cantidad > 1 && (
                        <span className="text-xs text-blue-400 ml-1">
                          ({(pieza.subtotalPieza / pieza.cantidad).toFixed(2)}/pz)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>IVA ({ivaPorcentaje}%)</span>
                    <span>${pieza.ivaPieza.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total pieza</span>
                    <div className="text-right">
                      <span>${pieza.totalPieza.toFixed(2)}</span>
                      {pieza.cantidad > 1 && (
                        <span className="text-xs text-slate-500 ml-1">
                          ({(pieza.totalPieza / pieza.cantidad).toFixed(2)}/pz)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {costosGenerales > 0 && (
        <div className="flex justify-between text-sm text-slate-600 px-2">
          <span>Costos generales del proyecto</span>
          <span>${costosGenerales.toFixed(2)}</span>
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Calcular costo directo global y margen global */}
            {(() => {
              const costoDirectoGlobal = piezas.reduce((sum, p) => {
                const mats = p.material ? p.material.costoTotal : 0;
                const procs = p.procesos.reduce((s, pr) => s + pr.costoTotal, 0);
                const adic = Object.values(p.costosAdicionales)
                  .filter((item: any) => !item.incluidoGratis)
                  .reduce((s: number, item: any) => s + (item.costo || 0), 0);
                return sum + mats + procs + adic;
              }, 0);
              const margenGlobal = subtotal - costoDirectoGlobal - costosGenerales;
              return (
                <>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Costo directo total</span>
                    <span>${costoDirectoGlobal.toFixed(2)}</span>
                  </div>
                  {costosGenerales > 0 && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Costos generales</span>
                      <span>${costosGenerales.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Utilidad ({margenUtilidad}%)</span>
                    <span>${margenGlobal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-blue-700 pt-1 border-t border-blue-200">
                    <span>Subtotal (antes de IVA)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </>
              );
            })()}
            <div className="flex justify-between text-sm text-slate-600">
              <span>IVA ({ivaPorcentaje}%)</span>
              <span>${iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t-2 border-blue-200 pt-2">
              <span>TOTAL</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
