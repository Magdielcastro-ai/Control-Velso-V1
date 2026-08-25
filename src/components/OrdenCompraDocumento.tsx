import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, FileText, MapPin, Phone, Mail } from 'lucide-react';
import type { OrdenCompra, Proveedor } from '@/types/ordenesCompra';
import { importeConLetra } from '@/utils/numeroALetras';

export interface DatosTallerOC {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  rfc?: string;
}

interface OrdenCompraDocumentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orden: OrdenCompra | null;
  proveedor?: Proveedor;
  datosTaller: DatosTallerOC;
}

function formatearMoneda(monto: number, moneda: 'MXN' | 'USD' = 'MXN') {
  return `$${monto.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${moneda}`;
}

function formatearFecha(fechaStr: string) {
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatearHora(fechaStr?: string) {
  const fecha = fechaStr ? new Date(fechaStr) : new Date();
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function OrdenCompraDocumento({
  open,
  onOpenChange,
  orden,
  proveedor,
  datosTaller,
}: OrdenCompraDocumentoProps) {
  if (!orden) return null;

  const moneda = orden.moneda || 'MXN';
  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-blue-600" />
              Orden de Compra {orden.numeroOc}
            </span>
            <Button onClick={handlePrint} variant="outline" size="sm" className="border-slate-300">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white text-slate-900 p-6 print:p-0">
          {/* ─── ENCABEZADO VELSO ─── */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
            <div>
              <img src="/logo-velso-pdf.png" alt="Logo Velso" className="w-40 h-auto object-contain mb-2" />
              <h1 className="text-lg font-bold">{datosTaller.nombre}</h1>
              {datosTaller.direccion && (
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {datosTaller.direccion}
                </p>
              )}
              <div className="flex gap-3 mt-0.5">
                {datosTaller.telefono && (
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {datosTaller.telefono}
                  </p>
                )}
                {datosTaller.email && (
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {datosTaller.email}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-base px-4 py-1.5 border-2 border-blue-600 text-blue-600 font-bold">
                ORDEN DE COMPRA
              </Badge>
              <p className="text-sm font-semibold mt-2">{orden.numeroOc}</p>
            </div>
          </div>

          {/* ─── PROVEEDOR + SOLICITANTE ─── */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div className="border border-slate-300 rounded p-3">
              <p className="font-bold text-slate-500 uppercase tracking-wide mb-2">Proveedor</p>
              <table className="w-full">
                <tbody>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top w-20">Número</td><td className="font-medium">{proveedor?.numero || '—'}</td></tr>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Nombre</td><td className="font-medium">{proveedor?.nombre || orden.proveedor || '—'}</td></tr>
                  {proveedor?.tipo && <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Tipo</td><td>{proveedor.tipo}</td></tr>}
                  {proveedor?.domicilio && <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Domicilio</td><td>{proveedor.domicilio}</td></tr>}
                  {proveedor?.telefono && <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Teléfono</td><td>{proveedor.telefono}</td></tr>}
                  {proveedor?.email && <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Email</td><td>{proveedor.email}</td></tr>}
                  {proveedor?.contacto && <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Contacto</td><td>{proveedor.contacto}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border border-slate-300 rounded p-3">
              <p className="font-bold text-slate-500 uppercase tracking-wide mb-2">Solicitante</p>
              <table className="w-full">
                <tbody>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top w-28">Número</td><td className="font-medium">{orden.numeroOc}</td></tr>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Nombre</td><td className="font-medium">{orden.solicitanteNombre || '—'}</td></tr>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Código</td><td>{orden.solicitanteCodigo || '—'}</td></tr>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Fecha de pedido</td><td>{formatearFecha(orden.fechaOc)}</td></tr>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Entrega estimada</td><td>{orden.fechaEntrega ? formatearFecha(orden.fechaEntrega) : '—'}</td></tr>
                  <tr><td className="text-slate-500 pr-2 py-0.5 align-top">Hora</td><td>{formatearHora(orden.createdAt)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── TABLA DE PARTIDAS ─── */}
          <table className="w-full text-xs border border-slate-300 mb-4">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-3 py-2 text-left font-semibold w-20">CANTIDAD</th>
                <th className="px-3 py-2 text-left font-semibold">DESCRIPCIÓN</th>
                <th className="px-3 py-2 text-right font-semibold w-28">COSTO UNITARIO</th>
                <th className="px-3 py-2 text-right font-semibold w-28">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orden.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2">{item.cantidad} {item.unidad}</td>
                  <td className="px-3 py-2">{item.nombre}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(item.precioUnitario, moneda)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(item.total, moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ─── TOTALES + IMPORTE CON LETRA ─── */}
          <div className="flex justify-end mb-4">
            <div className="w-64 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{formatearMoneda(orden.subtotal, moneda)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">IVA ({orden.ivaPorcentaje}%)</span>
                <span className="font-medium">{formatearMoneda(orden.iva, moneda)}</span>
              </div>
              <div className="flex justify-between py-2 bg-slate-800 text-white px-2 rounded-b">
                <span className="font-bold">TOTAL</span>
                <span className="font-bold">{formatearMoneda(orden.total, moneda)}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded p-3 mb-4 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wide">Importe con letra: </span>
            <span className="font-semibold capitalize">{importeConLetra(orden.total, moneda)}</span>
          </div>

          {/* ─── TÉRMINOS + CERTIFICADO ─── */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-300 rounded p-3">
              <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Términos de pago</p>
              <p className="font-semibold">
                {orden.terminosPago === 'credito' ? 'Crédito' : 'Contado'} · Moneda: {moneda}
              </p>
            </div>
            <div className="border border-slate-300 rounded p-3">
              <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Otros</p>
              <p className="font-semibold">
                {orden.certificadoCalidad
                  ? 'Se requiere certificado de calidad'
                  : 'No se requiere certificado de calidad'}
              </p>
            </div>
          </div>

          {/* ─── NOTAS ─── */}
          {orden.notas && (
            <div className="border border-slate-300 rounded p-3 mt-4 text-xs">
              <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Notas</p>
              <p>{orden.notas}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
