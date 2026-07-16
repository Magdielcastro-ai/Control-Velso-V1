import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { PiezaCatalogo, PiezaCotizacion } from '@/types/cotizacion';
import { toast } from 'sonner';

export function usePiezasCatalogoStore() {
  const [piezasCatalogo, setPiezasCatalogo] = useState<PiezaCatalogo[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarPiezasCatalogo = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('piezas_catalogo')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) {
        console.warn('[usePiezasCatalogoStore] Error cargando:', error);
        return;
      }

      const formateadas: PiezaCatalogo[] = (data || []).map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        cantidad: p.cantidad || 1,
        material: p.material,
        procesos: p.procesos || [],
        costosAdicionales: p.costos_adicionales || {},
        subtotalPieza: p.subtotal_pieza || 0,
        utilidadPieza: p.utilidad_pieza || 0,
        ivaPieza: p.iva_pieza || 0,
        totalPieza: p.total_pieza || 0,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      setPiezasCatalogo(formateadas);
    } catch (err) {
      console.warn('[usePiezasCatalogoStore] Error:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  const buscarPiezaPorCodigo = useCallback(async (codigo: string): Promise<PiezaCatalogo | null> => {
    try {
      const { data, error } = await supabase
        .from('piezas_catalogo')
        .select('*')
        .eq('codigo', codigo)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        codigo: data.codigo,
        nombre: data.nombre,
        cantidad: data.cantidad || 1,
        material: data.material,
        procesos: data.procesos || [],
        costosAdicionales: data.costos_adicionales || {},
        subtotalPieza: data.subtotal_pieza || 0,
        utilidadPieza: data.utilidad_pieza || 0,
        ivaPieza: data.iva_pieza || 0,
        totalPieza: data.total_pieza || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (err) {
      console.warn('[usePiezasCatalogoStore] Error buscando:', err);
      return null;
    }
  }, []);

  const guardarPiezaEnCatalogo = useCallback(async (pieza: PiezaCotizacion, codigo: string): Promise<boolean> => {
    if (!codigo.trim()) {
      toast.error('Ingresa un código para guardar la pieza');
      return false;
    }

    try {
      // Verificar si el código ya existe
      const { data: existente } = await supabase
        .from('piezas_catalogo')
        .select('id')
        .eq('codigo', codigo.trim())
        .single();

      const piezaData = {
        codigo: codigo.trim(),
        nombre: pieza.nombre,
        cantidad: pieza.cantidad,
        material: pieza.material,
        procesos: pieza.procesos,
        costos_adicionales: pieza.costosAdicionales,
        subtotal_pieza: pieza.subtotalPieza,
        utilidad_pieza: pieza.utilidadPieza,
        iva_pieza: pieza.ivaPieza,
        total_pieza: pieza.totalPieza,
      };

      if (existente) {
        // Actualizar pieza existente
        const { error } = await supabase
          .from('piezas_catalogo')
          .update(piezaData)
          .eq('id', existente.id);

        if (error) {
          toast.error('Error actualizando pieza en catálogo');
          return false;
        }
        toast.success(`Pieza ${codigo} actualizada en catálogo`);
      } else {
        // Crear nueva pieza
        const { error } = await supabase
          .from('piezas_catalogo')
          .insert(piezaData);

        if (error) {
          toast.error('Error guardando pieza en catálogo');
          return false;
        }
        toast.success(`Pieza ${codigo} guardada en catálogo`);
      }

      // Recargar catálogo
      await cargarPiezasCatalogo();
      return true;
    } catch (err) {
      console.warn('[usePiezasCatalogoStore] Error guardando:', err);
      toast.error('Error guardando pieza en catálogo');
      return false;
    }
  }, [cargarPiezasCatalogo]);

  // Cargar al iniciar
  useEffect(() => {
    cargarPiezasCatalogo();
  }, [cargarPiezasCatalogo]);

  return {
    piezasCatalogo,
    cargando,
    cargarPiezasCatalogo,
    buscarPiezaPorCodigo,
    guardarPiezaEnCatalogo,
  };
}
