import { useState, useEffect, useCallback } from 'react';
import type { Cliente, UsuarioCliente } from '@/types/ventas';

const STORAGE_KEY_CLIENTES = 'velso_clientes';

export const useClientesStore = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar clientes del localStorage
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY_CLIENTES);
    if (guardado) {
      try {
        setClientes(JSON.parse(guardado));
      } catch (e) {
        console.error('Error al cargar clientes:', e);
      }
    }
    setCargado(true);
  }, []);

  // Guardar clientes en localStorage
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    }
  }, [clientes, cargado]);

  // Agregar cliente
  const agregarCliente = useCallback((cliente: Omit<Cliente, 'id' | 'fechaRegistro' | 'usuarios'>) => {
    const nuevo: Cliente = {
      ...cliente,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString().split('T')[0],
      usuarios: [],
    };
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  // Actualizar cliente
  const actualizarCliente = useCallback((id: string, datos: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...datos } : c));
  }, []);

  // Eliminar cliente
  const eliminarCliente = useCallback((id: string) => {
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

  return {
    clientes,
    cargado,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    agregarUsuario,
    eliminarUsuario,
    buscarCliente,
    getClienteById,
    existeCliente,
  };
};
