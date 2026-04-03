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
      
      // PRIMERO: Cargar de localStorage inmediatamente (para que la UI no quede vacía)
      const guardado = localStorage.getItem(STORAGE_KEY_CLIENTES);
      if (guardado) {
        try {
          const clientesLocal = JSON.parse(guardado);
          console.log('[useClientesStore] Cargados desde localStorage:', clientesLocal.length);
          setClientes(clientesLocal);
        } catch (e) {
          console.error('[useClientesStore] Error parseando localStorage:', e);
        }
      }
      
      // LUEGO: Intentar sincronizar con Supabase
      try {
        console.log('[useClientesStore] Intentando cargar desde Supabase...');
        const { data, error: supabaseError } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.warn('[useClientesStore] Error cargando de Supabase:', supabaseError);
          setError('Error de conexión: ' + supabaseError.message);
        } else if (data) {
          console.log('[useClientesStore] Clientes cargados de Supabase:', data.length);
          
          // Cargar contactos de cada cliente
          const { data: contactosData, error: contactosError } = await supabase
            .from('contactos')
            .select('*');
          
          if (contactosError) {
            console.warn('[useClientesStore] Error cargando contactos:', contactosError);
          } else {
            console.log('[useClientesStore] Contactos cargados:', contactosData?.length || 0);
          }

          // Transformar datos de Supabase al formato de la app
          const clientesFormateados: Cliente[] = data.map(c => {
            // Filtrar contactos de este cliente
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
          // Actualizar localStorage como caché
          localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientesFormateados));
          console.log('[useClientesStore] Clientes sincronizados con Supabase');
        }
      } catch (err: any) {
        console.error('[useClientesStore] Error:', err);
        setError(err.message);
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

  // Agregar contacto a cliente (ahora sincroniza con Supabase)
  const agregarUsuario = useCallback(async (clienteId: string, usuario: Omit<UsuarioCliente, 'id'>) => {
    const nuevoUsuario: UsuarioCliente = {
      ...usuario,
      id: crypto.randomUUID(),
    };

    // Guardar en Supabase
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

  // Eliminar contacto de cliente (ahora sincroniza con Supabase)
  const eliminarUsuario = useCallback(async (clienteId: string, usuarioId: string) => {
    // Eliminar de Supabase
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

  // Recargar clientes desde Supabase (con contactos)
  const recargarClientes = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar clientes
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cargar contactos
      const { data: contactosData, error: contactosError } = await supabase
        .from('contactos')
        .select('*');
      
      if (contactosError) {
        console.warn('[useClientesStore] Error cargando contactos:', contactosError);
      }
      
      if (data) {
        const clientesFormateados: Cliente[] = data.map(c => {
          // Filtrar contactos de este cliente
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
