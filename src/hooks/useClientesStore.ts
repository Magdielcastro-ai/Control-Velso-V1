import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cliente, UsuarioCliente } from '@/types/ventas';

const STORAGE_KEY_CLIENTES = 'velso_clientes';

export const useClientesStore = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargado, setCargado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar clientes desde Supabase primero, luego localStorage como fallback
  useEffect(() => {
    const cargarClientes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Intentar cargar desde Supabase primero
        const { data, error: supabaseError } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.warn('[useClientesStore] Error cargando de Supabase:', supabaseError);
          // Fallback a localStorage
          const guardado = localStorage.getItem(STORAGE_KEY_CLIENTES);
          if (guardado) {
            setClientes(JSON.parse(guardado));
          }
        } else if (data && data.length > 0) {
          // Transformar datos de Supabase al formato de la app
          const clientesFormateados: Cliente[] = data.map(c => ({
            id: c.id,
            nombreEmpresa: c.nombre_empresa,
            direccion: c.direccion || '',
            telefono: c.telefono || '',
            rfc: c.rfc || '',
            terminosPago: c.terminos_pago || '50% anticipo, 50% contra entrega',
            fechaRegistro: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            usuarios: [], // Los usuarios de contacto se manejan separadamente
          }));
          setClientes(clientesFormateados);
          // Actualizar localStorage como caché
          localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientesFormateados));
        } else {
          // Si no hay datos en Supabase, cargar de localStorage
          const guardado = localStorage.getItem(STORAGE_KEY_CLIENTES);
          if (guardado) {
            setClientes(JSON.parse(guardado));
          }
        }
      } catch (err: any) {
        console.error('[useClientesStore] Error:', err);
        setError(err.message);
        // Fallback a localStorage
        const guardado = localStorage.getItem(STORAGE_KEY_CLIENTES);
        if (guardado) {
          setClientes(JSON.parse(guardado));
        }
      } finally {
        setLoading(false);
        setCargado(true);
      }
    };

    cargarClientes();
  }, []);

  // Guardar clientes en localStorage cuando cambien
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    }
  }, [clientes, cargado]);

  // Agregar cliente (Supabase + local)
  const agregarCliente = useCallback(async (cliente: Omit<Cliente, 'id' | 'fechaRegistro' | 'usuarios'>) => {
    const nuevo: Cliente = {
      ...cliente,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString().split('T')[0],
      usuarios: [],
    };
    
    // Guardar en Supabase
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
      }
    } catch (err) {
      console.error('[useClientesStore] Error:', err);
    }
    
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  // Actualizar cliente
  const actualizarCliente = useCallback(async (id: string, datos: Partial<Cliente>) => {
    // Actualizar en Supabase
    try {
      const updateData: any = {};
      if (datos.nombreEmpresa) updateData.nombre_empresa = datos.nombreEmpresa;
      if (datos.direccion !== undefined) updateData.direccion = datos.direccion;
      if (datos.telefono !== undefined) updateData.telefono = datos.telefono;
      if (datos.rfc !== undefined) updateData.rfc = datos.rfc;
      if (datos.terminosPago) updateData.terminos_pago = datos.terminosPago;
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('clientes')
          .update(updateData)
          .eq('id', id);
        
        if (error) {
          console.error('[useClientesStore] Error actualizando en Supabase:', error);
        }
      }
    } catch (err) {
      console.error('[useClientesStore] Error:', err);
    }
    
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...datos } : c));
  }, []);

  // Eliminar cliente
  const eliminarCliente = useCallback(async (id: string) => {
    // Eliminar de Supabase
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

  // Agregar usuario a cliente
  const agregarUsuario = useCallback((clienteId: string, usuario: Omit<UsuarioCliente, 'id'>) => {
    const nuevoUsuario: UsuarioCliente = {
      ...usuario,
      id: crypto.randomUUID(),
    };
    setClientes(prev => prev.map(c => {
      if (c.id !== clienteId) return c;
      return { ...c, usuarios: [...c.usuarios, nuevoUsuario] };
    }));
    return nuevoUsuario;
  }, []);

  // Eliminar usuario de cliente
  const eliminarUsuario = useCallback((clienteId: string, usuarioId: string) => {
    setClientes(prev => prev.map(c => {
      if (c.id !== clienteId) return c;
      return { ...c, usuarios: c.usuarios.filter(u => u.id !== usuarioId) };
    }));
  }, []);

  // Buscar cliente por nombre o empresa
  const buscarCliente = useCallback((query: string) => {
    const q = query.toLowerCase();
    return clientes.filter(c => 
      c.nombreEmpresa.toLowerCase().includes(q) ||
      c.rfc.toLowerCase().includes(q)
    );
  }, [clientes]);

  // Obtener cliente por ID
  const getClienteById = useCallback((id: string) => {
    return clientes.find(c => c.id === id);
  }, [clientes]);

  // Verificar si existe cliente
  const existeCliente = useCallback((nombreEmpresa: string, rfc: string) => {
    return clientes.some(c => 
      c.nombreEmpresa.toLowerCase() === nombreEmpresa.toLowerCase() ||
      c.rfc.toLowerCase() === rfc.toLowerCase()
    );
  }, [clientes]);

  // Recargar clientes desde Supabase
  const recargarClientes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const clientesFormateados: Cliente[] = data.map(c => ({
          id: c.id,
          nombreEmpresa: c.nombre_empresa,
          direccion: c.direccion || '',
          telefono: c.telefono || '',
          rfc: c.rfc || '',
          terminosPago: c.terminos_pago || '50% anticipo, 50% contra entrega',
          fechaRegistro: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          usuarios: [],
        }));
        setClientes(clientesFormateados);
        localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientesFormateados));
      }
    } catch (err: any) {
      console.error('[useClientesStore] Error recargando:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clientes,
    cargado,
    loading,
    error,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    agregarUsuario,
    eliminarUsuario,
    buscarCliente,
    getClienteById,
    existeCliente,
    recargarClientes,
  };
};
