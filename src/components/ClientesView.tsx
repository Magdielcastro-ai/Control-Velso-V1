import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Building2, 
  Phone, 
  MapPin, 
  Briefcase,
  User,
  Trash2,
  Search,
  UserPlus,
  Pencil
} from 'lucide-react';
import type { Cliente, UsuarioCliente } from '@/types/ventas';

interface ClientesViewProps {
  onVolver: () => void;
  clientes: Cliente[];
  onAgregarCliente?: (cliente: Omit<Cliente, 'id' | 'fechaRegistro' | 'usuarios'>) => void;
  onActualizarCliente?: (id: string, datos: Partial<Cliente>) => void;
  onEliminarCliente?: (id: string) => void;
  onAgregarUsuario?: (clienteId: string, usuario: Omit<UsuarioCliente, 'id'>) => void;
  onActualizarUsuario?: (clienteId: string, usuarioId: string, datos: Partial<UsuarioCliente>) => void;
  onEliminarUsuario?: (clienteId: string, usuarioId: string) => void;
}

export function ClientesView({
  onVolver,
  clientes,
  onAgregarCliente,
  onActualizarCliente,
  onEliminarCliente,
  onAgregarUsuario,
  onActualizarUsuario,
  onEliminarUsuario
}: ClientesViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);
  const [dialogoNuevoCliente, setDialogoNuevoCliente] = useState(false);
  const [dialogoEditarCliente, setDialogoEditarCliente] = useState<string | null>(null);
  const [dialogoEditarUsuario, setDialogoEditarUsuario] = useState<{clienteId: string, usuarioId: string} | null>(null);
  const [dialogoNuevoUsuario, setDialogoNuevoUsuario] = useState<string | null>(null);

  // Formulario nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombreEmpresa: '',
    direccion: '',
    telefono: '',
    rfc: '',
    terminosPago: '50% anticipo, 50% contra entrega',
  });

  // Formulario nuevo contacto
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    departamento: '',
    email: '',
    telefono: '',
    celular: '',
    esPrincipal: false,
  });

  // Formulario editar cliente
  const [clienteEditando, setClienteEditando] = useState({
    nombreEmpresa: '',
    direccion: '',
    telefono: '',
    rfc: '',
    terminosPago: '',
  });

  // Formulario editar contacto
  const [usuarioEditando, setUsuarioEditando] = useState({
    nombre: '',
    departamento: '',
    email: '',
    telefono: '',
    celular: '',
    esPrincipal: false,
  });

  const clientesFiltrados = clientes.filter(c => 
    c.nombreEmpresa.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.rfc.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAgregarCliente = () => {
    if (!nuevoCliente.nombreEmpresa || !nuevoCliente.rfc || !onAgregarCliente) return;
    onAgregarCliente(nuevoCliente);
    setNuevoCliente({
      nombreEmpresa: '',
      direccion: '',
      telefono: '',
      rfc: '',
      terminosPago: '50% anticipo, 50% contra entrega',
    });
    setDialogoNuevoCliente(false);
  };

  const handleAgregarUsuario = () => {
    if (!dialogoNuevoUsuario || !nuevoUsuario.nombre || !onAgregarUsuario) return;
    onAgregarUsuario(dialogoNuevoUsuario, nuevoUsuario);
    setNuevoUsuario({
      nombre: '',
      departamento: '',
      email: '',
      telefono: '',
      celular: '',
      esPrincipal: false,
    });
    setDialogoNuevoUsuario(null);
  };

  const abrirEditarCliente = (cliente: Cliente) => {
    setClienteEditando({
      nombreEmpresa: cliente.nombreEmpresa,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      rfc: cliente.rfc,
      terminosPago: cliente.terminosPago,
    });
    setDialogoEditarCliente(cliente.id);
  };

  const handleActualizarCliente = () => {
    if (!dialogoEditarCliente || !clienteEditando.nombreEmpresa || !clienteEditando.rfc || !onActualizarCliente) return;
    onActualizarCliente(dialogoEditarCliente, clienteEditando);
    setDialogoEditarCliente(null);
  };

  const abrirEditarUsuario = (clienteId: string, usuario: UsuarioCliente) => {
    setUsuarioEditando({
      nombre: usuario.nombre,
      departamento: usuario.departamento,
      email: usuario.email,
      telefono: usuario.telefono,
      celular: usuario.celular,
      esPrincipal: usuario.esPrincipal,
    });
    setDialogoEditarUsuario({ clienteId, usuarioId: usuario.id });
  };

  const handleActualizarUsuario = () => {
    if (!dialogoEditarUsuario || !usuarioEditando.nombre || !onActualizarUsuario) return;
    onActualizarUsuario(dialogoEditarUsuario.clienteId, dialogoEditarUsuario.usuarioId, usuarioEditando);
    setDialogoEditarUsuario(null);
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
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Clientes</h2>
          <p className="text-slate-500">{clientes.length} clientes registrados</p>
        </div>
        {onAgregarCliente && (
          <Dialog open={dialogoNuevoCliente} onOpenChange={setDialogoNuevoCliente}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre de la Empresa *</Label>
                  <Input
                    value={nuevoCliente.nombreEmpresa}
                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombreEmpresa: e.target.value }))}
                    placeholder="Ej: Industrias del Norte SA de CV"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RFC *</Label>
                  <Input
                    value={nuevoCliente.rfc}
                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                    placeholder="ABC010203XXX"
                    maxLength={13}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="(55) 1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Términos de Pago</Label>
                  <Input
                    value={nuevoCliente.terminosPago}
                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, terminosPago: e.target.value }))}
                    placeholder="Ej: 50% anticipo, 50% contra entrega"
                  />
                </div>
                <Button 
                  onClick={handleAgregarCliente}
                  disabled={!nuevoCliente.nombreEmpresa || !nuevoCliente.rfc}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Guardar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente por nombre o RFC..."
          className="pl-10"
        />
      </div>

      {/* Lista de clientes */}
      <div className="space-y-4">
        {clientes.length === 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-amber-400" />
              <p className="text-amber-700 font-medium">No hay clientes registrados</p>
              <p className="text-amber-600 text-sm mt-1">
                Agrega tu primer cliente para comenzar a crear cotizaciones
              </p>
            </CardContent>
          </Card>
        ) : clientesFiltrados.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron clientes</p>
            </CardContent>
          </Card>
        ) : (
          clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cliente.nombreEmpresa}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          RFC: {cliente.rfc}
                        </span>
                        {cliente.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cliente.telefono}
                          </span>
                        )}
                      </div>
                      {cliente.direccion && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {cliente.direccion}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setClienteExpandido(clienteExpandido === cliente.id ? null : cliente.id)}
                    >
                      {clienteExpandido === cliente.id ? 'Ocultar' : 'Ver Contactos'}
                      <Badge variant="secondary" className="ml-2">{cliente.usuarios.length}</Badge>
                    </Button>
                    {onActualizarCliente && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEditarCliente(cliente)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {onEliminarCliente && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEliminarCliente(cliente.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {clienteExpandido === cliente.id && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Contactos
                      </h4>
                      {onAgregarUsuario && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialogoNuevoUsuario(cliente.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Agregar Contacto
                        </Button>
                      )}
                    </div>

                    {cliente.usuarios.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay contactos registrados</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cliente.usuarios.map((usuario) => (
                            <TableRow key={usuario.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-400" />
                                  {usuario.nombre}
                                </div>
                              </TableCell>
                              <TableCell>{usuario.departamento || '-'}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {usuario.email && <div>{usuario.email}</div>}
                                  {usuario.celular && <div className="text-slate-500">{usuario.celular}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {onActualizarUsuario && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => abrirEditarUsuario(cliente.id, usuario)}
                                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {onEliminarUsuario && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEliminarUsuario(cliente.id, usuario.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Diálogo para editar cliente */}
      <Dialog open={!!dialogoEditarCliente} onOpenChange={() => setDialogoEditarCliente(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nombre de la Empresa *</Label>
              <Input
                value={clienteEditando.nombreEmpresa}
                onChange={(e) => setClienteEditando(prev => ({ ...prev, nombreEmpresa: e.target.value }))}
                placeholder="Ej: Industrias del Norte SA de CV"
              />
            </div>
            <div className="space-y-2">
              <Label>RFC *</Label>
              <Input
                value={clienteEditando.rfc}
                onChange={(e) => setClienteEditando(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                placeholder="ABC010203XXX"
                maxLength={13}
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={clienteEditando.direccion}
                onChange={(e) => setClienteEditando(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Calle, número, colonia, ciudad"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={clienteEditando.telefono}
                onChange={(e) => setClienteEditando(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="(55) 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Términos de Pago</Label>
              <Input
                value={clienteEditando.terminosPago}
                onChange={(e) => setClienteEditando(prev => ({ ...prev, terminosPago: e.target.value }))}
                placeholder="Ej: 50% anticipo, 50% contra entrega"
              />
            </div>
            <Button
              onClick={handleActualizarCliente}
              disabled={!clienteEditando.nombreEmpresa || !clienteEditando.rfc}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar contacto */}
      <Dialog open={!!dialogoEditarUsuario} onOpenChange={() => setDialogoEditarUsuario(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={usuarioEditando.nombre}
                onChange={(e) => setUsuarioEditando(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={usuarioEditando.departamento}
                onChange={(e) => setUsuarioEditando(prev => ({ ...prev, departamento: e.target.value }))}
                placeholder="Ej: Compras, Ingeniería"
              />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                value={usuarioEditando.email}
                onChange={(e) => setUsuarioEditando(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={usuarioEditando.telefono}
                onChange={(e) => setUsuarioEditando(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="(55) 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Celular</Label>
              <Input
                value={usuarioEditando.celular}
                onChange={(e) => setUsuarioEditando(prev => ({ ...prev, celular: e.target.value }))}
                placeholder="(55) 8765-4321"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPrincipalEdit"
                checked={usuarioEditando.esPrincipal}
                onChange={(e) => setUsuarioEditando(prev => ({ ...prev, esPrincipal: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="esPrincipalEdit" className="cursor-pointer">Contacto principal</Label>
            </div>
            <Button
              onClick={handleActualizarUsuario}
              disabled={!usuarioEditando.nombre}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para agregar contacto */}
      <Dialog open={!!dialogoNuevoUsuario} onOpenChange={() => setDialogoNuevoUsuario(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={nuevoUsuario.departamento}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, departamento: e.target.value }))}
                placeholder="Ej: Compras, Ingeniería"
              />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={nuevoUsuario.telefono}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="(55) 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Celular</Label>
              <Input
                value={nuevoUsuario.celular}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, celular: e.target.value }))}
                placeholder="(55) 8765-4321"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPrincipal"
                checked={nuevoUsuario.esPrincipal}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, esPrincipal: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="esPrincipal" className="cursor-pointer">Contacto principal</Label>
            </div>
            <Button 
              onClick={handleAgregarUsuario}
              disabled={!nuevoUsuario.nombre}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Guardar Contacto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
