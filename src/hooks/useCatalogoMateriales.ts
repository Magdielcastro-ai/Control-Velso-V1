import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { CatalogoMaterial, FormaMaterial } from '@/types/cotizacion';

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
          unidadMedida: m.unidad || 'mm',
          diametro: m.diametro,
          lado: m.lado,
          largo: m.largo,
          ancho: m.ancho,
          espesor: m.espesor,
          costoUnitario: m.costo_unitario ? Number(m.costo_unitario) : 0,
          unidadCosto: m.unidad || 'kg',
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('catalogo_materiales')
        .insert([{
          id: nuevo.id,
          nombre: nuevo.nombre,
          tipo: nuevo.tipo,
          forma: nuevo.forma,
          unidad: nuevo.unidadMedida,
          diametro: nuevo.diametro,
          lado: nuevo.lado,
          largo: nuevo.largo,
          ancho: nuevo.ancho,
          espesor: nuevo.espesor,
          costo_unitario: nuevo.costoUnitario,
          usuario_id: user?.id,
        }]);

      if (error) {
        console.error('[useCatalogoMateriales] Error guardando:', error);
        toast.error('Error guardando material: ' + error.message);
      }
    } catch (err) {
      console.error('[useCatalogoMateriales] Error:', err);
    }

    setCatalogo(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const eliminarDelCatalogo = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('catalogo_materiales')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useCatalogoMateriales] Error eliminando:', error);
      }
    } catch (err) {
      console.error('[useCatalogoMateriales] Error:', err);
    }

    setCatalogo(prev => prev.filter(m => m.id !== id));
  }, []);

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
