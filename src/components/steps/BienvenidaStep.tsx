import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Factory, 
  FileText, 
  Calculator, 
  Clock, 
  TrendingUp, 
  Shield,
  ChevronRight,
  Settings,
  Users,
  Package
} from 'lucide-react';

interface BienvenidaStepProps {
  onIniciar: () => void;
  onVerGuardadas: () => void;
}

export function BienvenidaStep({ onIniciar, onVerGuardadas }: BienvenidaStepProps) {
  const beneficios = [
    { icon: Clock, texto: 'Ahorra tiempo en cotizaciones' },
    { icon: TrendingUp, texto: 'Mejora tu imagen profesional' },
    { icon: Shield, texto: 'Información centralizada y segura' },
    { icon: Calculator, texto: 'Cálculos automáticos precisos' },
  ];

  const funcionalidades = [
    { icon: Factory, titulo: 'Datos del Taller', desc: 'Información de tu empresa' },
    { icon: Users, titulo: 'Clientes', desc: 'Gestión de clientes' },
    { icon: Settings, titulo: 'Proyectos', desc: 'Especificaciones técnicas' },
    { icon: Package, titulo: 'Materiales', desc: 'Control de materiales' },
    { icon: Settings, titulo: 'Procesos CNC', desc: 'Fresado, torneado y más' },
    { icon: FileText, titulo: 'Cotizaciones', desc: 'Documentos profesionales' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
          <Factory className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">
          Presupuesto <span className="text-blue-600">Pro CNC</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          El sistema digital diseñado para centralizar toda tu información y convertirla 
          en cotizaciones claras, bien presentadas y fáciles de generar.
        </p>
      </div>

      {/* Beneficios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {beneficios.map((item, index) => (
          <Card key={index} className="border-slate-200">
            <CardContent className="p-4 text-center">
              <item.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">{item.texto}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funcionalidades */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
          ¿Qué puedes hacer?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {funcionalidades.map((item, index) => (
            <Card key={index} className="border-slate-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <item.icon className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-slate-900">{item.titulo}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg" 
          onClick={onIniciar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          Nueva Cotización
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          onClick={onVerGuardadas}
          className="border-slate-300"
        >
          Ver Cotizaciones Guardadas
        </Button>
      </div>
    </div>
  );
}
