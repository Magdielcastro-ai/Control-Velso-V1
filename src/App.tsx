import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Toaster, toast } from 'sonner';
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
  Shield,
  Loader2,
  ArrowLeft,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

// Hooks
import { useCotizacionStore } from '@/hooks/useCotizacionStore';
import type { PiezaCotizacion } from '@/types/cotizacion';
import { useCatalogoMateriales } from '@/hooks/useCatalogoMateriales';
import { useClientesStore } from '@/hooks/useClientesStore';
import { useProyectosStore } from '@/hooks/useProyectosStore';
import { useTalleresStore } from '@/hooks/useTalleresStore';
import { useAuth, type AuthUser } from '@/hooks/useAuth';
import { usePendientesStore } from '@/hooks/usePendientesStore';
import { useCobranzaStore } from '@/hooks/useCobranzaStore';
import { usePiezasCatalogoStore } from '@/hooks/usePiezasCatalogoStore';

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
import { DashboardView } from '@/components/DashboardView';
import { ProduccionDashboardView } from '@/components/ProduccionDashboardView';
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

// NUEVO: Vista de Producción
import { ProduccionView } from '@/components/ProduccionView';

// NUEVOS COMPONENTES VELSO OS v2
import { PendientesView } from '@/components/PendientesView';
import { CobranzaView } from '@/components/CobranzaView';
import { DashboardEjecutivo } from '@/components/DashboardEjecutivo';

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

type VistaPrincipal = 'home' | 'dashboard' | 'produccion-dashboard' | 'clientes' | 'proyectos' | 'materiales' | 
                      'procesos' | 'cotizaciones' | 'cotizacion' | 'cotizacion-final' | 
                      'control-codigos' | 'admin-usuarios' | 'diagnostico' |
                      'pendientes' | 'cobranza' | 'dashboard-ejecutivo' | 'produccion';

// Horas disponibles por defecto
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
    canViewProduccionDashboard,
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
  } = useAuth();

  // NUEVOS STORES VELSO OS v2
  const {
    pendientes,
    generarPendientesDesdeProyectos,
    completarPendiente,
    agregarPendiente,
    actualizarNotas: actualizarNotasPendiente,
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
    actualizarMargenUtilidad,
    guardarCotizacion,
    cargarCotizacion,
    nuevaCotizacion,
    refrescarDesdeSupabase: refrescarCotizaciones,
  } = useCotizacionStore();

  const { catalogo, agregarAlCatalogo, eliminarDelCatalogo, recargarCatalogo } = useCatalogoMateriales();
  const { buscarPiezaPorCodigo, guardarPiezaEnCatalogo } = usePiezasCatalogoStore();

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

  // NUEVO: Generar pendientes y cobranzas automáticamente cuando cargan los datos
  useEffect(() => {
    if (datosCargados && proyectos.length > 0) {
      generarPendientesDesdeProyectos(proyectos, cotizacionesGuardadas);
      generarCobranzas(proyectos);
    }
  }, [datosCargados, proyectos, cotizacionesGuardadas, generarPendientesDesdeProyectos, generarCobranzas]);

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
    ]);
    setDatosCargados(true);
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

  const irADashboard = () => {
    if (canViewProduccionDashboard()) {
      setVistaActual('produccion-dashboard');
    } else if (canViewDashboard()) {
      setVistaActual('dashboard');
    } else {
      toast.error('No tienes permiso para ver el dashboard');
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
  const irADashboardEjecutivo = () => setVistaActual('dashboard-ejecutivo');
  const irAProduccion = () => setVistaActual('produccion');

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

  // Convertir cotización a venta desde la vista de cotizaciones
  const handleConvertirCotizacionAVenta = async (cotizacion: CotizacionGuardada, ordenCompra: string) => {
    if (!canConvertirAVenta()) {
      toast.error('No tienes permiso para convertir cotizaciones');
      return;
    }

    await convertirAVenta({
      numeroCotizacion: cotizacion.numero,
      ordenCompra,
      clienteId: '',
      clienteNombre: cotizacion.clienteNombre,
      proyectoNombre: cotizacion.proyectoNombre,
      totalCotizado: cotizacion.total,
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
    toast.success('Cotización convertida a venta exitosamente');
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

    await guardarCotizacion('enviada');
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

  const handleNuevaCotizacion = () => {
    nuevaCotizacion('pieza_unica');
    setVistaActual('cotizacion');
    setPasoActual('taller');
    toast.success('Nueva cotización iniciada');
  };

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
              onDashboardEjecutivo={irADashboardEjecutivo}
              onProduccion={irAProduccion}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
              cobranzaVencidaCount={getVencidos().length}
            />
            {canManageUsers() && (
              <div className="mt-6">
                <Button 
                  onClick={irAAdminUsuarios}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Administración de Usuarios
                </Button>
              </div>
            )}
          </>
        );

      case 'dashboard-ejecutivo':
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
              totalesCobranza={getTotales()}
              onIrAPendientes={irAPendientes}
              onIrACobranza={irACobranza}
              onIrAProyectos={irAProyectos}
              onIrACotizaciones={irACotizaciones}
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
              onActualizarNotas={actualizarNotasPendiente}
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
            <DashboardView
              onVolver={irAHome}
              cotizaciones={cotizacionesGuardadas}
              horasDisponibles={horasDisponibles}
              proyectos={proyectos}
              userRol={user.rol}
              userId={user.id}
            />
          </>
        );

      case 'produccion-dashboard':
        return (
          <>
            <UserHeader 
              user={user} 
              onLogout={handleLogout}
              alertasCount={alertasCount}
              pendientesCount={pendientesCount}
            />
            <ProduccionDashboardView
              onVolver={irAHome}
              proyectos={proyectos}
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
              registros={[]}
              onIniciarProceso={(id) => console.log('Iniciar', id)}
              onCompletarProceso={(id, tiempo) => console.log('Completar', id, tiempo)}
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
              onConvertirAVenta={canConvertirAVenta() ? convertirAVenta : undefined}
              onEliminarProyecto={canDeleteProyectos() ? eliminarProyecto : undefined}
              onMarcarFabricado={canUpdateProyectoEstado('fabricado') ? handleMarcarFabricado : undefined}
              onMarcarEntregado={canUpdateProyectoEstado('entregado') ? handleMarcarEntregado : undefined}
              onMarcarFacturado={canUpdateProyectoEstado('facturado') ? handleMarcarFacturado : undefined}
              onVerControlCodigos={canViewControlCodigos() ? handleVerControlCodigos : undefined}
              userRol={user.rol}
              userId={user.id}
            />
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
            {proyectoSeleccionado ? (
              <ControlDeCodigosView
                proyecto={proyectoSeleccionado}
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
              onConvertirAVenta={canConvertirAVenta() ? handleConvertirCotizacionAVenta : undefined}
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
                  <ClienteStep key={pasoActual} 
                    datos={cotizacion.datosCliente} 
                    onChange={actualizarDatosCliente}
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
                    onBuscarPiezaPorCodigo={buscarPiezaPorCodigo}
                    onGuardarPiezaEnCatalogo={guardarPiezaEnCatalogo}
                  />
                )}

                {pasoActual === 'costos' && (
                  <CostosStep
                    piezas={cotizacion.piezas}
                    costosGenerales={cotizacion.costosAdicionales}
                    margenUtilidad={cotizacion.margenUtilidad}
                    onChangeCostosPieza={(piezaId, datos) => {
                      console.log('Costos por pieza:', piezaId, datos);
                    }}
                    onChangeCostosGenerales={actualizarCostosAdicionales}
                    onChangeMargen={actualizarMargenUtilidad}
                  />
                )}
                {pasoActual === 'condiciones' && (
                  <CondicionesStep 
                    datos={cotizacion.condiciones}
                    onChange={actualizarCondiciones}
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
            onNuevaCotizacion={handleNuevaCotizacion}
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
