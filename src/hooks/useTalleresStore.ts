import { useState, useEffect, useCallback } from 'react';
import type { DatosTaller } from '@/types/cotizacion';

export interface TallerGuardado extends DatosTaller {
  id: string;
  fechaRegistro: string;
}

const STORAGE_KEY_TALLERES = 'velso_talleres';

export const useTalleresStore = () => {
  const [talleres, setTalleres] = useState<TallerGuardado[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar talleres del localStorage
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY_TALLERES);
    if (guardado) {
      try {
        setTalleres(JSON.parse(guardado));
      } catch (e) {
        console.error('Error al cargar talleres:', e);
      }
    }
    setCargado(true);
  }, []);

  // Guardar talleres en localStorage
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY_TALLERES, JSON.stringify(talleres));
    }
  }, [talleres, cargado]);

  // Agregar taller
  const agregarTaller = useCallback((taller: Omit<DatosTaller, 'id'>) => {
    // Verificar si ya existe un taller con el mismo nombre
    const existe = talleres.some(t => 
      t.nombre.toLowerCase() === taller.nombre.toLowerCase()
    );
    
    if (existe) {
      return null; // Ya existe
    }

    const nuevo: TallerGuardado = {
      ...taller,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString().split('T')[0],
    };
    setTalleres(prev => [...prev, nuevo]);
    return nuevo;
  }, [talleres]);

  // Actualizar taller
  const actualizarTaller = useCallback((id: string, datos: Partial<DatosTaller>) => {
    setTalleres(prev => prev.map(t => t.id === id ? { ...t, ...datos } : t));
  }, []);

  // Eliminar taller
  const eliminarTaller = useCallback((id: string) => {
    setTalleres(prev => prev.filter(t => t.id !== id));
  }, []);

  // Buscar taller por nombre
  const buscarTaller = useCallback((query: string) => {
    const q = query.toLowerCase();
    return talleres.filter(t => 
      t.nombre.toLowerCase().includes(q)
    );
  }, [talleres]);

  // Obtener taller por ID
  const getTallerById = useCallback((id: string) => {
    return talleres.find(t => t.id === id);
  }, [talleres]);

  // Verificar si existe taller
  const existeTaller = useCallback((nombre: string) => {
    return talleres.some(t => 
      t.nombre.toLowerCase() === nombre.toLowerCase()
    );
  }, [talleres]);

  // Guardar taller desde cotización (si no existe)
  const guardarTallerDesdeCotizacion = useCallback((datos: DatosTaller): TallerGuardado | null => {
    if (!datos.nombre) return null;
    
    // Si ya existe, no lo guardamos de nuevo
    if (existeTaller(datos.nombre)) {
      return talleres.find(t => t.nombre.toLowerCase() === datos.nombre.toLowerCase()) || null;
    }

    return agregarTaller(datos);
  }, [existeTaller, agregarTaller, talleres]);

  return {
    talleres,
    cargado,
    agregarTaller,
    actualizarTaller,
    eliminarTaller,
    buscarTaller,
    getTallerById,
    existeTaller,
    guardarTallerDesdeCotizacion,
  };
};
