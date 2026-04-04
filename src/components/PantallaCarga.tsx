import { useState, useEffect } from 'react';
import { Loader2, WifiOff, RefreshCw, Database, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface PantallaCargaProps {
  onCargaCompleta: () => void;
  onUsarOffline: () => void;
}

interface EstadoCarga {
  clientes: 'pendiente' | 'cargando' | 'completado' | 'error';
  cotizaciones: 'pendiente' | 'cargando' | 'completado' | 'error';
  proyectos: 'pendiente' | 'cargando' | 'completado' | 'error';
}

export function PantallaCarga({ onCargaCompleta, onUsarOffline }: PantallaCargaProps) {
  const [estado, setEstado] = useState<EstadoCarga>({
    clientes: 'pendiente',
    cotizaciones: 'pendiente',
    proyectos: 'pendiente',
  });
  const [errorConexion, setErrorConexion] = useState(false);
  const [reintentando, setReintentando] = useState(false);

  const cargarDatos = async () => {
    setEstado({
      clientes: 'cargando',
      cotizaciones: 'pendiente',
      proyectos: 'pendiente',
    });
    setErrorConexion(false);

    try {
      // 1. Cargar Clientes
      console.log('[PantallaCarga] Cargando clientes...');
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientesError) throw clientesError;

      if (clientesData) {
        // Cargar contactos
        const { data: contactosData } = await supabase.from('contactos').select('*');
        
        const clientesFormateados = clientesData.map(c => {
          const contactosCliente = (contactosData || [])
            .filter(contacto => contacto.cliente_id === c.id)
            .map(contacto => ({
              id: contacto.id,
              nombre: contacto.nombre,
              departamento: contacto.departamento || '',
              email: contacto.email || '',
              telefono: contacto.telefono || '',
              celular: contacto.celular || '',
              esPrincipal: contacto.es_principal,
            }));

          return {
            id: c.id,
            nombreEmpresa: c.nombre_empresa,
            direccion: c.direccion || '',
            telefono: c.telefono || '',
            rfc: c.rfc || '',
            terminosPago: c.terminos_pago || '50% anticipo, 50% contra entrega',
            fechaRegistro: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            usuarios: contactosCliente,
          };
        });

        localStorage.setItem('velso_clientes', JSON.stringify(clientesFormateados));
        console.log('[PantallaCarga] Clientes cargados:', clientesFormateados.length);
      }

      setEstado(prev => ({ ...prev, clientes: 'completado', cotizaciones: 'cargando' }));

      // Delay mínimo para mostrar progreso (1 segundo)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Cargar Cotizaciones
      console.log('[PantallaCarga] Cargando cotizaciones...');
      const { data: cotizacionesData, error: cotizacionesError } = await supabase
        .from('cotizaciones')
        .select('id, numero, created_at, cliente_nombre, proyecto_nombre, total, estado, usuario_id')
        .order('created_at', { ascending: false });

      if (cotizacionesError) throw cotizacionesError;

      if (cotizacionesData) {
        const cotizacionesFormateadas = cotizacionesData.map(c => ({
          id: c.id,
          numero: c.numero,
          fecha: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          clienteNombre: c.cliente_nombre,
          proyectoNombre: c.proyecto_nombre,
          total: c.total,
          estado: c.estado,
          usuarioId: c.usuario_id,
        }));

        localStorage.setItem('cotizaciones_cnc', JSON.stringify(cotizacionesFormateadas));
        console.log('[PantallaCarga] Cotizaciones cargadas:', cotizacionesFormateadas.length);
      }

      setEstado(prev => ({ ...prev, cotizaciones: 'completado', proyectos: 'cargando' }));

      // Delay entre pasos para mostrar progreso
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Cargar Proyectos
      console.log('[PantallaCarga] Cargando proyectos...');
      const { data: proyectosData, error: proyectosError } = await supabase
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });

      if (proyectosError) throw proyectosError;

      if (proyectosData) {
        const proyectosFormateados = proyectosData.map(p => ({
          id: p.id,
          numeroCotizacion: p.numero_cotizacion,
          ordenCompra: p.orden_compra,
          usuarioId: p.usuario_id,
          clienteId: p.cliente_id || '',
          clienteNombre: p.cliente_nombre,
          proyectoNombre: p.proyecto_nombre,
          totalCotizado: p.total_cotizado,
          totalFacturado: p.total_facturado,
          margenUtilidad: p.margen_utilidad,
          ivaPorcentaje: p.iva_porcentaje,
          materiales: p.materiales || [],
          procesos: p.procesos || [],
          costosAdicionales: p.costos_adicionales || {},
          estado: p.estado,
          numeroFactura: p.numero_factura,
          fechaVenta: p.fecha_venta ? p.fecha_venta.split('T')[0] : new Date().toISOString().split('T')[0],
          fechaFabricado: p.fecha_fabricado ? p.fecha_fabricado.split('T')[0] : undefined,
          fechaEntregado: p.fecha_entregado ? p.fecha_entregado.split('T')[0] : undefined,
          fechaFacturado: p.fecha_facturado ? p.fecha_facturado.split('T')[0] : undefined,
          utilidadReal: p.utilidad_real,
        }));

        localStorage.setItem('velso_proyectos', JSON.stringify(proyectosFormateados));
        console.log('[PentallaCarga] Proyectos cargados:', proyectosFormateados.length);
      }

      setEstado(prev => ({ ...prev, proyectos: 'completado' }));
      
      // Pausa para mostrar el checkmark final (1.5 segundos)
      await new Promise(resolve => setTimeout(resolve, 1500));
      onCargaCompleta();

    } catch (error: any) {
      console.error('[PantallaCarga] Error cargando datos:', error);
      setErrorConexion(true);
      setEstado(prev => ({
        clientes: prev.clientes === 'cargando' ? 'error' : prev.clientes,
        cotizaciones: prev.cotizaciones === 'cargando' ? 'error' : prev.cotizaciones,
        proyectos: prev.proyectos === 'cargando' ? 'error' : prev.proyectos,
      }));
    } finally {
      setReintentando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleReintentar = () => {
    setReintentando(true);
    cargarDatos();
  };

  const todosCompletados = 
    estado.clientes === 'completado' && 
    estado.cotizaciones === 'completado' && 
    estado.proyectos === 'completado';

  const ItemCarga = ({ 
    icon: Icon, 
    label, 
    estadoItem 
  }: { 
    icon: any; 
    label: string; 
    estadoItem: string 
  }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        estadoItem === 'completado' ? 'bg-green-100' :
        estadoItem === 'error' ? 'bg-red-100' :
        estadoItem === 'cargando' ? 'bg-blue-100' :
        'bg-slate-100'
      }`}>
        {estadoItem === 'completado' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : estadoItem === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : estadoItem === 'cargando' ? (
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        ) : (
          <Icon className="w-5 h-5 text-slate-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-700">{label}</p>
        <p className={`text-sm ${
          estadoItem === 'completado' ? 'text-green-600' :
          estadoItem === 'error' ? 'text-red-600' :
          estadoItem === 'cargando' ? 'text-blue-600' :
          'text-slate-400'
        }`}>
          {estadoItem === 'completado' ? 'Completado' :
           estadoItem === 'error' ? 'Error de conexión' :
           estadoItem === 'cargando' ? 'Cargando...' :
           'Pendiente'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardContent className="p-8">
          {!errorConexion ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cloud className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {todosCompletados ? '¡Listo!' : 'Cargando datos'}
                </h1>
                <p className="text-slate-500 mt-2">
                  {todosCompletados 
                    ? 'Todos los datos se han cargado correctamente'
                    : 'Estamos sincronizando tu información con la nube'}
                </p>
              </div>

              <div className="space-y-3">
                <ItemCarga 
                  icon={Database} 
                  label="Catálogo de Clientes" 
                  estadoItem={estado.clientes} 
                />
                <ItemCarga 
                  icon={Database} 
                  label="Cotizaciones" 
                  estadoItem={estado.cotizaciones} 
                />
                <ItemCarga 
                  icon={Database} 
                  label="Proyectos y Ventas" 
                  estadoItem={estado.proyectos} 
                />
              </div>

              {!todosCompletados && (
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando con Supabase...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WifiOff className="w-8 h-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Sin conexión a internet
                </h1>
                <p className="text-slate-500 mt-2">
                  No pudimos conectar con el servidor. Puedes usar la aplicación con los datos guardados en tu dispositivo.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Database className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800">
                      Se usarán los datos almacenados localmente
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button 
                  onClick={handleReintentar}
                  disabled={reintentando}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {reintentando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reintentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reintentar conexión
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={onUsarOffline}
                  variant="outline"
                  className="w-full border-slate-300"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Usar datos del dispositivo
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
