import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Factory, MapPin, Phone, Mail, Building, Save, Plus, Check } from 'lucide-react';
import type { DatosTaller } from '@/types/cotizacion';
import type { TallerGuardado } from '@/hooks/useTalleresStore';

interface TallerStepProps {
  datos: DatosTaller;
  onChange: (datos: Partial<DatosTaller>) => void;
  talleresGuardados: TallerGuardado[];
  onGuardarTaller?: (datos: DatosTaller) => TallerGuardado | null | Promise<TallerGuardado | null>;
  onActualizarTaller?: (id: string, datos: Partial<DatosTaller>) => Promise<void>;
  userRol?: string;
}

export function TallerStep({ datos, onChange, talleresGuardados, onGuardarTaller, onActualizarTaller, userRol = 'vendedor' }: TallerStepProps) {
  const [tallerSeleccionado, setTallerSeleccionado] = useState<string>('');
  const [mostrarGuardar, setMostrarGuardar] = useState(false);
  const [mostrarActualizar, setMostrarActualizar] = useState(false);
  const [tallerGuardado, setTallerGuardado] = useState(false);
  const [tallerOriginal, setTallerOriginal] = useState<TallerGuardado | null>(null);

  const isAdmin = userRol === 'admin' || userRol === 'superadmin';

  // Detectar si los datos actuales coinciden con un taller guardado
  useEffect(() => {
    if (datos.nombre) {
      const existe = talleresGuardados.some(t => 
        t.nombre.toLowerCase() === datos.nombre.toLowerCase()
      );
      setTallerGuardado(existe);
      
      // Detectar si hay cambios respecto al taller original seleccionado
      if (tallerOriginal && tallerSeleccionado === tallerOriginal.id) {
        const hayCambios = 
          datos.direccion !== tallerOriginal.direccion ||
          datos.telefono !== tallerOriginal.telefono ||
          datos.email !== tallerOriginal.email ||
          datos.rfc !== tallerOriginal.rfc;
        setMostrarActualizar(isAdmin && hayCambios);
        setMostrarGuardar(false);
      } else {
        // Solo mostrar botón de guardar si es admin/superadmin y no existe
        setMostrarGuardar(isAdmin && !existe && datos.nombre.length > 0);
        setMostrarActualizar(false);
      }
    } else {
      setMostrarGuardar(false);
      setMostrarActualizar(false);
      setTallerGuardado(false);
    }
  }, [datos, talleresGuardados, isAdmin, tallerOriginal, tallerSeleccionado]);

  const handleSeleccionarTaller = (tallerId: string) => {
    setTallerSeleccionado(tallerId);
    if (tallerId === 'nuevo') {
      // Limpiar todos los campos para nuevo taller
      setTallerOriginal(null);
      onChange({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        rfc: '',
      });
    } else {
      const taller = talleresGuardados.find(t => t.id === tallerId);
      if (taller) {
        setTallerOriginal(taller);
        onChange({
          nombre: taller.nombre,
          direccion: taller.direccion,
          telefono: taller.telefono,
          email: taller.email,
          rfc: taller.rfc || '',
        });
      }
    }
  };

  const handleGuardarTaller = async () => {
    if (!onGuardarTaller) return;
    const resultado = await onGuardarTaller(datos);
    if (resultado) {
      setTallerGuardado(true);
      setMostrarGuardar(false);
    }
  };

  const handleActualizarTaller = async () => {
    if (!onActualizarTaller || !tallerOriginal) return;
    await onActualizarTaller(tallerOriginal.id, {
      direccion: datos.direccion,
      telefono: datos.telefono,
      email: datos.email,
      rfc: datos.rfc,
    });
    // Actualizar el taller original con los nuevos datos
    setTallerOriginal({
      ...tallerOriginal,
      direccion: datos.direccion,
      telefono: datos.telefono,
      email: datos.email,
      rfc: datos.rfc,
    });
    setMostrarActualizar(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Datos del Taller</h2>
        <p className="text-slate-600">Información de tu empresa que aparecerá en la cotización</p>
      </div>

      {/* Selector de talleres guardados */}
      {talleresGuardados.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Factory className="w-5 h-5 text-blue-600" />
              Seleccionar Taller Guardado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={tallerSeleccionado || undefined} onValueChange={handleSeleccionarTaller}>
              <SelectTrigger className="border-slate-300">
                <SelectValue placeholder="Selecciona un taller guardado o crea uno nuevo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Crear nuevo taller</span>
                  </div>
                </SelectItem>
                {talleresGuardados
                  .filter((taller) => taller.id && taller.id.trim() !== '')
                  .map((taller) => (
                    <SelectItem key={taller.id} value={taller.id}>
                      {taller.nombre}
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
              <Factory className="w-5 h-5 text-blue-600" />
              Información General
            </span>
            {tallerGuardado && (
              <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Taller guardado
              </span>
            )}
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
              {/* Botón guardar taller - solo visible para admin/superadmin */}
              {mostrarGuardar && onGuardarTaller && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGuardarTaller}
                  className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar este taller para futuras cotizaciones
                </Button>
              )}
              {/* Botón actualizar taller - solo visible para admin/superadmin cuando hay cambios */}
              {mostrarActualizar && onActualizarTaller && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleActualizarTaller}
                  className="mt-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Actualizar datos del taller guardado
                </Button>
              )}
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
