import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Toaster, toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save,
  Factory,
  User,
  FileText,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  FileCheck,
  LogOut,
  Loader2,
  ArrowLeft,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

// Hooks
import { useCotizacionStore } from '@/hooks/useCotizacionStore';
import type { PiezaCotizacion, CostosAdicionalesProyecto } from '@/types/cotizacion';
import { useCatalogoMateriales } from '@/hooks/useCatalogoMateriales';
import { useClientesStore } from '@/hooks/useClientesStore';
import { useProyectosStore } from '@/hooks/useProyectosStore';
import { useTalleresStore } from '@/hooks/useTalleresStore';
import { useAuth, type AuthUser } from '@/hooks/useAuth';
import { usePendientesStore } from '@/hooks/usePendientesStore';
import { useCobranzaStore } from '@/hooks/useCobranzaStore';
import { usePiezasCatalogoStore } from '@/hooks/usePiezasCatalogoStore';
import { useMonedaStore } from '@/hooks/useMonedaStore';
import { useOrdenesCompraStore } from '@/hooks/useOrdenesCompraStore';
import { useProveedoresStore } from '@/hooks/useProveedoresStore';
import { materialesCotizadosDeProyecto } from '@/utils/proyectoDatos';

// Componentes de pasos
import { TallerStep } from '@/components/steps/TallerStep';
import { ClienteStep } from '@/components/steps/ClienteStep';
import { ProyectoStep } from '@/components/steps/ProyectoStep';
import { CostosStep } from '@/components/steps/CostosStep';
import { CondicionesStep } from '@/components/steps/CondicionesStep';
import { ResumenStep } from '@/components/steps/ResumenStep';
import { CotizacionFinalStep } from '@/components/steps/CotizacionFinalStep';
import { PiezasStep } from '@/components/steps/PiezasStep';

// Vistas principales
import { HomeVelso } from '@/components/HomeVelso';
import { ClientesView } from '@/components/ClientesView';
import { ProyectosView } from '@/components/ProyectosView';
import { MaterialesCatalogoView } from '@/components/MaterialesCatalogoView';
import { CatalogoProcesosView } from '@/components/CatalogoProcesosView';
import { CotizacionesView } from '@/components/CotizacionesView';
import { ControlDeCodigosView } from '@/components/ControlDeCodigosView';
import { LoginView } from '@/components/LoginView';
import { AdminUsuariosView } from '@/components/AdminUsuariosView';
import { DiagnosticoSupabase } from '@/components/DiagnosticoSupabase';
import { PantallaCarga } from '@/components/PantallaCarga';

// NUEVO: Vista de Hoja Viajera
import { HojaViajeraView } from '@/components/HojaViajeraView';
import { ProduccionView } from '@/components/ProduccionView';

// NUEVOS COMPONENTES VELSO OS v2
import { PendientesView } from '@/components/PendientesView';
import { CobranzaView } from '@/components/CobranzaView';
import { DashboardEjecutivo } from '@/components/DashboardEjecutivo';

// VISTA CATÁLOGO DE PIEZAS
import { CatalogoPiezasView } from '@/components/CatalogoPiezasView';
import { OrdenesCompraView } from '@/components/OrdenesCompraView';
import { ProveedoresView } from '@/components/ProveedoresView';

import type { PasoCotizacion } from '@/types/cotizacion';
import type { CotizacionGuardada } from '@/types/cotizacion';
import type { ProyectoVenta } from '@/types/ventas';

const pasos: { id: PasoCotizacion; label: string; icon: React.ElementType }[] = [
  { id: 'taller', label: 'Taller', icon: Factory },
  { id: 'cliente', label: 'Cliente', icon: User },
  { id: 'proyecto', label: 'Proyecto', icon: FileText },
  { id: 'piezas', label: 'Piezas', icon: Package },
  { id: 'costos', label: 'Costos', icon: DollarSign },
  { id: 'condiciones', label: 'Condiciones', icon: Calendar },
  { id: 'resumen', label: 'Resumen', icon: CheckCircle },
];

type VistaPrincipal = 'home' | 'dashboard' | 'clientes' | 'proyectos' | 'materiales' |
                      'procesos' | 'cotizaciones' | 'cotizacion' | 'cotizacion-final' |
                      'control-codigos' | 'admin-usuarios' | 'diagnostico' |
                      'pendientes' | 'cobranza' | 'produccion' | 'piezas-catalogo' | 'hoja-viajera' | 'ordenes-compra' |
                      'proveedores';

const HORAS_DEFAULT: Record<string, number> = {
  codigo_07: 742.69,
  mo_s: 268.88,
  mo_e: 403.31,
  hora_diseno: 159.30,
  hora_ensamble: 159.30,
  torno_convencional: 161.93,
  perfiladora: 161.93,
  torno_cnc: 133.35,
  cnc_vertical: 382.91,
};

// Header con info de usuario
function UserHeader({ user, onLogout, alertasCount, pendientesCount }: { 
  user: AuthUser; 
  onLogout: () => void;
  alertasCount: number;
  pendientesCount: number;
}) {
  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'superadmin': return 'bg-red-600';
      case 'admin': return 'bg-purple-600';
      case 'vendedor': return 'bg-blue-600';
      case 'produccion': return 'bg-green-600';
      default: return 'bg-slate-600';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'vendedor': return 'Vendedor';
      case 'produccion': return 'Producción';
      default: return rol;
    }
  };

  return (
    <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className={`w-10 h-10 ${getRolColor(user.rol)} rounded-full flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">
          {user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-900">{user.nombre}</p>
        <p className="text-xs text-slate-500">{getRolLabel(user.rol)}</p>
      </div>

      <div className="flex items-center gap-2">
        {alertasCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="text-xs font-medium text-red-600">{alertasCount}</span>
          </div>
        )}
        {pendientesCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
            <CheckSquare className="w-3 h-3 text-orange-600" />
            <span className="text-xs font-medium text-orange-600">{pendientesCount}</span>
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onLogout} className="border-slate-300">
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar Sesión
      </Button>
    </div>
  );
}

function App() {
  const [vistaActual, setVistaActual] = useState<VistaPrincipal>('home');
  const [pasoActual, setPasoActual] = useState<PasoCotizacion>('taller');
  const [horasDisponibles, setHorasDisponibles] = useState<Record<string, number>>(HORAS_DEFAULT);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoVenta | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [datosCargados, setDatosCargados] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  // Auth con todos los permisos
  const { 
    user, 
    loading: authLoading, 
    initialized, 
    signIn, 
    signOut,
    refreshSession,
    isAdmin,
    isVendedor,
    isProduccion,
    canManageUsers,
    canCreateCotizacion,
    canConvertirAVenta,
    canViewDashboard,
    canViewControlCodigos,
    canUpdateProyectoEstado,
    canManageClientes,
    canDeleteClientes,
    canManageTalleres,
    canManageMateriales,
    canViewMateriales,
    canManageProcesos,
    canViewProcesos,
    canDeleteProyectos,
    canViewPiezasCatalogo,
    canManagePiezasCatalogo,
  } = useAuth();

  // NUEVOS STORES VELSO OS v2
  const {
    pendientes,
    completarPendiente,
    agregarPendiente,
    eliminarPendiente,
    getPendientesHoy,
    getAlertasRojas,
  } = usePendientesStore();

  const {
    cobranzas,
    generarDesdeProyectos: generarCobranzas,
    registrarPago,
    actualizarNotas: actualizarNotasCobranza,
    actualizarContacto,
    marcarIncobrable,
    getVencidos,
    getTotales,
  } = useCobranzaStore();

  // Órdenes de Compra
  const {
    ordenes: ordenesCompra,
    crearOrdenCompra,
    actualizarEstado: actualizarEstadoOC,
    eliminarOrdenCompra,
    refrescarDesdeSupabase: refrescarOrdenes,
  } = useOrdenesCompraStore();

  // Proveedores (para órdenes de compra)
  const {
    proveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
  } = useProveedoresStore();

  // ─── OC → costo real de materiales del proyecto ───
  // Al crear una OC ligada a un proyecto: los items ligados a un material
  // cotizado acumulan su compra (permite re-compras por errores de
  // maquinado), y los items libres entran como "compra extra".
  const registrarComprasEnProyecto = async (proyectoId: string, ocId: string, ocNumero: string, items: any[]) => {
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    const actuales = (proyecto.materialesReales && proyecto.materialesReales.length > 0)
      ? proyecto.materialesReales.map((m: any) => ({ ...m }))
      : materialesCotizadosDeProyecto(proyecto).map((m: any) => ({
          ...m,
          costoUnitarioReal: m.costoUnitarioCotizado,
          costoTotalReal: m.costoTotalCotizado,
        }));

    const compraExtra = (item: any) => ({
      id: `oc-${ocId}-${item.id}`,
      nombre: `${item.nombre} (compra extra)`,
      tipo: 'compra_extra',
      forma: '',
      cantidad: item.cantidad,
      unidad: item.unidad || 'pieza',
      costoUnitarioCotizado: 0,
      margenPorcentaje: 0,
      costoTotalCotizado: 0,
      costoUnitarioReal: item.precioUnitario,
      costoTotalReal: item.total,
      comprasOC: [{ ocId, numero: ocNumero, descripcion: item.nombre, total: item.total }],
    });

    for (const item of items) {
      const mat = item.materialId ? actuales.find((m: any) => m.id === item.materialId) : null;
      if (mat) {
        mat.comprasOC = [...(mat.comprasOC || []), { ocId, numero: ocNumero, descripcion: item.nombre, total: item.total }];
        mat.costoTotalReal = mat.comprasOC.reduce((s: number, c: any) => s + (Number(c.total) || 0), 0);
      } else {
        actuales.push(compraExtra(item));
      }
    }

    await guardarDatosReales(proyectoId, { materialesReales: actuales });
  };

  // Al eliminar una OC: quitar sus compras del costo real del proyecto
  const limpiarComprasDeProyecto = async (proyectoId: string, ocId: string) => {
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto || !proyecto.materialesReales) return;

    const nuevos = proyecto.materialesReales
      .filter((m: any) => !String(m.id).startsWith(`oc-${ocId}-`))
      .map((m: any) => {
        if (!m.comprasOC) return m;
        const compras = m.comprasOC.filter((c: any) => c.ocId !== ocId);
        return {
          ...m,
          comprasOC: compras,
          // Sin compras registradas: vuelve a contar como cotizado
          costoTotalReal: compras.length > 0
            ? compras.reduce((s: number, c: any) => s + (Number(c.total) || 0), 0)
            : undefined,
        };
      });

    await guardarDatosReales(proyectoId, { materialesReales: nuevos });
  };

  const handleCrearOrdenCompra = async (datos: any): Promise<boolean> => {
    const ocCreada = await crearOrdenCompra(datos);
    if (!ocCreada) return false;
    if (ocCreada.proyectoId) {
      await registrarComprasEnProyecto(ocCreada.proyectoId, ocCreada.id, ocCreada.numeroOc, ocCreada.items || []);
    }
    return true;
  };

  const handleEliminarOrdenCompra = async (id: string): Promise<boolean> => {
    const oc = ordenesCompra.find(o => o.id === id);
    const ok = await eliminarOrdenCompra(id);
    if (ok && oc?.proyectoId) {
      await limpiarComprasDeProyecto(oc.proyectoId, id);
    }
    return ok;
  };

  // Verificar sesión periódicamente para evitar cierres inesperados
  useEffect(() => {
    if (!initialized || authLoading) return;

    const intervalId = setInterval(async () => {
      if (user) {
        const isValid = await refreshSession();
        if (!isValid) {
          console.warn('[App] Sesión inválida detectada');
          toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [initialized, authLoading, user, refreshSession]);

  // Stores existentes
  const {
    cotizacion,
    cotizacionesGuardadas,
    actualizarDatosTaller,
    actualizarDatosCliente,
    actualizarProyecto,
    agregarPieza,
    eliminarPieza,
    actualizarPieza,
    asignarMaterialAPieza,
    eliminarMaterialDePieza,
    actualizarCostosAdicionales,
    actualizarCondiciones,
    guardarCotizacion,
    cargarCotizacion,
    nuevaCotizacion,
    actualizarMoneda,
    actualizarTipoCambio,
    refrescarDesdeSupabase: refrescarCotizaciones,
  } = useCotizacionStore();

  const { catalogo, agregarAlCatalogo, eliminarDelCatalogo, recargarCatalogo } = useCatalogoMateriales();
  const { piezasCatalogo, cargando: cargandoPiezasCatalogo, buscarPiezaPorCodigo, guardarPiezaEnCatalogo } = usePiezasCatalogoStore();

  const { 
    clientes, 
    agregarCliente, 
    actualizarCliente,
    eliminarCliente, 
    agregarUsuario, 
    actualizarUsuario,
    eliminarUsuario,
    refrescarDesdeSupabase: refrescarClientes,
  } = useClientesStore();

  const { 
    proyectos, 
    convertirAVenta, 
    eliminarProyecto,
    marcarFabricado,
    marcarEntregado,
    marcarFacturado,
    guardarDatosReales,
    refrescarDesdeSupabase: refrescarProyectos,
  } = useProyectosStore();

  const {
    talleres,
    guardarTallerDesdeCotizacion,
    actualizarTaller,
    recargarTalleres,
  } = useTalleresStore();

  // MONEDA - Solo para referencia, el selector está en CondicionesStep
  const { moneda } = useMonedaStore();

  // Login handler
  const handleLogin = async (email: string, password: string) => {
    setLoginError(null);
    setDatosCargados(false);
    try {
      await signIn(email, password);
      toast.success('Bienvenido al sistema');
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Error al iniciar sesión');
      toast.error(error.message || 'Error al iniciar sesión');
    }
  };

  // Handlers para pantalla de carga
  const handleCargaCompleta = async () => {
    console.log('[App] Carga completada, refrescando datos...');
    await Promise.all([
      refrescarClientes(),
      refrescarCotizaciones(),
      refrescarProyectos(),
      recargarTalleres(),
      refrescarOrdenes(),
    ]);
    setDatosCargados(true);
    setUltimaActualizacion(new Date());
    toast.success('Datos sincronizados correctamente');
  };

  const handleUsarOffline = () => {
    console.log('[App] Usando modo offline');
    setDatosCargados(true);
    toast.info('Usando datos del dispositivo (modo offline)');
  };


  // Logout handler
  const handleLogout = async () => {
    await signOut();
    setVistaActual('home');
    toast.success('Sesión cerrada');
  };

  // Navegación con permisos
  const irAHome = () => setVistaActual('home');

  // Dashboard consolidado: SOLO admin/superadmin
  const irADashboard = () => {
    if (canViewDashboard()) {
      setVistaActual('dashboard');
      recargarDatosDashboard();
    } else {
      toast.error('Solo los administradores pueden ver el dashboard');
    }
  };

  // Leer datos frescos de Supabase al entrar al dashboard y
  // registrar la hora en que terminó la sincronización
  const recargarDatosDashboard = async () => {
    setCargandoDatos(true);
    try {
      await Promise.all([
        refrescarProyectos(),
        refrescarCotizaciones(),
        refrescarOrdenes(),
        refrescarClientes(),
      ]);
    } finally {
      setUltimaActualizacion(new Date());
      setCargandoDatos(false);
    }
  };

  const irAClientes = () => {
    if (canManageClientes()) {
      setVistaActual('clientes');
    } else {
      toast.error('No tienes permiso para ver clientes');
    }
  };

  const irAProyectos = () => {
    if (isAdmin() || isVendedor() || isProduccion()) {
      setVistaActual('proyectos');
    } else {
      toast.error('No tienes permiso para ver proyectos');
    }
  };

  const irAMateriales = () => {
    if (canViewMateriales()) {
      setVistaActual('materiales');
    } else {
      toast.error('No tienes permiso para ver materiales');
    }
  };

  const irAProcesos = () => {
    if (canViewProcesos()) {
      setVistaActual('procesos');
    } else {
      toast.error('No tienes permiso para ver procesos');
    }
  };

  const irAPiezasCatalogo = () => {
    if (canViewPiezasCatalogo()) {
      setVistaActual('piezas-catalogo');
    } else {
      toast.error('No tienes permiso para ver el catálogo de piezas');
    }
  };

  const irACotizaciones = () => {
    if (isAdmin() || isVendedor()) {
      setVistaActual('cotizaciones');
    } else {
      toast.error('No tienes permiso para ver cotizaciones');
    }
  };

  const irAAdminUsuarios = () => {
    if (canManageUsers()) {
      setVistaActual('admin-usuarios');
    } else {
      toast.error('Solo superadministradores pueden gestionar usuarios');
    }
  };

  const irADiagnostico = () => {
    setVistaActual('diagnostico');
  };

  // NUEVAS NAVEGACIONES VELSO OS v2
  const irAPendientes = () => setVistaActual('pendientes');
  const irACobranza = () => setVistaActual('cobranza');
  const irAProduccion = () => setVistaActual('produccion');
  const irAOrdenesCompra = () => setVistaActual('ordenes-compra');
  const irAProveedores = () => setVistaActual('proveedores');

  const irANuevaCotizacion = () => {
    if (!canCreateCotizacion()) {
      toast.error('No tienes permiso para crear cotizaciones');
      return;
    }
    nuevaCotizacion();
    setPasoActual('taller');
    setVistaActual('cotizacion');
  };

  // Actualizar horas disponibles
  const actualizarHorasDisponibles = (procesoId: string, horas: number) => {
    setHorasDisponibles(prev => ({ ...prev, [procesoId]: horas }));
    toast.success('Horas disponibles actualizadas');
  };

  // Convertir cotización a venta desde RESUMEN (usa cotización actual del store)
  // Convertir cotización a venta desde la vista de cotizaciones
  const handleConvertirCotizacionAVenta = async (
    cotizacion: CotizacionGuardada,
    ordenCompra: string,
    tipoProyecto: 'suministro' | 'maquinado' = 'maquinado',
    codigoManual?: string,
    piezasCompradas?: { piezaId: string; cantidad: number }[]
  ) => {
    if (!canConvertirAVenta()) {
      toast.error('No tienes permiso para convertir cotizaciones');
      return;
    }

    // Buscar la cotización completa para obtener las piezas
    const cotizacionCompleta = cotizacionesGuardadas.find(c => c.id === cotizacion.id);

    // Piezas COMPRADAS: escalar cada pieza a la cantidad comprada.
    // La cotización original no se toca (queda lo ofertado); el proyecto
    // nace solo con lo comprado. Si no hay selección, se toma todo.
    const piezasOriginales = cotizacionCompleta?.piezas || [];
    const piezasConv = piezasOriginales
      .filter(pz => !piezasCompradas || piezasCompradas.some(s => s.piezaId === pz.id))
      .map(pz => {
        const compradas = piezasCompradas
          ? (piezasCompradas.find(s => s.piezaId === pz.id)?.cantidad ?? pz.cantidad)
          : pz.cantidad;
        const factor = pz.cantidad > 0 ? compradas / pz.cantidad : 0;
        return {
          ...pz,
          cantidadCotizada: pz.cantidad,   // trazabilidad: cotizado vs comprado
          cantidad: compradas,
          // Procesos escalan por pieza: min/pza × compradas, costo proporcional
          procesos: (pz.procesos || []).map((pr: any) => ({
            ...pr,
            tiempoMinutos: (Number(pr.tiempoMinutosPorPieza ?? pr.tiempoMinutos) || 0) * compradas,
            costoTotal: (Number(pr.costoTotal) || 0) * factor,
          })),
          // Material: precio por pieza × compradas
          material: pz.material ? {
            ...pz.material,
            cantidad: compradas,
            costoTotal: (Number(pz.material.costoUnitario) || 0) * compradas,
          } : null,
        };
      });

    // Margen efectivo: promedio ponderado del % de utilidad de las piezas
    // COMPRADAS (cada pieza puede tener su propio margen 15–50%)
    const totalConUtilidad = piezasConv.reduce((s, p) => s + p.totalPieza * p.cantidad, 0);
    const utilidadTotalConv = piezasConv.reduce((s, p) => s + p.utilidadPieza * p.cantidad, 0);
    const margenEfectivo = totalConUtilidad > 0
      ? Math.round((utilidadTotalConv / totalConUtilidad) * 1000) / 10
      : (cotizacion.margenUtilidad || 30);

    // Total del proyecto = solo lo comprado (subtotal + IVA)
    const costosGenerales = Object.values(cotizacionCompleta?.costosAdicionales || {})
      .filter((item: any) => !item?.incluidoGratis)
      .reduce((s: number, item: any) => s + (Number(item?.costo) || 0), 0);
    const ivaPct = (cotizacion.ivaPorcentaje || 16) / 100;
    const subtotalCompra = totalConUtilidad + costosGenerales;
    const totalCompra = subtotalCompra * (1 + ivaPct);

    const exito = await convertirAVenta({
      numeroCotizacion: cotizacion.numero,
      ordenCompra,
      tipoProyecto,
      clienteId: cotizacion.clienteId || '',
      clienteNombre: cotizacion.clienteNombre,
      proyectoNombre: cotizacion.proyectoNombre,
      totalCotizado: piezasCompradas ? totalCompra : cotizacion.total,
      margenUtilidad: margenEfectivo,
      ivaPorcentaje: cotizacion.ivaPorcentaje || 16,
      piezas: piezasConv,
      materiales: cotizacionCompleta?.materiales || [],
      procesos: cotizacionCompleta?.procesos || [],
      costosAdicionales: cotizacionCompleta?.costosAdicionales || {
        envio: { costo: 0, incluidoGratis: false },
        diseno: { costo: 0, incluidoGratis: false },
        estudioMaterial: { costo: 0, incluidoGratis: false },
        pruebaDureza: { costo: 0, incluidoGratis: false },
      },
      cotizacionId: cotizacion.id,
      codigoManual,
    });
    if (exito) {
      toast.success('Cotización convertida a venta exitosamente');
    }
  };

  // Handlers para cambio de estado de proyectos
  const handleMarcarFabricado = (id: string) => {
    if (!canUpdateProyectoEstado('fabricado')) {
      toast.error('No tienes permiso para esta acción');
      return;
    }
    marcarFabricado(id);
    toast.success('Proyecto marcado como fabricado');
  };

  const handleMarcarEntregado = (id: string) => {
    if (!canUpdateProyectoEstado('entregado')) {
      toast.error('No tienes permiso para esta acción');
      return;
    }
    marcarEntregado(id);
    toast.success('Proyecto marcado como entregado');
  };

  const handleMarcarFacturado = (id: string, numeroFactura: string, totalFacturado: number) => {
    if (!canUpdateProyectoEstado('facturado')) {
      toast.error('No tienes permiso para facturar');
      return;
    }
    marcarFacturado(id, numeroFactura, totalFacturado);
    toast.success(`Proyecto facturado - Factura: ${numeroFactura}`);
  };

  // Ver control de códigos
  const handleVerControlCodigos = (proyecto: ProyectoVenta) => {
    if (!canViewControlCodigos()) {
      toast.error('No tienes permiso para ver el control de códigos');
      return;
    }
    setProyectoSeleccionado(proyecto);
    setVistaActual('control-codigos');
  };

  // Ver hoja viajera
  const handleVerHojaViajera = (proyecto: ProyectoVenta) => {
    setProyectoSeleccionado(proyecto);
    setVistaActual('hoja-viajera');
  };

  // Volver de hoja viajera
  const handleVolverDeHojaViajera = () => {
    setProyectoSeleccionado(null);
    setVistaActual('proyectos');
  };

  // Volver de control de códigos
  const handleVolverDeControlCodigos = () => {
    setProyectoSeleccionado(null);
    setVistaActual('proyectos');
  };

  // Cotización
  const handleSiguiente = async () => {
    await guardarCotizacion('borrador');

    const indiceActual = pasos.findIndex(p => p.id === pasoActual);
    if (indiceActual < pasos.length - 1) {
      setPasoActual(pasos[indiceActual + 1].id);
    }
  };

  const handleAnterior = async () => {
    await guardarCotizacion('borrador');

    const indiceActual = pasos.findIndex(p => p.id === pasoActual);
    if (indiceActual > 0) {
      setPasoActual(pasos[indiceActual - 1].id);
    }
  };

  const handleGuardar = async () => {
    await guardarCotizacion('borrador');
    toast.success('Cotización guardada correctamente');
  };

  const handleGenerarCotizacion = async () => {
    if (canManageTalleres() && cotizacion.datosTaller.nombre) {
      guardarTallerDesdeCotizacion(cotizacion.datosTaller);
    }

    if (canManageClientes() && (cotizacion.datosCliente.nombre || cotizacion.datosCliente.empresa)) {
      const clienteData = {
        nombreEmpresa: cotizacion.datosCliente.empresa || cotizacion.datosCliente.nombre,
        direccion: cotizacion.datosCliente.direccion,
        telefono: cotizacion.datosCliente.telefono,
        rfc: cotizacion.datosCliente.rfc || '',
        terminosPago: '50% anticipo, 50% contra entrega',
      };

      const existe = clientes.some(c => 
        c.nombreEmpresa.toLowerCase() === clienteData.nombreEmpresa.toLowerCase()
      );

      if (!existe && clienteData.nombreEmpresa) {
        agregarCliente(clienteData);
      }
    }

    await guardarCotizacion('cotizacion');
    setVistaActual('cotizacion-final');
    toast.success('¡Cotización generada exitosamente!');
  };

  const handleCargarCotizacion = async (id: string) => {
    const cargada = await cargarCotizacion(id);
    if (cargada) {
      setPasoActual('resumen');
      setVistaActual('cotizacion');
      toast.success('Cotización cargada correctamente');
    } else {
      toast.error('No se pudo cargar la cotización');
    }
  };

  // Cambio manual de estado de cotización (debug/pruebas):
  // si sale de comprada/vendida, eliminar proyecto vinculado
  // (desaparece de Proyectos y Producción) y sus órdenes de compra
  const handleCambiarEstadoCotizacion = async (cot: any, nuevoEstado: string) => {
    const ESTADOS_CONVERTIDA = ['orden'];
    const saleDeConvertida =
      ESTADOS_CONVERTIDA.includes(cot.estado) && !ESTADOS_CONVERTIDA.includes(nuevoEstado);
    if (!saleDeConvertida) return;

    const proyectosVinculados = proyectos.filter(
      (p) => (p.cotizacionId && p.cotizacionId === cot.id) || p.numeroCotizacion === cot.numero
    );
    const idsProyectos = new Set(proyectosVinculados.map((p) => p.id));

    const ocsVinculadas = ordenesCompra.filter(
      (o) => (o.proyectoId && idsProyectos.has(o.proyectoId)) || o.cotizacionId === cot.id
    );

    // Pendientes vinculados al proyecto o a la cotización
    const pendientesVinculados = pendientes.filter(
      (p) => (p.proyectoId && idsProyectos.has(p.proyectoId)) || p.cotizacionId === cot.id
    );

    for (const oc of ocsVinculadas) {
      await eliminarOrdenCompra(oc.id);
    }
    for (const pend of pendientesVinculados) {
      await eliminarPendiente(pend.id);
    }
    // Alertas vinculadas (se limpian directo en Supabase)
    await supabase.from('alertas').delete().eq('cotizacion_id', cot.id);
    if (idsProyectos.size > 0) {
      await supabase.from('alertas').delete().in('proyecto_id', [...idsProyectos]);
    }
    for (const proy of proyectosVinculados) {
      await eliminarProyecto(proy.id);
    }

    const totalLimpieza =
      proyectosVinculados.length + ocsVinculadas.length + pendientesVinculados.length;
    if (totalLimpieza > 0) {
      toast.info(
        `Limpieza: ${proyectosVinculados.length} proyecto(s), ${ocsVinculadas.length} orden(es) de compra y ${pendientesVinculados.length} pendiente(s) eliminados`
      );
    }
  };

  const handleCambiarMoneda = (moneda: 'MXN' | 'USD') => {
    actualizarMoneda(moneda);
  };

  const handleCambiarTipoCambio = (tipoCambio: number) => {
    actualizarTipoCambio(tipoCambio);
  };

  /*
  const handleNuevaCotizacion = () => {
    nuevaCotizacion('pieza_unica');
    setVistaActual('cotizacion');
    setPasoActual('taller');
    toast.success('Nueva cotización iniciada');
  };
  */

  // Verificar si el paso actual está completo
  const pasoCompleto = () => {
    switch (pasoActual) {
      case 'taller':
        return !!cotizacion.datosTaller.nombre;
      case 'cliente':
        return !!cotizacion.datosCliente.nombre;
      case 'proyecto':
        return !!cotizacion.proyecto.nombre;
      case 'piezas':
        return cotizacion.piezas.length > 0 && cotizacion.piezas.every((p: PiezaCotizacion) => p.nombre.trim() !== '');
      default:
        return true;
    }
  };

  const indicePasoActual = pasos.findIndex(p => p.id === pasoActual);
  const progreso = ((indicePasoActual + 1) / pasos.length) * 100;

  // Métricas para el header
  const alertasCount = getAlertasRojas().length;
  const pendientesCount = getPendientesHoy().length;

  // Mostrar loading mientras inicializa auth
  if (!initialized || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Factory className="w-12 h-12 animate-pulse mx-auto text-blue-600 mb-4" />
          <p className="text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar login si no hay usuario
  if (!user) {
    return (
      <LoginView 
        onLogin={handleLogin} 
        loading={authLoading}
        error={loginError}
      />
    );
  }

  // Mostrar pantalla de carga después del login hasta que los datos estén cargados
  if (!datosCargados) {
    return (
      <PantallaCarga 
        onCargaCompleta={handleCargaCompleta}
        onUsarOffline={handleUsarOffline}
      />
    );
  }

  // Renderizar vista actual
  const renderVista = () => {
    // Siempre usar la versión FRESCA del proyecto (con horas reales
    // recién guardadas), no la copia congelada al abrir la vista
    const proyectoFresco = proyectoSeleccionado
      ? (proyectos.find(p => p.id === proyectoSeleccionado.id) || proyectoSeleccionado)
      : null;

    switch (vistaActual) {
      case 'home':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout} 
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <HomeVelso
              onDashboard={irADashboard}
              onClientes={irAClientes}
              onProyectos={irAProyectos}
              onMateriales={irAMateriales}
              onProcesos={irAProcesos}
              onCotizaciones={irACotizaciones}
              onNuevaCotizacion={irANuevaCotizacion}
              onDiagnostico={irADiagnostico}
              onPendientes={irAPendientes}
              onCobranza={irACobranza}
              onProduccion={irAProduccion}
              onPiezasCatalogo={irAPiezasCatalogo}
              onOrdenesCompra={irAOrdenesCompra}
              onProveedores={irAProveedores}
              onAdminUsuarios={irAAdminUsuarios}
              esAdmin={canManageUsers() || canViewDashboard()}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
              cobranzaVencidaCount={getVencidos().length}
            />
          </>
        );

      case 'dashboard':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <DashboardEjecutivo
              onVolver={irAHome}
              pendientesHoy={getPendientesHoy()}
              alertasRojas={getAlertasRojas()}
              proyectos={proyectos}
              cotizaciones={cotizacionesGuardadas}
              horasDisponibles={horasDisponibles}
              totalesCobranza={getTotales()}
              cargando={cargandoDatos}
              ultimaActualizacion={ultimaActualizacion}
              onIrAPendientes={irAPendientes}
              onIrACobranza={irACobranza}
              onIrAProyectos={irAProyectos}
              talleresCount={talleres.length}
              clientesCount={clientes.length}
              materialesCount={catalogo.length}
              procesosCount={Object.keys(horasDisponibles).length}
            />
          </>
        );

      case 'pendientes':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <PendientesView
              onVolver={irAHome}
              pendientes={pendientes}
              onCompletar={completarPendiente}
              onAgregar={agregarPendiente}
              onEliminar={eliminarPendiente}
            />
          </>
        );

      case 'cobranza':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <CobranzaView
              onVolver={irAHome}
              cobranzas={cobranzas}
              onRegistrarPago={registrarPago}
              onActualizarNotas={actualizarNotasCobranza}
              onActualizarContacto={actualizarContacto}
              onMarcarIncobrable={marcarIncobrable}
              onGenerarDesdeProyectos={async () => {
                await generarCobranzas(proyectos);
                toast.success('Cobranzas generadas desde proyectos facturados');
              }}
            />
          </>
        );

      case 'produccion':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <ProduccionView
              onVolver={irAHome}
              proyectos={proyectos}
              onGuardarHorasReales={async (proyecto, procesosReales) => {
                // 1. JSON en proyectos.procesos_reales (alimenta dashboard y control de códigos)
                await guardarDatosReales(proyecto.id, { procesosReales });
                // 2. Tabla registros_produccion (una fila por proceso; corregir = upsert)
                // Dedup de seguridad por proceso_id (nunca dos filas con la misma llave)
                const vistos = new Set<string>();
                const filas = procesosReales
                  .filter((p: any) => {
                    if (vistos.has(p.id)) return false;
                    vistos.add(p.id);
                    return true;
                  })
                  .map((p: any) => ({
                  proyecto_id: proyecto.id,
                  codigo_proyecto: proyecto.codigoProyecto,
                  pieza_id: p.piezaId || '',
                  pieza_nombre: p.piezaNombre || null,
                  proceso_id: p.id,
                  proceso_nombre: p.nombre,
                  minutos_cotizados: p.tiempoMinutosCotizado || 0,
                  minutos_reales: p.tiempoMinutosReal,
                  operador: p.operadorNombre || null,
                  lineas: p.lineas || null,
                  piezas_real: p.piezasReal || 0,
                  usuario_id: user.id,
                  updated_at: new Date().toISOString(),
                }));
                const { error } = await supabase
                  .from('registros_produccion')
                  .upsert(filas, { onConflict: 'proyecto_id,proceso_id' });
                // Sincronizar eliminaciones (extras quitados en la app)
                const idsVigentes = procesosReales.map((p: any) => p.id);
                let errorBorrado = null;
                if (idsVigentes.length > 0) {
                  const res = await supabase
                    .from('registros_produccion')
                    .delete()
                    .eq('proyecto_id', proyecto.id)
                    .not('proceso_id', 'in', `(${idsVigentes.map((i: string) => `"${i}"`).join(',')})`);
                  errorBorrado = res.error;
                }
                if (error || errorBorrado) {
                  console.error('[App] Error registros_produccion:', error?.message || errorBorrado?.message);
                  toast.error('Las horas se guardaron, pero falló el registro detallado: ' + (error?.message || errorBorrado?.message));
                } else {
                  toast.success(`Horas reales guardadas en ${proyecto.codigoProyecto}`);
                }
              }}
            />
          </>
        );

      case 'clientes':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <ClientesView
              onVolver={irAHome}
              clientes={clientes}
              onAgregarCliente={canManageClientes() ? agregarCliente : undefined}
              onActualizarCliente={canManageClientes() ? actualizarCliente : undefined}
              onEliminarCliente={canDeleteClientes() ? eliminarCliente : undefined}
              onAgregarUsuario={agregarUsuario}
              onActualizarUsuario={actualizarUsuario}
              onEliminarUsuario={eliminarUsuario}
            />
          </>
        );

      case 'proyectos':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <ProyectosView
              onVolver={irAHome}
              proyectos={proyectos}
              cotizaciones={cotizacionesGuardadas}
              onConvertirAVenta={canConvertirAVenta() ? handleConvertirCotizacionAVenta : undefined}
              onEliminarProyecto={canDeleteProyectos() ? eliminarProyecto : undefined}
              onMarcarFabricado={canUpdateProyectoEstado('fabricado') ? handleMarcarFabricado : undefined}
              onMarcarEntregado={canUpdateProyectoEstado('entregado') ? handleMarcarEntregado : undefined}
              onMarcarFacturado={canUpdateProyectoEstado('facturado') ? handleMarcarFacturado : undefined}
              onVerControlCodigos={canViewControlCodigos() ? handleVerControlCodigos : undefined}
              onVerHojaViajera={handleVerHojaViajera}
              userRol={user.rol}
              userId={user.id}
              ordenesCompra={ordenesCompra}
              onCambiarEstadoOC={actualizarEstadoOC}
              onEliminarOC={handleEliminarOrdenCompra}
            />
          </>
        );

      case 'hoja-viajera':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            {proyectoFresco ? (
              <HojaViajeraView
                proyecto={proyectoFresco}
                onVolver={handleVolverDeHojaViajera}
              />
            ) : null}
          </>
        );

      case 'control-codigos':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            {proyectoFresco ? (
              <ControlDeCodigosView
                proyecto={proyectoFresco}
                onVolver={handleVolverDeControlCodigos}
                onGuardarDatosReales={guardarDatosReales}
              />
            ) : null}
          </>
        );

      case 'materiales':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <MaterialesCatalogoView
              onVolver={irAHome}
              catalogo={catalogo}
              onAgregar={canManageMateriales() ? agregarAlCatalogo : undefined}
              onEliminar={canManageMateriales() ? eliminarDelCatalogo : undefined}
              onActualizarPrecio={canManageMateriales() ? (id, precio) => {
                const mat = catalogo.find(m => m.id === id);
                if (mat) {
                  toast.success('Precio actualizado: $' + precio.toFixed(2));
                }
              } : undefined}
            />
          </>
        );

      case 'procesos':
        return (
          <>
            <UserHeader
              user={user}
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <CatalogoProcesosView
              onVolver={irAHome}
              horasDisponibles={horasDisponibles}
              onActualizarHoras={canManageProcesos() ? actualizarHorasDisponibles : undefined}
            />
          </>
        );

      case 'piezas-catalogo':
        return (
          <>
            <UserHeader
              user={user}
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <CatalogoPiezasView
              onVolver={irAHome}
              piezas={piezasCatalogo}
              onEliminar={canManagePiezasCatalogo() ? (_id) => {
                // TODO: implementar eliminación en usePiezasCatalogoStore
                toast.info('Eliminación de piezas desde catálogo próximamente');
              } : undefined}
            />
          </>
        );

      case 'cotizaciones':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <CotizacionesView
              onVolver={irAHome}
              userRol={user.rol}
              onCargarCotizacion={handleCargarCotizacion}
              onCambiarEstado={handleCambiarEstadoCotizacion}
            />
          </>
        );

      case 'ordenes-compra':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <OrdenesCompraView
              onVolver={irAHome}
              ordenes={ordenesCompra}
              proyectos={proyectos}
              proveedores={proveedores}
              datosTaller={
                talleres[0]
                  ? {
                      nombre: talleres[0].nombre,
                      direccion: talleres[0].direccion,
                      telefono: talleres[0].telefono,
                      email: talleres[0].email,
                      rfc: talleres[0].rfc,
                    }
                  : cotizacion.datosTaller?.nombre
                    ? {
                        nombre: cotizacion.datosTaller.nombre,
                        direccion: cotizacion.datosTaller.direccion,
                        telefono: cotizacion.datosTaller.telefono,
                        email: cotizacion.datosTaller.email,
                        rfc: cotizacion.datosTaller.rfc,
                      }
                    : { nombre: 'Soluciones Integrales Velso' }
              }
              solicitanteDefault={user?.nombre || user?.email || ''}
              onCambiarEstado={actualizarEstadoOC}
              onEliminar={handleEliminarOrdenCompra}
              onCrearOrden={handleCrearOrdenCompra}
            />
          </>
        );

      case 'proveedores':
        return (
          <>
            <UserHeader
              user={user}
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <ProveedoresView
              onVolver={irAHome}
              proveedores={proveedores}
              onCrear={crearProveedor}
              onActualizar={actualizarProveedor}
              onEliminar={eliminarProveedor}
            />
          </>
        );

      case 'admin-usuarios':
        if (!user) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-slate-500">Cargando usuario...</p>
              </div>
            </div>
          );
        }
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <AdminUsuariosView onVolver={irAHome} userRol={user.rol} />
          </>
        );

      case 'diagnostico':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <div className="mb-4">
              <Button variant="outline" onClick={irAHome} className="border-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
            <DiagnosticoSupabase />
          </>
        );

      case 'cotizacion':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <Card className="mb-6 border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Factory className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="font-bold text-slate-900">Sistema de Control de Ventas Velso</h1>
                      <p className="text-sm text-slate-500">Nueva Cotización</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleGuardar} className="border-slate-300">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button variant="outline" size="sm" onClick={irAHome} className="border-slate-300">
                      Salir
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progreso</span>
                    <span>{Math.round(progreso)}%</span>
                  </div>
                  <Progress value={progreso} className="h-2" />
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {pasos.map((paso, index) => {
                    const isActive = paso.id === pasoActual;
                    const isPast = index < indicePasoActual;
                    return (
                      <button
                        key={paso.id}
                        onClick={async () => {
                          await guardarCotizacion('borrador');
                          setPasoActual(paso.id);
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isPast
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <paso.icon className="w-3 h-3" />
                        {paso.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 mb-6">
              <CardContent className="p-6">
                {pasoActual === 'taller' && (
                  <TallerStep 
                    datos={cotizacion.datosTaller} 
                    onChange={actualizarDatosTaller}
                    talleresGuardados={talleres}
                    onGuardarTaller={canManageTalleres() ? async (datos) => {
                      const result = await guardarTallerDesdeCotizacion(datos);
                      return result;
                    } : undefined}
                    onActualizarTaller={canManageTalleres() ? async (id, datos) => {
                      await actualizarTaller(id, datos);
                    } : undefined}
                    userRol={user.rol}
                  />
                )}
                {pasoActual === 'cliente' && (
                  <ClienteStep 
                    datos={cotizacion.datosCliente} 
                    onChange={actualizarDatosCliente}
                    onChangeCondiciones={(cond) => actualizarCondiciones(cond)}
                    clientesGuardados={clientes}
                    onGuardarCliente={canManageClientes() ? async (datos) => {
                      const clienteData = {
                        nombreEmpresa: datos.empresa || datos.nombre,
                        direccion: datos.direccion,
                        telefono: datos.telefono,
                        rfc: datos.rfc || '',
                        terminosPago: '50% anticipo, 50% contra entrega',
                      };
                      return await agregarCliente(clienteData);
                    } : undefined}
                    onIrAClientes={canManageClientes() ? irAClientes : undefined}
                  />
                )}
                {pasoActual === 'proyecto' && (
                  <ProyectoStep proyecto={cotizacion.proyecto} onChange={actualizarProyecto} />
                )}
                {pasoActual === 'piezas' && (
                  <PiezasStep
                    piezas={cotizacion.piezas}
                    catalogoMateriales={catalogo}
                    onAgregarPieza={agregarPieza}
                    onEliminarPieza={eliminarPieza}
                    onActualizarPieza={actualizarPieza}
                    onAsignarMaterial={asignarMaterialAPieza}
                    onEliminarMaterial={eliminarMaterialDePieza}
                    onAgregarMaterialACatalogo={async (material) => {
                      const nuevo = await agregarAlCatalogo(material);
                      return nuevo;
                    }}
                    onRecargarCatalogo={recargarCatalogo}
                    piezasCatalogo={piezasCatalogo}
                    cargandoPiezasCatalogo={cargandoPiezasCatalogo}
                    onBuscarPiezaPorCodigo={buscarPiezaPorCodigo}
                    onGuardarPiezaEnCatalogo={guardarPiezaEnCatalogo}
                  />
                )}

                {pasoActual === 'costos' && (
                  <CostosStep
                    costosAdicionales={cotizacion.costosAdicionales as CostosAdicionalesProyecto}
                    onChangeCostosAdicionales={actualizarCostosAdicionales}
                  />
                )}
                {pasoActual === 'condiciones' && (
                  <CondicionesStep 
                    datos={cotizacion.condiciones}
                    onChange={actualizarCondiciones}
                    moneda={cotizacion.moneda || 'MXN'}
                    tipoCambio={cotizacion.tipoCambio || 1}
                    onCambiarMoneda={handleCambiarMoneda}
                    onCambiarTipoCambio={handleCambiarTipoCambio}
                  />
                )}
                {pasoActual === 'resumen' && (
                  <ResumenStep cotizacion={cotizacion} />
                )}
              </CardContent>
            </Card>


            <div className="flex justify-between">
              <Button variant="outline" onClick={handleAnterior} className="border-slate-300">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              {pasoActual === 'resumen' ? (
                <Button onClick={handleGenerarCotizacion} className="bg-green-600 hover:bg-green-700">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Generar Cotización
                </Button>
              ) : (
                <Button 
                  onClick={handleSiguiente}
                  disabled={!pasoCompleto()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        );

      case 'cotizacion-final':
        return (
          <CotizacionFinalStep
            cotizacion={cotizacion}
            moneda={moneda}
            onRegresar={() => {
              setVistaActual('cotizacion');
              setPasoActual('resumen');
            }}
            onSalir={() => {
              setVistaActual('home');
              setPasoActual('taller');
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-4">
      <div className="max-w-5xl mx-auto">
        {renderVista()}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
