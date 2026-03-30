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
import { CATALOGO_PROCESOS_VELSO } from '@/types/cotizacion';

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
  // Inicializar materiales reales (copiar de cotizados si no existen)
  const [materialesReales, setMaterialesReales] = useState<MaterialProyecto[]>(
    proyecto.materialesReales || proyecto.materiales.map(m => ({
      ...m,
      costoUnitarioReal: m.costoUnitarioCotizado,
      costoTotalReal: m.costoTotalCotizado
    }))
  );

  // Inicializar procesos reales
  const [procesosReales, setProcesosReales] = useState<ProcesoProyecto[]>(
    proyecto.procesosReales || proyecto.procesos.map(p => ({
      ...p,
      tiempoMinutosReal: p.tiempoMinutosCotizado,
      costoTotalReal: p.costoTotalCotizado
    }))
  );

  // Inicializar costos adicionales reales
  const [costosReales, setCostosReales] = useState<CostosAdicionalesProyecto>(
    proyecto.costosAdicionalesReales || { ...proyecto.costosAdicionales }
  );

  // Calcular totales
  const totales = useMemo(() => {
    const costoMaterialesCotizado = proyecto.materiales.reduce((sum, m) => sum + m.costoTotalCotizado, 0);
    const costoMaterialesReal = materialesReales.reduce((sum, m) => sum + (m.costoTotalReal || m.costoTotalCotizado), 0);
    
    const costoProcesosCotizado = proyecto.procesos.reduce((sum, p) => sum + p.costoTotalCotizado, 0);
    const costoProcesosReal = procesosReales.reduce((sum, p) => sum + (p.costoTotalReal || p.costoTotalCotizado), 0);
    
    const costosAdicionalesCotizado = Object.values(proyecto.costosAdicionales).reduce((sum, v) => sum + v, 0);
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
  }, [proyecto, materialesReales, procesosReales, costosReales]);

  // Actualizar material real
  const actualizarMaterialReal = (id: string, campo: 'costoUnitarioReal' | 'cantidad', valor: number) => {
    setMaterialesReales(prev => prev.map(m => {
      if (m.id !== id) return m;
      const nuevo = { ...m, [campo]: valor };
      if (campo === 'costoUnitarioReal' || campo === 'cantidad') {
        nuevo.costoTotalReal = (nuevo.costoUnitarioReal || nuevo.costoUnitarioCotizado) * nuevo.cantidad;
      }
      return nuevo;
    }));
  };

  // Actualizar proceso real
  const actualizarProcesoReal = (id: string, tiempoReal: number) => {
    setProcesosReales(prev => prev.map(p => {
      if (p.id !== id) return p;
      const tiempoHoras = tiempoReal / 60;
      const costoTotalReal = (tiempoHoras * p.costoPorHora) + p.costoManoObra;
      return { ...p, tiempoMinutosReal: tiempoReal, costoTotalReal };
    }));
  };

  // Actualizar costo adicional real
  const actualizarCostoReal = (campo: keyof CostosAdicionalesProyecto, valor: number) => {
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
  };

  // Obtener nombre del proceso
  const getNombreProceso = (tipo: string) => {
    const proceso = CATALOGO_PROCESOS_VELSO.find(p => p.id === tipo);
    return proceso?.nombre || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
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

        {/* Tab Materiales */}
        <TabsContent value="materiales" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Materiales Reales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materialesReales.map((material) => (
                  <div key={material.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{material.nombre}</p>
                      <p className="text-xs text-slate-500">{material.tipo} · {material.forma}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Cantidad Real</Label>
                      <Input
                        type="number"
                        value={material.cantidad}
                        onChange={(e) => actualizarMaterialReal(material.id, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Costo Unitario Real ($)</Label>
                      <Input
                        type="number"
                        value={material.costoUnitarioReal || material.costoUnitarioCotizado}
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Procesos */}
        <TabsContent value="procesos" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Tiempos Reales de Procesos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {procesosReales.map((proceso) => (
                  <div key={proceso.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{getNombreProceso(proceso.tipo)}</p>
                      <p className="text-xs text-slate-500">{proceso.nombre}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Tiempo Cotizado (min)</Label>
                      <p className="font-medium mt-2">{proceso.tiempoMinutosCotizado}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Tiempo Real (min)</Label>
                      <Input
                        type="number"
                        value={proceso.tiempoMinutosReal || proceso.tiempoMinutosCotizado}
                        onChange={(e) => actualizarProcesoReal(proceso.id, parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Costo Total Real</Label>
                      <p className="font-semibold text-amber-600 mt-2">
                        ${(proceso.costoTotalReal || proceso.costoTotalCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-400">
                        Cotizado: ${proceso.costoTotalCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
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
                        <p className="font-medium">${(proyecto.costosAdicionales as any)[key].toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
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
