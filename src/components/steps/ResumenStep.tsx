import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Factory, 
  User, 
  FileText, 
  Package, 
  Settings, 
  DollarSign, 
  Calendar,
  CheckCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';
import type { Cotizacion } from '@/types/cotizacion';

interface ResumenStepProps {
  cotizacion: Cotizacion;
}

export function ResumenStep({ cotizacion }: ResumenStepProps) {
  const seccionesCompletas = [
    { nombre: 'Datos del Taller', completo: !!cotizacion.datosTaller.nombre, icon: Factory },
    { nombre: 'Datos del Cliente', completo: !!cotizacion.datosCliente.nombre, icon: User },
    { nombre: 'Proyecto', completo: !!cotizacion.proyecto.nombre, icon: FileText },
    { nombre: 'Materiales', completo: cotizacion.materiales.length > 0, icon: Package },
    { nombre: 'Procesos', completo: cotizacion.procesos.length > 0, icon: Settings },
    { nombre: 'Costos', completo: true, icon: DollarSign },
    { nombre: 'Condiciones', completo: true, icon: Calendar },
  ];

  const totalCompletas = seccionesCompletas.filter(s => s.completo).length;
  const progreso = (totalCompletas / seccionesCompletas.length) * 100;

  const costoMateriales = cotizacion.materiales.reduce((sum, m) => sum + m.costoTotal, 0);
  const costoProcesos = cotizacion.procesos.reduce((sum, p) => sum + p.costoTotal, 0);
  const costosAdicionales = Object.values(cotizacion.costosAdicionales).reduce((sum, v) => sum + v, 0);
  const costoDirecto = costoMateriales + costoProcesos + costosAdicionales;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Resumen de la Cotización</h2>
        <p className="text-slate-600">Revisa la información antes de generar el documento</p>
      </div>

      {/* Progreso */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-slate-700">Progreso de la cotización</span>
            <span className="text-sm text-slate-500">{totalCompletas} de {seccionesCompletas.length} secciones</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de secciones */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Secciones Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seccionesCompletas.map((seccion) => (
                <div 
                  key={seccion.nombre}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    seccion.completo ? 'bg-green-50' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <seccion.icon className={`w-5 h-5 ${seccion.completo ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className={seccion.completo ? 'text-slate-900' : 'text-slate-500'}>
                      {seccion.nombre}
                    </span>
                  </div>
                  <Badge 
                    variant={seccion.completo ? 'default' : 'secondary'}
                    className={seccion.completo ? 'bg-green-600' : ''}
                  >
                    {seccion.completo ? 'Completo' : 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de costos */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-blue-600" />
              Resumen de Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Materiales:</span>
                <span className="font-medium">${costoMateriales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Procesos:</span>
                <span className="font-medium">${costoProcesos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Costos adicionales:</span>
                <span className="font-medium">${costosAdicionales.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-slate-600">Costo directo:</span>
                <span className="font-semibold">${costoDirecto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Margen ({cotizacion.margenUtilidad}%):
                </span>
                <span className="font-medium text-green-600">
                  +${(cotizacion.subtotal - costoDirecto).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">${cotizacion.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">IVA ({cotizacion.ivaPorcentaje}%):</span>
                <span className="font-medium">${cotizacion.iva.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-blue-600 pt-2 flex justify-between">
                <span className="text-lg font-bold text-slate-900">TOTAL:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${cotizacion.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Número:</strong> {cotizacion.numero}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Fecha:</strong> {new Date(cotizacion.fecha).toLocaleDateString('es-MX')}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Validez:</strong> {cotizacion.condiciones.validezDias} días
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
