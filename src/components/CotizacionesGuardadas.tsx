import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  DollarSign, 
  Trash2, 
  Eye,
  FolderOpen,
  CheckCircle,
  Clock,
  XCircle,
  Send
} from 'lucide-react';
import type { CotizacionGuardada } from '@/types/cotizacion';

interface CotizacionesGuardadasProps {
  cotizaciones: CotizacionGuardada[];
  onVolver: () => void;
  onCargar: (id: string) => void;
  onEliminar: (id: string) => void;
}

const estadosConfig = {
  borrador: { label: 'Borrador', color: 'bg-slate-500', icon: Clock },
  enviada: { label: 'Enviada', color: 'bg-blue-500', icon: Send },
  aceptada: { label: 'Aceptada', color: 'bg-green-500', icon: CheckCircle },
  rechazada: { label: 'Rechazada', color: 'bg-red-500', icon: XCircle },
};

export function CotizacionesGuardadas({ 
  cotizaciones, 
  onVolver, 
  onCargar, 
  onEliminar 
}: CotizacionesGuardadasProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="border-slate-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">Cotizaciones Guardadas</h2>
      </div>

      {cotizaciones.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No hay cotizaciones guardadas
            </h3>
            <p className="text-slate-500 mb-4">
              Crea tu primera cotización para comenzar
            </p>
            <Button onClick={onVolver} className="bg-blue-600 hover:bg-blue-700">
              Crear Cotización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Historial de Cotizaciones
              <Badge variant="secondary" className="ml-2">
                {cotizaciones.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizaciones.map((cot) => {
                    const estadoConfig = estadosConfig[cot.estado];
                    return (
                      <TableRow key={cot.id}>
                        <TableCell className="font-medium">{cot.numero}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(cot.fecha).toLocaleDateString('es-MX')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4 text-slate-400" />
                            {cot.clienteNombre}
                          </span>
                        </TableCell>
                        <TableCell>{cot.proyectoNombre}</TableCell>
                        <TableCell className="text-right font-semibold">
                          <span className="flex items-center justify-end gap-1">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            {cot.total.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${estadoConfig.color} text-white flex items-center gap-1 w-fit`}>
                            <estadoConfig.icon className="w-3 h-3" />
                            {estadoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCargar(cot.id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Ver/Editar"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEliminar(cot.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
