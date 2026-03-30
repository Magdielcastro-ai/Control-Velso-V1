import { useState, useEffect, useCallback } from 'react';
import type { CatalogoMaterial, FormaMaterial } from '@/types/cotizacion';

// Materiales predefinidos iniciales
const MATERIALES_INICIALES: CatalogoMaterial[] = [
  // Aluminio Redondo
  { id: 'al-6061-r-1', nombre: 'Aluminio 6061 Redondo', tipo: 'aluminio', forma: 'redondo', unidadMedida: 'mm', diametro: 10, largo: 1000, costoUnitario: 150, unidadCosto: 'kg' },
  { id: 'al-6061-r-2', nombre: 'Aluminio 6061 Redondo', tipo: 'aluminio', forma: 'redondo', unidadMedida: 'mm', diametro: 20, largo: 1000, costoUnitario: 150, unidadCosto: 'kg' },
  { id: 'al-6061-r-3', nombre: 'Aluminio 6061 Redondo', tipo: 'aluminio', forma: 'redondo', unidadMedida: 'mm', diametro: 25, largo: 1000, costoUnitario: 150, unidadCosto: 'kg' },
  { id: 'al-6061-r-4', nombre: 'Aluminio 6061 Redondo', tipo: 'aluminio', forma: 'redondo', unidadMedida: 'in', diametro: 0.5, largo: 12, costoUnitario: 150, unidadCosto: 'kg' },
  { id: 'al-6061-r-5', nombre: 'Aluminio 6061 Redondo', tipo: 'aluminio', forma: 'redondo', unidadMedida: 'in', diametro: 1, largo: 12, costoUnitario: 150, unidadCosto: 'kg' },
  
  // Aluminio Cuadrado
  { id: 'al-6061-c-1', nombre: 'Aluminio 6061 Cuadrado', tipo: 'aluminio', forma: 'cuadrado', unidadMedida: 'mm', lado: 20, largo: 1000, costoUnitario: 155, unidadCosto: 'kg' },
  { id: 'al-6061-c-2', nombre: 'Aluminio 6061 Cuadrado', tipo: 'aluminio', forma: 'cuadrado', unidadMedida: 'mm', lado: 25, largo: 1000, costoUnitario: 155, unidadCosto: 'kg' },
  { id: 'al-6061-c-3', nombre: 'Aluminio 6061 Cuadrado', tipo: 'aluminio', forma: 'cuadrado', unidadMedida: 'in', lado: 1, largo: 12, costoUnitario: 155, unidadCosto: 'kg' },
  
  // Aluminio Placa
  { id: 'al-6061-p-1', nombre: 'Aluminio 6061 Placa', tipo: 'aluminio', forma: 'placa', unidadMedida: 'mm', largo: 1000, ancho: 500, espesor: 6, costoUnitario: 160, unidadCosto: 'kg' },
  { id: 'al-6061-p-2', nombre: 'Aluminio 6061 Placa', tipo: 'aluminio', forma: 'placa', unidadMedida: 'mm', largo: 1000, ancho: 500, espesor: 10, costoUnitario: 160, unidadCosto: 'kg' },
  { id: 'al-6061-p-3', nombre: 'Aluminio 6061 Placa', tipo: 'aluminio', forma: 'placa', unidadMedida: 'in', largo: 24, ancho: 12, espesor: 0.25, costoUnitario: 160, unidadCosto: 'kg' },
  
  // Acero Redondo
  { id: 'ac-1018-r-1', nombre: 'Acero 1018 Redondo', tipo: 'acero', forma: 'redondo', unidadMedida: 'mm', diametro: 10, largo: 1000, costoUnitario: 80, unidadCosto: 'kg' },
  { id: 'ac-1018-r-2', nombre: 'Acero 1018 Redondo', tipo: 'acero', forma: 'redondo', unidadMedida: 'mm', diametro: 20, largo: 1000, costoUnitario: 80, unidadCosto: 'kg' },
  { id: 'ac-1018-r-3', nombre: 'Acero 1018 Redondo', tipo: 'acero', forma: 'redondo', unidadMedida: 'in', diametro: 0.5, largo: 12, costoUnitario: 80, unidadCosto: 'kg' },
  
  // Acero Cuadrado
  { id: 'ac-1018-c-1', nombre: 'Acero 1018 Cuadrado', tipo: 'acero', forma: 'cuadrado', unidadMedida: 'mm', lado: 20, largo: 1000, costoUnitario: 85, unidadCosto: 'kg' },
  { id: 'ac-1018-c-2', nombre: 'Acero 1018 Cuadrado', tipo: 'acero', forma: 'cuadrado', unidadMedida: 'in', lado: 1, largo: 12, costoUnitario: 85, unidadCosto: 'kg' },
  
  // Acero Placa
  { id: 'ac-a36-p-1', nombre: 'Acero A36 Placa', tipo: 'acero', forma: 'placa', unidadMedida: 'mm', largo: 1000, ancho: 500, espesor: 6, costoUnitario: 90, unidadCosto: 'kg' },
  { id: 'ac-a36-p-2', nombre: 'Acero A36 Placa', tipo: 'acero', forma: 'placa', unidadMedida: 'in', largo: 24, ancho: 12, espesor: 0.25, costoUnitario: 90, unidadCosto: 'kg' },
  
  // Acero Inoxidable
  { id: 'aci-304-r-1', nombre: 'Acero Inox 304 Redondo', tipo: 'acero_inoxidable', forma: 'redondo', unidadMedida: 'mm', diametro: 10, largo: 1000, costoUnitario: 250, unidadCosto: 'kg' },
  { id: 'aci-304-p-1', nombre: 'Acero Inox 304 Placa', tipo: 'acero_inoxidable', forma: 'placa', unidadMedida: 'mm', largo: 1000, ancho: 500, espesor: 3, costoUnitario: 280, unidadCosto: 'kg' },
  
  // Latón
  { id: 'lat-360-r-1', nombre: 'Latón 360 Redondo', tipo: 'laton', forma: 'redondo', unidadMedida: 'mm', diametro: 10, largo: 1000, costoUnitario: 350, unidadCosto: 'kg' },
  { id: 'lat-360-p-1', nombre: 'Latón 360 Placa', tipo: 'laton', forma: 'placa', unidadMedida: 'mm', largo: 500, ancho: 300, espesor: 3, costoUnitario: 380, unidadCosto: 'kg' },
  
  // Plástico
  { id: 'delrin-r-1', nombre: 'Delrin Redondo', tipo: 'plastico', forma: 'redondo', unidadMedida: 'mm', diametro: 25, largo: 1000, costoUnitario: 400, unidadCosto: 'kg' },
  { id: 'nylon-p-1', nombre: 'Nylon Placa', tipo: 'plastico', forma: 'placa', unidadMedida: 'mm', largo: 500, ancho: 300, espesor: 10, costoUnitario: 350, unidadCosto: 'kg' },
];

const STORAGE_KEY = 'catalogo_materiales_cnc';

export const useCatalogoMateriales = () => {
  const [catalogo, setCatalogo] = useState<CatalogoMaterial[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar catálogo del localStorage o usar iniciales
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado);
        setCatalogo(parsed);
      } catch (e) {
        console.error('Error al cargar catálogo:', e);
        setCatalogo(MATERIALES_INICIALES);
      }
    } else {
      setCatalogo(MATERIALES_INICIALES);
    }
    setCargado(true);
  }, []);

  // Guardar catálogo en localStorage
  useEffect(() => {
    if (cargado) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogo));
    }
  }, [catalogo, cargado]);

  // Agregar material al catálogo
  const agregarAlCatalogo = useCallback((material: Omit<CatalogoMaterial, 'id'>) => {
    const nuevo: CatalogoMaterial = {
      ...material,
      id: crypto.randomUUID(),
    };
    setCatalogo(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  // Eliminar material del catálogo
  const eliminarDelCatalogo = useCallback((id: string) => {
    setCatalogo(prev => prev.filter(m => m.id !== id));
  }, []);

  // Buscar materiales por nombre o tipo
  const buscarMateriales = useCallback((query: string, forma?: FormaMaterial) => {
    const q = query.toLowerCase();
    return catalogo.filter(m => {
      const matchQuery = m.nombre.toLowerCase().includes(q) || 
                         m.tipo.toLowerCase().includes(q);
      const matchForma = forma ? m.forma === forma : true;
      return matchQuery && matchForma;
    });
  }, [catalogo]);

  // Obtener materiales por forma
  const getMaterialesPorForma = useCallback((forma: FormaMaterial) => {
    return catalogo.filter(m => m.forma === forma);
  }, [catalogo]);

  // Obtener materiales por tipo
  const getMaterialesPorTipo = useCallback((tipo: string) => {
    return catalogo.filter(m => m.tipo === tipo);
  }, [catalogo]);

  // Obtener todas las formas disponibles
  const getFormasDisponibles = useCallback(() => {
    const formas = new Set<FormaMaterial>();
    catalogo.forEach(m => formas.add(m.forma));
    return Array.from(formas);
  }, [catalogo]);

  // Obtener todos los tipos disponibles
  const getTiposDisponibles = useCallback(() => {
    const tipos = new Set<string>();
    catalogo.forEach(m => tipos.add(m.tipo));
    return Array.from(tipos);
  }, [catalogo]);

  return {
    catalogo,
    cargado,
    agregarAlCatalogo,
    eliminarDelCatalogo,
    buscarMateriales,
    getMaterialesPorForma,
    getMaterialesPorTipo,
    getFormasDisponibles,
    getTiposDisponibles,
  };
};
