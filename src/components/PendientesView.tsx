// src/components/PendientesView.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowLeft, 
  Plus,
  MessageSquare,
  Filter,
  User,
  Briefcase,
  Phone,
  Truck,
  FileText,
  DollarSign,
  AlertOctagon,
  Send,
  Factory,
  Search,
  X
} from 'lucide-react';
import type { Pendiente, TipoPendiente, PrioridadPendiente } from '@/types/pendientes';

const iconosPorTipo: Record<TipoPendiente, React.ElementType> = {
  levantamiento: Briefcase,
  pasar_a_diseño: FileText,
  cotizar: FileText,
  enviar_cotizacion: Send,
  seguimiento_cotizacion: Phone,
  autorizar_oc: FileText,
  seguimiento_oc: Truck,
  produccion: Factory,
  cotejar_utilidad: DollarSign,
  entrega: Truck,
  facturar: FileText,
  cobranza: DollarSign,
  cobranza_urgente: AlertOctagon,
};

const coloresPrioridad = {
  baja: 'bg-slate-100 text-slate-700 border-slate-200',
  media: 'bg-blue-100 text-blue-700 border-blue-200',
  alta: 'bg-orange-100 text-orange-700 border-orange-200',
  urgente: 'bg-red-100 text-red-700 border-red-300 animate-pulse',
};

const labelsTipo: Record<TipoPendiente, string> = {
  levantamiento: 'Levantamiento',
  pasar_a_diseño: 'Pasar a Diseño',
  cotizar: 'Cotizar',
  enviar_cotizacion: 'Enviar Cotización',
  seguimiento_cotizacion: 'Seguimiento Cotización',
  autorizar_oc: 'Autorizar OC',
  seguimiento_oc: 'Seguimiento OC',
  produccion: 'Producción',
  cotejar_utilidad: 'Cotejar Utilidad',
  entrega: 'Entrega',
  facturar: 'Facturar',
  cobranza: 'Cobranza',
  cobranza_urgente: 'Cobranza URGENTE',
};

const labelsResponsable: Record<string, string> = {
  yo: 'Yo (Dueño)',
  diseno: 'Diseño',
  pm: 'Project Manager',
  produccion: 'Producción',
};

interface PendientesViewProps {
  onVolver: () => void;
  pendientes: Pendiente[];
  onCompletar: (id: string) => void;
  onAgregar: (pendiente: Omit<Pendiente, 'id' | 'fechaCreacion' | 'diasEstancado'>) => void;
  onActualizarNotas: (id: string, notas: string) => void;
}

export function PendientesView({ 
  onVolver, 
  pendientes, 
  onCompletar, 
  onAgregar,
  onActualizarNotas 
}: PendientesViewProps) {
  const [filtroResponsable, setFiltroResponsable] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [notasEditando, setNotasEditando] = useState<string | null>(null);
  const [notasTemp, setNotasTemp] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Formulario nuevo pendiente
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoDescripcion, setNuevoDescripcion] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState('');
  const [nuevoProyecto, setNuevoProyecto] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<TipoPendiente>('levantamiento');
  const [nuevoPrioridad, setNuevoPrioridad] = useState<PrioridadPendiente>('media');
  const [nuevoResponsable, setNuevoResponsable] = useState('yo');

  const pendientesFiltrados = pendientes.filter(p => {
    const matchResponsable = filtroResponsable === 'todos' || p.responsable === filtroResponsable;
    const matchPrioridad = filtroPrioridad === 'todos' || p.prioridad === filtroPrioridad;
    const matchBusqueda = !filtroBusqueda || 
      p.titulo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      p.clienteNombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      p.proyectoNombre.toLowerCase().includes(filtroBusqueda.toLowerCase());
    const matchCompletado = mostrarCompletados ? true : !p.completado;
    return matchResponsable && matchPrioridad && matchBusqueda && matchCompletado;
  });

  const pendientesHoy = pendientes.filter(p => !p.completado && p.fechaVencimiento <= new Date().toISOString().split('T')[0]);
  const alertasRojas = pendientes.filter(p => !p.completado && (p.prioridad === 'urgente' || p.diasEstancado > 7));
  const misPendientes = pendientes.filter(p => p.responsable === 'yo' && !p.completado);
  const equipoPendientes = pendientes.filter(p => p.responsable !== 'yo' && !p.completado);

  const handleGuardarNotas = (id: string) => {
    onActualizarNotas(id, notasTemp);
    setNotasEditando(null);
    setNotasTemp('');
  };

  const handleAgregarPendiente = () => {
    if (!nuevoTitulo || !nuevoCliente) return;

    onAgregar({
      tipo: nuevoTipo,
      titulo: nuevoTitulo,
      descripcion: nuevoDescripcion,
      clienteNombre: nuevoCliente,
      proyectoNombre: nuevoProyecto,
      fechaVencimiento: new Date().toISOString().split('T')[0],
      prioridad: nuevoPrioridad,
      completado: false,
      responsable: nuevoResponsable,
      notas: '',
    });

    setNuevoTitulo('');
    setNuevoDescripcion('');
    setNuevoCliente('');
    setNuevoProyecto('');
    setMostrarFormulario(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onVolver} className="border-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis Pendientes</h1>
            <p className="text-sm text-slate-500">Control diario de tareas y seguimientos</p>
          </div>
        </div>
        <Button onClick={() => setMostrarFormulario(!mostrarFormulario)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pendiente
        </Button>
      </div>

      {/* Formulario nuevo pendiente */}
      {mostrarFormulario && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Agregar Pendiente Manual</h3>
              <Button variant="ghost" size="sm" onClick={() => setMostrarFormulario(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input 
                placeholder="Título del pendiente" 
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
              />
              <Input 
                placeholder="Cliente" 
                value={nuevoCliente}
                onChange={(e) => setNuevoCliente(e.target.value)}
              />
              <Input 
                placeholder="Proyecto (opcional)" 
                value={nuevoProyecto}
                onChange={(e) => setNuevoProyecto(e.target.value)}
              />
              <Input 
                placeholder="Descripción" 
                value={nuevoDescripcion}
                onChange={(e) => setNuevoDescripcion(e.target.value)}
              />
              <select 
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as TipoPendiente)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {Object.entries(labelsTipo).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select 
                value={nuevoPrioridad}
                onChange={(e) => setNuevoPrioridad(e.target.value as PrioridadPendiente)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
              <select 
                value={nuevoResponsable}
                onChange={(e) => setNuevoResponsable(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {Object.entries(labelsResponsable).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleAgregarPendiente} className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Pendiente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-500">Para Hoy</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{pendientesHoy.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-slate-500">Alertas Rojas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{alertasRojas.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-500">Míos</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{misPendientes.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              <span className="text-sm text-slate-500">Del Equipo</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{equipoPendientes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Buscar pendiente..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            <select 
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="todos">Todos los responsables</option>
              <option value="yo">Yo (Dueño/Vendedor)</option>
              <option value="diseño">Diseño</option>
              <option value="pm">Project Manager</option>
              <option value="produccion">Producción</option>
            </select>

            <select 
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="todos">Todas las prioridades</option>
              <option value="urgente">🔴 Urgente</option>
              <option value="alta">🟠 Alta</option>
              <option value="media">🔵 Media</option>
              <option value="baja">⚪ Baja</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={mostrarCompletados}
                onChange={(e) => setMostrarCompletados(e.target.checked)}
                className="rounded border-slate-300"
              />
              Completados
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pendientes */}
      <div className="space-y-3">
        {pendientesFiltrados.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">¡Todo al día!</p>
              <p className="text-sm text-slate-500">No hay pendientes que coincidan con los filtros</p>
            </CardContent>
          </Card>
        ) : (
          pendientesFiltrados.map(pendiente => {
            const Icono = iconosPorTipo[pendiente.tipo];
            return (
              <Card 
                key={pendiente.id} 
                className={`border-slate-200 transition-all hover:shadow-md ${pendiente.completado ? 'opacity-50' : ''} ${
                  pendiente.prioridad === 'urgente' ? 'border-red-300 shadow-red-100' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => onCompletar(pendiente.id)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        pendiente.completado 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      {pendiente.completado && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Icono className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-900">{pendiente.titulo}</span>
                        <Badge className={coloresPrioridad[pendiente.prioridad]}>
                          {pendiente.prioridad.toUpperCase()}
                        </Badge>
                        {pendiente.diasEstancado > 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            {pendiente.diasEstancado} días
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-slate-500">
                          {labelsResponsable[pendiente.responsable] || pendiente.responsable}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{pendiente.descripcion}</p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {pendiente.clienteNombre}
                        </span>
                        {pendiente.proyectoNombre && (
                          <>
                            <span>•</span>
                            <span>{pendiente.proyectoNombre}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Vence: {pendiente.fechaVencimiento}</span>
                      </div>

                      {/* Notas */}
                      {notasEditando === pendiente.id ? (
                        <div className="mt-3 flex gap-2">
                          <Input
                            value={notasTemp}
                            onChange={(e) => setNotasTemp(e.target.value)}
                            placeholder="Agregar nota..."
                            className="flex-1 text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleGuardarNotas(pendiente.id)}>
                            Guardar
                          </Button>
                        </div>
                      ) : pendiente.notas ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          {pendiente.notas}
                        </div>
                      ) : null}

                      {!pendiente.completado && notasEditando !== pendiente.id && (
                        <button
                          onClick={() => {
                            setNotasEditando(pendiente.id);
                            setNotasTemp(pendiente.notas);
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Agregar nota
                        </button>
                      )}
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
