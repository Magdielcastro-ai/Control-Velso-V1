import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building2, MapPin, Phone, Mail, Briefcase } from 'lucide-react';
import type { DatosCliente } from '@/types/cotizacion';

interface ClienteStepProps {
  datos: DatosCliente;
  onChange: (datos: Partial<DatosCliente>) => void;
}

export function ClienteStep({ datos, onChange }: ClienteStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Datos del Cliente</h2>
        <p className="text-slate-600">Información de quien solicita la cotización</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-blue-600" />
            Información del Cliente
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
