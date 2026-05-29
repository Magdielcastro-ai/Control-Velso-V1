import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: localStorage,
    storageKey: 'velso-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'velso-cnc-app',
    },
  },
});

// ========== CACHÉ EN MEMORIA (NO localStorage) ==========
const perfilCache = new Map<string, { data: PerfilUsuario | null; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

type UserRole = 'admin' | 'vendedor' | 'produccion';

export interface PerfilUsuario {
  id: string;
  nombre: string;
  email?: string;
  rol: UserRole;
  activo: boolean;
  created_at: string;
}

export interface CotizacionDB {
  id: string;
  numero: string;
  usuario_id: string;
  cliente_nombre: string;
  proyecto_nombre: string;
  datos_taller: any;
  datos_cliente: any;
  materiales: any[];
  procesos: any[];
  costos_adicionales: any;
  margen_utilidad: number;
  iva_porcentaje: number;
  subtotal: number;
  total: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface ProyectoDB {
  id: string;
  cotizacion_id: string;
  numero_cotizacion: string;
  orden_compra: string;
  numero_factura?: string;
  cliente_nombre: string;
  proyecto_nombre: string;
  total_cotizado: number;
  total_facturado?: number;
  estado: 'en_fabricacion' | 'fabricado' | 'entregado' | 'facturado';
  materiales: any[];
  procesos: any[];
  costos_adicionales: any;
  materiales_reales?: any[];
  procesos_reales?: any[];
  costo_total_real?: number;
  utilidad_real?: number;
  porcentaje_utilidad_real?: number;
  fecha_venta: string;
  fecha_fabricado?: string;
  fecha_entregado?: string;
  fecha_facturado?: string;
  usuario_id: string;
  created_at: string;
}

export interface ClienteDB {
  id: string;
  usuario_id: string;
  nombre_empresa: string;
  direccion?: string;
  telefono?: string;
  rfc?: string;
  terminos_pago?: string;
  usuarios: any[];
  created_at: string;
}

export interface MaterialDB {
  id: string;
  usuario_id: string;
  nombre: string;
  tipo: string;
  forma?: string;
  dimensiones?: string;
  costo_unitario: number;
  unidad: string;
  margen_porcentaje: number;
  created_at: string;
}

export async function signUp(email: string, password: string, nombre: string, rol: UserRole = 'vendedor') {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No se pudo crear el usuario');

  const { error: perfilError } = await supabase
    .from('perfiles')
    .insert([{ id: authData.user.id, nombre, rol }]);

  if (perfilError) throw perfilError;

  perfilCache.delete(authData.user.id);
  return authData.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  perfilCache.clear();
}

export async function getPerfilUsuario(userId: string): Promise<PerfilUsuario | null> {
  const cached = perfilCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[getPerfilUsuario] Cache hit:', userId);
    return cached.data;
  }

  console.log('[getPerfilUsuario] Buscando ID:', userId);

  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[getPerfilUsuario] Error:', error);
      return null;
    }

    perfilCache.set(userId, { data, timestamp: Date.now() });
    console.log('[getPerfilUsuario] Resultado:', data);
    return data;
  } catch (err: any) {
    console.error('[getPerfilUsuario] Excepción:', err.message);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    console.log('[getCurrentUser] Iniciando...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[getCurrentUser] Error de sesión:', sessionError);
      return null;
    }

    if (!session) {
      console.log('[getCurrentUser] No hay sesión activa');
      return null;
    }

    console.log('[getCurrentUser] Sesión encontrada:', session.user.id);
    const user = session.user;
    const perfil = await getPerfilUsuario(user.id);
    console.log('[getCurrentUser] Perfil:', perfil);

    return { ...user, perfil };
  } catch (error: any) {
    console.error('[getCurrentUser] Error:', error.message);
    return null;
  }
}

export async function getCotizaciones(): Promise<CotizacionDB[]> {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveCotizacion(cotizacion: Partial<CotizacionDB>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('cotizaciones')
    .upsert([{ ...cotizacion, usuario_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCotizacion(id: string) {
  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getProyectos(): Promise<ProyectoDB[]> {
  const { data, error } = await supabase
    .from('proyectos')
    .select('*')
    .order('fecha_venta', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveProyecto(proyecto: Partial<ProyectoDB>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('proyectos')
    .upsert([{ ...proyecto, usuario_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProyectoEstado(
  id: string,
  estado: ProyectoDB['estado'],
  datosAdicionales?: Partial<ProyectoDB>
) {
  const updates: Partial<ProyectoDB> = { estado };

  if (estado === 'fabricado') updates.fecha_fabricado = new Date().toISOString().split('T')[0];
  if (estado === 'entregado') updates.fecha_entregado = new Date().toISOString().split('T')[0];
  if (estado === 'facturado') updates.fecha_facturado = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('proyectos')
    .update({ ...updates, ...datosAdicionales })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClientes(): Promise<ClienteDB[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre_empresa');

  if (error) throw error;
  return data || [];
}

export async function saveCliente(cliente: Partial<ClienteDB>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('clientes')
    .upsert([{ ...cliente, usuario_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCliente(id: string) {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMateriales(): Promise<MaterialDB[]> {
  const { data, error } = await supabase
    .from('catalogo_materiales')
    .select('*')
    .order('nombre');

  if (error) throw error;
  return data || [];
}

export async function saveMaterial(material: Partial<MaterialDB>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('catalogo_materiales')
    .upsert([{ ...material, usuario_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase
    .from('catalogo_materiales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAllUsers(): Promise<PerfilUsuario[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function createUser(email: string, password: string, nombre: string, rol: UserRole) {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('No autenticado');

  const perfil = await getPerfilUsuario(currentUser.id);
  if (perfil?.rol !== 'admin') throw new Error('Solo administradores pueden crear usuarios');

  return signUp(email, password, nombre, rol);
}

export async function updateUserRol(userId: string, rol: UserRole) {
  const { error } = await supabase
    .from('perfiles')
    .update({ rol })
    .eq('id', userId);

  if (error) throw error;
  perfilCache.delete(userId);
}

export async function deactivateUser(userId: string) {
  const { error } = await supabase
    .from('perfiles')
    .update({ activo: false })
    .eq('id', userId);

  if (error) throw error;
  perfilCache.delete(userId);
}
