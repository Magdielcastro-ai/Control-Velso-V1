import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Cliente, UsuarioCliente } from '@/types/ventas';

export const useClientesStore = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargado, setCargado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refrescarDesdeSupabase = useCallback(async () => {
    try {
      console.log('[useClientesStore] Refrescando desde Supabase...');
      setLoading(true);

      // Verificar que hay sesión activa antes de cargar
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[useClientesStore] No hay sesión, saltando carga');
        setClientes([]);
        return false;
      }

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const { data: contactosData } = await supabase.from('contactos').select('*');

        const clientesFormateados = data.map(c => {
          const contactosCliente = (contactosData || [])
            .filter(contacto => contacto.cliente_id === c.id)
            .map(contacto => ({
              id: contacto.id,
              nombre: contacto.nombre,
              departamento: contacto.departamento || '',
              email: contacto.email || '',
              telefono: contacto.telefono || '',
              celular: contacto.celular || '',
              esPrincipal: contacto.es_principal,
            }));

          return {
            id: c.id,
            nombreEmpresa: c.nombre_empresa,
            direccion: c.direccion || '',
            telefono: c.telefono || '',
            rfc: c.rfc || '',
            terminosPago: c.terminos_pago || '50% anticipo, 50% contra entrega',
            fechaRegistro: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            usuarios: contactosCliente,
          };
        });

        setClientes(clientesFormateados);
        console.log('[useClientesStore] Refrescado desde Supabase:', data.length);
      }
      return true;
    } catch (err) {
      console.warn('[useClientesStore] Error refrescando:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Escuchar cambios de autenticación para recargar datos
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        console.log('[useClientesStore] Usuario autenticado, recargando...');
        refrescarDesdeSupabase().then(() => setCargado(true));
      } else if (event === 'SIGNED_OUT') {
        console.log('[useClientesStore] Usuario desautenticado, limpiando...');
        setClientes([]);
        setCargado(false);
      }
    });

    // Carga inicial si ya hay sesión
    refrescarDesdeSupabase().then(() => setCargado(true));

    return () => subscription.unsubscribe();
  }, [refrescarDesdeSupabase]);

  const agregarCliente = useCallback(async (cliente: Omit<Cliente, 'id' | 'fechaRegistro' | 'usuarios'>) => {
    const nuevo: Cliente = {
      ...cliente,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString().split('T')[0],
      usuarios: [],
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('clientes')
        .insert([{
          id: nuevo.id,
          nombre_empresa: nuevo.nombreEmpresa,
          direccion: nuevo.direccion,
          telefono: nuevo.telefono,
          rfc: nuevo.rfc,
          terminos_pago: nuevo.terminosPago,
          usuario_id: user?.id,
        }]);

      if (error) {
        console.error('[useClientesStore] Error guardando en Supabase:', error);
        toast.error('Error guardando cliente: ' + error.message);
      }
    } catch (err) {
      console.error('[useClientesStore] Error:', err);
    }

    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const actualizarCliente = useCallback(async (id: string, datos: Partial<Cliente>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (datos.nombreEmpresa !== undefined) updateData.nombre_empresa = datos.nombreEmpresa;
      // Enviar null en lugar de string vacío para campos opcionales
      if (datos.direccion !== undefined) updateData.direccion = datos.direccion || null;
      if (datos.telefono !== undefined) updateData.telefono = datos.telefono || null;
      if (datos.rfc !== undefined) updateData.rfc = datos.rfc || null;
      if (datos.terminosPago !== undefined) updateData.terminos_pago = datos.terminosPago || null;

      if (Object.keys(updateData).length > 0) {
        console.log('[useClientesStore] Enviando a Supabase:', updateData);
        const { error } = await supabase
          .from('clientes')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('[useClientesStore] Error actualizando en Supabase:', JSON.stringify(error));
          toast.error(`Error ${error.code}: ${error.message}`);
          return false;
        }
      }

      setClientes(prev => prev.map(c => c.id === id ? { ...c, ...datos } : c));
      toast.success('Cliente actualizado correctamente');
      return true;
    } catch (err: any) {
      console.error('[useClientesStore] Error:', err);
      toast.error('Error de conexión: ' + err.message);
      return false;
    }
  }, []);

  const eliminarCliente = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useClientesStore] Error eliminando de Supabase:', error);
      }
    } catch (err) {
      console.error('[useClientesStore] Error:', err);
    }

    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  const agregarUsuario = useCallback(async (clienteId: string, usuario: Omit<UsuarioCliente, 'id'>) => {
    const nuevoUsuario: UsuarioCliente = {
      ...usuario,
      id: crypto.randomUUID(),
    };

    try {
      const { error } = await supabase
        .from('contactos')
        .insert([{
          id: nuevoUsuario.id,
          cliente_id: clienteId,
          nombre: nuevoUsuario.nombre,
          departamento: nuevoUsuario.departamento,
          email: nuevoUsuario.email,
          telefono: nuevoUsuario.telefono,
          celular: nuevoUsuario.celular,
          es_principal: nuevoUsuario.esPrincipal,
        }]);

      if (error) {
        console.error('[useClientesStore] Error guardando contacto:', error);
      }
    } catch (err) {
      console.error('[useClientesStore] Error:', err);
    }

    setClientes(prev => prev.map(c => {
      if (c.id !== clienteId) return c;
      return { ...c, usuarios: [...c.usuarios, nuevoUsuario] };
    }));
    return nuevoUsuario;
  }, []);

  const actualizarUsuario = useCallback(async (clienteId: string, usuarioId: string, datos: Partial<UsuarioCliente>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
      if (datos.departamento !== undefined) updateData.departamento = datos.departamento || null;
      if (datos.email !== undefined) updateData.email = datos.email || null;
      if (datos.telefono !== undefined) updateData.telefono = datos.telefono || null;
      if (datos.celular !== undefined) updateData.celular = datos.celular || null;
      if (datos.esPrincipal !== undefined) updateData.es_principal = datos.esPrincipal;

      if (Object.keys(updateData).length > 0) {
        console.log('[useClientesStore] Enviando contacto a Supabase:', updateData);
        const { error } = await supabase
          .from('contactos')
          .update(updateData)
          .eq('id', usuarioId);

        if (error) {
          console.error('[useClientesStore] Error actualizando contacto:', error);
          toast.error('Error al guardar contacto: ' + error.message);
          return false;
        }
      }

      setClientes(prev => prev.map(c => {
        if (c.id !== clienteId) return c;
        return {
          ...c,
          usuarios: c.usuarios.map(u => u.id === usuarioId ? { ...u, ...datos } : u)
        };
      }));
      toast.success('Contacto actualizado correctamente');
      return true;
    } catch (err: any) {
      console.error('[useClientesStore] Error:', err);
      toast.error('Error de conexión: ' + err.message);
      return false;
    }
  }, []);

  const eliminarUsuario = useCallback(async (clienteId: string, usuarioId: string) => {
    try {
      const { error } = await supabase
        .from('contactos')
        .delete()
        .eq('id', usuarioId);

      if (error) {
        console.error('[useClientesStore] Error eliminando contacto:', error);
      }
    } catch (err) {
      console.error('[useClientesStore] Error:', err);
    }

    setClientes(prev => prev.map(c => {
      if (c.id !== clienteId) return c;
      return { ...c, usuarios: c.usuarios.filter(u => u.id !== usuarioId) };
    }));
  }, []);

  const buscarCliente = useCallback((query: string) => {
    const q = query.toLowerCase();
    return clientes.filter(c => 
      c.nombreEmpresa.toLowerCase().includes(q) ||
      c.rfc.toLowerCase().includes(q)
    );
  }, [clientes]);

  const getClienteById = useCallback((id: string) => {
    return clientes.find(c => c.id === id);
  }, [clientes]);

  const existeCliente = useCallback((nombreEmpresa: string, rfc: string) => {
    return clientes.some(c => 
      c.nombreEmpresa.toLowerCase() === nombreEmpresa.toLowerCase() ||
      c.rfc.toLowerCase() === rfc.toLowerCase()
    );
  }, [clientes]);

  const recargarClientes = useCallback(async () => {
    await refrescarDesdeSupabase();
  }, [refrescarDesdeSupabase]);

  return {
    clientes,
    cargado,
    loading,
    error,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    agregarUsuario,
    actualizarUsuario,
    eliminarUsuario,
    buscarCliente,
    getClienteById,
    existeCliente,
    recargarClientes,
    refrescarDesdeSupabase,
  };
};
