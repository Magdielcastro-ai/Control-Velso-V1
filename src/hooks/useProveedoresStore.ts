import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Proveedor } from '@/types/ordenesCompra';

export const useProveedoresStore = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const mapearProveedor = (row: any): Proveedor => ({
    id: row.id,
    numero: row.numero || '',
    nombre: row.nombre || '',
    tipo: row.tipo || undefined,
    domicilio: row.domicilio || undefined,
    telefono: row.telefono || undefined,
    email: row.email || undefined,
    contacto: row.contacto || undefined,
    diasCredito: Number(row.dias_credito) || 0,
    createdAt: row.created_at || undefined,
  });

  const cargarProveedores = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setCargando(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (supabaseError) {
        console.error('[useProveedoresStore] ERROR SUPABASE:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      setProveedores((data || []).map(mapearProveedor));
    } catch (e: any) {
      console.error('[useProveedoresStore] ERROR GENERAL:', e);
      setError(e.message);
    } finally {
      setCargando(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        cargarProveedores();
      } else if (event === 'SIGNED_OUT') {
        setProveedores([]);
      }
    });

    cargarProveedores();

    return () => subscription.unsubscribe();
  }, [cargarProveedores]);

  const crearProveedor = useCallback(async (datos: {
    nombre: string;
    tipo?: string;
    domicilio?: string;
    telefono?: string;
    email?: string;
    contacto?: string;
    diasCredito?: number;
  }): Promise<Proveedor | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Error: No estás autenticado');
        return null;
      }

      // Número consecutivo simple: PROV-001, PROV-002...
      const siguiente = proveedores.length + 1;
      const numero = `PROV-${String(siguiente).padStart(3, '0')}`;

      const insertData = {
        usuario_id: userData.user.id,
        numero,
        nombre: datos.nombre.trim(),
        tipo: datos.tipo?.trim() || null,
        domicilio: datos.domicilio?.trim() || null,
        telefono: datos.telefono?.trim() || null,
        email: datos.email?.trim() || null,
        contacto: datos.contacto?.trim() || null,
        dias_credito: Number(datos.diasCredito) || 0,
      };

      const { data, error } = await supabase
        .from('proveedores')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('[useProveedoresStore] ERROR INSERT:', error);
        toast.error('Error guardando proveedor: ' + error.message);
        return null;
      }

      const nuevo = mapearProveedor(data);
      setProveedores(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      toast.success(`Proveedor ${nuevo.nombre} creado (${nuevo.numero})`);
      return nuevo;
    } catch (e: any) {
      console.error('[useProveedoresStore] ERROR:', e);
      toast.error('Error inesperado: ' + e.message);
      return null;
    }
  }, [proveedores.length]);

  const actualizarProveedor = useCallback(async (id: string, datos: Partial<{
    nombre: string;
    tipo: string;
    domicilio: string;
    telefono: string;
    email: string;
    contacto: string;
    diasCredito: number;
  }>): Promise<boolean> => {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
      if (datos.tipo !== undefined) updateData.tipo = datos.tipo;
      if (datos.domicilio !== undefined) updateData.domicilio = datos.domicilio;
      if (datos.telefono !== undefined) updateData.telefono = datos.telefono;
      if (datos.email !== undefined) updateData.email = datos.email;
      if (datos.contacto !== undefined) updateData.contacto = datos.contacto;
      if (datos.diasCredito !== undefined) updateData.dias_credito = datos.diasCredito;

      const { error } = await supabase
        .from('proveedores')
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast.error('Error actualizando proveedor: ' + error.message);
        return false;
      }

      setProveedores(prev =>
        prev.map(p => p.id === id ? { ...p, ...datos } : p)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      toast.success('Proveedor actualizado');
      return true;
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  const eliminarProveedor = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', id);
      if (error) {
        toast.error('Error eliminando proveedor: ' + error.message);
        return false;
      }
      setProveedores(prev => prev.filter(p => p.id !== id));
      toast.success('Proveedor eliminado');
      return true;
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
      return false;
    }
  }, []);

  return {
    proveedores,
    cargando,
    error,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    cargarProveedores,
  };
};
