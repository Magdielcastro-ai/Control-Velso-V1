import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ProyectoVenta } from '@/types/ventas';

export const useProyectosStore = () => {
  const [proyectos, setProyectos] = useState<ProyectoVenta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTime = useRef(0);
  const LOAD_DEBOUNCE = 2000;

  const cargarProyectos = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('[useProyectosStore] Carga ya en progreso, saltando...');
      return;
    }

    const now = Date.now();
    if (now - lastLoadTime.current < LOAD_DEBOUNCE && proyectos.length > 0) {
      console.log('[useProyectosStore] Datos recientes, saltando recarga');
      return;
    }

    console.log('[useProyectosStore] === INICIANDO CARGA ===');
    isLoadingRef.current = true;

    try {
      setCargando(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('[useProyectosStore] NO HAY USUARIO');
        setError('No autenticado');
        return;
      }

      console.log('[useProyectosStore] Usuario ID:', userData.user.id);

      const { data, error: supabaseError } = await supabase
        .from('proyectos')
        .select('*')
        .order('fecha_venta', { ascending: false });

      if (supabaseError) {
        console.error('[useProyectosStore] ERROR SUPABASE:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      console.log('[useProyectosStore] Datos crudos:', data);

      if (data && data.length > 0) {
        const proyectosMapeados: ProyectoVenta[] = data.map(p => ({
          id: p.id,
          codigoProyecto: p.codigo_proyecto || '',
          tipoProyecto: p.tipo_proyecto || 'maquinado',
          tipoOrigen: p.tipo_origen || 'cotizacion',
          stockVendido: p.stock_vendido || [],
          cotizadoSnapshot: p.cotizado_snapshot || undefined,
          numeroCotizacion: p.numero_cotizacion || '',
          cotizacionId: p.cotizacion_id || '',
          ordenCompra: p.orden_compra || '',
          clienteId: p.cliente_id || p.clienteid || '',
          clienteNombre: p.cliente_nombre || '',
          proyectoNombre: p.proyecto_nombre || '',
          totalCotizado: Number(p.total_cotizado) || 0,
          margenUtilidad: Number(p.margen_utilidad) || 30,
          ivaPorcentaje: Number(p.iva_porcentaje) || 16,
          estado: p.estado || 'en_fabricacion',
          fechaVenta: p.fecha_venta || new Date().toISOString(),
          fechaFabricado: p.fecha_fabricado,
          fechaEntregado: p.fecha_entregado,
          fechaFacturado: p.fecha_facturado,
          numeroFactura: p.numero_factura,
          totalFacturado: p.total_facturado ? Number(p.total_facturado) : undefined,
          utilidadReal: p.utilidad_real ? Number(p.utilidad_real) : undefined,
          piezas: p.piezas || [],
          materiales: p.materiales || [],
          procesos: p.procesos || [],
          materialesReales: p.materiales_reales || undefined,
          procesosReales: p.procesos_reales || undefined,
          costosAdicionalesReales: p.costos_adicionales_reales || undefined,
          costoTotalReal: p.costo_total_real ? Number(p.costo_total_real) : undefined,
          porcentajeUtilidadReal: p.porcentaje_utilidad_real ? Number(p.porcentaje_utilidad_real) : undefined,
          costosAdicionales: p.costos_adicionales || {
            disenoCAD: 0,
            programacionCNC: 0,
            setup: 0,
            transporte: 0,
            otro: 0,
          },
          usuarioId: p.usuario_id,
        }));

        setProyectos(proyectosMapeados);
        lastLoadTime.current = Date.now();
        console.log('[useProyectosStore] === CARGADOS:', proyectosMapeados.length, 'proyectos ===');
      } else {
        console.log('[useProyectosStore] === NO HAY PROYECTOS ===');
        setProyectos([]);
      }
    } catch (e: any) {
      console.error('[useProyectosStore] ERROR GENERAL:', e);
      setError(e.message);
    } finally {
      setCargando(false);
      isLoadingRef.current = false;
    }
  }, [proyectos.length]);

  useEffect(() => {
    // Escuchar cambios de autenticación para recargar datos
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        console.log('[useProyectosStore] Usuario autenticado, recargando...');
        lastLoadTime.current = 0; // Reset debounce
        cargarProyectos();
      } else if (event === 'SIGNED_OUT') {
        console.log('[useProyectosStore] Usuario desautenticado, limpiando...');
        setProyectos([]);
        lastLoadTime.current = 0;
      }
    });

    // Carga inicial si ya hay sesión
    cargarProyectos();

    return () => subscription.unsubscribe();
  }, [cargarProyectos]);

  // Helper para hacer update con fallback
  const updateProyectoSeguro = useCallback(async (
    id: string,
    datosCompletos: any,
    datosMinimos: any,
    nombreAccion: string
  ) => {
    try {
      // Intento 1: update completo
      let { error } = await supabase
        .from('proyectos')
        .update(datosCompletos)
        .eq('id', id);

      if (error) {
        console.warn(`[useProyectosStore] ${nombreAccion} error completo:`, error.message);

        // Intento 2: update mínimo (solo estado)
        const { error: errorMinimo } = await supabase
          .from('proyectos')
          .update(datosMinimos)
          .eq('id', id);

        if (errorMinimo) {
          console.error(`[useProyectosStore] ${nombreAccion} error mínimo:`, errorMinimo.message);
          toast.error(`${nombreAccion} falló: ${errorMinimo.message}`);
          return false;
        }

        console.log(`[useProyectosStore] ${nombreAccion} exitoso (mínimo)`);
        return true;
      }

      console.log(`[useProyectosStore] ${nombreAccion} exitoso (completo)`);
      return true;
    } catch (e: any) {
      console.error(`[useProyectosStore] ${nombreAccion} excepción:`, e.message);
      toast.error(`${nombreAccion} falló: ${e.message}`);
      return false;
    }
  }, []);

  const convertirAVenta = useCallback(async (datos: {
    numeroCotizacion: string;
    ordenCompra: string;
    tipoProyecto: 'suministro' | 'maquinado';
    clienteId: string;
    clienteNombre: string;
    proyectoNombre: string;
    totalCotizado: number;
    margenUtilidad: number;
    ivaPorcentaje: number;
    piezas: any[];
    materiales: any[];
    procesos: any[];
    costosAdicionales: any;
    cotizacionId?: string;
    codigoManual?: string;
  }) => {
    console.log('[useProyectosStore] === CONVERTIR A VENTA ===');
    console.log('[useProyectosStore] Datos recibidos:', datos);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Error: No estás autenticado');
        return false;
      }

      // 1. Código de proyecto: manual si el usuario lo capturó,
      //    si no, consecutivo automático MAQ-26-0001 / SUM-26-0002
      let codigoProyecto = datos.codigoManual?.trim() || '';
      if (!codigoProyecto) {
        console.log('[useProyectosStore] Generando código para tipo:', datos.tipoProyecto);
        const { data: codigoData, error: codigoError } = await supabase
          .rpc('generar_codigo_proyecto_v2', {
            tipo: datos.tipoProyecto
          });

        if (codigoError) {
          console.error('[useProyectosStore] ERROR generando código:', codigoError);
          toast.error('Error generando código de proyecto: ' + codigoError.message);
          return false;
        }
        codigoProyecto = codigoData || '';
      }
      console.log('[useProyectosStore] Código:', codigoProyecto);

      // Guardar cada pieza con el código del proyecto (tabla piezas_proyecto)
      const guardarPiezasProyecto = async (proyectoId: string) => {
        if (!datos.piezas || datos.piezas.length === 0) return;
        const filas = datos.piezas.map((pz: any) => ({
          proyecto_id: proyectoId,
          codigo_proyecto: codigoProyecto,
          pieza_id: pz.id,
          codigo_pieza: pz.codigo || '',
          nombre: pz.nombre || 'Pieza',
          cantidad: Number(pz.cantidad) || 1,
          material: pz.material || {},
          procesos: pz.procesos || [],
          horas_cotizadas: (pz.procesos || []).reduce(
            (s: number, pr: any) => s + (Number(pr.tiempoMinutos) || 0), 0
          ) / 60,
          usuario_id: userData.user.id,
        }));
        const { error } = await supabase.from('piezas_proyecto').insert(filas);
        if (error) {
          console.error('[useProyectosStore] Error guardando piezas:', error.message);
          toast.error('Proyecto creado, pero falló el registro de piezas: ' + error.message);
        }
      };

      // 2. Construir datos del proyecto
      const proyectoData: any = {
        usuario_id: userData.user.id,
        codigo_proyecto: codigoProyecto,
        tipo_proyecto: datos.tipoProyecto,
        numero_cotizacion: datos.numeroCotizacion || '',
        orden_compra: datos.ordenCompra || '',
        cliente_nombre: datos.clienteNombre || '',
        proyecto_nombre: datos.proyectoNombre || '',
        total_cotizado: Number(datos.totalCotizado) || 0,
        margen_utilidad: Number(datos.margenUtilidad) || 30,
        iva_porcentaje: Number(datos.ivaPorcentaje) || 16,
        estado: 'en_fabricacion',
        fecha_venta: new Date().toISOString(),
        piezas: datos.piezas || [],
        materiales: datos.materiales || [],
        procesos: datos.procesos || [],
        costos_adicionales: datos.costosAdicionales || {},
      };

      // clienteId es obligatorio, no opcional
      if (datos.clienteId && datos.clienteId.trim() !== '') {
        proyectoData.cliente_id = datos.clienteId;
      }

      // Vincular con la cotización de origen para trazabilidad
      if (datos.cotizacionId && datos.cotizacionId.trim() !== '') {
        proyectoData.cotizacion_id = datos.cotizacionId;
      }

      console.log('[useProyectosStore] Insertando proyecto:', proyectoData);

      // 3. Insertar en Supabase
      const { data, error } = await supabase
        .from('proyectos')
        .insert([proyectoData])
        .select()
        .single();

      if (error) {
        console.error('[useProyectosStore] ERROR INSERT:', error);

        if (error.message?.includes('cliente_id') || error.code === 'PGRST204') {
          console.log('[useProyectosStore] Reintentando sin cliente_id...');
          delete proyectoData.cliente_id;

          const { data: retryData, error: retryError } = await supabase
            .from('proyectos')
            .insert([proyectoData])
            .select()
            .single();

          if (retryError) {
            toast.error('Error guardando venta: ' + retryError.message);
            return false;
          }

          if (retryData) {
            await guardarPiezasProyecto(retryData.id);

            const nuevoProyecto: ProyectoVenta = {
              id: retryData.id,
              codigoProyecto: retryData.codigo_proyecto || '',
              tipoProyecto: retryData.tipo_proyecto || 'maquinado',
              numeroCotizacion: retryData.numero_cotizacion || '',
              ordenCompra: retryData.orden_compra || '',
              clienteId: '',
              clienteNombre: retryData.cliente_nombre || '',
              proyectoNombre: retryData.proyecto_nombre || '',
              totalCotizado: Number(retryData.total_cotizado) || 0,
              margenUtilidad: Number(retryData.margen_utilidad) || 30,
              ivaPorcentaje: Number(retryData.iva_porcentaje) || 16,
              estado: retryData.estado || 'en_fabricacion',
              fechaVenta: retryData.fecha_venta || new Date().toISOString(),
              piezas: retryData.piezas || [],
              materiales: retryData.materiales || [],
              procesos: retryData.procesos || [],
              costosAdicionales: retryData.costos_adicionales || {},
              usuarioId: retryData.usuario_id,
            };
            setProyectos(prev => [nuevoProyecto, ...prev]);

            // Actualizar estado de cotización a orden
            if (datos.cotizacionId) {
              await supabase.from('cotizaciones').update({ estado: 'orden', updated_at: new Date().toISOString() }).eq('id', datos.cotizacionId);
            }

            toast.success(`Proyecto ${nuevoProyecto.codigoProyecto} creado exitosamente`);
            return true;
          }
        }

        toast.error('Error guardando venta: ' + error.message);
        return false;
      }

      if (data) {
        await guardarPiezasProyecto(data.id);

        const nuevoProyecto: ProyectoVenta = {
          id: data.id,
          codigoProyecto: data.codigo_proyecto || '',
          tipoProyecto: data.tipo_proyecto || 'maquinado',
          numeroCotizacion: data.numero_cotizacion || '',
          ordenCompra: data.orden_compra || '',
          clienteId: data.cliente_id || '',
          clienteNombre: data.cliente_nombre || '',
          proyectoNombre: data.proyecto_nombre || '',
          totalCotizado: Number(data.total_cotizado) || 0,
          margenUtilidad: Number(data.margen_utilidad) || 30,
          ivaPorcentaje: Number(data.iva_porcentaje) || 16,
          estado: data.estado || 'en_fabricacion',
          fechaVenta: data.fecha_venta || new Date().toISOString(),
          piezas: data.piezas || [],
          materiales: data.materiales || [],
          procesos: data.procesos || [],
          costosAdicionales: data.costos_adicionales || {},
          usuarioId: data.usuario_id,
        };
        setProyectos(prev => [nuevoProyecto, ...prev]);

        // Actualizar estado de cotización a orden SIEMPRE que se cree el proyecto
        if (datos.cotizacionId) {
          const { error: updateError } = await supabase
            .from('cotizaciones')
            .update({ estado: 'orden', updated_at: new Date().toISOString() })
            .eq('id', datos.cotizacionId);

          if (updateError) {
            console.warn('[useProyectosStore] Error actualizando estado cotización:', updateError.message);
          } else {
            console.log('[useProyectosStore] Cotización marcada como comprada');
          }
        }

        toast.success(`Proyecto ${nuevoProyecto.codigoProyecto} creado exitosamente`);
      }

      return true;
    } catch (e: any) {
      console.error('[useProyectosStore] ERROR EN CONVERTIR A VENTA:', e);
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  // ========== PROYECTO DIRECTO (URGENCIA / STOCK) ==========
  // Crea un proyecto SIN cotización y SIN orden de compra:
  // - urgencia: trabajo urgente; la cotización se genera después con datos
  //   reales y la venta impacta al registrar la PO del cliente
  // - stock: fabricación para almacén; gastos impactan al hacerse, la
  //   utilidad solo al facturar
  const crearProyectoDirecto = useCallback(async (datos: {
    tipoOrigen: 'urgencia' | 'stock';
    tipoProyecto: 'suministro' | 'maquinado';
    proyectoNombre: string;
    clienteId?: string;
    clienteNombre?: string;
    piezas?: any[];
  }): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Error: No estás autenticado');
        return null;
      }

      // Código consecutivo MAQ/SUM igual que el flujo normal
      const { data: codigoData, error: codigoError } = await supabase
        .rpc('generar_codigo_proyecto_v2', { tipo: datos.tipoProyecto });
      if (codigoError) {
        toast.error('Error generando código de proyecto: ' + codigoError.message);
        return null;
      }
      const codigoProyecto = codigoData || '';

      const proyectoData: any = {
        usuario_id: userData.user.id,
        codigo_proyecto: codigoProyecto,
        tipo_proyecto: datos.tipoProyecto,
        tipo_origen: datos.tipoOrigen,
        numero_cotizacion: '',
        orden_compra: '',
        cliente_nombre: datos.clienteNombre || (datos.tipoOrigen === 'stock' ? 'Stock / Almacén' : ''),
        proyecto_nombre: datos.proyectoNombre,
        total_cotizado: 0,
        margen_utilidad: 30,
        iva_porcentaje: 16,
        estado: 'en_fabricacion',
        fecha_venta: new Date().toISOString(),
        piezas: datos.piezas || [],
        materiales: [],
        procesos: [],
        costos_adicionales: { disenoCAD: 0, programacionCNC: 0, setup: 0, transporte: 0, otro: 0 },
      };
      if (datos.clienteId) proyectoData.cliente_id = datos.clienteId;

      const { data, error } = await supabase
        .from('proyectos')
        .insert([proyectoData])
        .select()
        .single();

      if (error) {
        toast.error('Error creando proyecto directo: ' + error.message);
        return null;
      }

      const nuevoProyecto: ProyectoVenta = {
        id: data.id,
        codigoProyecto: data.codigo_proyecto || '',
        tipoProyecto: data.tipo_proyecto || 'maquinado',
        tipoOrigen: data.tipo_origen || datos.tipoOrigen,
        stockVendido: [],
        numeroCotizacion: '',
        ordenCompra: '',
        clienteId: data.cliente_id || '',
        clienteNombre: data.cliente_nombre || '',
        proyectoNombre: data.proyecto_nombre || '',
        totalCotizado: 0,
        margenUtilidad: 30,
        ivaPorcentaje: 16,
        estado: 'en_fabricacion',
        fechaVenta: data.fecha_venta || new Date().toISOString(),
        piezas: data.piezas || [],
        materiales: [],
        procesos: [],
        costosAdicionales: proyectoData.costos_adicionales,
        usuarioId: data.usuario_id,
      };
      setProyectos(prev => [nuevoProyecto, ...prev]);
      toast.success(`Proyecto ${codigoProyecto} creado (${datos.tipoOrigen === 'stock' ? 'Stock' : 'Urgencia'})`);
      return data.id;
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
      return null;
    }
  }, []);

  // Actualizar las piezas de un proyecto directo (captura manual, sin
  // cotización de origen). También guarda en piezas_proyecto para que
  // Producción y la hoja viajera lean lo mismo.
  const actualizarPiezasProyecto = useCallback(async (id: string, piezas: any[]) => {
    const proyecto = proyectos.find(p => p.id === id);
    const exitoso = await updateProyectoSeguro(
      id,
      { piezas },
      { piezas },
      'Actualizar piezas del proyecto'
    );
    if (exitoso && proyecto) {
      // Resincronizar piezas_proyecto (borrar y reinsertar)
      await supabase.from('piezas_proyecto').delete().eq('proyecto_id', id);
      if (piezas.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const filas = piezas.map((pz: any) => ({
          proyecto_id: id,
          codigo_proyecto: proyecto.codigoProyecto,
          pieza_id: pz.id,
          codigo_pieza: pz.codigo || '',
          nombre: pz.nombre || 'Pieza',
          cantidad: Number(pz.cantidad) || 1,
          material: pz.material || {},
          procesos: pz.procesos || [],
          horas_cotizadas: (pz.procesos || []).reduce(
            (s: number, pr: any) => s + (Number(pr.tiempoMinutos) || 0), 0
          ) / 60,
          usuario_id: userData.user?.id,
        }));
        const { error } = await supabase.from('piezas_proyecto').insert(filas);
        if (error) {
          toast.error('Piezas guardadas en el proyecto, pero falló piezas_proyecto: ' + error.message);
        }
      }
    }
    return exitoso;
  }, [proyectos, updateProyectoSeguro]);

  // Vincular la cotización generada DESDE un proyecto directo: guarda la
  // liga y el snapshot de lo cotizado (baseline para Control de Códigos).
  // Los datos reales (piezas, procesosReales, etc.) NO se tocan.
  const vincularCotizacionAProyectoDirecto = useCallback(async (
    proyectoId: string,
    datos: {
      cotizacionId: string;
      numeroCotizacion: string;
      totalCotizado: number;
      margenUtilidad: number;
      ivaPorcentaje: number;
      snapshot: any;
    }
  ) => {
    const updatesDb = {
      cotizacion_id: datos.cotizacionId,
      numero_cotizacion: datos.numeroCotizacion,
      total_cotizado: datos.totalCotizado,
      margen_utilidad: datos.margenUtilidad,
      iva_porcentaje: datos.ivaPorcentaje,
      cotizado_snapshot: datos.snapshot,
    };
    const exitoso = await updateProyectoSeguro(
      proyectoId,
      updatesDb,
      { cotizacion_id: datos.cotizacionId, numero_cotizacion: datos.numeroCotizacion },
      'Vincular cotización al proyecto'
    );
    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === proyectoId ? {
        ...p,
        cotizacionId: datos.cotizacionId,
        numeroCotizacion: datos.numeroCotizacion,
        totalCotizado: datos.totalCotizado,
        margenUtilidad: datos.margenUtilidad,
        ivaPorcentaje: datos.ivaPorcentaje,
        cotizadoSnapshot: datos.snapshot,
      } as ProyectoVenta : p));
      toast.success('Proyecto actualizado con los datos de la cotización');
    }
    return exitoso;
  }, [updateProyectoSeguro]);

  // Registrar la PO del cliente en un proyecto directo (urgencia/stock):
  // formaliza la venta — a partir de aquí impacta en las métricas de vendido
  const registrarPoEnProyecto = useCallback(async (id: string, numeroPo: string) => {
    const fechaHoy = new Date().toISOString();
    const exitoso = await updateProyectoSeguro(
      id,
      { orden_compra: numeroPo, fecha_venta: fechaHoy },
      { orden_compra: numeroPo },
      'Registrar PO'
    );
    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, ordenCompra: numeroPo, fechaVenta: fechaHoy } : p));
      toast.success(`PO ${numeroPo} registrada en el proyecto`);
    }
    return exitoso;
  }, [updateProyectoSeguro]);

  // ========== VENTA PARCIAL DE STOCK ==========
  // Vende N piezas de un proyecto de stock: crea un proyecto NUEVO (código
  // consecutivo propio — un código por factura) con las cantidades vendidas
  // y sus costos/tiempos proporcionales. El proyecto padre conserva el
  // remanente y registra la venta en stock_vendido.
  const venderStockParcial = useCallback(async (
    proyectoId: string,
    ventas: { piezaId: string; cantidad: number }[],
    clienteId?: string,
    clienteNombre?: string
  ): Promise<string | null> => {
    const padre = proyectos.find(p => p.id === proyectoId);
    if (!padre || (padre.tipoOrigen || 'cotizacion') !== 'stock') {
      toast.error('Solo se puede vender parcial desde un proyecto de stock');
      return null;
    }

    // Escala una pieza a una cantidad distinta (proporcional por pieza)
    const escalarPieza = (pz: any, cantidad: number) => ({
      ...pz,
      cantidad,
      procesos: (pz.procesos || []).map((pr: any) => ({
        ...pr,
        tiempoMinutos: (Number(pr.tiempoMinutosPorPieza) || 0) * cantidad,
        costoManoObra: ((Number(pr.costoManoObra) || 0) / (pz.cantidad || 1)) * cantidad,
        costoTotal: ((Number(pr.costoTotal) || 0) / (pz.cantidad || 1)) * cantidad,
      })),
    });

    const piezasVendidas: any[] = [];
    const piezasRemanentes: any[] = [];
    for (const pz of padre.piezas || []) {
      const v = ventas.find(x => x.piezaId === pz.id);
      const vendida = Math.min(Math.max(0, Math.floor(v?.cantidad || 0)), pz.cantidad);
      if (vendida > 0) piezasVendidas.push(escalarPieza(pz, vendida));
      const resta = pz.cantidad - vendida;
      if (resta > 0) piezasRemanentes.push(escalarPieza(pz, resta));
    }
    if (piezasVendidas.length === 0) {
      toast.error('Indica cuántas piezas se venden');
      return null;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Error: No estás autenticado');
        return null;
      }

      // Código nuevo consecutivo (un código por factura)
      const { data: codigoData, error: codigoError } = await supabase
        .rpc('generar_codigo_proyecto_v2', { tipo: padre.tipoProyecto });
      if (codigoError) {
        toast.error('Error generando código: ' + codigoError.message);
        return null;
      }
      const codigoHijo = codigoData || '';

      const hijoData: any = {
        usuario_id: userData.user.id,
        codigo_proyecto: codigoHijo,
        tipo_proyecto: padre.tipoProyecto,
        tipo_origen: 'stock',
        numero_cotizacion: '',
        orden_compra: '',
        cliente_nombre: clienteNombre || padre.clienteNombre || '',
        proyecto_nombre: `${padre.proyectoNombre} (venta de stock)`,
        total_cotizado: 0,
        margen_utilidad: padre.margenUtilidad || 30,
        iva_porcentaje: padre.ivaPorcentaje || 16,
        estado: 'en_fabricacion',
        fecha_venta: new Date().toISOString(),
        piezas: piezasVendidas,
        materiales: [],
        procesos: [],
        costos_adicionales: { disenoCAD: 0, programacionCNC: 0, setup: 0, transporte: 0, otro: 0 },
      };
      if (clienteId || padre.clienteId) hijoData.cliente_id = clienteId || padre.clienteId;

      const { data: hijo, error: errorHijo } = await supabase
        .from('proyectos')
        .insert([hijoData])
        .select()
        .single();
      if (errorHijo) {
        toast.error('Error creando proyecto de venta: ' + errorHijo.message);
        return null;
      }

      // Actualizar padre: remanente + registro de la venta
      const registroVenta = {
        proyectoDestinoId: hijo.id,
        codigoDestino: codigoHijo,
        fecha: new Date().toISOString(),
        piezas: piezasVendidas.map(p => ({ piezaId: p.id, cantidad: p.cantidad, nombre: p.nombre })),
      };
      const nuevoStockVendido = [...(padre.stockVendido || []), registroVenta];
      const exitoso = await updateProyectoSeguro(
        proyectoId,
        { piezas: piezasRemanentes, stock_vendido: nuevoStockVendido },
        { stock_vendido: nuevoStockVendido },
        'Actualizar remanente de stock'
      );
      if (!exitoso) {
        toast.error('Venta creada, pero no se actualizó el remanente del stock');
      }

      setProyectos(prev => [
        {
          id: hijo.id,
          codigoProyecto: codigoHijo,
          tipoProyecto: padre.tipoProyecto,
          tipoOrigen: 'stock',
          stockVendido: [],
          numeroCotizacion: '',
          ordenCompra: '',
          clienteId: hijo.cliente_id || '',
          clienteNombre: hijo.cliente_nombre || '',
          proyectoNombre: hijo.proyecto_nombre,
          totalCotizado: 0,
          margenUtilidad: padre.margenUtilidad || 30,
          ivaPorcentaje: padre.ivaPorcentaje || 16,
          estado: 'en_fabricacion',
          fechaVenta: hijo.fecha_venta,
          piezas: piezasVendidas,
          materiales: [],
          procesos: [],
          costosAdicionales: hijoData.costos_adicionales,
          usuarioId: hijo.usuario_id,
        } as ProyectoVenta,
        ...prev.map(p => p.id === proyectoId
          ? { ...p, piezas: piezasRemanentes, stockVendido: nuevoStockVendido }
          : p),
      ]);

      toast.success(`Venta registrada: ${codigoHijo} (remanente actualizado en ${padre.codigoProyecto})`);
      return hijo.id;
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
      return null;
    }
  }, [proyectos, updateProyectoSeguro]);

  const marcarFabricado = useCallback(async (id: string) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const exitoso = await updateProyectoSeguro(
      id,
      { estado: 'fabricado', fecha_fabricado: fechaHoy },
      { estado: 'fabricado' },
      'Marcar fabricado'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'fabricado', fechaFabricado: fechaHoy } : p));
      toast.success('Proyecto marcado como fabricado');
    }
  }, [updateProyectoSeguro]);

  const marcarEntregado = useCallback(async (id: string) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const exitoso = await updateProyectoSeguro(
      id,
      { estado: 'entregado', fecha_entregado: fechaHoy },
      { estado: 'entregado' },
      'Marcar entregado'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: 'entregado', fechaEntregado: fechaHoy } : p));
      toast.success('Proyecto marcado como entregado');
    }
  }, [updateProyectoSeguro]);

  const marcarFacturado = useCallback(async (id: string, numeroFactura: string, totalFacturado: number) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const exitoso = await updateProyectoSeguro(
      id,
      {
        estado: 'facturado',
        fecha_facturado: fechaHoy,
        numero_factura: numeroFactura,
        total_facturado: totalFacturado
      },
      { estado: 'facturado' },
      'Marcar facturado'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? {
        ...p,
        estado: 'facturado',
        fechaFacturado: fechaHoy,
        numeroFactura,
        totalFacturado
      } : p));
      toast.success('Proyecto facturado');
    }
  }, [updateProyectoSeguro]);

  const guardarDatosReales = useCallback(async (id: string, datos: any) => {
    const procesos = datos.procesosReales || datos.procesos || [];
    const materiales = datos.materialesReales || [];
    const costosAdicionales = datos.costosAdicionalesReales;
    const utilidadReal = datos.utilidadReal;

    const updateData: any = {};
    if (procesos.length > 0) updateData.procesos_reales = procesos;
    if (materiales.length > 0) updateData.materiales_reales = materiales;
    if (costosAdicionales) updateData.costos_adicionales_reales = costosAdicionales;
    if (datos.costoTotalReal !== undefined && datos.costoTotalReal !== null) updateData.costo_total_real = datos.costoTotalReal;
    if (utilidadReal !== undefined && utilidadReal !== null) updateData.utilidad_real = utilidadReal;
    if (datos.porcentajeUtilidadReal !== undefined && datos.porcentajeUtilidadReal !== null) updateData.porcentaje_utilidad_real = datos.porcentajeUtilidadReal;

    const exitoso = await updateProyectoSeguro(
      id,
      updateData,
      {},
      'Guardar datos reales'
    );

    if (exitoso) {
      setProyectos(prev => prev.map(p => p.id === id ? {
        ...p,
        procesosReales: procesos.length > 0 ? procesos : p.procesosReales,
        materialesReales: materiales.length > 0 ? materiales : p.materialesReales,
        costosAdicionalesReales: costosAdicionales || p.costosAdicionalesReales,
        utilidadReal: utilidadReal !== undefined ? utilidadReal : p.utilidadReal
      } : p));
    }
  }, [updateProyectoSeguro]);

  const eliminarProyecto = useCallback(async (id: string) => {
    try {
      const proyecto = proyectos.find(p => p.id === id);

      await supabase.from('proyectos').delete().eq('id', id);
      setProyectos(prev => prev.filter(p => p.id !== id));

      // Al eliminar el proyecto, su cotización vuelve a 'Cotización'
      // (queda lista para convertirse de nuevo si se requiere).
      // Proyectos DIRECTOS (urgencia/stock): la cotización se generó DESDE
      // el proyecto — no se toca su estado.
      if (proyecto && (!proyecto.tipoOrigen || proyecto.tipoOrigen === 'cotizacion')) {
        let query = supabase
          .from('cotizaciones')
          .update({ estado: 'cotizacion', updated_at: new Date().toISOString() });

        if (proyecto.cotizacionId) {
          query = query.eq('id', proyecto.cotizacionId);
        } else if (proyecto.numeroCotizacion) {
          query = query.eq('numero', proyecto.numeroCotizacion);
        } else {
          query = null as any;
        }

        if (query) {
          const { error } = await query;
          if (error) {
            console.error('[useProyectosStore] Error regresando cotización a "cotizacion":', error.message);
            toast.error('Proyecto eliminado, pero no se pudo actualizar la cotización: ' + error.message);
          } else {
            toast.success(`Cotización ${proyecto.numeroCotizacion} regresó a "Cotización"`);
          }
        }
      }
    } catch (e) { console.error(e); }
  }, [proyectos]);

  const refrescarDesdeSupabase = useCallback(async () => {
    await cargarProyectos();
  }, [cargarProyectos]);

  return {
    proyectos,
    cargando,
    error,
    convertirAVenta,
    crearProyectoDirecto,
    actualizarPiezasProyecto,
    vincularCotizacionAProyectoDirecto,
    registrarPoEnProyecto,
    venderStockParcial,
    eliminarProyecto,
    marcarFabricado,
    marcarEntregado,
    marcarFacturado,
    guardarDatosReales,
    refrescarDesdeSupabase,
    cargarProyectos,
  };
};
