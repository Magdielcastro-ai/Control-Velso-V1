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
  data?: any;
}

export function DiagnosticoSupabase() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Conexión con Supabase', status: 'pending', message: 'Pendiente...' },
    { name: 'Autenticación', status: 'pending', message: 'Pendiente...' },
    { name: 'Tabla Perfiles', status: 'pending', message: 'Pendiente...' },
    { name: 'Tabla Cotizaciones', status: 'pending', message: 'Pendiente...' },
    { name: 'Tabla Proyectos', status: 'pending', message: 'Pendiente...' },
    { name: 'Tabla Clientes', status: 'pending', message: 'Pendiente...' },
    { name: 'Tabla Talleres', status: 'pending', message: 'Pendiente...' },
    { name: 'Políticas RLS', status: 'pending', message: 'Pendiente...' },
  ]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    const newTests = [...tests];

    // Test 1: Conexión con Supabase
    try {
      const { data, error } = await supabase.from('perfiles').select('count').limit(1);
      if (error) throw error;
      newTests[0] = { name: 'Conexión con Supabase', status: 'success', message: 'Conectado correctamente', data };
    } catch (err: any) {
      newTests[0] = { name: 'Conexión con Supabase', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    // Test 2: Autenticación
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      newTests[1] = { name: 'Autenticación', status: 'success', message: `Usuario: ${user?.email || 'N/A'}`, data: user };
    } catch (err: any) {
      newTests[1] = { name: 'Autenticación', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    // Test 3: Tabla Perfiles
    try {
      const { data, error } = await supabase.from('perfiles').select('*').limit(5);
      if (error) throw error;
      newTests[2] = { name: 'Tabla Perfiles', status: 'success', message: `${data?.length || 0} registros encontrados`, data };
    } catch (err: any) {
      newTests[2] = { name: 'Tabla Perfiles', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    // Test 4: Tabla Cotizaciones
    try {
      const { data, error } = await supabase.from('cotizaciones').select('*').limit(5);
      if (error) throw error;
      newTests[3] = { name: 'Tabla Cotizaciones', status: 'success', message: `${data?.length || 0} registros encontrados`, data };
    } catch (err: any) {
      newTests[3] = { name: 'Tabla Cotizaciones', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    // Test 5: Tabla Proyectos
    try {
      const { data, error } = await supabase.from('proyectos').select('*').limit(5);
      if (error) throw error;
      newTests[4] = { name: 'Tabla Proyectos', status: 'success', message: `${data?.length || 0} registros encontrados`, data };
    } catch (err: any) {
      newTests[4] = { name: 'Tabla Proyectos', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    // Test 6: Tabla Clientes
    try {
      const { data, error } = await supabase.from('clientes').select('*').limit(5);
      if (error) throw error;
      newTests[5] = { name: 'Tabla Clientes', status: 'success', message: `${data?.length || 0} registros encontrados`, data };
    } catch (err: any) {
      newTests[5] = { name: 'Tabla Clientes', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    // Test 7: Tabla Talleres
    try {
      const { data, error } = await supabase.from('talleres').select('*').limit(5);
      if (error) throw error;
      newTests[6] = { name: 'Tabla Talleres', status: 'success', message: `${data?.length || 0} registros encontrados`, data };
    } catch (err: any) {
      newTests[6] = { name: 'Tabla Talleres', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    // Test 8: Insertar y eliminar una cotización de prueba
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
      
      // Si se insertó, eliminarlo
      const { error: deleteError } = await supabase.from('cotizaciones').delete().eq('id', testId);
      if (deleteError) throw deleteError;
      
      newTests[7] = { name: 'Políticas RLS', status: 'success', message: 'INSERT y DELETE funcionan correctamente' };
    } catch (err: any) {
      newTests[7] = { name: 'Políticas RLS', status: 'error', message: err.message };
    }
    setTests([...newTests]);

    setRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;

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
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">{successCount} OK</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm">{errorCount} Errores</span>
            </div>
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
                {test.data && (
                  <pre className="text-xs bg-slate-100 p-2 rounded mt-2 overflow-auto max-h-32">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                )}
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
