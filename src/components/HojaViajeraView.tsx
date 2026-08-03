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

  const togglePieza = (piezaId: string) => {
    setPiezaExpandida(piezaExpandida === piezaId ? null : piezaId);
  };

  const handleImprimir = () => {
    window.print();
  };

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
              <button
                onClick={() => togglePieza(pieza.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
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
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {pieza.procesos?.length || 0} procesos
                  </span>
                  {piezaExpandida === pieza.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

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
                        {pieza.procesos.map((proceso) => (
                          <div 
                            key={proceso.id} 
                            className="bg-slate-50 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-sm">{proceso.nombre}</p>
                              <p className="text-xs text-slate-500">
                                {proceso.tiempoMinutosPorPieza} min/pieza
                              </p>
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
                        ))}
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
