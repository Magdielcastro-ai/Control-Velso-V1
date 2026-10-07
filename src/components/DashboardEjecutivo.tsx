// src/components/DashboardEjecutivo.tsx

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Factory,
  FileText,
  Truck,
  Phone,
  AlertOctagon,
  BarChart3,
  Package,
  Users,
  Building2,
  Settings,
  Loader2,
  Calendar,
  Target,
  ShoppingCart,
  Wrench
} from 'lucide-react';
import type { Pendiente, Alerta } from '@/types/pendientes';
import type { ProyectoVenta } from '@/types/ventas';
import { CATALOGO_PROCESOS_VELSO } from '@/types/cotizacion';
import type { CotizacionGuardada } from '@/types/cotizacion';
import { GraficaCircular, GraficaComparacion, GraficaBarrasComparacion } from '@/components/GraficasCirculares';
import { procesosAplanados, minutosCotizados, minutosReales } from '@/utils/proyectoDatos';

interface DashboardEjecutivoProps {
  onVolver: () => void;
  pendientesHoy: Pendiente[];
  alertasRojas: Alerta[];
  proyectos: ProyectoVenta[];
  cotizaciones: CotizacionGuardada[];
  horasDisponibles: Record<string, number>;
  totalesCobranza: {
    totalPorCobrar: number;
    totalVencido: number;
    totalPagado: number;
    totalParcial: number;
    totalIncobrable: number;
    cantidadPorCobrar: number;
    cantidadVencidos: number;
    cantidadPagados: number;
    cantidadParciales: number;
  };
  onIrAPendientes: () => void;
  onIrACobranza: () => void;
  onIrAProyectos: () => void;
  // Estado de sincronización con Supabase
  cargando?: boolean;
  ultimaActualizacion?: Date | null;
  // Datos adicionales de catálogos (opcionales)
  talleresCount?: number;
  materialesCount?: number;
  clientesCount?: number;
  procesosCount?: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DashboardEjecutivo({
  onVolver,
  pendientesHoy,
  alertasRojas,
  proyectos,
  cotizaciones,
  horasDisponibles,
  totalesCobranza,
  onIrAPendientes,
  onIrACobranza,
  onIrAProyectos,
  cargando = false,
  ultimaActualizacion = null,
  talleresCount = 0,
  materialesCount = 0,
  clientesCount = 0,
  procesosCount = 0,
}: DashboardEjecutivoProps) {
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'pipeline' | 'ventas' | 'produccion' | 'alertas' | 'catalogos'>('resumen');
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null); // null = todo el año
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Período independiente para la pestaña de Ventas (meta mensual o anual)
  const hoy = new Date();
  const [mesVentas, setMesVentas] = useState<number | null>(hoy.getMonth());
  const [anioVentas, setAnioVentas] = useState(hoy.getFullYear());
  // La meta es mensual: en "todo el año" se multiplica por 12
  const mesesPeriodoVentas = mesVentas === null ? 12 : 1;


  // ============================================
  // PROYECTOS FILTRADOS POR MES (si aplica)
  // ============================================
  const proyectosFiltrados = useMemo(() => {
    if (mesSeleccionado === null) return proyectos;
    return proyectos.filter(p => {
      const fecha = new Date(p.fechaVenta);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });
  }, [proyectos, mesSeleccionado, anioSeleccionado]);

  // ============================================
  // CÁLCULOS DE MÉTRICAS (usando proyectosFiltrados)
  // ============================================
  const metricas = useMemo(() => {
    const totalVendido = proyectosFiltrados.reduce((sum, p) => sum + (p.totalCotizado || 0), 0);
    const totalFacturado = proyectosFiltrados.reduce((sum, p) => sum + (p.totalFacturado || 0), 0);
    const totalUtilidad = proyectosFiltrados.reduce((sum, p) => sum + (p.utilidadReal || 0), 0);

    const proyectosFabricacion = proyectosFiltrados.filter(p => p.estado === 'en_fabricacion').length;
    const proyectosFabricados = proyectosFiltrados.filter(p => p.estado === 'fabricado').length;
    const proyectosEntregados = proyectosFiltrados.filter(p => p.estado === 'entregado').length;
    const proyectosFacturados = proyectosFiltrados.filter(p => p.estado === 'facturado').length;

    return {
      totalVendido,
      totalFacturado,
      totalUtilidad,
      proyectosFabricacion,
      proyectosFabricados,
      proyectosEntregados,
      proyectosFacturados,
    };
  }, [proyectosFiltrados]);

  // ============================================
  // PIPELINE (usando proyectosFiltrados)
  // ============================================
  const pipelineData = useMemo(() => {
    const projFabricacion = proyectosFiltrados.filter(p => p.estado === 'en_fabricacion');
    const projFabricado = proyectosFiltrados.filter(p => p.estado === 'fabricado');
    const projEntregado = proyectosFiltrados.filter(p => p.estado === 'entregado');
    const projFacturado = proyectosFiltrados.filter(p => p.estado === 'facturado');

    return [
      { 
        etapa: 'En Fabricación', 
        cantidad: projFabricacion.length, 
        monto: projFabricacion.reduce((sum, p) => sum + (p.totalCotizado || 0), 0),
        color: 'bg-orange-500',
        icon: Factory,
        descripcion: 'Proyectos en producción'
      },
      { 
        etapa: 'Fabricado', 
        cantidad: projFabricado.length, 
        monto: projFabricado.reduce((sum, p) => sum + (p.totalCotizado || 0), 0),
        color: 'bg-yellow-500',
        icon: Package,
        descripcion: 'Proyectos terminados'
      },
      { 
        etapa: 'Entregado', 
        cantidad: projEntregado.length, 
        monto: projEntregado.reduce((sum, p) => sum + (p.totalCotizado || 0), 0),
        color: 'bg-purple-500',
        icon: Truck,
        descripcion: 'Entregados al cliente'
      },
      { 
        etapa: 'Facturado', 
        cantidad: projFacturado.length, 
        monto: projFacturado.reduce((sum, p) => sum + (p.totalFacturado || p.totalCotizado || 0), 0),
        color: 'bg-green-500',
        icon: DollarSign,
        descripcion: 'Facturas enviadas'
      },
    ];
  }, [proyectosFiltrados]);

  // ============================================
  // VENTAS: HORAS COTIZADAS VS META MENSUAL
  // (integrado desde DashboardView)
  // ============================================
  const datosVentasMes = useMemo(() => {
    // mesVentas null = todo el año (solo filtra por año)
    const enPeriodo = (fecha: Date) =>
      (mesVentas === null || fecha.getMonth() === mesVentas) && fecha.getFullYear() === anioVentas;

    const cotizacionesMes = cotizaciones.filter(c => enPeriodo(new Date(c.fecha)));

    const proyectosMes = proyectos.filter(p => enPeriodo(new Date(p.fechaVenta)));

    const proyectosFacturadosMes = proyectos.filter(p => {
      if (!p.fechaFacturado) return false;
      return enPeriodo(new Date(p.fechaFacturado));
    });

    const totalCotizado = cotizacionesMes.reduce((sum, c) => sum + c.total, 0);
    const totalVendido = proyectosMes.reduce((sum, p) => sum + p.totalCotizado, 0);
    const totalFacturado = proyectosFacturadosMes.reduce((sum, p) => sum + (p.totalFacturado || 0), 0);

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

    cotizacionesMes.forEach((cot) => {
      procesosAplanados(cot).forEach((p: any) => {
        const tiempoHoras = minutosCotizados(p) / 60;
        const tipo = p?.tipo;
        if (tipo && horasCotizadas[tipo] !== undefined) {
          horasCotizadas[tipo] += tiempoHoras;
        }
      });
    });

    proyectosMes.forEach(p => {
      procesosAplanados(p).forEach(proc => {
        const tiempoHoras = minutosCotizados(proc) / 60;
        const tiempoRealHoras = (minutosReales(proc) || minutosCotizados(proc)) / 60;

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

    return {
      cotizacionesMes,
      proyectosMes,
      proyectosFacturadosMes,
      totalCotizado,
      totalVendido,
      totalFacturado,
      horasCotizadas,
      horasVendidas,
      horasFabricadas,
      horasFacturadas,
    };
  }, [cotizaciones, proyectos, mesVentas, anioVentas]);

  // ============================================
  // PRODUCCIÓN: MÉTRICAS PRINCIPALES
  // (integrado desde ProduccionDashboardView;
  //  usa proyectosFiltrados, responde al filtro de período)
  // ============================================
  const datosProduccion = useMemo(() => {
    const proyectosFabricadosMes = proyectosFiltrados.filter(p =>
      p.estado === 'fabricado' || p.estado === 'entregado' || p.estado === 'facturado'
    );
    const proyectosPendientes = proyectosFiltrados.filter(p => p.estado === 'en_fabricacion');

    const totalVendido = proyectosFiltrados.reduce((sum, p) => sum + p.totalCotizado, 0);
    const totalFabricado = proyectosFabricadosMes.reduce((sum, p) => sum + p.totalCotizado, 0);
    const totalPendiente = proyectosPendientes.reduce((sum, p) => sum + p.totalCotizado, 0);

    const horasVendidas = proyectosFiltrados.reduce((sum, p) =>
      sum + procesosAplanados(p).reduce((h, proc) => h + minutosCotizados(proc), 0) / 60, 0
    );
    // Horas REALES capturadas por producción (procesos_reales con tiempoMinutosReal).
    // Sin captura real = 0, para no inflar la eficiencia con lo cotizado.
    const horasReales = proyectosFiltrados.reduce((sum, p) =>
      sum + (p.procesosReales || []).reduce((h: number, proc: any) =>
        h + (Number(proc.tiempoMinutosReal) || 0), 0) / 60, 0
    );
    // Eficiencia: cotizadas / reales. ≥100% = fabricamos en igual o menos
    // tiempo del cotizado (dentro de rango). <100% = nos pasamos.
    const eficiencia = horasReales > 0 && horasVendidas > 0
      ? (horasVendidas / horasReales) * 100
      : null;

    return {
      proyectosFabricadosMes,
      proyectosPendientes,
      totalVendido,
      totalFabricado,
      totalPendiente,
      horasVendidas,
      horasFabricadas: horasReales,
      horasReales,
      eficiencia,
    };
  }, [proyectosFiltrados]);

  // Datos derivados para las gráficas de Ventas
  const datosGraficaMontos = [
    { nombre: 'Cotizado', valor: datosVentasMes.totalCotizado, color: '#3b82f6' },
    { nombre: 'Vendido', valor: datosVentasMes.totalVendido, color: '#22c55e' },
    { nombre: 'Facturado', valor: datosVentasMes.totalFacturado, color: '#8b5cf6' },
  ];

  const datosGraficaHorasTotales = [
    { nombre: 'Cotizadas', valor: Object.values(datosVentasMes.horasCotizadas).reduce((a, b) => a + b, 0), color: '#3b82f6' },
    { nombre: 'Vendidas', valor: Object.values(datosVentasMes.horasVendidas).reduce((a, b) => a + b, 0), color: '#22c55e' },
    { nombre: 'Fabricadas', valor: Object.values(datosVentasMes.horasFabricadas).reduce((a, b) => a + b, 0), color: '#f59e0b' },
    { nombre: 'Facturadas', valor: Object.values(datosVentasMes.horasFacturadas).reduce((a, b) => a + b, 0), color: '#8b5cf6' },
  ];

  const datosPorProceso = CATALOGO_PROCESOS_VELSO
    .filter(p => p.id !== 'otro')
    .map(p => ({
      categoria: p.nombre,
      cotizadas: datosVentasMes.horasCotizadas[p.id] || 0,
      vendidas: datosVentasMes.horasVendidas[p.id] || 0,
      fabricadas: datosVentasMes.horasFabricadas[p.id] || 0,
      facturadas: datosVentasMes.horasFacturadas[p.id] || 0,
      meta: (horasDisponibles[p.id] || 0) * mesesPeriodoVentas,
    }));

  const datosCotizadas = datosPorProceso.map(p => ({ nombre: p.categoria, valor: p.cotizadas }));
  const datosVendidas = datosPorProceso.map(p => ({ nombre: p.categoria, valor: p.vendidas }));
  const datosFabricadas = datosPorProceso.map(p => ({ nombre: p.categoria, valor: p.fabricadas }));
  const datosFacturadas = datosPorProceso.map(p => ({ nombre: p.categoria, valor: p.facturadas }));

  // ============================================
  // DETECCIÓN DE ESTADO
  // ============================================
  const hayDatos = proyectos.length > 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onVolver} className="border-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">
              {cargando
                ? 'Cargando datos de Supabase...'
                : hayDatos
                  ? mesSeleccionado !== null
                    ? `${proyectosFiltrados.length} proyectos en ${MESES[mesSeleccionado]} ${anioSeleccionado} · $${metricas.totalVendido.toLocaleString()} vendido`
                    : `${proyectos.length} proyectos · $${metricas.totalVendido.toLocaleString()} vendido`
                  : 'Sin proyectos registrados'
              }
            </p>
            {/* Leyenda de sincronización — visible en todas las pestañas */}
            {!cargando && ultimaActualizacion && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3 h-3" />
                Actualizado {ultimaActualizacion.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant={vistaActiva === 'resumen' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('resumen')}
            className={vistaActiva === 'resumen' ? 'bg-blue-600' : ''}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Resumen
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'pipeline' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('pipeline')}
            className={vistaActiva === 'pipeline' ? 'bg-blue-600' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Pipeline
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'ventas' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('ventas')}
            className={vistaActiva === 'ventas' ? 'bg-green-600' : ''}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Ventas
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'produccion' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('produccion')}
            className={vistaActiva === 'produccion' ? 'bg-amber-600' : ''}
          >
            <Wrench className="w-4 h-4 mr-1" />
            Producción
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'alertas' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('alertas')}
            className={vistaActiva === 'alertas' ? 'bg-red-600' : ''}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Alertas {alertasRojas.length > 0 && `(${alertasRojas.length})`}
          </Button>
          <Button 
            size="sm" 
            variant={vistaActiva === 'catalogos' ? 'default' : 'outline'}
            onClick={() => setVistaActiva('catalogos')}
            className={vistaActiva === 'catalogos' ? 'bg-purple-600' : ''}
          >
            <Settings className="w-4 h-4 mr-1" />
            Catálogos
          </Button>
        </div>
      </div>

      {/* Estado de carga — solo mientras se lee Supabase */}
      {cargando && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-lg font-medium text-slate-700">Cargando datos de Supabase...</p>
          </CardContent>
        </Card>
      )}

      {/* Sin datos — la carga ya terminó, no hay nada que mostrar */}
      {!cargando && !hayDatos && (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium text-slate-700">Datos actualizados</p>
            <p className="text-sm text-slate-500 mt-1">
              No hay proyectos registrados todavía. Cuando conviertas una cotización a orden, aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtro de período — siempre visible: año + mes o todo el año */}
      {hayDatos && (
        <Card className="border-slate-200">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                Período:
              </span>
              <Select
                value={anioSeleccionado.toString()}
                onValueChange={(v) => setAnioSeleccionado(parseInt(v))}
              >
                <SelectTrigger className="h-8 w-24 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((anio) => (
                    <SelectItem key={anio} value={anio.toString()}>{anio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-slate-400">
                {mesSeleccionado !== null
                  ? `Mostrando ${MESES[mesSeleccionado]} ${anioSeleccionado}`
                  : `Todo ${anioSeleccionado} (suma del año)`}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={mesSeleccionado === null ? 'default' : 'outline'}
                onClick={() => setMesSeleccionado(null)}
                className={mesSeleccionado === null ? 'bg-blue-600' : ''}
              >
                Todo el año
              </Button>
              {MESES.map((mes, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={mesSeleccionado === index ? 'default' : 'outline'}
                  onClick={() => setMesSeleccionado(index)}
                  className={mesSeleccionado === index ? 'bg-blue-600' : ''}
                >
                  {mes}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === VISTA RESUMEN === */}
      {vistaActiva === 'resumen' && (
        <>
          {/* KPIs principales - SOLO PROYECTOS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrAProyectos}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Factory className="w-8 h-8 text-green-600" />
                  <Badge className="bg-green-100 text-green-700">{proyectosFiltrados.length} proyectos</Badge>
                </div>
                <p className="text-sm text-slate-500">Total Vendido</p>
                <p className="text-2xl font-bold text-slate-900">${metricas.totalVendido.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onIrACobranza}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                  <Badge className={totalesCobranza.totalVencido > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {totalesCobranza.cantidadVencidos} vencidas
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">Total Facturado</p>
                <p className="text-2xl font-bold text-slate-900">${metricas.totalFacturado.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{totalesCobranza.cantidadPorCobrar} por cobrar</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                  <Badge className="bg-amber-100 text-amber-700">
                    {metricas.totalVendido > 0 
                      ? ((metricas.totalUtilidad / metricas.totalVendido) * 100).toFixed(1) 
                      : 0}%
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">Utilidad Real</p>
                <p className="text-2xl font-bold text-amber-600">${metricas.totalUtilidad.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Margen sobre ventas</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-700">
                    {metricas.proyectosFabricacion} activos
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">En Producción</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${proyectosFiltrados
                    .filter(p => p.estado === 'en_fabricacion')
                    .reduce((sum, p) => sum + (p.totalCotizado || 0), 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">Valor en fabricación</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas rápidas */}
          {alertasRojas.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                  <AlertOctagon className="w-5 h-5" />
                  Alertas que requieren atención ({alertasRojas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertasRojas.slice(0, 5).map(alerta => (
                  <div 
                    key={alerta.id} 
                    className="flex items-center justify-between p-2 bg-white rounded border border-red-100"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{alerta.titulo}</p>
                        <p className="text-xs text-slate-500">{alerta.descripcion}</p>
                      </div>
                    </div>
                    {alerta.monto && (
                      <p className="text-sm font-medium text-slate-900">${alerta.monto.toLocaleString()}</p>
                    )}
                  </div>
                ))}
                {alertasRojas.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setVistaActiva('alertas')}>
                    Ver todas las alertas
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pendientes de hoy */}
          {pendientesHoy.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Pendientes para hoy ({pendientesHoy.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendientesHoy.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        p.prioridad === 'urgente' ? 'bg-red-500' :
                        p.prioridad === 'alta' ? 'bg-orange-500' :
                        p.prioridad === 'media' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.titulo}</p>
                        <p className="text-xs text-slate-500">{p.clienteNombre} • {p.responsable}</p>
                      </div>
                    </div>
                    <Badge className={
                      p.prioridad === 'urgente' ? 'bg-red-100 text-red-700' :
                      p.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {p.prioridad}
                    </Badge>
                  </div>
                ))}
                {pendientesHoy.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={onIrAPendientes}>
                    Ver todos ({pendientesHoy.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estado de Cartera y Producción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Cartera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Por Cobrar</span>
                    <span className="font-medium">${totalesCobranza.totalPorCobrar.toLocaleString()}</span>
                  </div>
                  <Progress value={totalesCobranza.totalPorCobrar > 0 ? 100 : 0} className="h-2 bg-slate-200" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-600">Vencido</span>
                    <span className="font-medium text-red-600">${totalesCobranza.totalVencido.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={totalesCobranza.totalPorCobrar > 0 
                      ? (totalesCobranza.totalVencido / totalesCobranza.totalPorCobrar) * 100 
                      : 0} 
                    className="h-2 bg-slate-200"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600">Pagado</span>
                    <span className="font-medium text-green-600">${totalesCobranza.totalPagado.toLocaleString()}</span>
                  </div>
                  <Progress value={100} className="h-2 bg-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-600" />
                  Producción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-600">{metricas.proyectosFabricacion}</p>
                    <p className="text-xs text-slate-600">En Fabricación</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{metricas.proyectosFabricados}</p>
                    <p className="text-xs text-slate-600">Fabricados</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{metricas.proyectosEntregados}</p>
                    <p className="text-xs text-slate-600">Entregados</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{metricas.proyectosFacturados}</p>
                    <p className="text-xs text-slate-600">Facturados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* === VISTA PIPELINE === */}
      {vistaActiva === 'pipeline' && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Pipeline de Producción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineData.map((etapa, index) => {
              const Icon = etapa.icon;
              const isLast = index === pipelineData.length - 1;

              return (
                <div key={etapa.etapa} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full ${etapa.color} flex items-center justify-center text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-8 bg-slate-300 my-1" />
                      )}
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{etapa.etapa}</p>
                          <p className="text-sm text-slate-500">{etapa.descripcion}</p>
                          <p className="text-xs text-slate-400">{etapa.cantidad} registros</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">${etapa.monto.toLocaleString()}</p>
                          <Badge className={`${etapa.color} text-white`}>
                            {etapa.cantidad}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold text-blue-900">Total en Pipeline</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ${pipelineData.reduce((sum, e) => sum + e.monto, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === VISTA VENTAS (horas cotizadas vs meta mensual) === */}
      {vistaActiva === 'ventas' && (
        <div className="space-y-6">
          {/* Selector de período: mes + año, o todo el año */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Mes</label>
                  <div className="flex gap-2">
                    <Select
                      value={mesVentas === null ? '' : mesVentas.toString()}
                      onValueChange={(v) => setMesVentas(parseInt(v))}
                      disabled={mesVentas === null}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Todo el año" />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((mes, index) => (
                          <SelectItem key={index} value={index.toString()}>{mes}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant={mesVentas === null ? 'default' : 'outline'}
                      onClick={() => setMesVentas(mesVentas === null ? hoy.getMonth() : null)}
                      className={mesVentas === null ? 'bg-blue-600' : 'border-slate-300'}
                    >
                      Todo el año
                    </Button>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Año</label>
                  <Select value={anioVentas.toString()} onValueChange={(v) => setAnioVentas(parseInt(v))}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((anio) => (
                        <SelectItem key={anio} value={anio.toString()}>{anio}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {datosVentasMes.cotizacionesMes.length === 0 && datosVentasMes.proyectosMes.length === 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6 text-center">
                <p className="text-amber-700 font-medium">No hay datos disponibles para este período</p>
                <p className="text-amber-600 text-sm mt-1">
                  Crea cotizaciones o conviértelas en ventas para ver métricas aquí
                </p>
              </CardContent>
            </Card>
          )}

          {/* KPIs del mes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Cotizado</p>
                    <p className="text-xl font-bold text-slate-900">${datosVentasMes.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                    <p className="text-xs text-slate-400">{datosVentasMes.cotizacionesMes.length} cotizaciones</p>
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
                    <p className="text-xl font-bold text-green-600">${datosVentasMes.totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                    <p className="text-xs text-slate-400">{datosVentasMes.proyectosMes.length} proyectos</p>
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
                    <p className="text-xl font-bold text-purple-600">${datosVentasMes.totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                    <p className="text-xs text-slate-400">{datosVentasMes.proyectosFacturadosMes.length} facturas</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas circulares */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GraficaCircular titulo="Distribución de Montos" datos={datosGraficaMontos} />
            <GraficaCircular titulo="Distribución de Horas" datos={datosGraficaHorasTotales} />
          </div>

          {/* Código 07 - Meta mensual */}
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
                  <p className="text-2xl font-bold text-blue-600">{(datosVentasMes.horasCotizadas['codigo_07'] || 0).toFixed(1)}h</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-xs text-green-600">Horas Vendidas</p>
                  <p className="text-2xl font-bold text-green-600">{(datosVentasMes.horasVendidas['codigo_07'] || 0).toFixed(1)}h</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <p className="text-xs text-amber-600">Horas Fabricadas</p>
                  <p className="text-2xl font-bold text-amber-600">{(datosVentasMes.horasFabricadas['codigo_07'] || 0).toFixed(1)}h</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-xs text-purple-600">Horas Facturadas</p>
                  <p className="text-2xl font-bold text-purple-600">{(datosVentasMes.horasFacturadas['codigo_07'] || 0).toFixed(1)}h</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso: Facturadas vs Meta{mesVentas === null ? ' anual' : ''}</span>
                  <span className="font-semibold">
                    {Math.min(((datosVentasMes.horasFacturadas['codigo_07'] || 0) / ((horasDisponibles['codigo_07'] || 1) * mesesPeriodoVentas)) * 100, 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(((datosVentasMes.horasFacturadas['codigo_07'] || 0) / ((horasDisponibles['codigo_07'] || 1) * mesesPeriodoVentas)) * 100, 100)}
                  className="h-3"
                />
                <p className="text-xs text-slate-500 text-right">
                  Meta{mesVentas === null ? ' anual' : ''}: {((horasDisponibles['codigo_07'] || 0) * mesesPeriodoVentas).toFixed(2)}h
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparaciones de horas */}
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

          {/* Horas por proceso */}
          <GraficaBarrasComparacion
            titulo="Comparación de Horas por Proceso"
            datos={datosPorProceso}
          />
        </div>
      )}

      {/* === VISTA PRODUCCIÓN (métricas de fabricación) === */}
      {vistaActiva === 'produccion' && (
        <div className="space-y-6">
          {/* KPIs principales */}
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
                      ${datosProduccion.totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-slate-400">{proyectosFiltrados.length} proyectos</p>
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
                      ${datosProduccion.totalFabricado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-slate-400">{datosProduccion.proyectosFabricadosMes.length} proyectos</p>
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
                      ${datosProduccion.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-slate-400">{datosProduccion.proyectosPendientes.length} proyectos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Horas: cotizadas vs reales con eficiencia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Horas Cotizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">
                  {datosProduccion.horasVendidas.toFixed(1)}h
                </p>
                <p className="text-sm text-slate-500">
                  Originales de la cotización (no modificables)
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Horas Fabricadas (reales)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {datosProduccion.horasReales.toFixed(1)}h
                </p>
                <p className="text-sm text-slate-500">
                  {datosProduccion.horasReales > 0
                    ? 'Capturadas por producción'
                    : 'Aún sin captura de horas reales'}
                </p>
              </CardContent>
            </Card>

            <Card className={
              datosProduccion.eficiencia === null
                ? 'border-slate-200'
                : datosProduccion.eficiencia >= 100
                  ? 'border-green-300 bg-green-50/40'
                  : 'border-red-300 bg-red-50/40'
            }>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                  Eficiencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${
                  datosProduccion.eficiencia === null
                    ? 'text-slate-400'
                    : datosProduccion.eficiencia >= 100
                      ? 'text-green-600'
                      : 'text-red-600'
                }`}>
                  {datosProduccion.eficiencia === null
                    ? '—'
                    : `${datosProduccion.eficiencia.toFixed(1)}%`}
                </p>
                <p className="text-sm text-slate-500">
                  {datosProduccion.eficiencia === null
                    ? 'Se calcula al capturar horas reales'
                    : datosProduccion.eficiencia >= 100
                      ? 'Dentro o mejor de lo cotizado'
                      : 'Por encima del tiempo cotizado'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Proyectos pendientes de fabricar */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-amber-600" />
                Proyectos Pendientes de Fabricar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {datosProduccion.proyectosPendientes.length === 0 ? (
                <p className="text-center text-slate-500 py-4">
                  No hay proyectos pendientes de fabricar en este período
                </p>
              ) : (
                <div className="space-y-3">
                  {datosProduccion.proyectosPendientes.map((proyecto) => (
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
      )}

      {/* === VISTA ALERTAS === */}
      {vistaActiva === 'alertas' && (
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" />
                Todas las Alertas ({alertasRojas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertasRojas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-slate-700">¡Sin alertas!</p>
                  <p className="text-sm text-slate-500">Todo está bajo control</p>
                </div>
              ) : (
                alertasRojas.map(alerta => (
                  <div 
                    key={alerta.id} 
                    className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {alerta.tipo === 'factura_vencida' && <DollarSign className="w-5 h-5 text-red-500" />}
                        {alerta.tipo === 'proyecto_estancado' && <Factory className="w-5 h-5 text-orange-500" />}
                        {alerta.tipo === 'seguimiento_cotizacion' && <Phone className="w-5 h-5 text-blue-500" />}
                        {alerta.tipo === 'cotizacion_sin_enviar' && <FileText className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{alerta.titulo}</p>
                        <p className="text-sm text-slate-500">{alerta.descripcion}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                            {alerta.dias} días
                          </Badge>
                          <span className="text-xs text-slate-400">{alerta.fecha}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {alerta.monto && (
                        <p className="text-lg font-bold text-slate-900">${alerta.monto.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* === VISTA CATÁLOGOS === */}
      {vistaActiva === 'catalogos' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{talleresCount}</p>
              <p className="text-sm text-slate-500">Talleres Guardados</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{clientesCount}</p>
              <p className="text-sm text-slate-500">Clientes Registrados</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{materialesCount}</p>
              <p className="text-sm text-slate-500">Materiales en Catálogo</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{procesosCount}</p>
              <p className="text-sm text-slate-500">Procesos Configurados</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
