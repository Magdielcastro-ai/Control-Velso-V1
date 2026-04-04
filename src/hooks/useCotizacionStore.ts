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
  TipoProcesoVelso
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

const cotizacionVacia: Cotizacion = {
  id: '',
  numero: generarNumeroCotizacion(),
  fecha: new Date().toISOString().split('T')[0],
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
};

export const useCotizacionStore = () => {
  const [cotizacion, setCotizacion] = useState<Cotizacion>(cotizacionVacia);
  const [cotizacionesGuardadas, setCotizacionesGuardadas] = useState<CotizacionGuardada[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar cotizaciones desde localStorage (la pantalla de carga ya sincronizó con Supabase)
  useEffect(() => {
    const cargarCotizaciones = () => {
      const guardadas = localStorage.getItem('cotizaciones_cnc');
      if (guardadas) {
        try {
          setCotizacionesGuardadas(JSON.parse(guardadas));
          console.log('[useCotizacionStore] Cargadas desde localStorage:', JSON.parse(guardadas).length);
        } catch (e) {
          console.error('Error al cargar cotizaciones del localStorage:', e);
        }
      }
      setCargado(true);
    };

    cargarCotizaciones();
  }, []);

  // Guardar cotizaciones en localStorage
  useEffect(() => {
    localStorage.setItem('cotizaciones_cnc', JSON.stringify(cotizacionesGuardadas));
  }, [cotizacionesGuardadas]);

  const recalcularTotales = useCallback((c: Cotizacion): Cotizacion => {
    const costoMateriales = c.materiales.reduce((sum, m) => sum + m.costoTotal, 0);
    const costoProcesos = c.procesos.reduce((sum, p) => sum + p.costoTotal, 0);
    const costosAdicionales = Object.values(c.costosAdicionales).reduce((sum, v) => sum + v, 0);
    
    const costoDirecto = costoMateriales + costoProcesos + costosAdicionales;
    const factorMargen = 1 + (c.margenUtilidad / 100);
    const subtotal = costoDirecto * factorMargen;
    const iva = subtotal * (c.ivaPorcentaje / 100);
    const total = subtotal + iva;

    return {
      ...c,
      subtotal,
      iva,
      total,
    };
  }, []);

  const actualizarDatosTaller = useCallback((datos: Partial<DatosTaller>) => {
    setCotizacion(prev => ({
      ...prev,
      datosTaller: { ...prev.datosTaller, ...datos },
    }));
  }, []);

  const actualizarDatosCliente = useCallback((datos: Partial<DatosCliente>) => {
    setCotizacion(prev => ({
      ...prev,
      datosCliente: { ...prev.datosCliente, ...datos },
    }));
  }, []);

  const actualizarProyecto = useCallback((datos: Partial<EspecificacionesProyecto>) => {
    setCotizacion(prev => ({
      ...prev,
      proyecto: { ...prev.proyecto, ...datos },
    }));
  }, []);

  const agregarMaterial = useCallback((material: Omit<Material, 'id' | 'costoTotal'>) => {
    const nuevoMaterial: Material = {
      ...material,
      id: crypto.randomUUID(),
      costoTotal: calcularCostoMaterial({ ...material, id: '', costoTotal: 0 }),
    };
    setCotizacion(prev => {
      const nueva = {
        ...prev,
        materiales: [...prev.materiales, nuevoMaterial],
      };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const eliminarMaterial = useCallback((id: string) => {
    setCotizacion(prev => {
      const nueva = {
        ...prev,
        materiales: prev.materiales.filter(m => m.id !== id),
      };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const actualizarMaterial = useCallback((id: string, datos: Partial<Material>) => {
    setCotizacion(prev => {
      const nueva = {
        ...prev,
        materiales: prev.materiales.map(m => {
          if (m.id !== id) return m;
          const actualizado = { ...m, ...datos };
          actualizado.costoTotal = calcularCostoMaterial(actualizado);
          return actualizado;
        }),
      };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const agregarProceso = useCallback((tipoProceso: TipoProcesoVelso, tiempoMinutos: number, descripcion?: string, tipoManoObra?: 'mo_s' | 'mo_e') => {
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
      const nueva = {
        ...prev,
        procesos: [...prev.procesos, nuevoProceso],
      };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const eliminarProceso = useCallback((id: string) => {
    setCotizacion(prev => {
      const nueva = {
        ...prev,
        procesos: prev.procesos.filter(p => p.id !== id),
      };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const actualizarProceso = useCallback((id: string, datos: Partial<Proceso>) => {
    setCotizacion(prev => {
      const nueva = {
        ...prev,
        procesos: prev.procesos.map(p => {
          if (p.id !== id) return p;
          const actualizado = { ...p, ...datos };
          actualizado.costoTotal = calcularCostoProceso(actualizado);
          return actualizado;
        }),
      };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const actualizarCostosAdicionales = useCallback((datos: Partial<CostosAdicionales>) => {
    setCotizacion(prev => {
      const nueva = {
        ...prev,
        costosAdicionales: { ...prev.costosAdicionales, ...datos },
      };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const actualizarCondiciones = useCallback((datos: Partial<CondicionesComerciales>) => {
    setCotizacion(prev => ({
      ...prev,
      condiciones: { ...prev.condiciones, ...datos },
    }));
  }, []);

  const actualizarMargenUtilidad = useCallback((margen: number) => {
    setCotizacion(prev => {
      const nueva = { ...prev, margenUtilidad: margen };
      return recalcularTotales(nueva);
    });
  }, [recalcularTotales]);

  const guardarCotizacion = useCallback(async (estado: CotizacionGuardada['estado'] = 'borrador') => {
    const id = cotizacion.id || crypto.randomUUID();
    const nuevaCotizacion = { ...cotizacion, id };
    
    setCotizacion(nuevaCotizacion);
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    const guardada: CotizacionGuardada = {
      id,
      numero: nuevaCotizacion.numero,
      fecha: nuevaCotizacion.fecha,
      clienteNombre: nuevaCotizacion.datosCliente.nombre || nuevaCotizacion.datosCliente.empresa || 'Sin cliente',
      proyectoNombre: nuevaCotizacion.proyecto.nombre || 'Sin nombre',
      total: nuevaCotizacion.total,
      estado,
      usuarioId: user?.id,
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

    // Guardar la cotización completa en localStorage (backup local)
    const cotizacionesCompletas = JSON.parse(localStorage.getItem('cotizaciones_completas') || '{}');
    cotizacionesCompletas[id] = { ...nuevaCotizacion, usuarioId: user?.id };
    localStorage.setItem('cotizaciones_completas', JSON.stringify(cotizacionesCompletas));

    // Guardar en Supabase
    if (user) {
      try {
        const cotizacionDB = {
          id,
          numero: nuevaCotizacion.numero,
          usuario_id: user.id,
          cliente_id: nuevaCotizacion.datosCliente.clienteId || null,
          cliente_nombre: nuevaCotizacion.datosCliente.nombre || nuevaCotizacion.datosCliente.empresa || 'Sin cliente',
          proyecto_nombre: nuevaCotizacion.proyecto.nombre || 'Sin nombre',
          datos_taller: nuevaCotizacion.datosTaller,
          datos_cliente: nuevaCotizacion.datosCliente,
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
          console.error('[guardarCotizacion] Error code:', error.code);
          console.error('[guardarCotizacion] Error details:', error.details);
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
      toast.warning('No hay sesión activa. La cotización se guardó solo localmente.');
    }

    return id;
  }, [cotizacion]);

  const cargarCotizacion = useCallback(async (id: string): Promise<boolean> => {
    // Primero intentar cargar desde Supabase
    try {
      console.log('[cargarCotizacion] Intentando cargar desde Supabase:', id);
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.warn('[cargarCotizacion] Error cargando de Supabase:', error);
      } else if (data) {
        console.log('[cargarCotizacion] Cotización cargada de Supabase:', data);
        
        // Si hay cliente_id, cargar los contactos del cliente
        let contactosCliente: any[] = [];
        if (data.cliente_id) {
          console.log('[cargarCotizacion] Cargando contactos del cliente:', data.cliente_id);
          const { data: contactosData, error: contactosError } = await supabase
            .from('contactos')
            .select('*')
            .eq('cliente_id', data.cliente_id);
          
          if (contactosError) {
            console.warn('[cargarCotizacion] Error cargando contactos:', contactosError);
          } else if (contactosData) {
            contactosCliente = contactosData;
            console.log('[cargarCotizacion] Contactos cargados:', contactosData.length);
          }
        }
        
        // Transformar datos de Supabase al formato de la app
        const datosCliente = data.datos_cliente || cotizacionVacia.datosCliente;
        
        // Agregar contactos al datosCliente si se cargaron
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
        
        const cotizacionCargada: Cotizacion = {
          id: data.id,
          numero: data.numero,
          fecha: data.fecha || new Date().toISOString().split('T')[0],
          datosTaller: data.datos_taller || cotizacionVacia.datosTaller,
          datosCliente: datosCliente,
          proyecto: {
            nombre: data.proyecto_nombre || '',
            descripcion: '',
            cantidad: 1,
          },
          materiales: data.materiales || [],
          procesos: data.procesos || [],
          costosAdicionales: data.costos_adicionales || cotizacionVacia.costosAdicionales,
          condiciones: cotizacionVacia.condiciones,
          subtotal: data.subtotal || 0,
          ivaPorcentaje: data.iva_porcentaje || 16,
          iva: (data.subtotal || 0) * (data.iva_porcentaje || 16) / 100,
          total: data.total || 0,
          margenUtilidad: data.margen_utilidad || 30,
        };
        
        setCotizacion(cotizacionCargada);
        
        // También guardar en localStorage para offline
        const cotizacionesCompletas = JSON.parse(localStorage.getItem('cotizaciones_completas') || '{}');
        cotizacionesCompletas[id] = cotizacionCargada;
        localStorage.setItem('cotizaciones_completas', JSON.stringify(cotizacionesCompletas));
        
        return true;
      }
    } catch (err) {
      console.warn('[cargarCotizacion] Error de conexión con Supabase:', err);
    }

    // Fallback a localStorage
    console.log('[cargarCotizacion] Intentando cargar desde localStorage:', id);
    const cotizacionesCompletas = JSON.parse(localStorage.getItem('cotizaciones_completas') || '{}');
    const cotizacionGuardada = cotizacionesCompletas[id];
    if (cotizacionGuardada) {
      setCotizacion(cotizacionGuardada);
      return true;
    }
    return false;
  }, []);

  const eliminarCotizacionGuardada = useCallback(async (id: string) => {
    // Eliminar de localStorage
    setCotizacionesGuardadas(prev => prev.filter(c => c.id !== id));
    const cotizacionesCompletas = JSON.parse(localStorage.getItem('cotizaciones_completas') || '{}');
    delete cotizacionesCompletas[id];
    localStorage.setItem('cotizaciones_completas', JSON.stringify(cotizacionesCompletas));

    // Eliminar de Supabase
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

  const nuevaCotizacion = useCallback(() => {
    setCotizacion({
      ...cotizacionVacia,
      numero: generarNumeroCotizacion(),
      fecha: new Date().toISOString().split('T')[0],
    });
  }, []);

  return {
    cotizacion,
    cotizacionesGuardadas,
    cargado,
    actualizarDatosTaller,
    actualizarDatosCliente,
    actualizarProyecto,
    agregarMaterial,
    eliminarMaterial,
    actualizarMaterial,
    agregarProceso,
    eliminarProceso,
    actualizarProceso,
    actualizarCostosAdicionales,
    actualizarCondiciones,
    actualizarMargenUtilidad,
    guardarCotizacion,
    cargarCotizacion,
    eliminarCotizacionGuardada,
    nuevaCotizacion,
  };
};
