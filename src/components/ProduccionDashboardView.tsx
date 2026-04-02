import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  DollarSign, 
  Package,
  Factory,
  TrendingUp,
  Clock
} from 'lucide-react';
import type { ProyectoVenta } from '@/types/ventas';

interface ProduccionDashboardViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function ProduccionDashboardView({ 
  onVolver, 
  proyectos 
}: ProduccionDashboardViewProps) {
  const hoy = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());

  // Filtrar proyectos por mes seleccionado
  const datosMes = useMemo(() => {
    // Proyectos vendidos en el mes
    const proyectosMes = proyectos.filter(p => {
      const fecha = new Date(p.fechaVenta);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });

    // Totales
    const totalVendido = proyectosMes.reduce((sum, p) => sum + p.totalCotizado, 0);
    
    // Proyectos fabricados en el mes
    const proyectosFabricadosMes = proyectosMes.filter(p => 
      p.estado === 'fabricado' || p.estado === 'entregado' || p.estado === 'facturado'
    );
    const totalFabricado = proyectosFabricadosMes.reduce((sum, p) => sum + p.totalCotizado, 0);
    
    // Proyectos pendientes de fabricar
    const proyectosPendientes = proyectosMes.filter(p => p.estado === 'en_fabricacion');
    const totalPendiente = proyectosPendientes.reduce((sum, p) => sum + p.totalCotizado, 0);

    // Conteos
    const cantidadVendida = proyectosMes.length;
    const cantidadFabricada = proyectosFabricadosMes.length;
    const cantidadPendiente = proyectosPendientes.length;

    // Calcular horas totales
    const horasVendidas = proyectosMes.reduce((sum, p) => 
      sum + p.procesos.reduce((h, proc) => h + (proc.tiempoMinutosCotizado || 0), 0) / 60, 0
    );
    
    const horasFabricadas = proyectosFabricadosMes.reduce((sum, p) => 
      sum + p.procesos.reduce((h, proc) => h + (proc.tiempoMinutosCotizado || 0), 0) / 60, 0
    );

    return {
      proyectosMes,
      proyectosFabricadosMes,
      proyectosPendientes,
      totalVendido,
      totalFabricado,
      totalPendiente,
      cantidadVendida,
      cantidadFabricada,
      cantidadPendiente,
      horasVendidas,
      horasFabricadas,
    };
  }, [proyectos, mesSeleccionado, anioSeleccionado]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Dashboard de Producción
            <span className="text-sm font-normal text-green-600 ml-2">(Vista de Producción)</span>
          </h2>
        </div>
      </div>

      {/* Selector de mes */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Mes</label>
              <Select value={mesSeleccionado.toString()} onValueChange={(v) => setMesSeleccionado(parseInt(v))}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Año</label>
              <Select value={anioSeleccionado.toString()} onValueChange={(v) => setAnioSeleccionado(parseInt(v))}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((anio) => (
                    <SelectItem key={anio} value={anio.toString()}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Vendido</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${datosMes.totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-slate-400">{datosMes.cantidadVendida} proyectos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Fabricado</p>
                <p className="text-2xl font-bold text-green-600">
                  ${datosMes.totalFabricado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-slate-400">{datosMes.cantidadFabricada} proyectos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Factory className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendiente de Fabricar</p>
                <p className="text-2xl font-bold text-amber-600">
                  ${datosMes.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-slate-400">{datosMes.cantidadPendiente} proyectos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Horas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              Horas Cotizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {datosMes.horasVendidas.toFixed(1)}h
            </p>
            <p className="text-sm text-slate-500">
              Total de horas en proyectos del mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Horas Fabricadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {datosMes.horasFabricadas.toFixed(1)}h
            </p>
            <p className="text-sm text-slate-500">
              {datosMes.horasVendidas > 0 
                ? `${((datosMes.horasFabricadas / datosMes.horasVendidas) * 100).toFixed(1)}% completado`
                : 'Sin horas pendientes'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de proyectos pendientes */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-amber-600" />
            Proyectos Pendientes de Fabricar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {datosMes.proyectosPendientes.length === 0 ? (
            <p className="text-center text-slate-500 py-4">
              No hay proyectos pendientes de fabricar este mes
            </p>
          ) : (
            <div className="space-y-3">
              {datosMes.proyectosPendientes.map((proyecto) => (
                <div 
                  key={proyecto.id} 
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div>
                    <p className="font-medium">{proyecto.proyectoNombre}</p>
                    <p className="text-sm text-slate-500">{proyecto.clienteNombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">
                      ${proyecto.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </p>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      En Fabricación
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
