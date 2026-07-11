import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { CatalogoMaterial, FormaMaterial, UnidadMedida } from '@/types/cotizacion';

export const useCatalogoMateriales = () => {
  const [catalogo, setCatalogo] = useState<CatalogoMaterial[]>([]);
  const [cargado, setCargado] = useState(false);
  const [loading, setLoading] = useState(false);

  const cargarDesdeSupabase = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[useCatalogoMateriales] Cargando desde Supabase...');

      const { data, error } = await supabase
        .from('catalogo_materiales')
        .select('*')
        .order('nombre');

      console.log('[useCatalogoMateriales] Respuesta:', { data, error });

      if (error) {
        console.error('[useCatalogoMateriales] Error cargando:', error);
        toast.error('Error cargando catálogo: ' + error.message);
        return;
      }

      if (data && data.length > 0) {
        console.log('[useCatalogoMateriales] Datos recibidos:', data.length, 'materiales');
        const materialesFormateados: CatalogoMaterial[] = data.map(m => ({
          id: m.id,
          nombre: m.nombre,
          tipo: m.tipo,
          forma: (m.forma || 'redondo') as FormaMaterial,
          unidadMedida: (m.unidad_medida || 'mm') as UnidadMedida,
          diametro: m.diametro,
          lado: m.lado,
          largo: m.largo,
          ancho: m.ancho,
          espesor: m.espesor,
          diametro_exterior: m.diametro_exterior,
          diametro_interior: m.diametro_interior,
          lado_a: m.lado_a,
          lado_b: m.lado_b,
          descripcion: m.descripcion,
          dimensiones_libre: m.dimensiones_libre,
          costoUnitario: m.costo_unitario ? Number(m.costo_unitario) : 0,
          unidadCosto: (m.unidad_costo || 'kg') as 'kg' | 'pieza' | 'metro',
        }));
        console.log('[useCatalogoMateriales] Formateados:', materialesFormateados);
        setCatalogo(materialesFormateados);
      } else {
        console.log('[useCatalogoMateriales] No hay datos en la tabla');
      }
    } catch (e) {
      console.error('[useCatalogoMateriales] Error:', e);
      toast.error('Error de conexión con catálogo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDesdeSupabase().then(() => setCargado(true));
  }, [cargarDesdeSupabase]);

  const agregarAlCatalogo = useCallback(async (material: Omit<CatalogoMaterial, 'id'>) => {
    const nuevo: CatalogoMaterial = {
      ...material,
      id: crypto.randomUUID(),
    };

    // Optimistic update: agregar al estado local primero
    setCatalogo(prev => [...prev, nuevo]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('catalogo_materiales')
        .insert([{
          id: nuevo.id,
          nombre: nuevo.nombre,
          tipo: nuevo.tipo,
          forma: nuevo.forma,
          unidad_medida: nuevo.unidadMedida,
          diametro: nuevo.diametro,
          lado: nuevo.lado,
          largo: nuevo.largo,
          ancho: nuevo.ancho,
          espesor: nuevo.espesor,
          diametro_exterior: nuevo.diametro_exterior,
          diametro_interior: nuevo.diametro_interior,
          lado_a: nuevo.lado_a,
          lado_b: nuevo.lado_b,
          descripcion: nuevo.descripcion,
          dimensiones_libre: nuevo.dimensiones_libre,
          costo_unitario: nuevo.costoUnitario,
          unidad_costo: nuevo.unidadCosto,
          usuario_id: user?.id,
        }]);

      if (error) {
        console.error('[useCatalogoMateriales] Error guardando:', error);
        toast.error('Error guardando material: ' + error.message);
        // Revertir optimistic update en caso de error
        setCatalogo(prev => prev.filter(m => m.id !== nuevo.id));
      }
    } catch (err) {
      console.error('[useCatalogoMateriales] Error:', err);
      toast.error('Error de conexión al guardar material');
      // Revertir optimistic update en caso de error
      setCatalogo(prev => prev.filter(m => m.id !== nuevo.id));
    }

    return nuevo;
  }, []);

  const eliminarDelCatalogo = useCallback(async (id: string) => {
    // Guardar estado previo para posible revert
    const materialEliminado = catalogo.find(m => m.id === id);
    
    // Optimistic update: eliminar del estado local primero
    setCatalogo(prev => prev.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from('catalogo_materiales')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useCatalogoMateriales] Error eliminando:', error);
        toast.error('Error eliminando material: ' + error.message);
        // Revertir optimistic update en caso de error
        if (materialEliminado) {
          setCatalogo(prev => [...prev, materialEliminado]);
        }
      }
    } catch (err) {
      console.error('[useCatalogoMateriales] Error:', err);
      toast.error('Error de conexión al eliminar material');
      // Revertir optimistic update en caso de error
      if (materialEliminado) {
        setCatalogo(prev => [...prev, materialEliminado]);
      }
    }
  }, [catalogo]);

  const buscarMateriales = useCallback((query: string, forma?: FormaMaterial) => {
    const q = query.toLowerCase();
    return catalogo.filter(m => {
      const matchQuery = m.nombre.toLowerCase().includes(q) || 
                         m.tipo.toLowerCase().includes(q);
      const matchForma = forma ? m.forma === forma : true;
      return matchQuery && matchForma;
    });
  }, [catalogo]);

  const getMaterialesPorForma = useCallback((forma: FormaMaterial) => {
    return catalogo.filter(m => m.forma === forma);
  }, [catalogo]);

  const getMaterialesPorTipo = useCallback((tipo: string) => {
    return catalogo.filter(m => m.tipo === tipo);
  }, [catalogo]);

  const getFormasDisponibles = useCallback(() => {
    const formas = new Set<FormaMaterial>();
    catalogo.forEach(m => formas.add(m.forma));
    return Array.from(formas);
  }, [catalogo]);

  const getTiposDisponibles = useCallback(() => {
    const tipos = new Set<string>();
    catalogo.forEach(m => tipos.add(m.tipo));
    return Array.from(tipos);
  }, [catalogo]);

  const recargarCatalogo = useCallback(async () => {
    await cargarDesdeSupabase();
  }, [cargarDesdeSupabase]);

  return {
    catalogo,
    cargado,
    loading,
    agregarAlCatalogo,
    eliminarDelCatalogo,
    buscarMateriales,
    getMaterialesPorForma,
    getMaterialesPorTipo,
    getFormasDisponibles,
    getTiposDisponibles,
    recargarCatalogo,
  };
};
