// src/components/CobranzaView.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  X,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  CreditCard
} from 'lucide-react';
import type { Cobranza, PagoRecibido } from '@/types/pendientes';

interface CobranzaViewProps {
  onVolver: () => void;
  cobranzas: Cobranza[];
  onRegistrarPago: (proyectoId: string, pago: Omit<PagoRecibido, 'id'>) => void;
  onActualizarNotas: (proyectoId: string, notas: string) => void;
  onActualizarContacto: (proyectoId: string, fecha: string) => void;
  onMarcarIncobrable: (proyectoId: string) => void;
}

const coloresEstado = {
  pendiente: 'bg-blue-100 text-blue-700 border-blue-200',
  parcial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pagado: 'bg-green-100 text-green-700 border-green-200',
  vencido: 'bg-red-100 text-red-700 border-red-300 animate-pulse',
  incobrable: 'bg-slate-100 text-slate-500 border-slate-200',
};

const labelsEstado = {
  pendiente: 'Pendiente',
  parcial: 'Pago Parcial',
  pagado: 'Pagado',
  vencido: 'Vencido',
  incobrable: 'Incobrable',
};

export function CobranzaView({ 
  onVolver, 
  cobranzas, 
  onRegistrarPago,
  onActualizarNotas,
  onActualizarContacto,
  onMarcarIncobrable,
}: CobranzaViewProps) {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormPago, setMostrarFormPago] = useState<string | null>(null);
  const [mostrarNotas, setMostrarNotas] = useState<string | null>(null);

  // Formulario de pago
  const [montoPago, setMontoPago] = useState('');
  const [formaPago, setFormaPago] = useState<PagoRecibido['formaPago']>('transferencia');
  const [referencia, setReferencia] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);

  // Notas
  const [notasTemp, setNotasTemp] = useState('');

  const cobranzasFiltradas = cobranzas.filter(c => {
    const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    const matchBusqueda = !busqueda || 
      c.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.numeroFactura.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.proyectoNombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const totales = {
    totalPorCobrar: cobranzas
      .filter(c => c.estado !== 'pagado' && c.estado !== 'incobrable')
      .reduce((sum, c) => sum + (c.montoFacturado - c.montoPagado), 0),
    totalVencido: cobranzas
      .filter(c => c.estado === 'vencido')
      .reduce((sum, c) => sum + (c.montoFacturado - c.montoPagado), 0),
    totalPagado: cobranzas
      .filter(c => c.estado === 'pagado')
      .reduce((sum, c) => sum + c.montoPagado, 0),
    totalParcial: cobranzas
      .filter(c => c.estado === 'parcial')
      .reduce((sum, c) => sum + c.montoPagado, 0),
    totalIncobrable: cobranzas
      .filter(c => c.estado === 'incobrable')
      .reduce((sum, c) => sum + c.montoFacturado, 0),
    cantidadPorCobrar: cobranzas.filter(c => c.estado !== 'pagado' && c.estado !== 'incobrable').length,
    cantidadVencidos: cobranzas.filter(c => c.estado === 'vencido').length,
    cantidadPagados: cobranzas.filter(c => c.estado === 'pagado').length,
  };

  const handleRegistrarPago = (proyectoId: string) => {
    if (!montoPago || parseFloat(montoPago) <= 0) return;

    onRegistrarPago(proyectoId, {
      fecha: fechaPago,
      monto: parseFloat(montoPago),
      formaPago,
      referencia,
    });

    setMontoPago('');
    setReferencia('');
    setMostrarFormPago(null);
  };

  const handleGuardarNotas = (proyectoId: string) => {
    onActualizarNotas(proyectoId, notasTemp);
    setMostrarNotas(null);
    setNotasTemp('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onVolver} className="border-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cobranza</h1>
            <p className="text-sm text-slate-500">Seguimiento de facturas y pagos</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-500">Por Cobrar</span>
            </div>
            <p className="text-xl font-bold text-slate-900">${totales.totalPorCobrar.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{totales.cantidadPorCobrar} facturas</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-slate-500">Vencido</span>
            </div>
            <p className="text-xl font-bold text-red-600">${totales.totalVencido.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{totales.cantidadVencidos} facturas</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-slate-500">Pagado</span>
            </div>
            <p className="text-xl font-bold text-green-600">${totales.totalPagado.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{totales.cantidadPagados} facturas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-500">Parcial</span>
            </div>
            <p className="text-xl font-bold text-purple-600">${totales.totalParcial.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Input 
                placeholder="Buscar por cliente, factura o proyecto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select 
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">🔵 Pendiente</option>
              <option value="parcial">🟡 Parcial</option>
              <option value="vencido">🔴 Vencido</option>
              <option value="pagado">🟢 Pagado</option>
              <option value="incobrable">⚪ Incobrable</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cobranzas */}
      <div className="space-y-3">
        {cobranzasFiltradas.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">¡Cartera al día!</p>
              <p className="text-sm text-slate-500">No hay facturas que coincidan con los filtros</p>
            </CardContent>
          </Card>
        ) : (
          cobranzasFiltradas.map(cobranza => {
            const saldoPendiente = cobranza.montoFacturado - cobranza.montoPagado;
            const porcentajePagado = (cobranza.montoPagado / cobranza.montoFacturado) * 100;

            return (
              <Card 
                key={cobranza.id} 
                className={`border-slate-200 ${cobranza.estado === 'vencido' ? 'border-red-300' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-semibold text-slate-900">{cobranza.clienteNombre}</span>
                        <Badge className={coloresEstado[cobranza.estado]}>
                          {labelsEstado[cobranza.estado]}
                        </Badge>
                        {cobranza.diasVencido > 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            {cobranza.diasVencido} días vencido
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-slate-500 text-xs">Factura</p>
                          <p className="font-medium text-slate-900">{cobranza.numeroFactura}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Proyecto</p>
                          <p className="font-medium text-slate-900">{cobranza.proyectoNombre}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Monto Facturado</p>
                          <p className="font-medium text-slate-900">${cobranza.montoFacturado.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Vencimiento</p>
                          <p className={`font-medium ${cobranza.estado === 'vencido' ? 'text-red-600' : 'text-slate-900'}`}>
                            {cobranza.fechaVencimiento}
                          </p>
                        </div>
                      </div>

                      {/* Barra de progreso de pago */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Pagado: ${cobranza.montoPagado.toLocaleString()}</span>
                          <span>Saldo: ${saldoPendiente.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              cobranza.estado === 'pagado' ? 'bg-green-500' : 
                              cobranza.estado === 'vencido' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Historial de pagos */}
                      {cobranza.historialPagos.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-xs font-medium text-slate-500">Historial de pagos:</p>
                          {cobranza.historialPagos.map(pago => (
                            <div key={pago.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-1.5 rounded">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{pago.fecha}</span>
                              <span className="font-medium">${pago.monto.toLocaleString()}</span>
                              <span className="text-slate-400">({pago.formaPago})</span>
                              {pago.referencia && <span className="text-slate-400">Ref: {pago.referencia}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notas */}
                      {mostrarNotas === cobranza.proyectoId ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={notasTemp}
                            onChange={(e) => setNotasTemp(e.target.value)}
                            placeholder="Notas de cobranza..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm min-h-[80px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleGuardarNotas(cobranza.proyectoId)}>
                              Guardar Notas
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setMostrarNotas(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : cobranza.notasCobranza ? (
                        <div className="mt-2 flex items-start gap-2 text-sm text-slate-600 bg-yellow-50 p-2 rounded">
                          <MessageSquare className="w-4 h-4 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-yellow-600 font-medium mb-1">Notas de cobranza:</p>
                            {cobranza.notasCobranza}
                          </div>
                        </div>
                      ) : null}

                      {mostrarNotas !== cobranza.proyectoId && (
                        <button
                          onClick={() => {
                            setMostrarNotas(cobranza.proyectoId);
                            setNotasTemp(cobranza.notasCobranza);
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {cobranza.notasCobranza ? 'Editar notas' : 'Agregar notas'}
                        </button>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {cobranza.estado !== 'pagado' && cobranza.estado !== 'incobrable' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setMostrarFormPago(cobranza.proyectoId);
                            setMontoPago(saldoPendiente.toString());
                          }}
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Registrar Pago
                        </Button>
                      )}

                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onActualizarContacto(cobranza.proyectoId, new Date().toISOString().split('T')[0]);
                        }}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Contactado Hoy
                      </Button>

                      {cobranza.estado !== 'incobrable' && cobranza.estado !== 'pagado' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('¿Marcar como incobrable? Esta acción no se puede deshacer.')) {
                              onMarcarIncobrable(cobranza.proyectoId);
                            }
                          }}
                        >
                          <AlertOctagon className="w-3 h-3 mr-1" />
                          Incobrable
                        </Button>
                      )}

                      {cobranza.ultimoContacto && (
                        <p className="text-xs text-slate-400 text-center">
                          Último contacto: {cobranza.ultimoContacto}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Formulario de pago */}
                  {mostrarFormPago === cobranza.proyectoId && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-green-900">Registrar Pago</h4>
                        <Button variant="ghost" size="sm" onClick={() => setMostrarFormPago(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Monto</label>
                          <Input
                            type="number"
                            value={montoPago}
                            onChange={(e) => setMontoPago(e.target.value)}
                            placeholder={saldoPendiente.toString()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Forma de Pago</label>
                          <select
                            value={formaPago}
                            onChange={(e) => setFormaPago(e.target.value as PagoRecibido['formaPago'])}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="transferencia">Transferencia</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="cheque">Cheque</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="deposito">Depósito</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Fecha</label>
                          <Input
                            type="date"
                            value={fechaPago}
                            onChange={(e) => setFechaPago(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Referencia</label>
                          <Input
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                      <Button 
                        className="mt-3 w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleRegistrarPago(cobranza.proyectoId)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Confirmar Pago de ${parseFloat(montoPago || '0').toLocaleString()}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
