import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Package, 
  Settings,
  Save,
  Calculator,
  CheckCircle
} from 'lucide-react';
import type { ProyectoVenta, MaterialProyecto, ProcesoProyecto, CostosAdicionalesProyecto } from '@/types/ventas';
import { procesosAplanados, materialesAplanados, minutosCotizados, costoCotizadoProc } from '@/utils/proyectoDatos';
import { toast } from 'sonner';

interface ControlDeCodigosViewProps {
  proyecto: ProyectoVenta;
  onVolver: () => void;
  onGuardarDatosReales: (id: string, datos: {
    materialesReales: MaterialProyecto[];
    procesosReales: ProcesoProyecto[];
    costosAdicionalesReales: CostosAdicionalesProyecto;
    costoTotalReal: number;
    utilidadReal: number;
    porcentajeUtilidadReal: number;
  }) => void;
}

export function ControlDeCodigosView({ 
  proyecto, 
  onVolver, 
  onGuardarDatosReales 
}: ControlDeCodigosViewProps) {
  // Los proyectos convertidos guardan material y procesos DENTRO de cada
  // pieza — aquí los aplanamos y los llevamos al esquema del proyecto.
  const materialesCot = useMemo<MaterialProyecto[]>(() =>
    materialesAplanados(proyecto).map((m: any) => ({
      id: m.id || crypto.randomUUID(),
      nombre: m.piezaNombre ? `${m.nombre} (${m.piezaNombre})` : (m.nombre || ''),
      tipo: m.tipo || '',
      forma: m.forma || '',
      cantidad: Number(m.cantidad) || 0,
      unidad: m.unidad || 'pieza',
      costoUnitarioCotizado: Number(m.costoUnitario) || 0,
      margenPorcentaje: Number(m.margenPorcentaje) || 0,
      costoTotalCotizado: Number(m.costoTotal) || 0,
    })), [proyecto]);

  const procesosCot = useMemo<(ProcesoProyecto & { piezaNombre?: string })[]>(() =>
    procesosAplanados(proyecto).map((p: any) => ({
      id: p.id || crypto.randomUUID(),
      nombre: p.nombre || '',
      piezaNombre: p.piezaNombre || 'General',
      tipo: p.tipo || '',
      tiempoMinutosCotizado: minutosCotizados(p),
      costoPorHora: Number(p.costoPorHora) || 0,
      costoManoObra: Number(p.costoManoObra) || 0,
      costoTotalCotizado: costoCotizadoProc(p),
    })), [proyecto]);

  const costosCot = useMemo<CostosAdicionalesProyecto>(() => {
    const ca: any = proyecto.costosAdicionales || {};
    const num = (v: any) => Number(typeof v === 'object' && v !== null ? v.costo : v) || 0;
    return {
      disenoCAD: num(ca.diseno ?? ca.disenoCAD),
      programacionCNC: num(ca.programacionCNC),
      setup: num(ca.setup),
      transporte: num(ca.envio ?? ca.transporte),
      otro: num(ca.otro) + num(ca.pruebaDureza) + num(ca.estudioMaterial),
    };
  }, [proyecto]);

  // Inicializar materiales reales (copiar de cotizados si no existen)
  const [materialesReales, setMaterialesReales] = useState<MaterialProyecto[]>(
    proyecto.materialesReales || materialesCot.map(m => ({
      ...m,
      costoUnitarioReal: m.costoUnitarioCotizado,
      costoTotalReal: m.costoTotalCotizado
    }))
  );

  // Congelado por material: los guardados quedan bloqueados hasta "Editar"
  const [materialesEditando, setMaterialesEditando] = useState<Set<string>>(new Set());
  // Cambios sin guardar (para alertar al salir)
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  // Procesos reales: solo lectura — la captura de tiempos reales
  // se hace en la sección Producción (hoja viajera)
  const [procesosReales] = useState<ProcesoProyecto[]>(
    proyecto.procesosReales || procesosCot.map(p => ({
      ...p,
      tiempoMinutosReal: p.tiempoMinutosCotizado,
      costoTotalReal: p.costoTotalCotizado
    }))
  );

  // Inicializar costos adicionales reales
  const [costosReales, setCostosReales] = useState<CostosAdicionalesProyecto>(
    proyecto.costosAdicionalesReales || { ...costosCot }
  );

  // Calcular totales
  const totales = useMemo(() => {
    const costoMaterialesCotizado = materialesCot.reduce((sum, m) => sum + m.costoTotalCotizado, 0);
    const costoMaterialesReal = materialesReales.reduce((sum, m) => sum + (m.costoTotalReal || m.costoTotalCotizado), 0);

    const costoProcesosCotizado = procesosCot.reduce((sum, p) => sum + p.costoTotalCotizado, 0);
    const costoProcesosReal = procesosReales.reduce((sum, p) => sum + (p.costoTotalReal || p.costoTotalCotizado), 0);

    const costosAdicionalesCotizado = Object.values(costosCot).reduce((sum, v) => sum + v, 0);
    const costosAdicionalesReal = Object.values(costosReales).reduce((sum, v) => sum + v, 0);
    
    const costoTotalCotizado = costoMaterialesCotizado + costoProcesosCotizado + costosAdicionalesCotizado;
    const costoTotalReal = costoMaterialesReal + costoProcesosReal + costosAdicionalesReal;
    
    const totalFacturado = proyecto.totalFacturado || proyecto.totalCotizado;
    const utilidadCotizada = proyecto.totalCotizado - costoTotalCotizado;
    const utilidadReal = totalFacturado - costoTotalReal;
    
    const porcentajeUtilidadCotizada = proyecto.totalCotizado > 0 ? (utilidadCotizada / proyecto.totalCotizado) * 100 : 0;
    const porcentajeUtilidadReal = totalFacturado > 0 ? (utilidadReal / totalFacturado) * 100 : 0;

    return {
      costoMaterialesCotizado,
      costoMaterialesReal,
      costoProcesosCotizado,
      costoProcesosReal,
      costosAdicionalesCotizado,
      costosAdicionalesReal,
      costoTotalCotizado,
      costoTotalReal,
      totalFacturado,
      utilidadCotizada,
      utilidadReal,
      porcentajeUtilidadCotizada,
      porcentajeUtilidadReal,
    };
  }, [proyecto, materialesCot, procesosCot, costosCot, materialesReales, procesosReales, costosReales]);

  // Actualizar material real (solo si no está congelado)
  const actualizarMaterialReal = (id: string, campo: 'costoUnitarioReal' | 'cantidad', valor: number) => {
    setHayCambiosSinGuardar(true);
    setMaterialesReales(prev => prev.map(m => {
      if (m.id !== id) return m;
      const nuevo = { ...m, [campo]: valor };
      if (campo === 'costoUnitarioReal' || campo === 'cantidad') {
        nuevo.costoTotalReal = (nuevo.costoUnitarioReal || nuevo.costoUnitarioCotizado) * nuevo.cantidad;
      }
      return nuevo;
    }));
  };

  // Un material congelado = guardado y no en modo edición
  const materialCongelado = (m: MaterialProyecto) =>
    (m as any).guardado === true && !materialesEditando.has(m.id);

  // Guardar material: lo congela y persiste de inmediato
  const handleGuardarMaterial = (materialId: string) => {
    const nuevos = materialesReales.map(m =>
      m.id === materialId ? ({ ...m, guardado: true } as any) : m
    );
    setMaterialesReales(nuevos);
    setMaterialesEditando(prev => {
      const s = new Set(prev);
      s.delete(materialId);
      return s;
    });

    const costoMaterialesReal = nuevos.reduce((sum, m) => sum + (m.costoTotalReal || m.costoTotalCotizado), 0);
    const costoProcesosReal = procesosReales.reduce((sum, p) => sum + (p.costoTotalReal || p.costoTotalCotizado), 0);
    const costosAdicionalesReal = Object.values(costosReales).reduce((sum, v) => sum + v, 0);
    const costoTotalReal = costoMaterialesReal + costoProcesosReal + costosAdicionalesReal;
    const totalFacturado = proyecto.totalFacturado || proyecto.totalCotizado;
    const utilidadReal = totalFacturado - costoTotalReal;
    const porcentajeUtilidadReal = totalFacturado > 0 ? (utilidadReal / totalFacturado) * 100 : 0;

    onGuardarDatosReales(proyecto.id, {
      materialesReales: nuevos,
      procesosReales,
      costosAdicionalesReales: costosReales,
      costoTotalReal,
      utilidadReal,
      porcentajeUtilidadReal,
    });
    toast.success('Material guardado y congelado');
  };

  // Editar material congelado: habilita sus campos de nuevo
  const handleEditarMaterial = (materialId: string) => {
    setMaterialesEditando(prev => new Set(prev).add(materialId));
  };

  // Actualizar costo adicional real
  const actualizarCostoReal = (campo: keyof CostosAdicionalesProyecto, valor: number) => {
    setHayCambiosSinGuardar(true);
    setCostosReales(prev => ({ ...prev, [campo]: valor }));
  };

  // Guardar cambios
  const handleGuardar = () => {
    onGuardarDatosReales(proyecto.id, {
      materialesReales,
      procesosReales,
      costosAdicionalesReales: costosReales,
      costoTotalReal: totales.costoTotalReal,
      utilidadReal: totales.utilidadReal,
      porcentajeUtilidadReal: totales.porcentajeUtilidadReal,
    });
    setHayCambiosSinGuardar(false);
  };

  // Salir con cambios sin guardar → confirmar
  const handleVolverSeguro = () => {
    if (hayCambiosSinGuardar) {
      const salir = confirm('Hay cambios sin guardar. ¿Salir sin guardar?\n\nAceptar = salir sin guardar · Cancelar = quedarse para guardar');
      if (!salir) return;
    }
    onVolver();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={handleVolverSeguro} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Proyectos
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Control de Códigos</h2>
          <p className="text-slate-500">{proyecto.proyectoNombre} · {proyecto.clienteNombre}</p>
        </div>
        <Button onClick={handleGuardar} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* Resumen de Utilidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Cotizado</p>
                <p className="text-xl font-bold text-slate-900">
                  ${proyecto.totalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Facturado</p>
                <p className="text-xl font-bold text-purple-600">
                  ${(proyecto.totalFacturado || proyecto.totalCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totales.utilidadReal >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Utilidad Real</p>
                <p className={`text-xl font-bold ${totales.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totales.utilidadReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400">
                  {totales.porcentajeUtilidadReal.toFixed(1)}% del facturado
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totales.utilidadReal >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={`w-5 h-5 ${totales.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparación Cotizado vs Real */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-blue-600" />
            Comparación: Cotizado vs Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Materiales */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Materiales</span>
                <span className={`${totales.costoMaterialesReal > totales.costoMaterialesCotizado ? 'text-red-600' : 'text-green-600'}`}>
                  {totales.costoMaterialesReal > totales.costoMaterialesCotizado ? '+' : ''}
                  ${(totales.costoMaterialesReal - totales.costoMaterialesCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Cotizado</p>
                  <p className="font-semibold">${totales.costoMaterialesCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Real</p>
                  <p className="font-semibold">${totales.costoMaterialesReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            {/* Procesos */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Procesos (Mano de Obra)</span>
                <span className={`${totales.costoProcesosReal > totales.costoProcesosCotizado ? 'text-red-600' : 'text-green-600'}`}>
                  {totales.costoProcesosReal > totales.costoProcesosCotizado ? '+' : ''}
                  ${(totales.costoProcesosReal - totales.costoProcesosCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Cotizado</p>
                  <p className="font-semibold">${totales.costoProcesosCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Real</p>
                  <p className="font-semibold">${totales.costoProcesosReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            {/* Costos Adicionales */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Costos Adicionales</span>
                <span className={`${totales.costosAdicionalesReal > totales.costosAdicionalesCotizado ? 'text-red-600' : 'text-green-600'}`}>
                  {totales.costosAdicionalesReal > totales.costosAdicionalesCotizado ? '+' : ''}
                  ${(totales.costosAdicionalesReal - totales.costosAdicionalesCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Cotizado</p>
                  <p className="font-semibold">${totales.costosAdicionalesCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Real</p>
                  <p className="font-semibold">${totales.costosAdicionalesReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold">Costo Total</span>
                <span className={`font-bold ${totales.costoTotalReal > totales.costoTotalCotizado ? 'text-red-600' : 'text-green-600'}`}>
                  Diferencia: {totales.costoTotalReal > totales.costoTotalCotizado ? '+' : ''}
                  ${(totales.costoTotalReal - totales.costoTotalCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-blue-600">Costo Cotizado</p>
                  <p className="font-bold text-blue-800">${totales.costoTotalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <p className="text-xs text-amber-600">Costo Real</p>
                  <p className="font-bold text-amber-800">${totales.costoTotalReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para editar datos reales */}
      <Tabs defaultValue="materiales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materiales">
            <Package className="w-4 h-4 mr-2" />
            Materiales
          </TabsTrigger>
          <TabsTrigger value="procesos">
            <Clock className="w-4 h-4 mr-2" />
            Procesos
          </TabsTrigger>
          <TabsTrigger value="costos">
            <Settings className="w-4 h-4 mr-2" />
            Costos Adicionales
          </TabsTrigger>
        </TabsList>

        {/* Tab Materiales — con guardar/congelar por material */}
        <TabsContent value="materiales" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Materiales Reales</CardTitle>
              <p className="text-xs text-slate-500">
                Guarda cada material para congelarlo. Para modificarlo después, usa Editar.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materialesReales.map((material) => {
                  const congelado = materialCongelado(material);
                  return (
                    <div key={material.id} className={`grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-lg ${congelado ? 'bg-green-50/60 border border-green-200' : 'bg-slate-50'}`}>
                      <div>
                        <p className="text-sm font-medium">{material.nombre}</p>
                        <p className="text-xs text-slate-500">{material.tipo} · {material.forma}</p>
                        {congelado && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-semibold mt-1">
                            <CheckCircle className="w-3 h-3" /> Guardado
                          </span>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Cantidad Real</Label>
                        <Input
                          type="number"
                          value={material.cantidad}
                          disabled={congelado}
                          onChange={(e) => actualizarMaterialReal(material.id, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Costo Unitario Real ($)</Label>
                        <Input
                          type="number"
                          value={material.costoUnitarioReal || material.costoUnitarioCotizado}
                          disabled={congelado}
                          onChange={(e) => actualizarMaterialReal(material.id, 'costoUnitarioReal', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Costo Total Real</Label>
                        <p className="font-semibold text-amber-600 mt-2">
                          ${(material.costoTotalReal || material.costoTotalCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400">
                          Cotizado: ${material.costoTotalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-end">
                        {congelado ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-slate-300"
                            onClick={() => handleEditarMaterial(material.id)}
                          >
                            Editar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleGuardarMaterial(material.id)}
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            Guardar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Procesos — resumen por pieza, cotizado vs real (solo lectura) */}
        <TabsContent value="procesos" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Procesos por Pieza: Cotizado vs Real</CardTitle>
              <p className="text-xs text-slate-500">
                Las horas reales se capturan en la sección Producción. Si un proceso aún no
                tiene captura, se muestran los valores cotizados.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {Object.entries(
                  procesosCot.reduce((grupos: Record<string, typeof procesosCot>, proc) => {
                    const pieza = proc.piezaNombre || 'General';
                    if (!grupos[pieza]) grupos[pieza] = [];
                    grupos[pieza].push(proc);
                    return grupos;
                  }, {})
                ).map(([piezaNombre, procesos]) => (
                  <div key={piezaNombre} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-sm text-slate-800">{piezaNombre}</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Proceso</th>
                          <th className="px-3 py-2 text-right font-medium">Min. cotizados</th>
                          <th className="px-3 py-2 text-right font-medium">Min. reales</th>
                          <th className="px-3 py-2 text-right font-medium">Costo cotizado</th>
                          <th className="px-3 py-2 text-right font-medium">Costo real</th>
                          <th className="px-3 py-2 text-left font-medium">Operador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {procesos.map((proceso) => {
                          const real = (proyecto.procesosReales || []).find((r: any) => r.id === proceso.id);
                          const hayReal = real && real.tiempoMinutosReal != null;
                          const minReal = hayReal ? Number(real.tiempoMinutosReal) : proceso.tiempoMinutosCotizado;
                          const costoReal = hayReal
                            ? (Number(real.costoTotalReal) || (Number(real.tiempoMinutosReal) / 60) * proceso.costoPorHora + proceso.costoManoObra)
                            : proceso.costoTotalCotizado;
                          const sePaso = hayReal && minReal > proceso.tiempoMinutosCotizado;
                          return (
                            <tr key={proceso.id}>
                              <td className="px-3 py-2 text-slate-800">{proceso.nombre}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{proceso.tiempoMinutosCotizado}</td>
                              <td className={`px-3 py-2 text-right font-medium ${!hayReal ? 'text-slate-400' : sePaso ? 'text-red-600' : 'text-green-600'}`}>
                                {minReal}
                                {!hayReal && <span className="text-[10px] block">sin captura (cotizado)</span>}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                ${proceso.costoTotalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td className={`px-3 py-2 text-right font-medium ${hayReal && costoReal > proceso.costoTotalCotizado ? 'text-red-600' : 'text-green-600'}`}>
                                ${costoReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{hayReal ? ((real as any).operadorNombre || '—') : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
                {procesosCot.length === 0 && (
                  <p className="text-center text-slate-400 py-6">Este proyecto no tiene procesos registrados.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Costos Adicionales */}
        <TabsContent value="costos" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Costos Adicionales Reales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'disenoCAD', label: 'Diseño CAD' },
                  { key: 'programacionCNC', label: 'Programación CNC' },
                  { key: 'setup', label: 'Setup / Preparación' },
                  { key: 'transporte', label: 'Transporte' },
                  { key: 'otro', label: 'Otros' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Cotizado</p>
                        <p className="font-medium">${(costosCot as any)[key].toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Real</p>
                        <Input
                          type="number"
                          value={(costosReales as any)[key]}
                          onChange={(e) => actualizarCostoReal(key as keyof CostosAdicionalesProyecto, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
