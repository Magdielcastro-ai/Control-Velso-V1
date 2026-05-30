import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { 
  Cotizacion, 
  DatosTaller, 
  DatosCliente, 
  EspecificacionesProyecto,
  Material,
  Proceso,
  CostosAdicionales,
  CondicionesComerciales,
  CotizacionGuardada,
  TipoProcesoVelso,
  PiezaCotizacion,
  TipoCotizacion
} from '@/types/cotizacion';
import { CATALOGO_PROCESOS_VELSO, COSTOS_MANO_OBRA } from '@/types/cotizacion';
import { toast } from 'sonner';

const generarNumeroCotizacion = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear().toString().slice(-2);
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CNC-${anio}${mes}-${random}`;
};

const calcularCostoMaterial = (material: Material): number => {
  const costoBase = material.cantidad * material.costoUnitario;
  const factorMargen = 1 + (material.margenPorcentaje / 100);
  return costoBase * factorMargen;
};

const calcularCostoProceso = (proceso: Proceso): number => {
  const tiempoHoras = proceso.tiempoMinutos / 60;
  const costoMaquina = tiempoHoras * proceso.costoPorHora;
  const costoManoObra = tiempoHoras * proceso.costoManoObra;
  return costoMaquina + costoManoObra;
};

const piezaVacia = (): PiezaCotizacion => ({
  id: crypto.randomUUID(),
  nombre: 'Pieza',
  cantidad: 1,
  materiales: [],
  procesos: [],
  costosAdicionales: {
    disenoCAD: 0,
    programacionCNC: 0,
    setup: 0,
    transporte: 0,
    otro: 0,
  },
  subtotalPieza: 0,
  ivaPieza: 0,
  totalPieza: 0,
});

const cotizacionVacia = (tipo: TipoCotizacion = 'pieza_unica'): Cotizacion => ({
  id: '',
  numero: generarNumeroCotizacion(),
  fecha: new Date().toISOString().split('T')[0],
  tipo,
  datosTaller: {
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
  },
  datosCliente: {
    nombre: '',
    empresa: '',
    direccion: '',
    telefono: '',
    email: '',
  },
  proyecto: {
    nombre: '',
    descripcion: '',
    cantidad: 1,
  },
  piezas: [piezaVacia()],
  materiales: [],
  procesos: [],
  costosAdicionales: {
    disenoCAD: 0,
    programacionCNC: 0,
    setup: 0,
    transporte: 0,
    otro: 0,
  },
  condiciones: {
    validezDias: 15,
    tiempoEntregaDias: 7,
    formaPago: '50% anticipo, 50% contra entrega',
    anticipoPorcentaje: 50,
    garantia: '30 días contra defectos de fabricación',
  },
  subtotal: 0,
  ivaPorcentaje: 16,
  iva: 0,
  total: 0,
  margenUtilidad: 30,
});

export const useCotizacionStore = () => {
  const [cotizacion, setCotizacion] = useState<Cotizacion>(cotizacionVacia());
  const [cotizacionesGuardadas, setCotizacionesGuardadas] = useState<CotizacionGuardada[]>([]);
  const [cargado, setCargado] = useState(false);

  const refrescarDesdeSupabase = useCallback(async () => {
    try {
      console.log('[useCotizacionStore] Refrescando desde Supabase...');
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('id, numero, created_at, tipo, cliente_nombre, proyecto_nombre, total, estado, usuario_id, piezas')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const cotizacionesFormateadas: CotizacionGuardada[] = data.map(c => ({
          id: c.id,
          numero: c.numero,
          fecha: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          tipo: c.tipo || 'pieza_unica',
          clienteNombre: c.cliente_nombre,
          proyectoNombre: c.proyecto_nombre,
          total: c.total,
          estado: c.estado,
          usuarioId: c.usuario_id,
          cantidadPiezas: c.piezas ? JSON.parse(c.piezas).length : 1,
        }));

        setCotizacionesGuardadas(cotizacionesFormateadas);
        console.log('[useCotizacionStore] Refrescado desde Supabase:', data.length);
      }
      return true;
    } catch (err) {
      console.warn('[useCotizacionStore] Error refrescando:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    refrescarDesdeSupabase().then(() => setCargado(true));
  }, [refrescarDesdeSupabase]);

  // ========== PIEZAS ==========

  const agregarPieza = useCallback((nombre: string, cantidad: number = 1) => {
    const nuevaPieza = piezaVacia();
    nuevaPieza.nombre = nombre;
    nuevaPieza.cantidad = cantidad;

    setCotizacion(prev => {
      const nuevasPiezas = [...prev.piezas, nuevaPieza];
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);

  const eliminarPieza = useCallback((piezaId: string) => {
    setCotizacion(prev => {
      if (prev.piezas.length <= 1) {
        toast.error('Debe haber al menos una pieza');
        return prev;
      }
      const nuevasPiezas = prev.piezas.filter(p => p.id !== piezaId);
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);

  const actualizarPieza = useCallback((piezaId: string, datos: Partial<PiezaCotizacion>) => {
    setCotizacion(prev => {
      const nuevasPiezas = prev.piezas.map(p => 
        p.id === piezaId ? { ...p, ...datos } : p
      );
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);



  // ========== MATERIALES POR PIEZA ==========

  const agregarMaterialAPieza = useCallback((piezaId: string, material: Omit<Material, 'id' | 'costoTotal'>) => {
    const nuevoMaterial: Material = {
      ...material,
      id: crypto.randomUUID(),
      costoTotal: calcularCostoMaterial({ ...material, id: '', costoTotal: 0 }),
    };

    setCotizacion(prev => {
      const nuevasPiezas = prev.piezas.map((p: PiezaCotizacion) => {
        if (p.id !== piezaId) return p;
        return { ...p, materiales: [...p.materiales, nuevoMaterial] };
      });
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);

  const eliminarMaterialDePieza = useCallback((piezaId: string, materialId: string) => {
    setCotizacion(prev => {
      const nuevasPiezas = prev.piezas.map((p: PiezaCotizacion) => {
        if (p.id !== piezaId) return p;
        return { ...p, materiales: p.materiales.filter((m: Material) => m.id !== materialId) };
      });
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);

  // ========== PROCESOS POR PIEZA ==========

  const agregarProcesoAPieza = useCallback((
    piezaId: string,
    tipoProceso: TipoProcesoVelso,
    tiempoMinutos: number,
    descripcion?: string,
    tipoManoObra?: 'mo_s' | 'mo_e'
  ) => {
    const catalogoItem = CATALOGO_PROCESOS_VELSO.find(p => p.id === tipoProceso);
    if (!catalogoItem) return;

    let costoManoObra = 0;
    let incluyeManoObra = false;
    let tipoManoObraSeleccionada: 'mo_s' | 'mo_e' | undefined = undefined;

    if (catalogoItem.categoria === 'maquina' && tipoManoObra) {
      costoManoObra = COSTOS_MANO_OBRA[tipoManoObra];
      incluyeManoObra = true;
      tipoManoObraSeleccionada = tipoManoObra;
    } else if (catalogoItem.requiereManoObra === 'mo_s') {
      costoManoObra = COSTOS_MANO_OBRA.mo_s;
      incluyeManoObra = true;
      tipoManoObraSeleccionada = 'mo_s';
    } else if (catalogoItem.requiereManoObra === 'mo_e') {
      costoManoObra = COSTOS_MANO_OBRA.mo_e;
      incluyeManoObra = true;
      tipoManoObraSeleccionada = 'mo_e';
    }

    const nuevoProceso: Proceso = {
      id: crypto.randomUUID(),
      nombre: catalogoItem.nombre,
      tipo: tipoProceso,
      tiempoMinutos,
      costoPorHora: catalogoItem.costoPorHora,
      costoManoObra,
      costoTotal: 0,
      descripcion: descripcion || catalogoItem.descripcion,
      incluyeManoObra,
      tipoManoObraSeleccionada,
    };

    nuevoProceso.costoTotal = calcularCostoProceso(nuevoProceso);

    setCotizacion(prev => {
      const nuevasPiezas = prev.piezas.map((p: PiezaCotizacion) => {
        if (p.id !== piezaId) return p;
        return { ...p, procesos: [...p.procesos, nuevoProceso] };
      });
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);

  const eliminarProcesoDePieza = useCallback((piezaId: string, procesoId: string) => {
    setCotizacion(prev => {
      const nuevasPiezas = prev.piezas.map((p: PiezaCotizacion) => {
        if (p.id !== piezaId) return p;
        return { ...p, procesos: p.procesos.filter((pr: Proceso) => pr.id !== procesoId) };
      });
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);

  // ========== COSTOS ADICIONALES POR PIEZA ==========

  const actualizarCostosAdicionalesPieza = useCallback((piezaId: string, datos: Partial<CostosAdicionales>) => {
    setCotizacion(prev => {
      const nuevasPiezas = prev.piezas.map((p: PiezaCotizacion) => {
        if (p.id !== piezaId) return p;
        return { ...p, costosAdicionales: { ...p.costosAdicionales, ...datos } };
      });
      return recalcularTotales({ ...prev, piezas: nuevasPiezas });
    });
  }, []);

  // ========== COSTOS ADICIONALES GENERALES ==========

  const actualizarCostosAdicionales = useCallback((datos: Partial<CostosAdicionales>) => {
    setCotizacion(prev => {
      const nueva = {
        ...prev,
        costosAdicionales: { ...prev.costosAdicionales, ...datos },
      };
      return recalcularTotales(nueva);
    });
  }, []);

  // ========== CÁLCULOS ==========

  const recalcularTotales = (c: Cotizacion): Cotizacion => {
    // Recalcular cada pieza
    const piezasRecalculadas = c.piezas.map((pieza: PiezaCotizacion) => {
      const costoMateriales = pieza.materiales.reduce((sum: number, m: Material) => sum + m.costoTotal, 0);
      const costoProcesos = pieza.procesos.reduce((sum: number, p: Proceso) => sum + p.costoTotal, 0);
      const costosAdicionalesPieza = Object.values(pieza.costosAdicionales).reduce((sum: number, v: number) => sum + v, 0);

      const costoDirectoPieza = costoMateriales + costoProcesos + costosAdicionalesPieza;
      const factorMargen = 1 + (c.margenUtilidad / 100);
      const subtotalPieza = costoDirectoPieza * factorMargen;
      const ivaPieza = subtotalPieza * (c.ivaPorcentaje / 100);
      const totalPieza = subtotalPieza + ivaPieza;

      return {
        ...pieza,
        subtotalPieza,
        ivaPieza,
        totalPieza,
      };
    });

    // Costos generales del proyecto
    const costosGenerales = Object.values(c.costosAdicionales).reduce((sum: number, v: number) => sum + v, 0);

    // Total del proyecto
    const subtotal = piezasRecalculadas.reduce((sum, p) => sum + p.subtotalPieza, 0) + costosGenerales;
    const iva = subtotal * (c.ivaPorcentaje / 100);
    const total = subtotal + iva;

    return {
      ...c,
      piezas: piezasRecalculadas,
      subtotal,
      iva,
      total,
    };
  };

  // ========== DATOS GENERALES ==========

  const actualizarDatosTaller = useCallback((datos: Partial<DatosTaller>) => {
    setCotizacion(prev => ({ ...prev, datosTaller: { ...prev.datosTaller, ...datos } }));
  }, []);

  const actualizarDatosCliente = useCallback((datos: Partial<DatosCliente>) => {
    setCotizacion(prev => ({ ...prev, datosCliente: { ...prev.datosCliente, ...datos } }));
  }, []);

  const actualizarProyecto = useCallback((datos: Partial<EspecificacionesProyecto>) => {
    setCotizacion(prev => ({ ...prev, proyecto: { ...prev.proyecto, ...datos } }));
  }, []);

  const actualizarCondiciones = useCallback((datos: Partial<CondicionesComerciales>) => {
    setCotizacion(prev => ({ ...prev, condiciones: { ...prev.condiciones, ...datos } }));
  }, []);

  const actualizarMargenUtilidad = useCallback((margen: number) => {
    setCotizacion(prev => {
      const nueva = { ...prev, margenUtilidad: margen };
      return recalcularTotales(nueva);
    });
  }, []);

  const cambiarTipoCotizacion = useCallback((tipo: TipoCotizacion) => {
    setCotizacion(prev => {
      if (tipo === 'pieza_unica' && prev.piezas.length > 1) {
        // Si cambia a pieza única, consolidar todo en 1 pieza
        const todasMateriales = prev.piezas.flatMap(p => p.materiales);
        const todosProcesos = prev.piezas.flatMap(p => p.procesos);
        const piezaUnica: PiezaCotizacion = {
          ...piezaVacia(),
          nombre: prev.proyecto.nombre || 'Pieza Única',
          cantidad: prev.proyecto.cantidad || 1,
          materiales: todasMateriales,
          procesos: todosProcesos,
        };
        return recalcularTotales({ ...prev, tipo, piezas: [piezaUnica] });
      }
      return recalcularTotales({ ...prev, tipo });
    });
  }, []);

  // ========== GUARDAR / CARGAR ==========

  const guardarCotizacion = useCallback(async (estado: CotizacionGuardada['estado'] = 'borrador') => {
    const id = cotizacion.id || crypto.randomUUID();
    const nuevaCotizacion = { ...cotizacion, id };

    setCotizacion(nuevaCotizacion);

    const { data: { user } } = await supabase.auth.getUser();

    const guardada: CotizacionGuardada = {
      id,
      numero: nuevaCotizacion.numero,
      fecha: nuevaCotizacion.fecha,
      tipo: nuevaCotizacion.tipo,
      clienteNombre: nuevaCotizacion.datosCliente.nombre || nuevaCotizacion.datosCliente.empresa || 'Sin cliente',
      proyectoNombre: nuevaCotizacion.proyecto.nombre || 'Sin nombre',
      total: nuevaCotizacion.total,
      estado,
      usuarioId: user?.id,
      cantidadPiezas: nuevaCotizacion.piezas.length,
    };

    setCotizacionesGuardadas(prev => {
      const existente = prev.findIndex(c => c.id === id);
      if (existente >= 0) {
        const nuevas = [...prev];
        nuevas[existente] = guardada;
        return nuevas;
      }
      return [guardada, ...prev];
    });

    if (user) {
      try {
        const cotizacionDB = {
          id,
          numero: nuevaCotizacion.numero,
          tipo: nuevaCotizacion.tipo,
          usuario_id: user.id,
          cliente_id: nuevaCotizacion.datosCliente.clienteId || null,
          cliente_nombre: nuevaCotizacion.datosCliente.nombre || nuevaCotizacion.datosCliente.empresa || 'Sin cliente',
          proyecto_nombre: nuevaCotizacion.proyecto.nombre || 'Sin nombre',
          datos_taller: nuevaCotizacion.datosTaller,
          datos_cliente: nuevaCotizacion.datosCliente,
          piezas: nuevaCotizacion.piezas,
          materiales: nuevaCotizacion.materiales,
          procesos: nuevaCotizacion.procesos,
          costos_adicionales: nuevaCotizacion.costosAdicionales,
          margen_utilidad: nuevaCotizacion.margenUtilidad,
          iva_porcentaje: nuevaCotizacion.ivaPorcentaje,
          subtotal: nuevaCotizacion.subtotal,
          total: nuevaCotizacion.total,
          estado,
        };

        console.log('[guardarCotizacion] Guardando en Supabase:', cotizacionDB);

        const { data, error } = await supabase
          .from('cotizaciones')
          .upsert(cotizacionDB)
          .select();

        if (error) {
          console.error('[guardarCotizacion] Error al guardar en Supabase:', error);
          toast.error('Error al sincronizar con la nube: ' + error.message);
        } else {
          console.log('[guardarCotizacion] Cotización guardada exitosamente:', data);
          toast.success('Cotización guardada en la nube');
        }
      } catch (err: any) {
        console.error('[guardarCotizacion] Error de conexión con Supabase:', err);
        toast.error('Error de conexión: ' + err.message);
      }
    } else {
      toast.warning('No hay sesión activa. La cotización se guardó solo en memoria.');
    }

    return id;
  }, [cotizacion]);

  const cargarCotizacion = useCallback(async (id: string): Promise<boolean> => {
    try {
      console.log('[cargarCotizacion] Intentando cargar desde Supabase:', id);
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.warn('[cargarCotizacion] Error cargando de Supabase:', error);
        return false;
      }

      if (data) {
        console.log('[cargarCotizacion] Cotización cargada de Supabase:', data);

        let contactosCliente: any[] = [];
        if (data.cliente_id) {
          const { data: contactosData, error: contactosError } = await supabase
            .from('contactos')
            .select('*')
            .eq('cliente_id', data.cliente_id);

          if (!contactosError && contactosData) {
            contactosCliente = contactosData;
          }
        }

        const datosCliente = data.datos_cliente || cotizacionVacia().datosCliente;

        if (contactosCliente.length > 0) {
          datosCliente.contactos = contactosCliente.map(c => ({
            id: c.id,
            nombre: c.nombre,
            departamento: c.departamento || '',
            email: c.email || '',
            telefono: c.telefono || '',
            celular: c.celular || '',
            esPrincipal: c.es_principal,
          }));
        }

        // Parsear piezas (pueden venir como string o JSON)
        let piezas: PiezaCotizacion[] = [];
        if (data.piezas) {
          try {
            piezas = typeof data.piezas === 'string' ? JSON.parse(data.piezas) : data.piezas;
          } catch (e) {
            console.warn('[cargarCotizacion] Error parseando piezas:', e);
          }
        }

        // Fallback: si no hay piezas, crear una desde materiales/procesos antiguos
        if (piezas.length === 0 && (data.materiales?.length > 0 || data.procesos?.length > 0)) {
          piezas = [{
            id: crypto.randomUUID(),
            nombre: data.proyecto_nombre || 'Pieza',
            cantidad: 1,
            materiales: data.materiales || [],
            procesos: data.procesos || [],
            costosAdicionales: data.costos_adicionales || {
              disenoCAD: 0,
              programacionCNC: 0,
              setup: 0,
              transporte: 0,
              otro: 0,
            },
            subtotalPieza: 0,
            ivaPieza: 0,
            totalPieza: 0,
          }];
        }

        // Si aún no hay piezas, crear una vacía
        if (piezas.length === 0) {
          piezas = [piezaVacia()];
        }

        const cotizacionCargada: Cotizacion = {
          id: data.id,
          numero: data.numero,
          fecha: data.fecha || new Date().toISOString().split('T')[0],
          tipo: data.tipo || 'pieza_unica',
          datosTaller: data.datos_taller || cotizacionVacia().datosTaller,
          datosCliente: datosCliente,
          proyecto: {
            nombre: data.proyecto_nombre || '',
            descripcion: '',
            cantidad: 1,
          },
          piezas,
          materiales: data.materiales || [],
          procesos: data.procesos || [],
          costosAdicionales: data.costos_adicionales || cotizacionVacia().costosAdicionales,
          condiciones: cotizacionVacia().condiciones,
          subtotal: data.subtotal || 0,
          ivaPorcentaje: data.iva_porcentaje || 16,
          iva: (data.subtotal || 0) * (data.iva_porcentaje || 16) / 100,
          total: data.total || 0,
          margenUtilidad: data.margen_utilidad || 30,
        };

        setCotizacion(cotizacionCargada);
        return true;
      }
    } catch (err) {
      console.warn('[cargarCotizacion] Error de conexión con Supabase:', err);
    }

    return false;
  }, []);

  const eliminarCotizacionGuardada = useCallback(async (id: string) => {
    setCotizacionesGuardadas(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('cotizaciones')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando de Supabase:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  const nuevaCotizacion = useCallback((tipo: TipoCotizacion = 'pieza_unica') => {
    setCotizacion(cotizacionVacia(tipo));
  }, []);

  return {
    cotizacion,
    cotizacionesGuardadas,
    cargado,
    // Piezas
    agregarPieza,
    eliminarPieza,
    actualizarPieza,
    // Materiales por pieza
    agregarMaterialAPieza,
    eliminarMaterialDePieza,
    // Procesos por pieza
    agregarProcesoAPieza,
    eliminarProcesoDePieza,
    // Costos por pieza
    actualizarCostosAdicionalesPieza,
    // Generales
    actualizarDatosTaller,
    actualizarDatosCliente,
    actualizarProyecto,
    actualizarCostosAdicionales,
    actualizarCondiciones,
    actualizarMargenUtilidad,
    cambiarTipoCotizacion,
    guardarCotizacion,
    cargarCotizacion,
    eliminarCotizacionGuardada,
    nuevaCotizacion,
    refrescarDesdeSupabase,
  };
};
