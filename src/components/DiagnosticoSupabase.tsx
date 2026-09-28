import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

// Todas las tablas públicas de Supabase a verificar
const TABLAS: { tabla: string; nombre: string }[] = [
  { tabla: 'perfiles', nombre: 'Perfiles' },
  { tabla: 'cotizaciones', nombre: 'Cotizaciones' },
  { tabla: 'proyectos', nombre: 'Proyectos' },
  { tabla: 'ordenes_compra', nombre: 'Órdenes de Compra' },
  { tabla: 'proveedores', nombre: 'Proveedores' },
  { tabla: 'clientes', nombre: 'Clientes' },
  { tabla: 'contactos', nombre: 'Contactos' },
  { tabla: 'talleres', nombre: 'Talleres' },
  { tabla: 'materiales', nombre: 'Materiales' },
  { tabla: 'catalogo_materiales', nombre: 'Catálogo Materiales' },
  { tabla: 'catalogo_materiales_v2', nombre: 'Catálogo Materiales V2' },
  { tabla: 'procesos', nombre: 'Procesos' },
  { tabla: 'piezas_catalogo', nombre: 'Piezas Catálogo' },
  { tabla: 'pendientes', nombre: 'Pendientes' },
  { tabla: 'alertas', nombre: 'Alertas' },
  { tabla: 'cobranza', nombre: 'Cobranza' },
  { tabla: 'pagos_recibidos', nombre: 'Pagos Recibidos' },
  { tabla: 'consecutivos_proyectos', nombre: 'Consecutivos Proyectos' },
  { tabla: 'consecutivos_oc', nombre: 'Consecutivos OC' },
  { tabla: 'cotizaciones_backup', nombre: 'Cotizaciones Backup (legacy)' },
];

const testInicial = (name: string): TestResult => ({ name, status: 'pending', message: 'Pendiente...' });

export function DiagnosticoSupabase() {
  const [tests, setTests] = useState<TestResult[]>([
    testInicial('Conexión con Supabase'),
    testInicial('Autenticación'),
    ...TABLAS.map(t => testInicial(`Tabla ${t.nombre}`)),
    testInicial('Políticas RLS (escritura)'),
  ]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    // Reiniciar todos a pendiente
    const newTests: TestResult[] = [
      testInicial('Conexión con Supabase'),
      testInicial('Autenticación'),
      ...TABLAS.map(t => testInicial(`Tabla ${t.nombre}`)),
      testInicial('Políticas RLS (escritura)'),
    ];
    setTests([...newTests]);

    const actualizar = (index: number, resultado: TestResult) => {
      newTests[index] = resultado;
      setTests([...newTests]);
    };

    // Test 0: Conexión con Supabase
    try {
      const { error } = await supabase.from('perfiles').select('count').limit(1);
      if (error) throw error;
      actualizar(0, { name: 'Conexión con Supabase', status: 'success', message: 'Conectado correctamente' });
    } catch (err: any) {
      actualizar(0, { name: 'Conexión con Supabase', status: 'error', message: err.message });
    }

    // Test 1: Autenticación
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      actualizar(1, { name: 'Autenticación', status: 'success', message: `Usuario: ${user?.email || 'N/A'}` });
    } catch (err: any) {
      actualizar(1, { name: 'Autenticación', status: 'error', message: err.message });
    }

    // Tests de tablas: lectura con conteo exacto (sin traer filas)
    for (let i = 0; i < TABLAS.length; i++) {
      const { tabla, nombre } = TABLAS[i];
      const idx = i + 2;
      try {
        const { count, error } = await supabase
          .from(tabla)
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        actualizar(idx, {
          name: `Tabla ${nombre}`,
          status: 'success',
          message: `${count ?? 0} registros · acceso OK`,
        });
      } catch (err: any) {
        actualizar(idx, { name: `Tabla ${nombre}`, status: 'error', message: err.message });
      }
    }

    // Último test: INSERT y DELETE de prueba en cotizaciones
    const idxRLS = TABLAS.length + 2;
    try {
      const testId = crypto.randomUUID();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('cotizaciones').insert([{
        id: testId,
        numero: 'TEST-001',
        usuario_id: user?.id,
        cliente_nombre: 'Cliente Test',
        proyecto_nombre: 'Proyecto Test',
        total: 100,
        estado: 'borrador',
      }]);
      if (insertError) throw insertError;

      const { error: deleteError } = await supabase.from('cotizaciones').delete().eq('id', testId);
      if (deleteError) throw deleteError;

      actualizar(idxRLS, { name: 'Políticas RLS (escritura)', status: 'success', message: 'INSERT y DELETE funcionan correctamente' });
    } catch (err: any) {
      actualizar(idxRLS, { name: 'Políticas RLS (escritura)', status: 'error', message: err.message });
    }

    setRunning(false);
  };

  useEffect(() => {
    runTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const pendingCount = tests.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-4 p-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Diagnóstico de Supabase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">{successCount} OK</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm">{errorCount} Errores</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-500">{pendingCount} pendientes</span>
              </div>
            )}
            <Button
              onClick={runTests}
              disabled={running}
              size="sm"
              className="ml-auto"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reejecutar'}
            </Button>
          </div>

          <div className="space-y-2">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  test.status === 'success' ? 'bg-green-50 border-green-200' :
                  test.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {test.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {test.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                    {test.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <Badge
                    variant={test.status === 'success' ? 'default' : test.status === 'error' ? 'destructive' : 'secondary'}
                  >
                    {test.status === 'success' ? 'OK' : test.status === 'error' ? 'Error' : '...'}
                  </Badge>
                </div>
                <p className={`text-sm mt-1 ${
                  test.status === 'success' ? 'text-green-700' :
                  test.status === 'error' ? 'text-red-700' :
                  'text-slate-500'
                }`}>
                  {test.message}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Información de Conexión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1 text-slate-600">
            <p><strong>URL de Supabase:</strong> {import.meta.env.VITE_SUPABASE_URL || 'No configurada'}</p>
            <p><strong>Key configurada:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Sí' : 'No'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
