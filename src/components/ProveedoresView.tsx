// Catálogo de Proveedores — toda la info de cada proveedor
// incluyendo los días de crédito que tenemos con ellos.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  Pencil,
  Trash2,
  CalendarClock,
  X,
} from 'lucide-react';
import type { Proveedor } from '@/types/ordenesCompra';

interface ProveedoresViewProps {
  onVolver: () => void;
  proveedores: Proveedor[];
  onCrear: (datos: any) => Promise<Proveedor | null>;
  onActualizar: (id: string, datos: Partial<Proveedor>) => Promise<boolean>;
  onEliminar: (id: string) => Promise<boolean> | void;
}

const formVacio = {
  nombre: '',
  tipo: '',
  domicilio: '',
  telefono: '',
  email: '',
  contacto: '',
  diasCredito: '0',
};

export function ProveedoresView({
  onVolver,
  proveedores,
  onCrear,
  onActualizar,
  onEliminar,
}: ProveedoresViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.numero || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.contacto || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const hayCambios = JSON.stringify(form) !== JSON.stringify(formVacio) || editandoId !== null;

  const abrirNuevo = () => {
    setForm(formVacio);
    setEditandoId(null);
    setMostrarFormulario(true);
  };

  const abrirEditar = (p: Proveedor) => {
    setForm({
      nombre: p.nombre,
      tipo: p.tipo || '',
      domicilio: p.domicilio || '',
      telefono: p.telefono || '',
      email: p.email || '',
      contacto: p.contacto || '',
      diasCredito: String(p.diasCredito ?? 0),
    });
    setEditandoId(p.id);
    setMostrarFormulario(true);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    const datos = {
      nombre: form.nombre.trim(),
      tipo: form.tipo.trim() || undefined,
      domicilio: form.domicilio.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
      contacto: form.contacto.trim() || undefined,
      diasCredito: Number(form.diasCredito) || 0,
    };
    const ok = editandoId
      ? await onActualizar(editandoId, datos)
      : !!(await onCrear(datos));
    setGuardando(false);
    if (ok) {
      setForm(formVacio);
      setEditandoId(null);
      setMostrarFormulario(false);
    }
  };

  const handleEliminar = async (p: Proveedor) => {
    if (!confirm(`¿Eliminar al proveedor "${p.nombre}"?`)) return;
    await onEliminar(p.id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onVolver} className="border-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Proveedores</h2>
            <p className="text-slate-500 text-sm">
              {proveedores.length} proveedores en el catálogo
            </p>
          </div>
        </div>
        <Button onClick={abrirNuevo} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo proveedor
        </Button>
      </div>

      {/* Formulario (nuevo / editar) */}
      {mostrarFormulario && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {editandoId ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setMostrarFormulario(false); setForm(formVacio); setEditandoId(null); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Input
                  placeholder="Ej. materiales, servicios"
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Días de crédito</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.diasCredito}
                  onChange={e => setForm(f => ({ ...f, diasCredito: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Domicilio</Label>
                <Input
                  placeholder="Dirección"
                  value={form.domicilio}
                  onChange={e => setForm(f => ({ ...f, domicilio: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  placeholder="Teléfono"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  placeholder="correo@proveedor.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contacto</Label>
                <Input
                  placeholder="Nombre del contacto"
                  value={form.contacto}
                  onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                />
              </div>
            </div>
            <Button
              onClick={handleGuardar}
              disabled={guardando || !form.nombre.trim() || (editandoId === null && !hayCambios)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, número o contacto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {proveedoresFiltrados.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No hay proveedores. Agrega el primero con "Nuevo proveedor".</p>
            </CardContent>
          </Card>
        ) : (
          proveedoresFiltrados.map((p) => (
            <Card key={p.id} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{p.nombre}</span>
                      <Badge variant="outline" className="text-xs">{p.numero}</Badge>
                      {p.tipo && (
                        <Badge variant="outline" className="text-xs bg-slate-50">{p.tipo}</Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${p.diasCredito && p.diasCredito > 0 ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-slate-500'}`}
                      >
                        <CalendarClock className="w-3 h-3 mr-1" />
                        {p.diasCredito && p.diasCredito > 0 ? `${p.diasCredito} días de crédito` : 'Contado'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                      {p.domicilio && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {p.domicilio}
                        </span>
                      )}
                      {p.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {p.telefono}
                        </span>
                      )}
                      {p.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {p.email}
                        </span>
                      )}
                      {p.contacto && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {p.contacto}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600"
                      onClick={() => abrirEditar(p)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleEliminar(p)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
