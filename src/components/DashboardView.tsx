import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Target,
  TrendingUp,
  ShoppingCart,
  FileText
} from 'lucide-react';
import { CATALOGO_PROCESOS_VELSO } from '@/types/cotizacion';
import type { CotizacionGuardada } from '@/types/cotizacion';
import type { ProyectoVenta } from '@/types/ventas';
import { GraficaCircular, GraficaComparacion, GraficaBarrasComparacion } from '@/components/GraficasCirculares';

interface DashboardViewProps {
  onVolver: () => void;
  cotizaciones: CotizacionGuardada[];
  cotizacionesCompletas: any[];
  horasDisponibles: Record<string, number>;
  proyectos: ProyectoVenta[];
  userRol?: string;
  userId?: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DashboardView({ 
  onVolver, 
  cotizaciones, 
  cotizacionesCompletas,
  horasDisponibles,
  proyectos,
  userRol = 'vendedor',
  userId
}: DashboardViewProps) {
  const hoy = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());

  // Determinar si es admin/superadmin
  const isAdmin = userRol === 'admin' || userRol === 'superadmin';

  // Filtrar datos por usuario si es vendedor
  const cotizacionesFiltradas = isAdmin 
    ? cotizaciones 
    : cotizaciones.filter(c => c.usuarioId === userId);

  const proyectosFiltrados = isAdmin 
    ? proyectos 
    : proyectos.filter(p => p.usuarioId === userId);

  const cotizacionesCompletasFiltradas = isAdmin 
    ? cotizacionesCompletas 
    : cotizacionesCompletas.filter((c: any) => c.usuario_id === userId);

  // Filtrar datos por mes seleccionado
  const datosMes = useMemo(() => {
    // Cotizaciones del mes (usando datos filtrados por usuario)
    const cotizacionesMes = cotizacionesFiltradas.filter(c => {
      const fecha = new Date(c.fecha);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });

    // Proyectos vendidos en el mes (usando datos filtrados por usuario)
    const proyectosMes = proyectosFiltrados.filter(p => {
      const fecha = new Date(p.fechaVenta);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });

    // Proyectos facturados en el mes (usando datos filtrados por usuario)
    const proyectosFacturadosMes = proyectosFiltrados.filter(p => {
      if (!p.fechaFacturado) return false;
      const fecha = new Date(p.fechaFacturado);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });

    // Totales
    const totalCotizado = cotizacionesMes.reduce((sum, c) => sum + c.total, 0);
    const totalVendido = proyectosMes.reduce((sum, p) => sum + p.totalCotizado, 0);
    const totalFacturado = proyectosFacturadosMes.reduce((sum, p) => sum + (p.totalFacturado || 0), 0);
    const totalUtilidad = proyectosFacturadosMes.reduce((sum, p) => sum + (p.utilidadReal || 0), 0);

    // Calcular horas
    const horasCotizadas: Record<string, number> = {};
    const horasVendidas: Record<string, number> = {};
    const horasFabricadas: Record<string, number> = {};
    const horasFacturadas: Record<string, number> = {};

    CATALOGO_PROCESOS_VELSO.forEach(p => {
      horasCotizadas[p.id] = 0;
      horasVendidas[p.id] = 0;
      horasFabricadas[p.id] = 0;
      horasFacturadas[p.id] = 0;
    });

    // Horas cotizadas (de cotizaciones filtradas por usuario)
    cotizacionesCompletasFiltradas.forEach((cot: any) => {
      const fecha = new Date(cot.fecha);
      if (fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado) {
        cot.procesos?.forEach((p: any) => {
          const tiempoHoras = (p.tiempoMinutos || 0) / 60;
          if (horasCotizadas[p.tipo] !== undefined) {
            horasCotizadas[p.tipo] += tiempoHoras;
          }
        });
      }
    });

    // Horas vendidas, fabricadas, facturadas (de proyectos)
    proyectosMes.forEach(p => {
      p.procesos.forEach(proc => {
        const tiempoHoras = (proc.tiempoMinutosCotizado || 0) / 60;
        const tiempoRealHoras = (proc.tiempoMinutosReal || proc.tiempoMinutosCotizado || 0) / 60;
        
        if (horasVendidas[proc.tipo] !== undefined) {
          horasVendidas[proc.tipo] += tiempoHoras;
          
          if (p.estado === 'fabricado' || p.estado === 'entregado' || p.estado === 'facturado') {
            horasFabricadas[proc.tipo] += tiempoRealHoras;
          }
          
          if (p.estado === 'facturado') {
            horasFacturadas[proc.tipo] += tiempoRealHoras;
          }
        }
      });
    });

    // Agrupar por cliente
    const porCliente: Record<string, { nombre: string; cotizado: number; vendido: number; facturado: number }> = {};
    
    cotizacionesMes.forEach(c => {
      if (!porCliente[c.clienteNombre]) {
        porCliente[c.clienteNombre] = { nombre: c.clienteNombre, cotizado: 0, vendido: 0, facturado: 0 };
      }
      porCliente[c.clienteNombre].cotizado += c.total;
    });

    proyectosMes.forEach(p => {
      if (!porCliente[p.clienteNombre]) {
        porCliente[p.clienteNombre] = { nombre: p.clienteNombre, cotizado: 0, vendido: 0, facturado: 0 };
      }
      porCliente[p.clienteNombre].vendido += p.totalCotizado;
      if (p.totalFacturado) {
        porCliente[p.clienteNombre].facturado += p.totalFacturado;
      }
    });

    const clientesData = Object.values(porCliente).sort((a, b) => b.vendido - a.vendido);

    return {
      cotizacionesMes,
      proyectosMes,
      proyectosFacturadosMes,
      totalCotizado,
      totalVendido,
      totalFacturado,
      totalUtilidad,
      horasCotizadas,
      horasVendidas,
      horasFabricadas,
      horasFacturadas,
      clientesData,
    };
  }, [cotizacionesFiltradas, proyectosFiltrados, cotizacionesCompletasFiltradas, mesSeleccionado, anioSeleccionado]);

  // Datos para gráficas
  const datosGraficaMontos = [
    { nombre: 'Cotizado', valor: datosMes.totalCotizado, color: '#3b82f6' },
    { nombre: 'Vendido', valor: datosMes.totalVendido, color: '#22c55e' },
    { nombre: 'Facturado', valor: datosMes.totalFacturado, color: '#8b5cf6' },
  ];

  const datosGraficaHorasTotales = [
    { 
      nombre: 'Cotizadas', 
      valor: Object.values(datosMes.horasCotizadas).reduce((a, b) => a + b, 0), 
      color: '#3b82f6' 
    },
    { 
      nombre: 'Vendidas', 
      valor: Object.values(datosMes.horasVendidas).reduce((a, b) => a + b, 0), 
      color: '#22c55e' 
    },
    { 
      nombre: 'Fabricadas', 
      valor: Object.values(datosMes.horasFabricadas).reduce((a, b) => a + b, 0), 
      color: '#f59e0b' 
    },
    { 
      nombre: 'Facturadas', 
      valor: Object.values(datosMes.horasFacturadas).reduce((a, b) => a + b, 0), 
      color: '#8b5cf6' 
    },
  ];

  // Datos para gráfica de barras por proceso
  const datosPorProceso = CATALOGO_PROCESOS_VELSO
    .filter(p => p.id !== 'otro')
    .map(p => ({
      categoria: p.nombre,
      cotizadas: datosMes.horasCotizadas[p.id] || 0,
      vendidas: datosMes.horasVendidas[p.id] || 0,
      fabricadas: datosMes.horasFabricadas[p.id] || 0,
      facturadas: datosMes.horasFacturadas[p.id] || 0,
    }));

  // Datos para gráficas de comparación
  const datosCotizadas = CATALOGO_PROCESOS_VELSO
    .filter(p => p.id !== 'otro')
    .map(p => ({
      nombre: p.nombre,
      valor: datosMes.horasCotizadas[p.id] || 0,
    }));

  const datosVendidas = CATALOGO_PROCESOS_VELSO
    .filter(p => p.id !== 'otro')
    .map(p => ({
      nombre: p.nombre,
      valor: datosMes.horasVendidas[p.id] || 0,
    }));

  const datosFabricadas = CATALOGO_PROCESOS_VELSO
    .filter(p => p.id !== 'otro')
    .map(p => ({
      nombre: p.nombre,
      valor: datosMes.horasFabricadas[p.id] || 0,
    }));

  const datosFacturadas = CATALOGO_PROCESOS_VELSO
    .filter(p => p.id !== 'otro')
    .map(p => ({
      nombre: p.nombre,
      valor: datosMes.horasFacturadas[p.id] || 0,
    }));

  // Generar años disponibles
  const aniosDisponibles = [2024, 2025, 2026];

  return (
    <div className="space-y-6">
      {/* Header con selector de mes */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Dashboard
            {!isAdmin && <span className="text-sm font-normal text-blue-600 ml-2">(Vista Personal)</span>}
            {isAdmin && <span className="text-sm font-normal text-purple-600 ml-2">(Vista de Admin)</span>}
          </h2>
        </div>
        <div className="flex gap-2">
          <Select value={mesSeleccionado.toString()} onValueChange={(v) => setMesSeleccionado(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((mes, index) => (
                <SelectItem key={index} value={index.toString()}>{mes}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={anioSeleccionado.toString()} onValueChange={(v) => setAnioSeleccionado(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aniosDisponibles.map((anio) => (
                <SelectItem key={anio} value={anio.toString()}>{anio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mensaje si no hay datos */}
      {cotizacionesFiltradas.length === 0 && proyectosFiltrados.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <p className="text-amber-700 font-medium">No hay datos disponibles para este período</p>
            <p className="text-amber-600 text-sm mt-1">
              Crea cotizaciones o conviértelas en ventas para ver métricas aquí
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Cotizado</p>
                <p className="text-xl font-bold text-slate-900">${datosMes.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Total Vendido</p>
                <p className="text-xl font-bold text-green-600">${datosMes.totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Total Facturado</p>
                <p className="text-xl font-bold text-purple-600">${datosMes.totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Utilidad Real</p>
                <p className="text-xl font-bold text-amber-600">${datosMes.totalUtilidad.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas Circulares - Montos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraficaCircular 
          titulo="Distribución de Montos" 
          datos={datosGraficaMontos} 
        />
        <GraficaCircular 
          titulo="Distribución de Horas" 
          datos={datosGraficaHorasTotales} 
        />
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Resumen de Proyectos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm">Cotizaciones</span>
                <Badge className="bg-blue-600">{datosMes.cotizacionesMes.length}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm">Proyectos Vendidos</span>
                <Badge className="bg-green-600">{datosMes.proyectosMes.length}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm">Proyectos Facturados</span>
                <Badge className="bg-purple-600">{datosMes.proyectosFacturadosMes.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Código 07 - Objetivo Principal */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-blue-600" />
            Código 07 - Objetivo Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-xs text-slate-500">Horas Cotizadas</p>
              <p className="text-2xl font-bold text-blue-600">{(datosMes.horasCotizadas['codigo_07'] || 0).toFixed(1)}h</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-xs text-green-600">Horas Vendidas</p>
              <p className="text-2xl font-bold text-green-600">{(datosMes.horasVendidas['codigo_07'] || 0).toFixed(1)}h</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-xs text-amber-600">Horas Fabricadas</p>
              <p className="text-2xl font-bold text-amber-600">{(datosMes.horasFabricadas['codigo_07'] || 0).toFixed(1)}h</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-xs text-purple-600">Horas Facturadas</p>
              <p className="text-2xl font-bold text-purple-600">{(datosMes.horasFacturadas['codigo_07'] || 0).toFixed(1)}h</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso: Facturadas vs Meta</span>
              <span className="font-semibold">
                {Math.min(((datosMes.horasFacturadas['codigo_07'] || 0) / (horasDisponibles['codigo_07'] || 1)) * 100, 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(((datosMes.horasFacturadas['codigo_07'] || 0) / (horasDisponibles['codigo_07'] || 1)) * 100, 100)} 
              className="h-3"
            />
            <p className="text-xs text-slate-500 text-right">
              Meta: {horasDisponibles['codigo_07']?.toFixed(2) || '0.00'}h
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparaciones de Horas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraficaComparacion
          titulo="Cotizadas vs Vendidas"
          datos1={datosCotizadas}
          datos2={datosVendidas}
          color1="#3b82f6"
          color2="#22c55e"
          label1="Cotizadas"
          label2="Vendidas"
        />
        <GraficaComparacion
          titulo="Vendidas vs Fabricadas"
          datos1={datosVendidas}
          datos2={datosFabricadas}
          color1="#22c55e"
          color2="#f59e0b"
          label1="Vendidas"
          label2="Fabricadas"
        />
        <GraficaComparacion
          titulo="Fabricadas vs Facturadas"
          datos1={datosFabricadas}
          datos2={datosFacturadas}
          color1="#f59e0b"
          color2="#8b5cf6"
          label1="Fabricadas"
          label2="Facturadas"
        />
      </div>

      {/* Horas por Proceso - Barras */}
      <GraficaBarrasComparacion
        titulo="Comparación de Horas por Proceso"
        datos={datosPorProceso}
      />

      {/* Clientes */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-600" />
            Clientes - {MESES[mesSeleccionado]} {anioSeleccionado}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {datosMes.clientesData.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No hay datos este mes</p>
          ) : (
            <div className="space-y-4">
              {datosMes.clientesData.map((cliente) => (
                <div key={cliente.nombre} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{cliente.nombre}</span>
                      <span className="text-slate-500">
                        ${cliente.vendido.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                        {cliente.facturado > 0 && (
                          <span className="text-purple-600 ml-2">(${cliente.facturado.toLocaleString('es-MX', { minimumFractionDigits: 0 })} fact.)</span>
                        )}
                      </span>
                    </div>
                    <Progress 
                      value={datosMes.totalVendido > 0 ? (cliente.vendido / datosMes.totalVendido) * 100 : 0} 
                      className="h-2" 
                    />
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
