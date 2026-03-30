import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory, MapPin, Phone, Mail, Building } from 'lucide-react';
import type { DatosTaller } from '@/types/cotizacion';

interface TallerStepProps {
  datos: DatosTaller;
  onChange: (datos: Partial<DatosTaller>) => void;
}

export function TallerStep({ datos, onChange }: TallerStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Datos del Taller</h2>
        <p className="text-slate-600">Información de tu empresa que aparecerá en la cotización</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Factory className="w-5 h-5 text-blue-600" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">
                Nombre del Taller <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={datos.nombre}
                onChange={(e) => onChange({ nombre: e.target.value })}
                placeholder="Ej: Taller CNC Precision"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">
                <MapPin className="w-4 h-4 inline mr-1" />
                Dirección
              </Label>
              <Input
                id="direccion"
                value={datos.direccion}
                onChange={(e) => onChange({ direccion: e.target.value })}
                placeholder="Calle, número, colonia, ciudad, CP"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </Label>
              <Input
                id="telefono"
                value={datos.telefono}
                onChange={(e) => onChange({ telefono: e.target.value })}
                placeholder="(55) 1234-5678"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-1" />
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={datos.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="contacto@taller.com"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfc">
                <Building className="w-4 h-4 inline mr-1" />
                RFC
              </Label>
              <Input
                id="rfc"
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
