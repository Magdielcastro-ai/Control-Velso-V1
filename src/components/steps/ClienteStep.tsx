import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building2, MapPin, Phone, Mail, Briefcase, Save, Plus, Check } from 'lucide-react';
import type { DatosCliente } from '@/types/cotizacion';
import type { Cliente } from '@/types/ventas';

interface ClienteStepProps {
  datos: DatosCliente;
  onChange: (datos: Partial<DatosCliente>) => void;
  clientesGuardados: Cliente[];
  onGuardarCliente?: (datos: DatosCliente) => Cliente | null | Promise<Cliente | null>;
  userRol?: string;
}

export function ClienteStep({ datos, onChange, clientesGuardados, onGuardarCliente, userRol = 'vendedor' }: ClienteStepProps) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [mostrarGuardar, setMostrarGuardar] = useState(false);
  const [clienteGuardado, setClienteGuardado] = useState(false);

  const isAdmin = userRol === 'admin' || userRol === 'superadmin';
  const isVendedor = userRol === 'vendedor';
  const canSaveClientes = isAdmin || isVendedor;

  // Detectar si los datos actuales coinciden con un cliente guardado
  useEffect(() => {
    if (datos.nombre || datos.empresa) {
      const existe = clientesGuardados.some(c => 
        (datos.nombre && c.nombreEmpresa.toLowerCase() === datos.nombre.toLowerCase()) ||
        (datos.empresa && c.nombreEmpresa.toLowerCase() === datos.empresa.toLowerCase())
      );
      setClienteGuardado(existe);
      // Mostrar botón de guardar si puede guardar clientes y no existe
      setMostrarGuardar(canSaveClientes && !existe && (datos.nombre.length > 0 || datos.empresa.length > 0));
    } else {
      setMostrarGuardar(false);
      setClienteGuardado(false);
    }
  }, [datos, clientesGuardados, canSaveClientes]);

  const handleSeleccionarCliente = (clienteId: string) => {
    setClienteSeleccionado(clienteId);
    if (clienteId === 'nuevo') {
      // Limpiar todos los campos para nuevo cliente
      onChange({
        nombre: '',
        empresa: '',
        direccion: '',
        telefono: '',
        email: '',
        rfc: '',
      });
    } else {
      const cliente = clientesGuardados.find(c => c.id === clienteId);
      if (cliente) {
        onChange({
          nombre: cliente.nombreEmpresa,
          empresa: cliente.nombreEmpresa,
          direccion: cliente.direccion,
          telefono: cliente.telefono,
          email: cliente.usuarios[0]?.email || '',
          rfc: cliente.rfc || '',
        });
      }
    }
  };

  const handleGuardarCliente = async () => {
    if (!onGuardarCliente) return;
    const resultado = await onGuardarCliente(datos);
    if (resultado) {
      setClienteGuardado(true);
      setMostrarGuardar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Datos del Cliente</h2>
        <p className="text-slate-600">Información de quien solicita la cotización</p>
      </div>

      {/* Selector de clientes guardados */}
      {clientesGuardados.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-blue-600" />
              Seleccionar Cliente Guardado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={clienteSeleccionado} onValueChange={handleSeleccionarCliente}>
              <SelectTrigger className="border-slate-300">
                <SelectValue placeholder="Selecciona un cliente guardado o crea uno nuevo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Crear nuevo cliente</span>
                  </div>
                </SelectItem>
                {clientesGuardados.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombreEmpresa} {cliente.rfc && `(${cliente.rfc})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Información del Cliente
            </span>
            {clienteGuardado && (
              <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Cliente guardado
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombreCliente">
                Nombre de Contacto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombreCliente"
                value={datos.nombre}
                onChange={(e) => onChange({ nombre: e.target.value })}
                placeholder="Nombre completo"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">
                <Building2 className="w-4 h-4 inline mr-1" />
                Empresa
              </Label>
              <Input
                id="empresa"
                value={datos.empresa}
                onChange={(e) => onChange({ empresa: e.target.value })}
                placeholder="Nombre de la empresa"
                className="border-slate-300"
              />
              {/* Botón guardar cliente - visible para admin, superadmin y vendedor */}
              {mostrarGuardar && onGuardarCliente && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGuardarCliente}
                  className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar este cliente para futuras cotizaciones
                </Button>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccionCliente">
                <MapPin className="w-4 h-4 inline mr-1" />
                Dirección
              </Label>
              <Input
                id="direccionCliente"
                value={datos.direccion}
                onChange={(e) => onChange({ direccion: e.target.value })}
                placeholder="Calle, número, colonia, ciudad, CP"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefonoCliente">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </Label>
              <Input
                id="telefonoCliente"
                value={datos.telefono}
                onChange={(e) => onChange({ telefono: e.target.value })}
                placeholder="(55) 1234-5678"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailCliente">
                <Mail className="w-4 h-4 inline mr-1" />
                Correo Electrónico
              </Label>
              <Input
                id="emailCliente"
                type="email"
                value={datos.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="cliente@empresa.com"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfcCliente">
                <Briefcase className="w-4 h-4 inline mr-1" />
                RFC
              </Label>
              <Input
                id="rfcCliente"
                value={datos.rfc || ''}
                onChange={(e) => onChange({ rfc: e.target.value.toUpperCase() })}
                placeholder="ABCD010203XXX"
                className="border-slate-300"
                maxLength={13}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
