import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Package,
  Settings,
  FileText,
  ClipboardList,
  TrendingUp,
  Factory,
  Activity
} from 'lucide-react';

interface HomeVelsoProps {
  onDashboard: () => void;
  onClientes: () => void;
  onProyectos: () => void;
  onMateriales: () => void;
  onProcesos: () => void;
  onCotizaciones: () => void;
  onNuevaCotizacion: () => void;
  onDiagnostico?: () => void;
}

export function HomeVelso({ 
  onDashboard, 
  onClientes, 
  onProyectos, 
  onMateriales,
  onProcesos,
  onCotizaciones,
  onNuevaCotizacion,
  onDiagnostico
}: HomeVelsoProps) {
  const funcionalidades = [
    { 
      id: 'dashboard',
      titulo: 'Dashboard', 
      desc: 'Métricas de ventas, horas cotizadas y cumplimiento de objetivos',
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      onClick: onDashboard
    },
    { 
      id: 'clientes',
      titulo: 'Clientes', 
      desc: 'Catálogo de clientes y usuarios de contacto',
      icon: Users,
      color: 'bg-green-600',
      onClick: onClientes
    },
    { 
      id: 'proyectos',
      titulo: 'Proyectos', 
      desc: 'Cotizaciones convertidas en ventas con órdenes de compra',
      icon: FolderKanban,
      color: 'bg-purple-600',
      onClick: onProyectos
    },
    { 
      id: 'materiales',
      titulo: 'Materiales', 
      desc: 'Catálogo de materiales con precios y dimensiones',
      icon: Package,
      color: 'bg-orange-600',
      onClick: onMateriales
    },
    { 
      id: 'procesos',
      titulo: 'Catálogo de Procesos', 
      desc: 'Procesos CNC con precios y horas disponibles por mes',
      icon: Settings,
      color: 'bg-cyan-600',
      onClick: onProcesos
    },
    { 
      id: 'cotizaciones',
      titulo: 'Cotizaciones', 
      desc: 'Ver, editar y convertir cotizaciones en ventas',
      icon: ClipboardList,
      color: 'bg-rose-600',
      onClick: onCotizaciones
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
          <Factory className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">
          Sistema de Control de Ventas <span className="text-blue-600">Velso</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Gestión integral de cotizaciones, clientes, proyectos y materiales para tu taller CNC
        </p>
        <Button 
          size="lg" 
          onClick={onNuevaCotizacion}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 mt-4"
        >
          <FileText className="w-5 h-5 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Botones de funcionalidades */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
          ¿Qué quieres hacer?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionalidades.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="group text-left"
            >
              <Card className="border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`${item.color} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.titulo}
                      </h3>
                      <p className="text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {/* Botón de diagnóstico (solo para debug) */}
        {onDiagnostico && (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <button
              onClick={onDiagnostico}
              className="w-full text-left"
            >
              <Card className="border-slate-300 hover:border-amber-400 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-600 p-2 rounded-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        Diagnóstico de Conexión
                      </h3>
                      <p className="text-sm text-slate-500">
                        Verificar estado de conexión con Supabase
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
