import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft,
  Package,
  Search,
  Trash2,
  DollarSign,
  Layers,
  Wrench,
  Hash,
  FileText,
} from 'lucide-react';
import type { PiezaCatalogo, Proceso } from '@/types/cotizacion';

interface CatalogoPiezasViewProps {
  onVolver: () => void;
  piezas: PiezaCatalogo[];
  onEliminar?: (id: string) => void;
}

export function CatalogoPiezasView({
  onVolver,
  piezas,
  onEliminar,
}: CatalogoPiezasViewProps) {
  const [busqueda, setBusqueda] = useState('');

  // Filtrar piezas
  const piezasFiltradas = piezas.filter((p) => {
    const matchBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    return matchBusqueda;
  });

  // Formatear procesos
  const formatearProcesos = (procesos: Proceso[]) => {
    if (!procesos || procesos.length === 0) return '-';
    return procesos.map((p) => p.nombre).join(', ');
  };

  // Formatear material
  const formatearMaterial = (pieza: PiezaCatalogo) => {
    if (!pieza.material) return 'Sin material';
    const m = pieza.material;
    const dims: string[] = [];
    if (m.diametro) dims.push(`Ø${m.diametro}${m.unidadMedida}`);
    if (m.lado) dims.push(`${m.lado}${m.unidadMedida}`);
    if (m.largo) dims.push(`L:${m.largo}${m.unidadMedida}`);
    if (m.ancho) dims.push(`A:${m.ancho}${m.unidadMedida}`);
    if (m.espesor) dims.push(`E:${m.espesor}${m.unidadMedida}`);
    return `${m.nombre}${dims.length > 0 ? ' (' + dims.join(', ') + ')' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Piezas</h2>
          <p className="text-slate-500">{piezas.length} piezas registradas</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total Piezas</p>
            <p className="text-2xl font-bold text-blue-600">{piezas.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Con Material</p>
            <p className="text-2xl font-bold text-green-600">
              {piezas.filter((p) => p.material !== null).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Con Procesos</p>
            <p className="text-2xl font-bold text-purple-600">
              {piezas.filter((p) => p.procesos && p.procesos.length > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Valor Total</p>
            <p className="text-2xl font-bold text-amber-600">
              ${piezas.reduce((acc, p) => acc + (p.totalPieza || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tabla de piezas */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Piezas del Catálogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {piezasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron piezas</p>
              <p className="text-sm mt-1">
                Las piezas se guardan automáticamente desde el paso "Piezas" de una cotización.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Procesos</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {piezasFiltradas.map((pieza) => (
                    <TableRow key={pieza.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-sm font-medium">{pieza.codigo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{pieza.nombre}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {pieza.cantidad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {formatearMaterial(pieza)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Wrench className="w-3 h-3 text-slate-400" />
                          <span className="max-w-[150px] truncate" title={formatearProcesos(pieza.procesos)}>
                            {formatearProcesos(pieza.procesos)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1 text-slate-600">
                          <DollarSign className="w-3 h-3" />
                          {(pieza.subtotalPieza || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1 font-semibold text-slate-900">
                          <DollarSign className="w-3 h-3" />
                          {(pieza.totalPieza || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {onEliminar && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEliminar(pieza.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Las piezas se guardan automáticamente en el catálogo desde el paso{' '}
            <strong>"Piezas"</strong> de una cotización. Usa un código único para identificar cada pieza
            y reutilizarla en futuras cotizaciones.
          </p>
        </div>
      </div>
    </div>
  );
}
