import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { OrdenCompra, OrdenCompraItem } from '@/types/ordenesCompra';

export const useOrdenesCompraStore = () => {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTime = useRef(0);
  const LOAD_DEBOUNCE = 2000;

  const mapearOrden = (row: any): OrdenCompra => ({
    id: row.id,
    numeroOc: row.numero_oc || '',
    proyectoId: row.proyecto_id || undefined,
    cotizacionId: row.cotizacion_id || undefined,
    usuarioId: row.usuario_id || undefined,
    proveedor: row.proveedor || undefined,
    proveedorId: row.proveedor_id || undefined,
    concepto: row.concepto || undefined,
    items: (row.items || []).map((it: any): OrdenCompraItem => ({
      id: it.id,
      nombre: it.nombre || '',
      cantidad: Number(it.cantidad) || 0,
      unidad: it.unidad || '',
      precioUnitario: Number(it.precio_unitario) || 0,
      total: Number(it.total) || 0,
    })),
    subtotal: Number(row.subtotal) || 0,
    ivaPorcentaje: Number(row.iva_porcentaje) || 16,
    iva: Number(row.iva) || 0,
    total: Number(row.total) || 0,
    estado: row.estado || 'pendiente',
    fechaOc: row.fecha_oc || new Date().toISOString(),
    fechaEntrega: row.fecha_entrega || undefined,
    terminosPago: row.terminos_pago || 'contado',
    moneda: row.moneda || 'MXN',
    certificadoCalidad: row.certificado_calidad ?? false,
    solicitanteNombre: row.solicitante_nombre || undefined,
    solicitanteCodigo: row.solicitante_codigo || undefined,
    notas: row.notas || undefined,
    createdAt: row.created_at || undefined,
  });

  const cargarOrdenes = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('[useOrdenesCompraStore] Carga ya en progreso, saltando...');
      return;
    }

    const now = Date.now();
    if (now - lastLoadTime.current < LOAD_DEBOUNCE && ordenes.length > 0) {
      console.log('[useOrdenesCompraStore] Datos recientes, saltando recarga');
      return;
    }

    console.log('[useOrdenesCompraStore] === INICIANDO CARGA ===');
    isLoadingRef.current = true;

    try {
      setCargando(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('[useOrdenesCompraStore] NO HAY USUARIO');
        setError('No autenticado');
        return;
      }

      console.log('[useOrdenesCompraStore] Usuario ID:', userData.user.id);

      const { data, error: supabaseError } = await supabase
        .from('ordenes_compra')
        .select('*')
        .order('fecha_oc', { ascending: false });

      if (supabaseError) {
        console.error('[useOrdenesCompraStore] ERROR SUPABASE:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      console.log('[useOrdenesCompraStore] Datos crudos:', data);

      if (data && data.length > 0) {
        const ordenesMapeadas = data.map(mapearOrden);
        setOrdenes(ordenesMapeadas);
        lastLoadTime.current = Date.now();
        console.log('[useOrdenesCompraStore] === CARGADAS:', ordenesMapeadas.length, 'ordenes ===');
      } else {
        console.log('[useOrdenesCompraStore] === NO HAY ORDENES ===');
        setOrdenes([]);
      }
    } catch (e: any) {
      console.error('[useOrdenesCompraStore] ERROR GENERAL:', e);
      setError(e.message);
    } finally {
      setCargando(false);
      isLoadingRef.current = false;
    }
  }, [ordenes.length]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        console.log('[useOrdenesCompraStore] Usuario autenticado, recargando...');
        lastLoadTime.current = 0;
        cargarOrdenes();
      } else if (event === 'SIGNED_OUT') {
        console.log('[useOrdenesCompraStore] Usuario desautenticado, limpiando...');
        setOrdenes([]);
        lastLoadTime.current = 0;
      }
    });

    cargarOrdenes();

    return () => subscription.unsubscribe();
  }, [cargarOrdenes]);

  const crearOrdenCompra = useCallback(async (datos: {
    proyectoId?: string;
    cotizacionId?: string;
    proveedor?: string;
    proveedorId?: string;
    concepto?: string;
    items: OrdenCompraItem[];
    subtotal: number;
    ivaPorcentaje: number;
    iva: number;
    total: number;
    fechaEntrega?: string;
    terminosPago?: 'contado' | 'credito';
    moneda?: 'MXN' | 'USD';
    certificadoCalidad?: boolean;
    solicitanteNombre?: string;
    solicitanteCodigo?: string;
    notas?: string;
  }) => {
    console.log('[useOrdenesCompraStore] === CREAR ORDEN DE COMPRA ===');
    console.log('[useOrdenesCompraStore] Datos recibidos:', datos);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Error: No estás autenticado');
        return false;
      }

      // 1. Generar número de OC via RPC
      console.log('[useOrdenesCompraStore] Generando número de OC...');
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generar_numero_oc');

      if (numeroError) {
        console.error('[useOrdenesCompraStore] ERROR generando número:', numeroError);
        toast.error('Error generando número de orden: ' + numeroError.message);
        return false;
      }

      const numeroOc = numeroData || '';
      console.log('[useOrdenesCompraStore] Número generado:', numeroOc);

      // 2. Construir datos de inserción
      const insertData: any = {
        usuario_id: userData.user.id,
        numero_oc: numeroOc,
        proveedor: datos.proveedor || '',
        concepto: datos.concepto || '',
        items: (datos.items || []).map(it => ({
          id: it.id,
          nombre: it.nombre,
          cantidad: it.cantidad,
          unidad: it.unidad,
          precio_unitario: it.precioUnitario,
          total: it.total,
        })),
        subtotal: Number(datos.subtotal) || 0,
        iva_porcentaje: Number(datos.ivaPorcentaje) || 16,
        iva: Number(datos.iva) || 0,
        total: Number(datos.total) || 0,
        estado: 'pendiente',
        fecha_oc: new Date().toISOString(),
      };

      if (datos.proyectoId && datos.proyectoId.trim() !== '') {
        insertData.proyecto_id = datos.proyectoId;
      }
      if (datos.cotizacionId && datos.cotizacionId.trim() !== '') {
        insertData.cotizacion_id = datos.cotizacionId;
      }
      if (datos.proveedorId && datos.proveedorId.trim() !== '') {
        insertData.proveedor_id = datos.proveedorId;
      }
      if (datos.fechaEntrega && datos.fechaEntrega.trim() !== '') {
        insertData.fecha_entrega = datos.fechaEntrega;
      }
      insertData.terminos_pago = datos.terminosPago || 'contado';
      insertData.moneda = datos.moneda || 'MXN';
      insertData.certificado_calidad = datos.certificadoCalidad ?? false;
      if (datos.solicitanteNombre && datos.solicitanteNombre.trim() !== '') {
        insertData.solicitante_nombre = datos.solicitanteNombre;
      }
      if (datos.solicitanteCodigo && datos.solicitanteCodigo.trim() !== '') {
        insertData.solicitante_codigo = datos.solicitanteCodigo;
      }
      if (datos.notas && datos.notas.trim() !== '') {
        insertData.notas = datos.notas;
      }

      console.log('[useOrdenesCompraStore] Insertando orden:', insertData);

      // 3. Insertar en Supabase
      const { data, error } = await supabase
        .from('ordenes_compra')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('[useOrdenesCompraStore] ERROR INSERT:', error);
        toast.error('Error guardando orden de compra: ' + error.message);
        return false;
      }

      if (data) {
        const nuevaOrden = mapearOrden(data);
        setOrdenes(prev => [nuevaOrden, ...prev]);
        toast.success(`Orden de compra ${nuevaOrden.numeroOc} creada exitosamente`);
      }

      return true;
    } catch (e: any) {
      console.error('[useOrdenesCompraStore] ERROR EN CREAR ORDEN:', e);
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  const actualizarEstado = useCallback(async (
    id: string,
    estado: OrdenCompra['estado']
  ) => {
    console.log(`[useOrdenesCompraStore] Actualizando estado de ${id} a ${estado}`);

    try {
      const { error } = await supabase
        .from('ordenes_compra')
        .update({ estado })
        .eq('id', id);

      if (error) {
        console.error('[useOrdenesCompraStore] ERROR actualizando estado:', error);
        toast.error('Error actualizando estado: ' + error.message);
        return false;
      }

      setOrdenes(prev =>
        prev.map(o => (o.id === id ? { ...o, estado } : o))
      );

      toast.success(`Orden actualizada a "${estado}"`);
      return true;
    } catch (e: any) {
      console.error('[useOrdenesCompraStore] ERROR actualizando estado:', e);
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  const eliminarOrdenCompra = useCallback(async (id: string) => {
    console.log('[useOrdenesCompraStore] Eliminando orden:', id);

    try {
      const { error } = await supabase
        .from('ordenes_compra')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useOrdenesCompraStore] ERROR eliminando:', error);
        toast.error('Error eliminando orden: ' + error.message);
        return false;
      }

      setOrdenes(prev => prev.filter(o => o.id !== id));
      toast.success('Orden de compra eliminada');
      return true;
    } catch (e: any) {
      console.error('[useOrdenesCompraStore] ERROR eliminando:', e);
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  const refrescarDesdeSupabase = useCallback(async () => {
    await cargarOrdenes();
  }, [cargarOrdenes]);

  const filtrarPorProyecto = useCallback((proyectoId: string) => {
    return ordenes.filter(o => o.proyectoId === proyectoId);
  }, [ordenes]);

  return {
    ordenes,
    cargando,
    error,
    crearOrdenCompra,
    actualizarEstado,
    eliminarOrdenCompra,
    refrescarDesdeSupabase,
    cargarOrdenes,
    filtrarPorProyecto,
  };
};
