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
  Settings,
  DollarSign,
  Calendar,
  CheckCircle,
  FileCheck,
  LogOut,
  Shield
} from 'lucide-react';

// Hooks
import { useCotizacionStore } from '@/hooks/useCotizacionStore';
import { useCatalogoMateriales } from '@/hooks/useCatalogoMateriales';
import { useClientesStore } from '@/hooks/useClientesStore';
import { useProyectosStore } from '@/hooks/useProyectosStore';
import { useTalleresStore } from '@/hooks/useTalleresStore';
import { useAuth, type AuthUser } from '@/hooks/useAuth';

// Componentes de pasos
import { TallerStep } from '@/components/steps/TallerStep';
import { ClienteStep } from '@/components/steps/ClienteStep';
import { ProyectoStep } from '@/components/steps/ProyectoStep';
import { MaterialesStep } from '@/components/steps/MaterialesStep';
import { ProcesosStep } from '@/components/steps/ProcesosStep';
import { CostosStep } from '@/components/steps/CostosStep';
import { CondicionesStep } from '@/components/steps/CondicionesStep';
import { ResumenStep } from '@/components/steps/ResumenStep';
import { CotizacionFinalStep } from '@/components/steps/CotizacionFinalStep';

// Vistas principales
import { HomeVelso } from '@/components/HomeVelso';
import { DashboardView } from '@/components/DashboardView';
import { ClientesView } from '@/components/ClientesView';
import { ProyectosView } from '@/components/ProyectosView';
import { MaterialesCatalogoView } from '@/components/MaterialesCatalogoView';
import { CatalogoProcesosView } from '@/components/CatalogoProcesosView';
import { CotizacionesView } from '@/components/CotizacionesView';
import { ControlDeCodigosView } from '@/components/ControlDeCodigosView';
import { LoginView } from '@/components/LoginView';
import { AdminUsuariosView } from '@/components/AdminUsuariosView';

import type { PasoCotizacion } from '@/types/cotizacion';
import type { CotizacionGuardada } from '@/types/cotizacion';
import type { ProyectoVenta } from '@/types/ventas';

const pasos: { id: PasoCotizacion; label: string; icon: React.ElementType }[] = [
  { id: 'taller', label: 'Taller', icon: Factory },
  { id: 'cliente', label: 'Cliente', icon: User },
  { id: 'proyecto', label: 'Proyecto', icon: FileText },
  { id: 'materiales', label: 'Materiales', icon: Package },
  { id: 'procesos', label: 'Procesos', icon: Settings },
  { id: 'costos', label: 'Costos', icon: DollarSign },
  { id: 'condiciones', label: 'Condiciones', icon: Calendar },
  { id: 'resumen', label: 'Resumen', icon: CheckCircle },
];

type VistaPrincipal = 'home' | 'dashboard' | 'clientes' | 'proyectos' | 'materiales' | 
                      'procesos' | 'cotizaciones' | 'cotizacion' | 'cotizacion-final' | 
                      'control-codigos' | 'admin-usuarios';

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
function UserHeader({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-purple-600';
      case 'vendedor': return 'bg-blue-600';
      case 'produccion': return 'bg-green-600';
      default: return 'bg-slate-600';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
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
  
  // Auth
  const { 
    user, 
    loading: authLoading, 
    initialized, 
    signIn, 
    signOut,
    canCreateCotizacion,
    canViewDashboard,
    canManageUsers,
    canViewControlCodigos,
    canUpdateProyectoEstado
  } = useAuth();
  
  // Cargar horas disponibles del localStorage
  useEffect(() => {
    const guardado = localStorage.getItem('velso_horas_disponibles');
    if (guardado) {
      try {
        setHorasDisponibles(JSON.parse(guardado));
      } catch (e) {
        console.error('Error al cargar horas:', e);
      }
    }
  }, []);

  // Guardar horas disponibles
  useEffect(() => {
    localStorage.setItem('velso_horas_disponibles', JSON.stringify(horasDisponibles));
  }, [horasDisponibles]);
  
  // Stores
  const {
    cotizacion,
    cotizacionesGuardadas,
    actualizarDatosTaller,
    actualizarDatosCliente,
    actualizarProyecto,
    agregarMaterial,
    eliminarMaterial,
    agregarProceso,
    eliminarProceso,
    actualizarCostosAdicionales,
    actualizarCondiciones,
    actualizarMargenUtilidad,
    guardarCotizacion,
    cargarCotizacion,
    nuevaCotizacion,
  } = useCotizacionStore();

  const { catalogo, agregarAlCatalogo, eliminarDelCatalogo } = useCatalogoMateriales();
  
  const { 
    clientes, 
    agregarCliente, 
    eliminarCliente, 
    agregarUsuario, 
    eliminarUsuario 
  } = useClientesStore();
  
  const { 
    proyectos, 
    convertirAVenta, 
    eliminarProyecto,
    marcarFabricado,
    marcarEntregado,
    marcarFacturado,
    guardarDatosReales
  } = useProyectosStore();

  const {
    talleres,
    guardarTallerDesdeCotizacion,
  } = useTalleresStore();

  // Login handler
  const handleLogin = async (email: string, password: string) => {
    setLoginError(null);
    try {
      await signIn(email, password);
      toast.success('Bienvenido al sistema');
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Error al iniciar sesión');
      toast.error(error.message || 'Error al iniciar sesión');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await signOut();
    setVistaActual('home');
    toast.success('Sesión cerrada');
  };

  // Navegación
  const irAHome = () => setVistaActual('home');
  const irADashboard = () => {
    if (canViewDashboard()) setVistaActual('dashboard');
    else toast.error('No tienes permiso para ver el dashboard');
  };
  const irAClientes = () => setVistaActual('clientes');
  const irAProyectos = () => setVistaActual('proyectos');
  const irAMateriales = () => setVistaActual('materiales');
  const irAProcesos = () => setVistaActual('procesos');
  const irACotizaciones = () => setVistaActual('cotizaciones');
  const irAAdminUsuarios = () => {
    if (canManageUsers()) setVistaActual('admin-usuarios');
    else toast.error('Solo administradores pueden gestionar usuarios');
  };
  
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
  const handleSiguiente = () => {
    const indiceActual = pasos.findIndex(p => p.id === pasoActual);
    if (indiceActual < pasos.length - 1) {
      setPasoActual(pasos[indiceActual + 1].id);
    }
  };

  const handleAnterior = () => {
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
    // Guardar el taller si no existe
    if (cotizacion.datosTaller.nombre) {
      guardarTallerDesdeCotizacion(cotizacion.datosTaller);
    }
    
    // Guardar el cliente si no existe
    if (cotizacion.datosCliente.nombre || cotizacion.datosCliente.empresa) {
      const clienteData = {
        nombreEmpresa: cotizacion.datosCliente.empresa || cotizacion.datosCliente.nombre,
        direccion: cotizacion.datosCliente.direccion,
        telefono: cotizacion.datosCliente.telefono,
        rfc: cotizacion.datosCliente.rfc || '',
        terminosPago: '50% anticipo, 50% contra entrega',
      };
      
      // Verificar si el cliente ya existe
      const existe = clientes.some(c => 
        c.nombreEmpresa.toLowerCase() === clienteData.nombreEmpresa.toLowerCase()
      );
      
      if (!existe && clienteData.nombreEmpresa) {
        agregarCliente(clienteData);
      }
    }
    
    // Guardar la cotización
    await guardarCotizacion('enviada');
    setVistaActual('cotizacion-final');
    toast.success('¡Cotización generada exitosamente!');
  };

  const handleCargarCotizacion = (id: string) => {
    if (cargarCotizacion(id)) {
      setPasoActual('resumen');
      setVistaActual('cotizacion');
      toast.success('Cotización cargada correctamente');
    }
  };

  const handleNuevaCotizacion = () => {
    nuevaCotizacion();
    setVistaActual('home');
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
      default:
        return true;
    }
  };

  const indicePasoActual = pasos.findIndex(p => p.id === pasoActual);
  const progreso = ((indicePasoActual + 1) / pasos.length) * 100;

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

  // Renderizar vista actual
  const renderVista = () => {
    switch (vistaActual) {
      case 'home':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            <HomeVelso
              onDashboard={irADashboard}
              onClientes={irAClientes}
              onProyectos={irAProyectos}
              onMateriales={irAMateriales}
              onProcesos={irAProcesos}
              onCotizaciones={irACotizaciones}
              onNuevaCotizacion={irANuevaCotizacion}
            />
            {canManageUsers() && (
              <div className="mt-6">
                <Button 
                  onClick={irAAdminUsuarios}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Administración de Usuarios
                </Button>
              </div>
            )}
          </>
        );

      case 'dashboard':
        const cotizacionesCompletas = JSON.parse(localStorage.getItem('cotizaciones_completas') || '{}');
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            <DashboardView
              onVolver={irAHome}
              cotizaciones={cotizacionesGuardadas}
              cotizacionesCompletas={Object.values(cotizacionesCompletas)}
              horasDisponibles={horasDisponibles}
              proyectos={proyectos}
              userRol={user.rol}
              userId={user.id}
            />
          </>
        );

      case 'clientes':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            <ClientesView
              onVolver={irAHome}
              clientes={clientes}
              onAgregarCliente={agregarCliente}
              onEliminarCliente={eliminarCliente}
              onAgregarUsuario={agregarUsuario}
              onEliminarUsuario={eliminarUsuario}
            />
          </>
        );

      case 'proyectos':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            <ProyectosView
              onVolver={irAHome}
              proyectos={proyectos}
              cotizaciones={cotizacionesGuardadas}
              onConvertirAVenta={convertirAVenta}
              onEliminarProyecto={eliminarProyecto}
              onMarcarFabricado={handleMarcarFabricado}
              onMarcarEntregado={handleMarcarEntregado}
              onMarcarFacturado={handleMarcarFacturado}
              onVerControlCodigos={handleVerControlCodigos}
            />
          </>
        );

      case 'control-codigos':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
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
            <UserHeader user={user} onLogout={handleLogout} />
            <MaterialesCatalogoView
              onVolver={irAHome}
              catalogo={catalogo}
              onAgregar={agregarAlCatalogo}
              onEliminar={eliminarDelCatalogo}
              onActualizarPrecio={(id, precio) => {
                const mat = catalogo.find(m => m.id === id);
                if (mat) {
                  const nuevoCatalogo = catalogo.map(m => 
                    m.id === id ? { ...m, costoUnitario: precio } : m
                  );
                  localStorage.setItem('catalogo_materiales_cnc', JSON.stringify(nuevoCatalogo));
                  toast.success('Precio actualizado');
                }
              }}
            />
          </>
        );

      case 'procesos':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            <CatalogoProcesosView
              onVolver={irAHome}
              horasDisponibles={horasDisponibles}
              onActualizarHoras={actualizarHorasDisponibles}
            />
          </>
        );

      case 'cotizaciones':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            <CotizacionesView
              onVolver={irAHome}
              userRol={user?.rol}
              onCargarCotizacion={handleCargarCotizacion}
              onConvertirAVenta={handleConvertirCotizacionAVenta}
            />
          </>
        );

      case 'admin-usuarios':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            <AdminUsuariosView onVolver={irAHome} />
          </>
        );

      case 'cotizacion':
        return (
          <>
            <UserHeader user={user} onLogout={handleLogout} />
            {/* Header con progreso */}
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
                        onClick={() => setPasoActual(paso.id)}
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

            {/* Contenido del paso */}
            <Card className="border-slate-200 mb-6">
              <CardContent className="p-6">
                {pasoActual === 'taller' && (
                  <TallerStep 
                    datos={cotizacion.datosTaller} 
                    onChange={actualizarDatosTaller}
                    talleresGuardados={talleres}
                    onGuardarTaller={guardarTallerDesdeCotizacion}
                  />
                )}
                {pasoActual === 'cliente' && (
                  <ClienteStep 
                    datos={cotizacion.datosCliente} 
                    onChange={actualizarDatosCliente}
                    clientesGuardados={clientes}
                    onGuardarCliente={(datos) => {
                      const clienteData = {
                        nombreEmpresa: datos.empresa || datos.nombre,
                        direccion: datos.direccion,
                        telefono: datos.telefono,
                        rfc: datos.rfc || '',
                        terminosPago: '50% anticipo, 50% contra entrega',
                      };
                      return agregarCliente(clienteData);
                    }}
                  />
                )}
                {pasoActual === 'proyecto' && (
                  <ProyectoStep datos={cotizacion.proyecto} onChange={actualizarProyecto} />
                )}
                {pasoActual === 'materiales' && (
                  <MaterialesStep 
                    materiales={cotizacion.materiales}
                    onAgregar={agregarMaterial}
                    onEliminar={eliminarMaterial}
                  />
                )}
                {pasoActual === 'procesos' && (
                  <ProcesosStep 
                    procesos={cotizacion.procesos}
                    onAgregar={agregarProceso}
                    onEliminar={eliminarProceso}
                  />
                )}
                {pasoActual === 'costos' && (
                  <CostosStep 
                    costos={cotizacion.costosAdicionales}
                    margenUtilidad={cotizacion.margenUtilidad}
                    costoMateriales={cotizacion.materiales.reduce((sum, m) => sum + m.costoTotal, 0)}
                    costoProcesos={cotizacion.procesos.reduce((sum, p) => sum + p.costoTotal, 0)}
                    onChangeCostos={actualizarCostosAdicionales}
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

            {/* Navegación */}
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
