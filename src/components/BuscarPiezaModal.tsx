import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Package } from 'lucide-react';
import type { PiezaCatalogo } from '@/types/cotizacion';

interface BuscarPiezaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  piezas: PiezaCatalogo[];
  onSeleccionar: (pieza: PiezaCatalogo) => void;
  cargando?: boolean;
}

export function BuscarPiezaModal({
  open,
  onOpenChange,
  piezas,
  onSeleccionar,
  cargando = false,
}: BuscarPiezaModalProps) {
  const [busqueda, setBusqueda] = useState('');

  const piezasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return piezas;
    const termino = busqueda.trim().toLowerCase();
    return piezas.filter(
      (p) =>
        p.codigo.toLowerCase().includes(termino) ||
        p.nombre.toLowerCase().includes(termino)
    );
  }, [piezas, busqueda]);

  const handleSeleccionar = (pieza: PiezaCatalogo) => {
    onSeleccionar(pieza);
    setBusqueda('');
    onOpenChange(false);
  };

  const formatearMaterial = (pieza: PiezaCatalogo) => {
    if (!pieza.material) return 'Sin material';
    return pieza.material.nombre || pieza.material.tipo || 'Sin material';
  };

  const formatearProcesos = (pieza: PiezaCatalogo) => {
    const count = pieza.procesos?.length || 0;
    if (count === 0) return 'Sin procesos';
    return `${count} proceso${count > 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Package className="w-5 h-5 text-blue-600" />
            Buscar Pieza del Catálogo
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Selecciona una pieza del catálogo para cargar su información.
          </DialogDescription>
        </DialogHeader>

        {/* Campo de búsqueda */}
        <div className="px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="pl-9 h-9 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Tabla de piezas */}
        <div className="flex-1 overflow-auto px-6 pb-6 min-h-[200px]">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Cargando piezas del catálogo...</p>
            </div>
          ) : piezasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">
                {busqueda.trim()
                  ? 'No se encontraron piezas con ese criterio'
                  : 'No hay piezas en el catálogo'}
              </p>
              <p className="text-xs mt-1">
                {busqueda.trim()
                  ? 'Intenta con otro término de búsqueda'
                  : 'Guarda piezas en el catálogo para verlas aquí'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="text-left py-2.5 px-3 font-medium">Código</th>
                      <th className="text-left py-2.5 px-3 font-medium">Nombre</th>
                      <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Material</th>
                      <th className="text-left py-2.5 px-3 font-medium hidden sm:table-cell">Procesos</th>
                      <th className="text-right py-2.5 px-3 font-medium">Subtotal</th>
                      <th className="text-right py-2.5 px-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {piezasFiltradas.map((pieza) => (
                      <tr
                        key={pieza.id}
                        onClick={() => handleSeleccionar(pieza)}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSeleccionar(pieza);
                          }
                        }}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                            {pieza.codigo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {pieza.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 hidden md:table-cell">
                          {formatearMaterial(pieza)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 hidden sm:table-cell">
                          {formatearProcesos(pieza)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          ${pieza.subtotalPieza.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                          ${pieza.totalPieza.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contador de resultados */}
          {!cargando && piezasFiltradas.length > 0 && (
            <p className="text-xs text-slate-400 mt-2 text-right">
              {piezasFiltradas.length}{' '}
              {piezasFiltradas.length === 1 ? 'pieza' : 'piezas'}
              {busqueda.trim() && ` encontrada${piezasFiltradas.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
