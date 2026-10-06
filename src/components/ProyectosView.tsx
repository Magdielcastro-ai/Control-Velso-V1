import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  DollarSign,
  User,
  Hash,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ClipboardList
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ProyectoVenta, EstadoProyecto } from '@/types/ventas';
import { procesosAplanados, minutosCotizados } from '@/utils/proyectoDatos';
import type { CotizacionGuardada } from '@/types/cotizacion';

import type { OrdenCompra } from '@/types/ordenesCompra';

interface ProyectosViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  cotizaciones: CotizacionGuardada[];
  onConvertirAVenta?: (
    cotizacion: CotizacionGuardada,
    ordenCompra: string,
    tipoProyecto: 'suministro' | 'maquinado',
    codigoManual?: string,
    piezasCompradas?: { piezaId: string; cantidad: number }[]
  ) => void;
  onEliminarProyecto?: (id: string) => void;
  onMarcarFabricado?: (id: string) => void;
  onMarcarEntregado?: (id: string) => void;
  onMarcarFacturado?: (id: string, numeroFactura: string, totalFacturado: number) => void;
  onVerControlCodigos?: (proyecto: ProyectoVenta) => void;
  onVerHojaViajera?: (proyecto: ProyectoVenta) => void;
  userRol?: string;
  userId?: string;
  // Órdenes de Compra (solo lectura: la creación se hace desde la sección Órdenes de Compra)
  ordenesCompra?: OrdenCompra[];
  onCambiarEstadoOC?: (id: string, estado: OrdenCompra['estado']) => Promise<boolean> | void;
  onEliminarOC?: (id: string) => void;
}

interface Vendedor {
  id: string;
  nombre: string;
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

// Configuración de estados de OC
const estadoOCConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  autorizada: { label: 'Autorizada', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  pagada: { label: 'Pagada', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  recibida: { label: 'Recibida', color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelada: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100' },
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
  onVerControlCodigos,
  onVerHojaViajera,
  userRol = 'vendedor',
  userId,
  ordenesCompra = [],
  onCambiarEstadoOC,
  onEliminarOC
}: ProyectosViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoProyecto | 'todos'>('todos');
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('todos');
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [dialogoConvertir, setDialogoConvertir] = useState(false);
  const [dialogoFacturar, setDialogoFacturar] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoVenta | null>(null);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<CotizacionGuardada | null>(null);
  const [ordenCompra, setOrdenCompra] = useState('');
  const [tipoProyecto, setTipoProyecto] = useState<'suministro' | 'maquinado'>('maquinado');
  const [codigoManual, setCodigoManual] = useState('');
  // Piezas compradas: por defecto todo lo cotizado; se puede bajar a 0 o desmarcar
  const [piezasCompra, setPiezasCompra] = useState<Record<string, { incluir: boolean; cantidad: number }>>({});
  const [numeroFactura, setNumeroFactura] = useState('');
  const [montoFactura, setMontoFactura] = useState('');
  
  // Estado para la sección expandible de Órdenes de Compra (solo lectura)
  const [proyectoExpandido, setProyectoExpandido] = useState<string | null>(null);

  const isAdmin = userRol === 'admin' || userRol === 'superadmin';
  const isVendedor = userRol === 'vendedor';

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

  // Filtrar proyectos según rol
  const proyectosFiltradosPorRol = isAdmin 
    ? proyectos 
    : proyectos.filter(p => p.usuarioId === userId);

  // Filtrar proyectos por búsqueda, estado y vendedor
  const proyectosFiltrados = proyectosFiltradosPorRol.filter(p => {
    const coincideBusqueda = 
      (p.proyectoNombre?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (p.clienteNombre?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (p.ordenCompra?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (p.numeroFactura?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (p.codigoProyecto?.toLowerCase() || '').includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const coincideVendedor = vendedorFiltro === 'todos' || p.usuarioId === vendedorFiltro;
    
    return coincideBusqueda && coincideEstado && coincideVendedor;
  });

  // Cotizaciones convertibles: SOLO estado 'cotizacion' (terminada y enviada)
  // y que aún no tengan proyecto asociado. Borradores y órdenes no aplican.
  const cotizacionesPendientes = isAdmin
    ? cotizaciones.filter(c =>
        c.estado === 'cotizacion' && !proyectos.some(p => p.numeroCotizacion === c.numero)
      )
    : cotizaciones.filter(c =>
        c.usuarioId === userId &&
        c.estado === 'cotizacion' &&
        !proyectos.some(p => p.numeroCotizacion === c.numero)
      );

  // Totales por estado (solo de proyectos visibles para el usuario)
  const totalesPorEstado = {
    en_fabricacion: proyectosFiltrados.filter(p => p.estado === 'en_fabricacion').reduce((sum, p) => sum + p.totalCotizado, 0),
    fabricado: proyectosFiltrados.filter(p => p.estado === 'fabricado').reduce((sum, p) => sum + p.totalCotizado, 0),
    entregado: proyectosFiltrados.filter(p => p.estado === 'entregado').reduce((sum, p) => sum + p.totalCotizado, 0),
    facturado: proyectosFiltrados.filter(p => p.estado === 'facturado').reduce((sum, p) => sum + (p.totalFacturado || 0), 0),
  };

  const totalVendido = proyectosFiltrados.reduce((sum, p) => sum + p.totalCotizado, 0);
  const totalFacturado = proyectosFiltrados.reduce((sum, p) => sum + (p.totalFacturado || 0), 0);

  // Obtener nombre del vendedor
  const getNombreVendedor = (usuarioId: string | undefined) => {
    if (!usuarioId) return 'Desconocido';
    const vendedor = vendedores.find(v => v.id === usuarioId);
    return vendedor?.nombre || 'Desconocido';
  };

  const handleConvertir = () => {
    if (!cotizacionSeleccionada || !ordenCompra || !onConvertirAVenta) return;

    // Piezas compradas: solo las incluidas con cantidad > 0.
    // Si la cotización no tiene piezas (formato viejo), se convierte completa.
    const piezasCot = cotizacionSeleccionada.piezas || [];
    let piezasCompradas: { piezaId: string; cantidad: number }[] | undefined;
    if (piezasCot.length > 0) {
      piezasCompradas = piezasCot
        .filter(pz => piezasCompra[pz.id]?.incluir && (piezasCompra[pz.id]?.cantidad ?? 0) > 0)
        .map(pz => ({ piezaId: pz.id, cantidad: piezasCompra[pz.id].cantidad }));
      if (piezasCompradas.length === 0) return; // el botón se deshabilita, doble seguro
    }

    onConvertirAVenta(cotizacionSeleccionada, ordenCompra, tipoProyecto, codigoManual || undefined, piezasCompradas);

    setOrdenCompra('');
    setTipoProyecto('maquinado');
    setCodigoManual('');
    setPiezasCompra({});
    setCotizacionSeleccionada(null);
    setDialogoConvertir(false);
  };

  const handleMarcarFabricadoClick = (id: string) => {
    if (onMarcarFabricado) {
      onMarcarFabricado(id);
    }
  };

  const handleMarcarEntregadoClick = (id: string) => {
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
    if (!proyectoSeleccionado || !numeroFactura || !montoFactura || !onMarcarFacturado) return;
    
    onMarcarFacturado(proyectoSeleccionado.id, numeroFactura, parseFloat(montoFactura));

    setNumeroFactura('');
    setMontoFactura('');
    setProyectoSeleccionado(null);
    setDialogoFacturar(false);
  };

  // Calcular horas totales de un proyecto (los procesos viven en las piezas)
  const calcularHorasTotales = (proyecto: ProyectoVenta) => {
    const minutos = procesosAplanados(proyecto).reduce((sum, p) => sum + minutosCotizados(p), 0);
    return (minutos / 60).toFixed(1);
  };

  // Calcular piezas totales de un proyecto
  const calcularPiezasTotales = (proyecto: ProyectoVenta) => {
    return proyecto.piezas?.length || 0;
  };

  // Funciones para Órdenes de Compra
  const toggleExpandirProyecto = (proyectoId: string) => {
    setProyectoExpandido(prev => prev === proyectoId ? null : proyectoId);
  };

  const getOCsByProyecto = (proyectoId: string) => {
    return ordenesCompra.filter(oc => oc.proyectoId === proyectoId);
  };

  const siguienteEstadoOC = (estadoActual: OrdenCompra['estado']): OrdenCompra['estado'] => {
    const estados: OrdenCompra['estado'][] = ['pendiente', 'autorizada', 'pagada', 'recibida'];
    const idx = estados.indexOf(estadoActual);
    if (idx >= 0 && idx < estados.length - 1) {
      return estados[idx + 1];
    }
    return estados[0];
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
            {proyectosFiltrados.length} proyectos · ${totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })} vendido
            {totalFacturado > 0 && ` · $${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} facturado`}
            {!isAdmin && <span className="text-blue-600 ml-2">(Vista Personal)</span>}
          </p>
        </div>
        
        {/* Botón Convertir Cotización - solo admin y vendedor */}
        {(isAdmin || isVendedor) && onConvertirAVenta && (
          <Dialog open={dialogoConvertir} onOpenChange={setDialogoConvertir}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Convertir Cotización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                            onClick={() => {
                              setCotizacionSeleccionada(cot);
                              // Inicializar: todo lo cotizado queda incluido por defecto
                              setPiezasCompra(Object.fromEntries(
                                (cot.piezas || []).map(pz => [pz.id, { incluir: true, cantidad: pz.cantidad }])
                              ));
                            }}
                            className={`w-full p-3 text-left hover:bg-slate-50 transition-colors ${
                              cotizacionSeleccionada?.id === cot.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                            }`}
                          >
                            <div className="font-medium">{cot.numero}</div>
                            <div className="text-sm text-slate-500">
                              {cot.clienteNombre} · {cot.proyectoNombre} · ${cot.total.toFixed(2)}
                            </div>
                            {isAdmin && cot.usuarioId && (
                              <div className="text-xs text-blue-600 mt-1">
                                <User className="w-3 h-3 inline mr-1" />
                                {getNombreVendedor(cot.usuarioId)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Piezas compradas: ajustar cantidades o excluir items */}
                {cotizacionSeleccionada && (cotizacionSeleccionada.piezas?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <Label>Piezas compradas *</Label>
                    <p className="text-xs text-slate-400">
                      Lo cotizado queda guardado en la cotización. Aquí ajusta lo que SÍ te
                      compraron: baja la cantidad o desmarca el item (0 = no entra al proyecto).
                    </p>
                    <div className="border rounded-lg divide-y max-h-[180px] overflow-y-auto">
                      {cotizacionSeleccionada.piezas!.map((pz) => {
                        const sel = piezasCompra[pz.id] || { incluir: true, cantidad: pz.cantidad };
                        return (
                          <div key={pz.id} className={`flex items-center gap-2 p-2 ${sel.incluir ? '' : 'opacity-40'}`}>
                            <input
                              type="checkbox"
                              checked={sel.incluir}
                              onChange={(e) => setPiezasCompra(prev => ({
                                ...prev,
                                [pz.id]: { ...sel, incluir: e.target.checked },
                              }))}
                              className="rounded border-slate-300 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{pz.nombre}</p>
                              <p className="text-xs text-slate-400">Cotizadas: {pz.cantidadCotizada ?? pz.cantidad}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-slate-500">Compradas:</span>
                              <Input
                                type="number"
                                min={0}
                                max={pz.cantidadCotizada ?? pz.cantidad}
                                value={sel.cantidad}
                                disabled={!sel.incluir}
                                onChange={(e) => setPiezasCompra(prev => ({
                                  ...prev,
                                  [pz.id]: { ...sel, cantidad: Math.max(0, parseInt(e.target.value) || 0) },
                                }))}
                                className="h-7 w-16 text-sm text-right"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Vista previa del total comprado */}
                    {(() => {
                      const ivaPct = (cotizacionSeleccionada.ivaPorcentaje ?? 16) / 100;
                      const totalCompra = (cotizacionSeleccionada.piezas || []).reduce((s, pz) => {
                        const sel = piezasCompra[pz.id];
                        if (!sel?.incluir || sel.cantidad <= 0) return s;
                        return s + (pz.totalPieza || 0) * sel.cantidad;
                      }, 0);
                      return (
                        <p className="text-sm text-right text-slate-600">
                          Total de la compra: <span className="font-bold text-green-700">
                            ${(totalCompra * (1 + ivaPct)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span> <span className="text-xs text-slate-400">(con IVA)</span>
                        </p>
                      );
                    })()}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Tipo de Proyecto *</Label>
                  <Select value={tipoProyecto} onValueChange={(v) => setTipoProyecto(v as 'suministro' | 'maquinado')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suministro">Suministro (SUM)</SelectItem>
                      <SelectItem value="maquinado">Maquinado (MAQ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número de Orden de Compra *</Label>
                  <Input
                    value={ordenCompra}
                    onChange={(e) => setOrdenCompra(e.target.value)}
                    placeholder="Ej: OC-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código de proyecto (opcional)</Label>
                  <Input
                    value={codigoManual}
                    onChange={(e) => setCodigoManual(e.target.value)}
                    placeholder={tipoProyecto === 'suministro' ? 'SUM-26-0001 (automático si se deja vacío)' : 'MAQ-26-0001 (automático si se deja vacío)'}
                  />
                  <p className="text-xs text-slate-400">
                    Las piezas heredan este código. El 0007 de cada año está reservado para gastos internos.
                  </p>
                </div>

                <Button
                  onClick={handleConvertir}
                  disabled={
                    !cotizacionSeleccionada ||
                    !ordenCompra ||
                    // Si la cotización tiene piezas, al menos una debe quedar incluida con cantidad > 0
                    ((cotizacionSeleccionada.piezas?.length ?? 0) > 0 &&
                      !Object.values(piezasCompra).some(s => s.incluir && s.cantidad > 0))
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Convertir a Venta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar proyecto, cliente, OC, factura o código..."
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
            const expandido = proyectoExpandido === proyecto.id;
            const ocs = getOCsByProyecto(proyecto.id);
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
                            <Hash className="w-3 h-3" />
                            {proyecto.codigoProyecto || 'Sin código'}
                          </span>
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
                            <Package className="w-3 h-3" />
                            {calcularPiezasTotales(proyecto)} piezas
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calcularHorasTotales(proyecto)}h cotizadas
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${proyecto.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                          {isAdmin && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <User className="w-3 h-3" />
                              {getNombreVendedor(proyecto.usuarioId)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Botón expandir/colapsar OC */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpandirProyecto(proyecto.id)}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Órdenes de Compra
                        {ocs.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {ocs.length}
                          </Badge>
                        )}
                        {expandido ? (
                          <ChevronUp className="w-3 h-3 ml-1" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>

                      {/* Botón Hoja Viajera */}
                      {onVerHojaViajera && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerHojaViajera(proyecto)}
                          title="Hoja viajera"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          <ClipboardList className="w-4 h-4 mr-1" />
                          Hoja Viajera
                        </Button>
                      )}

                      {/* Botón Control de Códigos - solo admin, superadmin y producción */}
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
                          onClick={() => handleMarcarFabricadoClick(proyecto.id)}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Marcar Fabricado
                        </Button>
                      )}

                      {proyecto.estado === 'fabricado' && onMarcarEntregado && (
                        <Button
                          size="sm"
                          onClick={() => handleMarcarEntregadoClick(proyecto.id)}
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

                      {/* Botón eliminar - solo admin y superadmin */}
                      {onEliminarProyecto && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminarProyecto(proyecto.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Sección Órdenes de Compra (expandible) */}
                  {expandido && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Órdenes de Compra
                        </h4>
                      </div>

                      {ocs.length === 0 ? (
                        <p className="text-sm text-slate-500 py-2">No hay órdenes de compra para este proyecto</p>
                      ) : (
                        <div className="space-y-2">
                          {ocs.map((oc) => {
                            const ocEstado = estadoOCConfig[oc.estado] || estadoOCConfig.pendiente;
                            return (
                              <div
                                key={oc.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="font-medium text-sm">{oc.numeroOc}</span>
                                  <Badge variant="outline" className={`${ocEstado.color} border-current text-xs`}>
                                    {ocEstado.label}
                                  </Badge>
                                  <span className="text-sm text-slate-600">
                                    {oc.proveedor || 'Sin proveedor'}
                                  </span>
                                  {oc.concepto && (
                                    <span className="text-xs text-slate-400">
                                      {oc.concepto}
                                    </span>
                                  )}
                                  <span className="text-sm font-medium text-slate-700">
                                    ${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {onCambiarEstadoOC && oc.estado !== 'cancelada' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onCambiarEstadoOC(oc.id, siguienteEstadoOC(oc.estado))}
                                      className="text-xs h-7"
                                    >
                                      Cambiar Estado
                                    </Button>
                                  )}
                                  {onEliminarOC && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEliminarOC(oc.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
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
              {isAdmin && proyectoSeleccionado && (
                <p className="text-xs text-blue-600">
                  <User className="w-3 h-3 inline mr-1" />
                  Vendedor: {getNombreVendedor(proyectoSeleccionado.usuarioId)}
                </p>
              )}
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
              Facturar Proyecto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
