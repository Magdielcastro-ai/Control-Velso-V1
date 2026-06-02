import { Card, CardContent } from '@/components/ui/card';
import type { Cotizacion, PiezaCotizacion, Material, Proceso } from '@/types/cotizacion';

interface ResumenStepProps {
  cotizacion: Cotizacion;
}

export function ResumenStep({ cotizacion }: ResumenStepProps) {
  const { piezas, costosAdicionales, subtotal, iva, total, margenUtilidad, ivaPorcentaje } = cotizacion;

  const costosGenerales = Object.values(costosAdicionales).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-6">
      {/* Tipo de cotización */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
          {cotizacion.tipo === 'pieza_unica' ? 'Pieza Única' : 'Proyecto'}
        </span>
        <span className="text-xs text-slate-500">
          {piezas.length} {piezas.length === 1 ? 'pieza' : 'piezas'}
        </span>
      </div>

      {/* Desglose por pieza */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">Desglose por pieza</h3>

        {piezas.map((pieza: PiezaCotizacion, index: number) => {
          // ← CAMBIO: material único en lugar de array
          const costoMats = pieza.material ? pieza.material.costoTotal : 0;
          const costoProcs = pieza.procesos.reduce((sum: number, p: Proceso) => sum + p.costoTotal, 0);
          const costosAdic = Object.values(pieza.costosAdicionales).reduce((sum: number, v: number) => sum + v, 0);
          const costoDirecto = costoMats + costoProcs + costosAdic;

          return (
            <Card key={pieza.id} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">
                    {index + 1}. {pieza.nombre}
                  </h4>
                  <span className="text-xs text-slate-500">Cant: {pieza.cantidad}</span>
                </div>

                <div className="space-y-1 text-sm">
                  {pieza.material && (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Material: {pieza.material.nombre} ({pieza.material.tipo})
                      </span>
                      <span>${costoMats.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Procesos ({pieza.procesos.length})</span>
                    <span>${costoProcs.toFixed(2)}</span>
                  </div>
                  {(costosAdic as number) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Costos adicionales</span>
                      <span>${(costosAdic as number).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-slate-900 pt-1 border-t border-slate-100">
                    <span>Costo directo</span>
                    <span>${costoDirecto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Con margen ({margenUtilidad}%)</span>
                    <span>${pieza.subtotalPieza.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>IVA ({ivaPorcentaje}%)</span>
                    <span>${pieza.ivaPieza.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total pieza</span>
                    <span>${pieza.totalPieza.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Costos generales */}
      {costosGenerales > 0 && (
        <div className="flex justify-between text-sm text-slate-600 px-2">
          <span>Costos generales del proyecto</span>
          <span>${costosGenerales.toFixed(2)}</span>
        </div>
      )}

      {/* Totales */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>IVA ({ivaPorcentaje}%)</span>
              <span>${iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t border-blue-200">
              <span>TOTAL</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
