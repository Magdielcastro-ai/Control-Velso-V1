import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building2, MapPin, Phone, Mail, Briefcase, Plus, Check, Users, ExternalLink, Save } from 'lucide-react';
import type { DatosCliente } from '@/types/cotizacion';
import type { Cliente, UsuarioCliente } from '@/types/ventas';

interface ClienteStepProps {
  datos: DatosCliente;
  onChange: (datos: Partial<DatosCliente>) => void;
  clientesGuardados: Cliente[];
  onGuardarCliente?: (datos: DatosCliente) => Promise<Cliente | null>;
  onIrAClientes?: () => void;
}

export function ClienteStep({ datos, onChange, clientesGuardados, onGuardarCliente, onIrAClientes }: ClienteStepProps) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | undefined>(undefined);
  const [contactoSeleccionado, setContactoSeleccionado] = useState<string | undefined>(undefined);
  const [contactosDisponibles, setContactosDisponibles] = useState<UsuarioCliente[]>([]);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Sincronizar estado cuando cambian los datos externos
  useEffect(() => {
    if (datos.clienteId) {
      const cliente = clientesGuardados.find(c => c.id === datos.clienteId);
      if (cliente) {
        // Cliente encontrado en la lista
        setClienteSeleccionado(datos.clienteId);
        setModoNuevo(false);
        setContactosDisponibles(cliente.usuarios || []);
        
        // Si hay un contacto seleccionado en los datos, sincronizar
        if (datos.nombre && cliente.usuarios) {
          const contacto = cliente.usuarios.find(u => u.nombre === datos.nombre);
          if (contacto) {
            setContactoSeleccionado(contacto.id);
          }
        }
      } else {
        // Cliente no encontrado (puede haber sido eliminado o renombrado)
        console.warn('[ClienteStep] Cliente no encontrado:', datos.clienteId);
        // NO limpiar el clienteSeleccionado para evitar el crash del Select
        // En su lugar, mantener el ID pero mostrar que no está disponible
        setContactosDisponibles([]);
        setContactoSeleccionado(undefined);
        setModoNuevo(false);
      }
    } else if (!datos.nombre && !datos.empresa) {
      // No hay cliente seleccionado
      setClienteSeleccionado(undefined);
      setContactoSeleccionado(undefined);
      setModoNuevo(false);
    }
  }, [datos.clienteId, datos.nombre, datos.empresa, clientesGuardados]);

  const handleSeleccionarCliente = (clienteId: string) => {
    setClienteSeleccionado(clienteId);
    setContactoSeleccionado(undefined);
    
    if (clienteId === 'nuevo') {
      // Modo nuevo cliente
      setModoNuevo(true);
      setContactosDisponibles([]);
      onChange({
        nombre: '',
        empresa: '',
        direccion: '',
        telefono: '',
        email: '',
        rfc: '',
        clienteId: undefined,
      });
    } else if (clienteId === '') {
      // Sin selección
      setModoNuevo(false);
      setContactosDisponibles([]);
      onChange({
        nombre: '',
        empresa: '',
        direccion: '',
        telefono: '',
        email: '',
        rfc: '',
        clienteId: undefined,
      });
    } else {
      // Cliente existente seleccionado
      setModoNuevo(false);
      const cliente = clientesGuardados.find(c => c.id === clienteId);
      if (cliente) {
        const contactos = cliente.usuarios || [];
        setContactosDisponibles(contactos);
        
        // Buscar contacto principal o usar el primero
        const contactoPrincipal = contactos.find(c => c.esPrincipal) || contactos[0];
        
        if (contactoPrincipal) {
          setContactoSeleccionado(contactoPrincipal.id);
          onChange({
            nombre: contactoPrincipal.nombre,
            empresa: cliente.nombreEmpresa,
            direccion: cliente.direccion,
            telefono: contactoPrincipal.telefono || contactoPrincipal.celular || cliente.telefono,
            email: contactoPrincipal.email,
            rfc: cliente.rfc || '',
            clienteId: cliente.id,
          });
        } else {
          // Si no hay contactos, usar datos del cliente
          onChange({
            nombre: '',
            empresa: cliente.nombreEmpresa,
            direccion: cliente.direccion,
            telefono: cliente.telefono,
            email: '',
            rfc: cliente.rfc || '',
            clienteId: cliente.id,
          });
        }
      }
    }
  };

  const handleSeleccionarContacto = (contactoId: string) => {
    setContactoSeleccionado(contactoId);
    
    if (contactoId === 'ninguno') {
      const cliente = clientesGuardados.find(c => c.id === clienteSeleccionado);
      if (cliente) {
        onChange({
          nombre: '',
          telefono: cliente.telefono,
          email: '',
        });
      }
    } else {
      const contacto = contactosDisponibles.find(c => c.id === contactoId);
      const cliente = clientesGuardados.find(c => c.id === clienteSeleccionado);
      
      if (contacto && cliente) {
        onChange({
          nombre: contacto.nombre,
          telefono: contacto.telefono || contacto.celular || cliente.telefono,
          email: contacto.email,
        });
      }
    }
  };

  const handleGuardarNuevoCliente = async () => {
    if (!onGuardarCliente) return;
    
    // Validar campos mínimos
    if (!datos.nombre && !datos.empresa) {
      alert('Debes ingresar al menos el nombre o la empresa del cliente');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await onGuardarCliente(datos);
      if (resultado) {
        // El cliente se guardó exitosamente
        setModoNuevo(false);
        setClienteSeleccionado(resultado.id);
        onChange({
          ...datos,
          clienteId: resultado.id,
        });
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
    } finally {
      setGuardando(false);
    }
  };

  const hayClienteSeleccionado = clienteSeleccionado && clienteSeleccionado !== 'nuevo' && clienteSeleccionado !== '';

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Datos del Cliente</h2>
        <p className="text-slate-600">Selecciona un cliente existente o agrega uno nuevo</p>
      </div>

      {/* Selector de clientes */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Seleccionar Cliente
            </span>
            {onIrAClientes && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onIrAClientes}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Administrar Clientes
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={clienteSeleccionado || undefined} onValueChange={handleSeleccionarCliente}>
            <SelectTrigger className="border-slate-300">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nuevo">
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar nuevo cliente</span>
                </div>
              </SelectItem>
              {clientesGuardados
                .filter((cliente) => cliente.id && cliente.id.trim() !== '')
                .map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombreEmpresa} {cliente.rfc && `(${cliente.rfc})`}
                    {cliente.usuarios.length > 0 && (
                      <span className="ml-2 text-xs text-slate-500">
                        ({cliente.usuarios.length} contacto{cliente.usuarios.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Mensaje si no hay clientes */}
          {clientesGuardados.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <span className="text-amber-500">⚠</span>
                No hay clientes registrados. 
                {onIrAClientes && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={onIrAClientes}
                    className="text-amber-700 underline p-0 h-auto"
                  >
                    Ir a Clientes para agregar uno
                  </Button>
                )}
              </p>
            </div>
          )}

          {/* Selector de contactos - solo para clientes existentes */}
          {hayClienteSeleccionado && contactosDisponibles.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <Label className="flex items-center gap-2 mb-2 text-slate-700">
                <Users className="w-4 h-4 text-blue-600" />
                Seleccionar Contacto
              </Label>
              <Select value={contactoSeleccionado || undefined} onValueChange={handleSeleccionarContacto}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecciona un contacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">
                    <span className="text-slate-500">-- Sin contacto específico --</span>
                  </SelectItem>
                  {contactosDisponibles
                    .filter((contacto) => contacto.id && contacto.id.trim() !== '')
                    .map((contacto) => (
                      <SelectItem key={contacto.id} value={contacto.id}>
                        <div className="flex items-center gap-2">
                          <span>{contacto.nombre}</span>
                          {contacto.esPrincipal && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                          {contacto.departamento && (
                            <span className="text-xs text-slate-500">
                              ({contacto.departamento})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mensaje si el cliente no tiene contactos */}
          {hayClienteSeleccionado && contactosDisponibles.length === 0 && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <span className="text-amber-500">⚠</span>
                Este cliente no tiene contactos guardados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulario para NUEVO cliente */}
      {modoNuevo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-blue-600" />
              Nuevo Cliente
              <span className="text-xs font-normal text-blue-600 flex items-center gap-1 ml-auto">
                <span className="bg-blue-100 px-2 py-0.5 rounded-full">Modo edición</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreNuevo">
                  Nombre de Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombreNuevo"
                  value={datos.nombre}
                  onChange={(e) => onChange({ nombre: e.target.value })}
                  placeholder="Nombre completo"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresaNueva">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="empresaNueva"
                  value={datos.empresa}
                  onChange={(e) => onChange({ empresa: e.target.value })}
                  placeholder="Nombre de la empresa"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccionNueva">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Dirección
                </Label>
                <Input
                  id="direccionNueva"
                  value={datos.direccion}
                  onChange={(e) => onChange({ direccion: e.target.value })}
                  placeholder="Calle, número, colonia, ciudad, CP"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefonoNuevo">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </Label>
                <Input
                  id="telefonoNuevo"
                  value={datos.telefono}
                  onChange={(e) => onChange({ telefono: e.target.value })}
                  placeholder="(55) 1234-5678"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailNuevo">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Correo Electrónico
                </Label>
                <Input
                  id="emailNuevo"
                  type="email"
                  value={datos.email}
                  onChange={(e) => onChange({ email: e.target.value })}
                  placeholder="cliente@empresa.com"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfcNuevo">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  RFC
                </Label>
                <Input
                  id="rfcNuevo"
                  value={datos.rfc || ''}
                  onChange={(e) => onChange({ rfc: e.target.value.toUpperCase() })}
                  placeholder="ABCD010203XXX"
                  className="bg-white border-slate-300"
                  maxLength={13}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-blue-200 flex items-center justify-between">
              <p className="text-xs text-blue-600">
                * Debes ingresar al menos el nombre o la empresa
              </p>
              {onGuardarCliente && (
                <Button
                  type="button"
                  onClick={handleGuardarNuevoCliente}
                  disabled={guardando || (!datos.nombre && !datos.empresa)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {guardando ? 'Guardando...' : 'Guardar Cliente'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datos del cliente seleccionado - SOLO LECTURA */}
      {hayClienteSeleccionado && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
              Información del Cliente
              <span className="text-xs font-normal text-green-600 flex items-center gap-1 ml-auto">
                <Check className="w-3 h-3" />
                Solo lectura
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">Nombre de Contacto</Label>
                <Input
                  value={datos.nombre}
                  readOnly
                  className="bg-white border-slate-200 text-slate-700 cursor-default"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">Empresa</Label>
                <Input
                  value={datos.empresa}
                  readOnly
                  className="bg-white border-slate-200 text-slate-700 cursor-default"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-500 text-xs">Dirección</Label>
                <Input
                  value={datos.direccion}
                  readOnly
                  className="bg-white border-slate-200 text-slate-700 cursor-default"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">Teléfono</Label>
                <Input
                  value={datos.telefono}
                  readOnly
                  className="bg-white border-slate-200 text-slate-700 cursor-default"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">Correo Electrónico</Label>
                <Input
                  value={datos.email}
                  readOnly
                  className="bg-white border-slate-200 text-slate-700 cursor-default"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">RFC</Label>
                <Input
                  value={datos.rfc || ''}
                  readOnly
                  className="bg-white border-slate-200 text-slate-700 cursor-default"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Para modificar estos datos, ve a la sección de <Button variant="link" size="sm" onClick={onIrAClientes} className="p-0 h-auto text-xs">Clientes</Button>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
