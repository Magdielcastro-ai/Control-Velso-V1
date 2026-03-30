import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  FileText, 
  Calendar,
  Building2,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  FolderKanban,
  Eye
} from 'lucide-react';
import type { CotizacionGuardada } from '@/types/cotizacion';

interface CotizacionesViewProps {
  onVolver: () => void;
  cotizaciones: CotizacionGuardada[];
  proyectos: { numeroCotizacion: string }[];
  onCargarCotizacion: (id: string) => void;
  onEliminarCotizacion: (id: string) => void;
  onConvertirAVenta: (cotizacion: CotizacionGuardada, ordenCompra: string) => void;
}

const estadosConfig = {
  borrador: { label: 'Borrador', color: 'bg-slate-500', icon: Clock },
  enviada: { label: 'Enviada', color: 'bg-blue-500', icon: FileText },
  aceptada: { label: 'Aceptada', color: 'bg-green-500', icon: CheckCircle },
  rechazada: { label: 'Rechazada', color: 'bg-red-500', icon: Trash2 },
};

export function CotizacionesView({ 
  onVolver, 
  cotizaciones, 
  proyectos,
  onCargarCotizacion,
  onEliminarCotizacion,
  onConvertirAVenta
}: CotizacionesViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<CotizacionGuardada | null>(null);
  const [ordenCompra, setOrdenCompra] = useState('');
  const [dialogoConvertir, setDialogoConvertir] = useState(false);

  // Verificar si una cotización ya fue convertida en proyecto
  const esComprada = (numeroCotizacion: string) => {
    return proyectos.some(p => p.numeroCotizacion === numeroCotizacion);
  };

  // Filtrar cotizaciones
  const cotizacionesFiltradas = cotizaciones.filter(c => {
    const matchBusqueda = 
      c.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.proyectoNombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = estadoFiltro === 'todos' ? true : 
                        estadoFiltro === 'comprada' ? esComprada(c.numero) :
                        estadoFiltro === 'pendiente' ? !esComprada(c.numero) :
                        c.estado === estadoFiltro;
    return matchBusqueda && matchEstado;
  });

  // Ordenar por fecha (más reciente primero)
  const cotizacionesOrdenadas = [...cotizacionesFiltradas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const handleConvertir = () => {
    if (!cotizacionSeleccionada || !ordenCompra) return;
    onConvertirAVenta(cotizacionSeleccionada, ordenCompra);
    setOrdenCompra('');
    setCotizacionSeleccionada(null);
    setDialogoConvertir(false);
  };

  // Estadísticas
  const totalCotizaciones = cotizaciones.length;
  const totalCompradas = proyectos.length;
  const totalPendientes = totalCotizaciones - totalCompradas;
  const totalMonto = cotizaciones.reduce((sum, c) => sum + c.total, 0);
  const montoComprado = cotizaciones
    .filter(c => esComprada(c.numero))
    .reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Cotizaciones</h2>
          <p className="text-slate-500">
            {totalCotizaciones} cotizaciones · {totalCompradas} compradas · {totalPendientes} pendientes
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Cotizado</p>
            <p className="text-xl font-bold text-slate-900">
              ${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Monto Comprado</p>
            <p className="text-xl font-bold text-green-600">
              ${montoComprado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pendiente</p>
            <p className="text-xl font-bold text-amber-600">
              ${(totalMonto - montoComprado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Tasa de Conversión</p>
            <p className="text-xl font-bold text-blue-600">
              {totalCotizaciones > 0 ? ((totalCompradas / totalCotizaciones) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número, cliente o proyecto..."
              className="pl-10"
            />
          </div>
        </div>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="comprada">Compradas</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviada">Enviadas</SelectItem>
            <SelectItem value="aceptada">Aceptadas</SelectItem>
            <SelectItem value="rechazada">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de cotizaciones */}
      <div className="space-y-4">
        {cotizacionesOrdenadas.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron cotizaciones</p>
            </CardContent>
          </Card>
        ) : (
          cotizacionesOrdenadas.map((cot) => {
            const comprada = esComprada(cot.numero);
            const estadoConfig = estadosConfig[cot.estado];
            
            return (
              <Card key={cot.id} className={`border-slate-200 ${comprada ? 'bg-green-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        comprada ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {comprada ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{cot.numero}</h3>
                          {comprada && (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              COMPRADA
                            </Badge>
                          )}
                          {!comprada && (
                            <Badge className={`${estadoConfig.color} text-white`}>
                              <estadoConfig.icon className="w-3 h-3 mr-1" />
                              {estadoConfig.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {cot.clienteNombre}
                          </span>
                          <span className="flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            {cot.proyectoNombre}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(cot.fecha).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          ${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCargarCotizacion(cot.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        
                        {!comprada && cot.estado !== 'rechazada' && (
                          <Dialog open={dialogoConvertir && cotizacionSeleccionada?.id === cot.id} 
                                 onOpenChange={(open) => {
                                   if (!open) {
                                     setDialogoConvertir(false);
                                     setCotizacionSeleccionada(null);
                                   }
                                 }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setCotizacionSeleccionada(cot);
                                  setDialogoConvertir(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Comprar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Convertir Cotización a Venta</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="bg-slate-50 p-3 rounded-lg">
                                  <p className="text-sm text-slate-600">Cotización:</p>
                                  <p className="font-semibold">{cot.numero}</p>
                                  <p className="text-sm">{cot.clienteNombre} - {cot.proyectoNombre}</p>
                                  <p className="text-lg font-bold text-green-600">${cot.total.toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Número de Orden de Compra *</label>
                                  <Input
                                    value={ordenCompra}
                                    onChange={(e) => setOrdenCompra(e.target.value)}
                                    placeholder="Ej: OC-2024-001"
                                  />
                                </div>
                                <Button 
                                  onClick={handleConvertir}
                                  disabled={!ordenCompra}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  Confirmar Compra
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminarCotizacion(cot.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
