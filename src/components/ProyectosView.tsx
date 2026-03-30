import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { 
  ArrowLeft, 
  FolderKanban, 
  FileText, 
  Calendar,
  Building2,
  Trash2,
  Search,
  CheckCircle,
  TrendingUp,
  Factory,
  Truck,
  Receipt,
  Package,
  Clock,
  DollarSign
} from 'lucide-react';
import type { ProyectoVenta, EstadoProyecto, MaterialProyecto, ProcesoProyecto, CostosAdicionalesProyecto } from '@/types/ventas';
import type { CotizacionGuardada } from '@/types/cotizacion';

interface ProyectosViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  cotizaciones: CotizacionGuardada[];
  onConvertirAVenta: (datos: {
    numeroCotizacion: string;
    ordenCompra: string;
    clienteId: string;
    clienteNombre: string;
    proyectoNombre: string;
    totalCotizado: number;
    margenUtilidad: number;
    ivaPorcentaje: number;
    materiales: MaterialProyecto[];
    procesos: ProcesoProyecto[];
    costosAdicionales: CostosAdicionalesProyecto;
  }) => void;
  onEliminarProyecto: (id: string) => void;
  onMarcarFabricado?: (id: string) => void;
  onMarcarEntregado?: (id: string) => void;
  onMarcarFacturado?: (id: string, numeroFactura: string, totalFacturado: number) => void;
  onVerControlCodigos?: (proyecto: ProyectoVenta) => void;
}

// Configuración de estados
const estadoConfig: Record<EstadoProyecto, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  en_fabricacion: { 
    label: 'EN FABRICACIÓN', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    icon: Factory 
  },
  fabricado: { 
    label: 'FABRICADO', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100',
    icon: Package 
  },
  entregado: { 
    label: 'ENTREGADO', 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-100',
    icon: Truck 
  },
  facturado: { 
    label: 'FACTURADO', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100',
    icon: Receipt 
  },
};

export function ProyectosView({ 
  onVolver, 
  proyectos, 
  cotizaciones,
  onConvertirAVenta,
  onEliminarProyecto,
  onMarcarFabricado,
  onMarcarEntregado,
  onMarcarFacturado,
  onVerControlCodigos
}: ProyectosViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoProyecto | 'todos'>('todos');
  const [dialogoConvertir, setDialogoConvertir] = useState(false);
  const [dialogoFacturar, setDialogoFacturar] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoVenta | null>(null);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<CotizacionGuardada | null>(null);
  const [ordenCompra, setOrdenCompra] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [montoFactura, setMontoFactura] = useState('');

  // Filtrar proyectos
  const proyectosFiltrados = proyectos.filter(p => {
    const coincideBusqueda = 
      p.proyectoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.ordenCompra.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.numeroFactura?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
    
    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  // Cotizaciones que aún no son ventas
  const cotizacionesPendientes = cotizaciones.filter(c => 
    !proyectos.some(p => p.numeroCotizacion === c.numero)
  );

  // Totales por estado
  const totalesPorEstado = {
    en_fabricacion: proyectos.filter(p => p.estado === 'en_fabricacion').reduce((sum, p) => sum + p.totalCotizado, 0),
    fabricado: proyectos.filter(p => p.estado === 'fabricado').reduce((sum, p) => sum + p.totalCotizado, 0),
    entregado: proyectos.filter(p => p.estado === 'entregado').reduce((sum, p) => sum + p.totalCotizado, 0),
    facturado: proyectos.filter(p => p.estado === 'facturado').reduce((sum, p) => sum + (p.totalFacturado || 0), 0),
  };

  const totalVendido = proyectos.reduce((sum, p) => sum + p.totalCotizado, 0);
  const totalFacturado = proyectos.reduce((sum, p) => sum + (p.totalFacturado || 0), 0);

  const handleConvertir = () => {
    if (!cotizacionSeleccionada || !ordenCompra) return;
    
    onConvertirAVenta({
      numeroCotizacion: cotizacionSeleccionada.numero,
      ordenCompra,
      clienteId: '',
      clienteNombre: cotizacionSeleccionada.clienteNombre,
      proyectoNombre: cotizacionSeleccionada.proyectoNombre,
      totalCotizado: cotizacionSeleccionada.total,
      margenUtilidad: 30,
      ivaPorcentaje: 16,
      materiales: [],
      procesos: [],
      costosAdicionales: {
        disenoCAD: 0,
        programacionCNC: 0,
        setup: 0,
        transporte: 0,
        otro: 0,
      },
    });

    setOrdenCompra('');
    setCotizacionSeleccionada(null);
    setDialogoConvertir(false);
  };

  const handleMarcarFabricado = (id: string) => {
    if (onMarcarFabricado) {
      onMarcarFabricado(id);
    }
  };

  const handleMarcarEntregado = (id: string) => {
    if (onMarcarEntregado) {
      onMarcarEntregado(id);
    }
  };

  const handleAbrirFacturar = (proyecto: ProyectoVenta) => {
    setProyectoSeleccionado(proyecto);
    setMontoFactura(proyecto.totalCotizado.toString());
    setDialogoFacturar(true);
  };

  const handleFacturar = () => {
    if (!proyectoSeleccionado || !numeroFactura || !montoFactura) return;
    
    if (onMarcarFacturado) {
      onMarcarFacturado(proyectoSeleccionado.id, numeroFactura, parseFloat(montoFactura));
    }

    setNumeroFactura('');
    setMontoFactura('');
    setProyectoSeleccionado(null);
    setDialogoFacturar(false);
  };

  // Calcular horas totales de un proyecto
  const calcularHorasTotales = (proyecto: ProyectoVenta) => {
    const minutos = proyecto.procesos.reduce((sum, p) => sum + (p.tiempoMinutosCotizado || 0), 0);
    return (minutos / 60).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Proyectos / Ventas</h2>
          <p className="text-slate-500">
            {proyectos.length} proyectos · ${totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })} vendido
            {totalFacturado > 0 && ` · $${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} facturado`}
          </p>
        </div>
        <Dialog open={dialogoConvertir} onOpenChange={setDialogoConvertir}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Convertir Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Convertir Cotización a Venta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Seleccionar Cotización</Label>
                <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                  {cotizacionesPendientes.length === 0 ? (
                    <p className="p-4 text-center text-slate-500">No hay cotizaciones pendientes</p>
                  ) : (
                    <div className="divide-y">
                      {cotizacionesPendientes.map((cot) => (
                        <button
                          key={cot.id}
                          onClick={() => setCotizacionSeleccionada(cot)}
                          className={`w-full p-3 text-left hover:bg-slate-50 transition-colors ${
                            cotizacionSeleccionada?.id === cot.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                        >
                          <div className="font-medium">{cot.numero}</div>
                          <div className="text-sm text-slate-500">
                            {cot.clienteNombre} · {cot.proyectoNombre} · ${cot.total.toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Número de Orden de Compra *</Label>
                <Input
                  value={ordenCompra}
                  onChange={(e) => setOrdenCompra(e.target.value)}
                  placeholder="Ej: OC-2024-001"
                />
              </div>

              <Button 
                onClick={handleConvertir}
                disabled={!cotizacionSeleccionada || !ordenCompra}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Convertir a Venta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar proyecto, cliente, OC o factura..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filtroEstado === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('todos')}
            className={filtroEstado === 'todos' ? 'bg-slate-700' : 'border-slate-300'}
          >
            Todos
          </Button>
          {(Object.keys(estadoConfig) as EstadoProyecto[]).map((estado) => (
            <Button
              key={estado}
              variant={filtroEstado === estado ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado(estado)}
              className={filtroEstado === estado ? estadoConfig[estado].color.replace('text-', 'bg-') : 'border-slate-300'}
            >
              {estadoConfig[estado].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Resumen por estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-200">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">En Fabricación</p>
            <p className="text-lg font-bold text-blue-600">
              ${totalesPorEstado.en_fabricacion.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Fabricados</p>
            <p className="text-lg font-bold text-amber-600">
              ${totalesPorEstado.fabricado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-cyan-200">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Entregados</p>
            <p className="text-lg font-bold text-cyan-600">
              ${totalesPorEstado.entregado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Facturados</p>
            <p className="text-lg font-bold text-purple-600">
              ${totalesPorEstado.facturado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de proyectos */}
      <div className="space-y-4">
        {proyectosFiltrados.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay proyectos registrados</p>
              <p className="text-sm">Convierte una cotización en venta para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          proyectosFiltrados.map((proyecto) => {
            const EstadoIcon = estadoConfig[proyecto.estado].icon;
            return (
              <Card key={proyecto.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info del proyecto */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${estadoConfig[proyecto.estado].bgColor} rounded-lg flex items-center justify-center`}>
                        <EstadoIcon className={`w-5 h-5 ${estadoConfig[proyecto.estado].color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{proyecto.proyectoNombre}</h3>
                          <Badge variant="outline" className={`${estadoConfig[proyecto.estado].color} border-current`}>
                            {estadoConfig[proyecto.estado].label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {proyecto.clienteNombre}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            OC: {proyecto.ordenCompra}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(proyecto.fechaVenta).toLocaleDateString('es-MX')}
                          </span>
                          {proyecto.numeroFactura && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Receipt className="w-3 h-3" />
                              Fact: {proyecto.numeroFactura}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calcularHorasTotales(proyecto)}h cotizadas
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${proyecto.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Botón Control de Códigos */}
                      {onVerControlCodigos && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerControlCodigos(proyecto)}
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Control de Códigos
                        </Button>
                      )}

                      {/* Botones de cambio de estado */}
                      {proyecto.estado === 'en_fabricacion' && onMarcarFabricado && (
                        <Button
                          size="sm"
                          onClick={() => handleMarcarFabricado(proyecto.id)}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Marcar Fabricado
                        </Button>
                      )}

                      {proyecto.estado === 'fabricado' && onMarcarEntregado && (
                        <Button
                          size="sm"
                          onClick={() => handleMarcarEntregado(proyecto.id)}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Marcar Entregado
                        </Button>
                      )}

                      {proyecto.estado === 'entregado' && onMarcarFacturado && (
                        <Button
                          size="sm"
                          onClick={() => handleAbrirFacturar(proyecto)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Facturar
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEliminarProyecto(proyecto.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Diálogo de Facturación */}
      <Dialog open={dialogoFacturar} onOpenChange={setDialogoFacturar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Facturar Proyecto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <p className="text-sm text-slate-600">{proyectoSeleccionado?.proyectoNombre}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Número de Factura *</Label>
              <Input
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                placeholder="Ej: FAC-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Total Facturado *</Label>
              <Input
                type="number"
                value={montoFactura}
                onChange={(e) => setMontoFactura(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">
                Total cotizado: ${proyectoSeleccionado?.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <Button 
              onClick={handleFacturar}
              disabled={!numeroFactura || !montoFactura}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Confirmar Facturación
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resumen mensual */}
      {proyectos.length > 0 && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Resumen de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-slate-500">Total Vendido</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-slate-500">Total Facturado</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-slate-500">Proyectos</p>
                <p className="text-2xl font-bold text-slate-900">{proyectos.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-slate-500">Promedio por Proyecto</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(totalVendido / proyectos.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
