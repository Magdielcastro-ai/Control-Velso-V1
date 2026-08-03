import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, ArrowLeft, FileText, Calendar, Building2, Search, CheckCircle, Clock, Trash2, 
  Eye, User, ChevronDown, ChevronRight 
} from 'lucide-react';
import { useSupabaseCotizaciones } from '@/hooks/useSupabaseCotizaciones';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CotizacionesViewProps {
  onVolver: () => void;
  userRol?: string;
  onCargarCotizacion: (id: string) => void;
  onConvertirAVenta?: (cotizacion: any, ordenCompra: string) => void;
}

interface Vendedor {
  id: string;
  nombre: string;
}

interface CotizacionConDetalle {
  id: string;
  numero: string;
  cliente_nombre: string;
  empresa: string;
  contacto: string;
  proyecto_nombre: string;
  total: number;
  subtotal: number;
  iva_porcentaje: number;
  estado: string;
  created_at: string;
  usuario_id: string;
  datos_cliente?: any;
  moneda?: string;
  tipo_cambio?: number;
}

const estadosConfig: Record<string, { label: string; color: string; icon: any }> = {
  borrador: { label: 'Borrador', color: 'bg-slate-500', icon: Clock },
  enviada: { label: 'Enviada', color: 'bg-blue-500', icon: FileText },
  aceptada: { label: 'Aceptada', color: 'bg-green-500', icon: CheckCircle },
  rechazada: { label: 'Rechazada', color: 'bg-red-500', icon: Trash2 },
};

export function CotizacionesView({
  onVolver,
  userRol = 'vendedor',
  onCargarCotizacion,
  onConvertirAVenta
}: CotizacionesViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('todos');
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<any>(null);
  const [ordenCompra, setOrdenCompra] = useState('');
  const [dialogoConvertir, setDialogoConvertir] = useState(false);
  const [clientesExpandidos, setClientesExpandidos] = useState<Set<string>>(new Set());

  const { 
    cotizaciones, 
    loading, 
    getAllCotizaciones, 
    getMisCotizaciones, 
    deleteCotizacion,
    updateEstado 
  } = useSupabaseCotizaciones();

  const isAdmin = userRol === 'admin' || userRol === 'superadmin';

  // Cargar cotizaciones al montar
  useEffect(() => {
    if (isAdmin) {
      getAllCotizaciones();
    } else {
      getMisCotizaciones();
    }
  }, [isAdmin, getAllCotizaciones, getMisCotizaciones]);

  // Cargar lista de vendedores (solo para admin)
  useEffect(() => {
    if (isAdmin) {
      cargarVendedores();
    }
  }, [isAdmin]);

  const cargarVendedores = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre')
        .in('rol', ['vendedor', 'admin', 'superadmin'])
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setVendedores(data || []);
    } catch (err) {
      console.error('Error cargando vendedores:', err);
    }
  };

  // Verificar si una cotización ya fue convertida en proyecto
  const esComprada = (estado: string) => {
    return estado === 'comprada' || estado === 'convertida';
  };

  // Helper: formatear moneda con conversión si es necesario
  // En el listado interno: MXN primario, USD entre paréntesis
  const formatearMonedaLista = (monto: number, monedaCot: string, tipoCambio: number) => {
    if (monedaCot === 'USD' && tipoCambio > 1) {
      const montoMXN = monto * tipoCambio;
      return (
        <span>
          ${montoMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
          <span className="text-xs text-slate-400">
            (US${monto.toLocaleString('en-US', { minimumFractionDigits: 2 })})
          </span>
        </span>
      );
    }
    return <span>${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>;
  };

  // Procesar cotizaciones para extraer empresa y contacto
  const cotizacionesProcesadas: CotizacionConDetalle[] = useMemo(() => {
    return cotizaciones.map(cot => {
      const datosCliente = cot.datos_cliente || {};
      const empresa = datosCliente.empresa || datosCliente.nombre || cot.cliente_nombre || 'Sin empresa';
      const contacto = datosCliente.nombre && datosCliente.empresa ? datosCliente.nombre : '';
      
      return {
        id: cot.id,
        numero: cot.numero,
        cliente_nombre: cot.cliente_nombre,
        empresa,
        contacto,
        proyecto_nombre: cot.proyecto_nombre,
        total: cot.total || 0,
        subtotal: cot.subtotal || 0,
        iva_porcentaje: cot.iva_porcentaje || 16,
        estado: cot.estado,
        created_at: cot.created_at,
        usuario_id: cot.usuario_id,
        datos_cliente: datosCliente,
        moneda: cot.moneda || 'MXN',
        tipo_cambio: cot.tipo_cambio || 1,
      };
    });
  }, [cotizaciones]);

  // Filtrar cotizaciones
  const cotizacionesFiltradas = cotizacionesProcesadas.filter(c => {
    const matchBusqueda = 
      c.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.contacto.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.proyecto_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = estadoFiltro === 'todos' ? true : 
                        estadoFiltro === 'comprada' ? esComprada(c.estado) :
                        estadoFiltro === 'pendiente' ? !esComprada(c.estado) :
                        c.estado === estadoFiltro;
    const matchVendedor = vendedorFiltro === 'todos' ? true :
                          c.usuario_id === vendedorFiltro;
    return matchBusqueda && matchEstado && matchVendedor;
  });

  // Agrupar por empresa
  const cotizacionesPorEmpresa = useMemo(() => {
    const grupos: Record<string, CotizacionConDetalle[]> = {};
    cotizacionesFiltradas.forEach(cot => {
      const empresa = cot.empresa;
      if (!grupos[empresa]) {
        grupos[empresa] = [];
      }
      grupos[empresa].push(cot);
    });
    return grupos;
  }, [cotizacionesFiltradas]);

  // Ordenar empresas alfabéticamente
  const empresasOrdenadas = useMemo(() => {
    return Object.keys(cotizacionesPorEmpresa).sort((a, b) => a.localeCompare(b));
  }, [cotizacionesPorEmpresa]);

  const toggleEmpresa = (empresa: string) => {
    setClientesExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(empresa)) {
        nuevo.delete(empresa);
      } else {
        nuevo.add(empresa);
      }
      return nuevo;
    });
  };

  const handleConvertir = async () => {
    if (!cotizacionSeleccionada || !ordenCompra || !onConvertirAVenta) return;
    
    try {
      await updateEstado(cotizacionSeleccionada.id, 'comprada');
      onConvertirAVenta(cotizacionSeleccionada, ordenCompra);
      setOrdenCompra('');
      setCotizacionSeleccionada(null);
      setDialogoConvertir(false);
      toast.success('Cotización convertida a venta');
    } catch (err) {
      toast.error('Error al convertir cotización');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cotización?')) return;
    
    try {
      await deleteCotizacion(id);
      toast.success('Cotización eliminada');
    } catch (err) {
      toast.error('Error al eliminar cotización');
    }
  };

  // Obtener nombre del vendedor
  const getNombreVendedor = (usuarioId: string | undefined) => {
    if (!usuarioId) return 'Desconocido';
    const vendedor = vendedores.find(v => v.id === usuarioId);
    return vendedor?.nombre || 'Desconocido';
  };

  // Estadísticas (en MXN - globales)
  const totalCotizaciones = cotizacionesFiltradas.length;
  const totalCompradas = cotizacionesFiltradas.filter(c => esComprada(c.estado)).length;
  const totalPendientes = totalCotizaciones - totalCompradas;
  // Convertir todo a MXN para las estadísticas globales
  const totalMonto = cotizacionesFiltradas.reduce((sum, c) => {
    const monto = c.total || 0;
    return sum + (c.moneda === 'USD' && c.tipo_cambio ? monto * c.tipo_cambio : monto);
  }, 0);
  const montoComprado = cotizacionesFiltradas
    .filter(c => esComprada(c.estado))
    .reduce((sum, c) => {
      const monto = c.total || 0;
      return sum + (c.moneda === 'USD' && c.tipo_cambio ? monto * c.tipo_cambio : monto);
    }, 0);

  if (loading && cotizaciones.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-slate-500">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

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
            {isAdmin ? <span className="text-blue-600 ml-2">(Vista de Admin)</span> : <span className="text-blue-600 ml-2">(Vista Personal)</span>}
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
        {isAdmin && (
          <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los vendedores</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {v.nombre}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Lista de cotizaciones agrupadas por empresa */}
      <div className="space-y-4">
        {empresasOrdenadas.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron cotizaciones</p>
            </CardContent>
          </Card>
        ) : (
          empresasOrdenadas.map((empresa) => {
            const cotizacionesEmpresa = cotizacionesPorEmpresa[empresa];
            const expandido = clientesExpandidos.has(empresa);
            // Convertir total de empresa a MXN si es USD
            const totalEmpresa = cotizacionesEmpresa.reduce((sum, c) => {
              const monto = c.total || 0;
              return sum + (c.moneda === 'USD' && c.tipo_cambio ? monto * c.tipo_cambio : monto);
            }, 0);
            const compradasEmpresa = cotizacionesEmpresa.filter(c => esComprada(c.estado)).length;
            
            return (
              <Card key={empresa} className="border-slate-200">
                {/* Header de empresa - Clickable */}
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleEmpresa(empresa)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandido ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{empresa}</h3>
                        <p className="text-sm text-slate-500">
                          {cotizacionesEmpresa.length} cotizaciones · {compradasEmpresa} compradas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        ${totalEmpresa.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">Total acumulado (MXN)</p>
                    </div>
                  </div>
                </div>

                {/* Tabla de cotizaciones - Solo visible cuando está expandido */}
                {expandido && (
                  <div className="border-t border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Número</th>
                            <th className="px-4 py-3 text-left font-medium">Proyecto</th>
                            <th className="px-4 py-3 text-left font-medium">Contacto</th>
                            <th className="px-4 py-3 text-left font-medium">Fecha</th>
                            <th className="px-4 py-3 text-right font-medium">Total sin IVA</th>
                            <th className="px-4 py-3 text-right font-medium">Total con IVA</th>
                            <th className="px-4 py-3 text-center font-medium">Estado</th>
                            <th className="px-4 py-3 text-center font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cotizacionesEmpresa.map((cot) => {
                            const comprada = esComprada(cot.estado);
                            const estadoConfig = estadosConfig[cot.estado] || estadosConfig.borrador;
                            const EstadoIcon = estadoConfig.icon;
                            const totalSinIVA = cot.subtotal || (cot.total / (1 + cot.iva_porcentaje / 100));
                            
                            return (
                              <tr key={cot.id} className={`hover:bg-slate-50 ${comprada ? 'bg-green-50/50' : ''}`}>
                                <td className="px-4 py-3 font-medium text-slate-900">{cot.numero}</td>
                                <td className="px-4 py-3 text-slate-700">{cot.proyecto_nombre}</td>
                                <td className="px-4 py-3 text-slate-600">{cot.contacto || '-'}</td>
                                <td className="px-4 py-3 text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(cot.created_at).toLocaleDateString('es-MX')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-slate-700">
                                  {formatearMonedaLista(totalSinIVA, cot.moneda || 'MXN', cot.tipo_cambio || 1)}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                  {formatearMonedaLista(cot.total, cot.moneda || 'MXN', cot.tipo_cambio || 1)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {comprada ? (
                                    <Badge className="bg-green-600 text-white text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      COMPRADA
                                    </Badge>
                                  ) : (
                                    <Badge className={`${estadoConfig.color} text-white text-xs`}>
                                      <EstadoIcon className="w-3 h-3 mr-1" />
                                      {estadoConfig.label}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onCargarCotizacion(cot.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="w-4 h-4 text-blue-600" />
                                    </Button>

                                    {!comprada && cot.estado !== 'rechazada' && onConvertirAVenta && (
                                      <Dialog open={dialogoConvertir && cotizacionSeleccionada?.id === cot.id} 
                                             onOpenChange={(open) => {
                                               if (!open) {
                                                 setDialogoConvertir(false);
                                                 setCotizacionSeleccionada(null);
                                               }
                                             }}>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                              setCotizacionSeleccionada(cot);
                                              setDialogoConvertir(true);
                                            }}
                                          >
                                            <CheckCircle className="w-4 h-4 text-green-600" />
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
                                              <p className="text-sm">{cot.empresa} - {cot.proyecto_nombre}</p>
                                              <p className="text-lg font-bold text-green-600">
                                                {formatearMonedaLista(cot.total, cot.moneda || 'MXN', cot.tipo_cambio || 1)}
                                              </p>
                                              {isAdmin && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                  <User className="w-3 h-3 inline mr-1" />
                                                  Vendedor: {getNombreVendedor(cot.usuario_id)}
                                                </p>
                                              )}
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
                                      onClick={() => handleEliminar(cot.id)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
