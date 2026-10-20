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
  Search,
  CheckCircle,
  Factory,
  Package,
  Clock,
  DollarSign,
  User,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ProyectoVenta, EstadoProyecto } from '@/types/ventas';
import { procesosAplanados, minutosCotizados } from '@/utils/proyectoDatos';
import type { CotizacionGuardada } from '@/types/cotizacion';

interface ProyectosViewProps {
  onVolver: () => void;
  proyectos: ProyectoVenta[];
  cotizaciones: CotizacionGuardada[];
  // Abrir la vista de detalle del código (OCs, hoja viajera, control de
  // códigos, estados, etc. se operan DENTRO del proyecto)
  onVerProyecto: (proyecto: ProyectoVenta) => void;
  onConvertirAVenta?: (
    cotizacion: CotizacionGuardada,
    ordenCompra: string,
    tipoProyecto: 'suministro' | 'maquinado',
    codigoManual?: string,
    piezasCompradas?: { piezaId: string; cantidad: number }[]
  ) => void;
  userRol?: string;
  userId?: string;
  // Proyecto directo: urgencia (sin PO) o stock (almacén)
  onCrearProyectoDirecto?: (datos: {
    tipoOrigen: 'urgencia' | 'stock';
    tipoProyecto: 'suministro' | 'maquinado';
    proyectoNombre: string;
    clienteId?: string;
    clienteNombre?: string;
  }) => Promise<string | null> | void;
  clientes?: { id: string; nombreEmpresa: string }[];
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
    icon: CheckCircle
  },
  facturado: {
    label: 'FACTURADO',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: DollarSign
  },
};

// LISTA de proyectos: solo códigos y datos clave. Al seleccionar un código
// se abre ProyectoDetalleView con todas sus opciones — evita confusiones
// al tener todos los proyectos desplegados juntos.
export function ProyectosView({
  onVolver,
  proyectos,
  cotizaciones,
  onVerProyecto,
  onConvertirAVenta,
  userRol = 'vendedor',
  userId,
  onCrearProyectoDirecto,
  clientes = []
}: ProyectosViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoProyecto | 'todos'>('todos');
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('todos');
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [dialogoConvertir, setDialogoConvertir] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<CotizacionGuardada | null>(null);
  const [ordenCompra, setOrdenCompra] = useState('');
  const [tipoProyecto, setTipoProyecto] = useState<'suministro' | 'maquinado'>('maquinado');
  const [codigoManual, setCodigoManual] = useState('');
  // Piezas compradas: por defecto todo lo cotizado; se puede bajar a 0 o desmarcar
  const [piezasCompra, setPiezasCompra] = useState<Record<string, { incluir: boolean; cantidad: number }>>({});
  // Proyecto directo (urgencia / stock)
  const [dialogoDirecto, setDialogoDirecto] = useState(false);
  const [directoOrigen, setDirectoOrigen] = useState<'urgencia' | 'stock'>('urgencia');
  const [directoTipo, setDirectoTipo] = useState<'suministro' | 'maquinado'>('maquinado');
  const [directoNombre, setDirectoNombre] = useState('');
  const [directoClienteId, setDirectoClienteId] = useState('');
  const [creandoDirecto, setCreandoDirecto] = useState(false);

  const isAdmin = userRol === 'admin' || userRol === 'superadmin' || userRol === 'finanzas';
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

  // Siempre del más nuevo al más antiguo: por fecha y, en empate (mismo
  // día), por código de proyecto que es consecutivo (MAQ-26-0018 > 0017)
  proyectosFiltrados.sort((a, b) => {
    const fa = new Date(a.fechaVenta).getTime();
    const fb = new Date(b.fechaVenta).getTime();
    if (fb !== fa) return fb - fa;
    return (b.codigoProyecto || '').localeCompare(a.codigoProyecto || '');
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

  // Crear proyecto directo: urgencia (sin PO) o stock (almacén)
  const handleCrearDirecto = async () => {
    if (!onCrearProyectoDirecto || !directoNombre.trim()) return;
    setCreandoDirecto(true);
    const cliente = clientes.find(c => c.id === directoClienteId);
    await onCrearProyectoDirecto({
      tipoOrigen: directoOrigen,
      tipoProyecto: directoTipo,
      proyectoNombre: directoNombre.trim(),
      clienteId: cliente?.id,
      clienteNombre: cliente?.nombreEmpresa,
    });
    setCreandoDirecto(false);
    setDialogoDirecto(false);
    setDirectoNombre('');
    setDirectoClienteId('');
    setDirectoOrigen('urgencia');
    setDirectoTipo('maquinado');
  };

  // Calcular horas totales de un proyecto (los procesos viven en las piezas)
  const calcularHorasTotales = (proyecto: ProyectoVenta) => {
    const minutos = procesosAplanados(proyecto).reduce((sum, p) => sum + minutosCotizados(p), 0);
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
            {proyectosFiltrados.length} proyectos · ${totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })} vendido
            {totalFacturado > 0 && ` · $${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} facturado`}
            {!isAdmin && <span className="text-blue-600 ml-2">(Vista Personal)</span>}
          </p>
        </div>

        {/* Botón Proyecto Directo (urgencia / stock) - solo admin y vendedor */}
        {(isAdmin || isVendedor) && onCrearProyectoDirecto && (
          <Dialog open={dialogoDirecto} onOpenChange={setDialogoDirecto}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50">
                <Factory className="w-4 h-4 mr-2" />
                Proyecto Directo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Proyecto Directo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tipo de proyecto</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDirectoOrigen('urgencia')}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        directoOrigen === 'urgencia'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm">Urgencia</p>
                      <p className="text-xs text-slate-500">Sin PO del cliente. Se cotiza después con datos reales.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectoOrigen('stock')}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        directoOrigen === 'stock'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm">Stock</p>
                      <p className="text-xs text-slate-500">Fabricar para almacén. Utilidad solo al facturar.</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Código (prefijo)</Label>
                  <Select value={directoTipo} onValueChange={(v) => setDirectoTipo(v as 'suministro' | 'maquinado')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maquinado">Maquinado (MAQ)</SelectItem>
                      <SelectItem value="suministro">Suministro (SUM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nombre del proyecto *</Label>
                  <Input
                    value={directoNombre}
                    onChange={(e) => setDirectoNombre(e.target.value)}
                    placeholder={directoOrigen === 'stock' ? 'Ej: Bujes de bronce para stock' : 'Ej: Reparación urgente prensa'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cliente {directoOrigen === 'stock' ? '(opcional)' : ''}</Label>
                  <Select value={directoClienteId || 'sin-cliente'} onValueChange={(v) => setDirectoClienteId(v === 'sin-cliente' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin-cliente">
                        {directoOrigen === 'stock' ? 'Stock / Almacén' : 'Sin cliente asignado'}
                      </SelectItem>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombreEmpresa}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCrearDirecto}
                  disabled={!directoNombre.trim() || creandoDirecto}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {creandoDirecto ? 'Creando…' : 'Crear Proyecto'}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Se crea sin cotización ni orden de compra. Las piezas y tiempos se capturan en la sección de Producción.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}

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

      {/* Lista de códigos: solo lo esencial; al elegir uno se abre su detalle */}
      <div className="space-y-3">
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
              <Card
                key={proyecto.id}
                className="border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => onVerProyecto(proyecto)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 ${estadoConfig[proyecto.estado].bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                        <EstadoIcon className={`w-5 h-5 ${estadoConfig[proyecto.estado].color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{proyecto.codigoProyecto || 'Sin código'}</span>
                          <Badge variant="outline" className={`${estadoConfig[proyecto.estado].color} border-current`}>
                            {estadoConfig[proyecto.estado].label}
                          </Badge>
                          {proyecto.tipoOrigen === 'urgencia' && (
                            <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50">
                              URGENCIA
                            </Badge>
                          )}
                          {proyecto.tipoOrigen === 'stock' && (
                            <Badge variant="outline" className="text-purple-700 border-purple-400 bg-purple-50">
                              STOCK
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-slate-700 truncate mt-0.5">{proyecto.proyectoNombre}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {proyecto.clienteNombre}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            OC: {proyecto.ordenCompra || 'pendiente'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(proyecto.fechaVenta).toLocaleDateString('es-MX')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {proyecto.piezas?.length || 0} piezas
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calcularHorasTotales(proyecto)}h
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${proyecto.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                          {proyecto.numeroFactura && (
                            <span className="flex items-center gap-1 text-purple-600">
                              Fact: {proyecto.numeroFactura}
                            </span>
                          )}
                          {isAdmin && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <User className="w-3 h-3" />
                              {getNombreVendedor(proyecto.usuarioId)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 shrink-0">
                      <span className="text-sm font-medium hidden sm:inline">Ver proyecto</span>
                      <ChevronRight className="w-5 h-5" />
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
