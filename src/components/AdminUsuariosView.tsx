import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  UserCog,
  Shield,
  User,
  Factory,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase, type PerfilUsuario } from '@/lib/supabase';
import { toast } from 'sonner';

interface AdminUsuariosViewProps {
  onVolver: () => void;
}

const ROLES = [
  { value: 'admin', label: 'Administrador', icon: Shield, color: 'bg-purple-600' },
  { value: 'vendedor', label: 'Vendedor', icon: User, color: 'bg-blue-600' },
  { value: 'produccion', label: 'Producción', icon: Factory, color: 'bg-green-600' },
];

export function AdminUsuariosView({ onVolver }: AdminUsuariosViewProps) {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  // Formulario nuevo usuario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'admin' | 'vendedor' | 'produccion'>('vendedor');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async () => {
    if (!nombre || !email || !password) {
      toast.error('Completa todos los campos');
      return;
    }

    setGuardando(true);
    try {
      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Crear perfil
      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert([{ 
          id: authData.user.id, 
          nombre, 
          rol,
          activo: true 
        }]);

      if (perfilError) throw perfilError;

      toast.success('Usuario creado exitosamente');
      setDialogoAbierto(false);
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('vendedor');
      cargarUsuarios();
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarRol = async (userId: string, nuevoRol: string) => {
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ rol: nuevoRol })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Rol actualizado');
      cargarUsuarios();
    } catch (error) {
      toast.error('Error al actualizar rol');
    }
  };

  const handleActivarDesactivar = async (userId: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ activo: !activo })
        .eq('id', userId);

      if (error) throw error;
      toast.success(activo ? 'Usuario desactivado' : 'Usuario activado');
      cargarUsuarios();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const getRolConfig = (rolValue: string) => {
    return ROLES.find(r => r.value === rolValue) || ROLES[1];
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
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-purple-600" />
            Administración de Usuarios
          </h2>
          <p className="text-slate-500">
            {usuarios.length} usuarios registrados
          </p>
        </div>
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@velso.mx"
                />
              </div>

              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select value={rol} onValueChange={(v) => setRol(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex items-center gap-2">
                          <r.icon className="w-4 h-4" />
                          {r.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-700 text-sm">
                  El usuario recibirá un correo de confirmación para activar su cuenta.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleCrearUsuario}
                disabled={guardando || !nombre || !email || !password}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Usuario'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-slate-500 mt-2">Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay usuarios registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {usuarios.map((usuario) => {
            const rolConfig = getRolConfig(usuario.rol);
            return (
              <Card key={usuario.id} className={`border-slate-200 ${!usuario.activo ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${rolConfig.color} rounded-lg flex items-center justify-center`}>
                        <rolConfig.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{usuario.nombre}</h3>
                          <Badge 
                            variant={usuario.activo ? 'default' : 'secondary'}
                            className={usuario.activo ? 'bg-green-600' : 'bg-slate-400'}
                          >
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{usuario.email || 'Sin email'}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Registrado: {new Date(usuario.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={usuario.rol}
                        onValueChange={(v) => handleCambiarRol(usuario.id, v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivarDesactivar(usuario.id, usuario.activo)}
                        className={usuario.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                      >
                        {usuario.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Leyenda de permisos */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Permisos por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {ROLES.map((rol) => (
              <div key={rol.value} className="bg-white p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 ${rol.color} rounded flex items-center justify-center`}>
                    <rol.icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium">{rol.label}</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  {rol.value === 'admin' && (
                    <>
                      <li>• Todo el acceso</li>
                      <li>• Crear/editar usuarios</li>
                      <li>• Dashboard completo</li>
                      <li>• Control de códigos</li>
                    </>
                  )}
                  {rol.value === 'vendedor' && (
                    <>
                      <li>• Crear cotizacionesporjoan</li>
                      <li>• Ver proyectos</li>
                      <li>• Facturar proyectos</li>
                      <li>• Dashboard de ventas</li>
                    </>
                  )}
                  {rol.value === 'produccion' && (
                    <>
                      <li>• Actualizar estados</li>
                      <li>• Marcar fabricado</li>
                      <li>• Marcar entregado</li>
                      <li>• Control de códigos</li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
