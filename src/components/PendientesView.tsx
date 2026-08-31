// src/components/PendientesView.tsx
// Bullet journal manual de pendientes — sin automatización.
// El usuario anota cliente + pendiente, los tacha al completarlos
// y puede imprimir o exportar a PDF su lista.

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Printer,
  Trash2,
  CheckCircle,
  Circle,
} from 'lucide-react';
import type { Pendiente } from '@/types/pendientes';

interface PendientesViewProps {
  onVolver: () => void;
  pendientes: Pendiente[];
  onCompletar: (id: string) => void;
  onAgregar: (pendiente: Omit<Pendiente, 'id' | 'fechaCreacion' | 'diasEstancado'>) => void;
  onEliminar?: (id: string) => void;
}

export function PendientesView({
  onVolver,
  pendientes,
  onCompletar,
  onAgregar,
  onEliminar,
}: PendientesViewProps) {
  const [nuevoCliente, setNuevoCliente] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [mostrarCompletados, setMostrarCompletados] = useState(false);

  const activos = useMemo(
    () => pendientes.filter((p) => !p.completado),
    [pendientes]
  );
  const completados = useMemo(
    () => pendientes.filter((p) => p.completado),
    [pendientes]
  );

  const handleAgregar = () => {
    if (!nuevoTitulo.trim()) return;

    onAgregar({
      tipo: 'manual',
      titulo: nuevoTitulo.trim(),
      descripcion: '',
      clienteNombre: nuevoCliente.trim() || 'General',
      proyectoNombre: '',
      fechaVencimiento: new Date().toISOString().split('T')[0],
      prioridad: 'media',
      completado: false,
      responsable: 'yo',
      notas: '',
    });

    setNuevoTitulo('');
    // Se conserva el cliente para anotar varios pendientes seguidos del mismo
  };

  const handleEliminar = (id: string) => {
    if (!onEliminar) return;
    if (!confirm('¿Eliminar este pendiente definitivamente?')) return;
    onEliminar(id);
  };

  const handleImprimir = () => {
    document.body.classList.add('imprimiendo-pendientes');
    window.print();
    // Limpieza por si el diálogo de impresión se cancela
    setTimeout(() => document.body.classList.remove('imprimiendo-pendientes'), 500);
  };

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onVolver} className="border-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pendientes</h1>
            <p className="text-sm text-slate-500">
              Bullet journal manual — anota, tacha e imprime
            </p>
          </div>
        </div>
        <Button onClick={handleImprimir} variant="outline" className="border-slate-300">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / PDF
        </Button>
      </div>

      {/* Captura rápida */}
      <div className="flex flex-col sm:flex-row gap-2 no-print">
        <Input
          placeholder="Cliente"
          value={nuevoCliente}
          onChange={(e) => setNuevoCliente(e.target.value)}
          className="sm:w-48"
        />
        <Input
          placeholder="Pendiente (ej. llamar para seguimiento de cotización)"
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
          className="flex-1"
        />
        <Button
          onClick={handleAgregar}
          disabled={!nuevoTitulo.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Anotar
        </Button>
      </div>

      {/* Lista interactiva (pantalla) */}
      <div className="space-y-1.5 no-print">
        {activos.length === 0 && completados.length === 0 ? (
          <p className="text-center text-slate-400 py-10">
            No hay pendientes anotados. Escribe el primero arriba ✏️
          </p>
        ) : (
          <>
            {activos.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 group"
              >
                <button
                  onClick={() => onCompletar(p.id)}
                  className="text-slate-300 hover:text-green-500 transition-colors shrink-0"
                  title="Marcar como hecho"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <span className="font-semibold text-slate-800 shrink-0">{p.clienteNombre}</span>
                <span className="text-slate-400 shrink-0">—</span>
                <span className="text-slate-700 flex-1 min-w-0">{p.titulo}</span>
                {onEliminar && (
                  <button
                    onClick={() => handleEliminar(p.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {completados.length > 0 && (
              <div className="pt-4">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer px-3 pb-2">
                  <input
                    type="checkbox"
                    checked={mostrarCompletados}
                    onChange={(e) => setMostrarCompletados(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Mostrar completados ({completados.length})
                </label>
                {mostrarCompletados &&
                  completados.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 py-2 px-3 opacity-50"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="font-semibold text-slate-600 shrink-0">{p.clienteNombre}</span>
                      <span className="text-slate-300 shrink-0">—</span>
                      <span className="text-slate-500 line-through flex-1 min-w-0">{p.titulo}</span>
                      {onEliminar && (
                        <button
                          onClick={() => handleEliminar(p.id)}
                          className="text-slate-300 hover:text-red-500 shrink-0"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── ÁREA DE IMPRESIÓN: bullet journal limpio ─── */}
      <div className="area-impresion hidden print:block">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Pendientes</h1>
        <p className="text-sm text-slate-500 mb-4 capitalize">{fechaHoy}</p>
        <div className="border-t-2 border-slate-800 mb-3" />
        {activos.length === 0 ? (
          <p className="text-slate-400 text-sm">Sin pendientes activos 🎉</p>
        ) : (
          <ul className="space-y-2.5">
            {activos.map((p) => (
              <li key={p.id} className="flex items-start gap-3 text-sm">
                <span className="inline-block w-4 h-4 border-2 border-slate-700 rounded-sm mt-0.5 shrink-0" />
                <span>
                  <strong>{p.clienteNombre}</strong>
                  {' — '}
                  {p.titulo}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-300 mt-8">
          {activos.length} pendiente{activos.length !== 1 ? 's' : ''} · Soluciones Integrales Velso
        </p>
      </div>
    </div>
  );
}
