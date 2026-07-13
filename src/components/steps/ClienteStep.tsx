import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building2, MapPin, Phone, Mail, Briefcase, Plus, Check, Users, ExternalLink } from 'lucide-react';
import type { DatosCliente } from '@/types/cotizacion';
import type { Cliente, UsuarioCliente } from '@/types/ventas';

interface ClienteStepProps {
  datos: DatosCliente;
  onChange: (datos: Partial<DatosCliente>) => void;
  clientesGuardados: Cliente[];
  onIrAClientes?: () => void;
  userRol?: string;
}

export function ClienteStep({ datos, onChange, clientesGuardados, onIrAClientes, userRol = 'vendedor' }: ClienteStepProps) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [contactoSeleccionado, setContactoSeleccionado] = useState<string>('');
  const [contactosDisponibles, setContactosDisponibles] = useState<UsuarioCliente[]>([]);

  // Sincronizar estado cuando cambian los datos externos
  useEffect(() => {
    if (datos.clienteId) {
      setClienteSeleccionado(datos.clienteId);
      const cliente = clientesGuardados.find(c => c.id === datos.clienteId);
      if (cliente) {
        setContactosDisponibles(cliente.usuarios || []);
        
        // Si hay un contacto seleccionado en los datos, sincronizar
        if (datos.nombre && cliente.usuarios) {
          const contacto = cliente.usuarios.find(u => u.nombre === datos.nombre);
          if (contacto) {
            setContactoSeleccionado(contacto.id);
          }
        }
      }
    }
  }, [datos.clienteId, datos.nombre, clientesGuardados]);

  const handleSeleccionarCliente = (clienteId: string) => {
    setClienteSeleccionado(clienteId);
    setContactoSeleccionado('');
    
    if (clienteId === 'nuevo') {
      // Limpiar todos los campos
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

  const hayClienteSeleccionado = clienteSeleccionado && clienteSeleccionado !== 'nuevo';

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Datos del Cliente</h2>
        <p className="text-slate-600">Selecciona un cliente de tu base de datos</p>
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
          <Select value={clienteSeleccionado} onValueChange={handleSeleccionarCliente}>
            <SelectTrigger className="border-slate-300">
              <SelectValue placeholder="Selecciona un cliente guardado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nuevo">
                <div className="flex items-center gap-2 text-slate-500">
                  <Plus className="w-4 h-4" />
                  <span>-- Sin cliente seleccionado --</span>
                </div>
              </SelectItem>
              {clientesGuardados.map((cliente) => (
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

          {/* Selector de contactos */}
          {hayClienteSeleccionado && contactosDisponibles.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <Label className="flex items-center gap-2 mb-2 text-slate-700">
                <Users className="w-4 h-4 text-blue-600" />
                Seleccionar Contacto
              </Label>
              <Select value={contactoSeleccionado} onValueChange={handleSeleccionarContacto}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecciona un contacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">
                    <span className="text-slate-500">-- Sin contacto específico --</span>
                  </SelectItem>
                  {contactosDisponibles.map((contacto) => (
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
