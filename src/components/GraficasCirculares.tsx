import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatosGrafica {
  nombre: string;
  valor: number;
  color: string;
}

interface GraficaCircularProps {
  titulo: string;
  datos: DatosGrafica[];
  mostrarPorcentaje?: boolean;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export function GraficaCircular({ titulo, datos, mostrarPorcentaje = true }: GraficaCircularProps) {
  const total = datos.reduce((sum, d) => sum + d.valor, 0);
  
  const datosConPorcentaje = datos.map((d, index) => ({
    ...d,
    porcentaje: total > 0 ? ((d.valor / total) * 100).toFixed(1) : '0.0',
    fill: d.color || COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.nombre}</p>
          <p className="text-sm">
            Valor: <span className="font-medium">{data.valor.toFixed(2)}</span>
          </p>
          {mostrarPorcentaje && (
            <p className="text-sm">
              Porcentaje: <span className="font-medium">{data.porcentaje}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={datosConPorcentaje}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="valor"
              nameKey="nombre"
            >
              {datosConPorcentaje.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value: string, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value} ({entry.payload.porcentaje}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 && (
          <div className="text-center mt-2">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-bold">{total.toFixed(2)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Gráfica de comparación (dona doble)
interface GraficaComparacionProps {
  titulo: string;
  datos1: { nombre: string; valor: number }[];
  datos2: { nombre: string; valor: number }[];
  color1: string;
  color2: string;
  label1: string;
  label2: string;
}

export function GraficaComparacion({ 
  titulo, 
  datos1, 
  datos2, 
  color1, 
  color2,
  label1,
  label2
}: GraficaComparacionProps) {
  const total1 = datos1.reduce((sum, d) => sum + d.valor, 0);
  const total2 = datos2.reduce((sum, d) => sum + d.valor, 0);

  const data1 = datos1.map(d => ({ name: d.nombre, value: d.valor }));
  const data2 = datos2.map(d => ({ name: d.nombre, value: d.valor }));

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            {/* Anillo exterior (datos 1) */}
            <Pie
              data={data1}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={90}
              dataKey="value"
              nameKey="name"
              stroke={color1}
              fill={color1}
              fillOpacity={0.6}
            />
            {/* Anillo interior (datos 2) */}
            <Pie
              data={data2}
              cx="50%"
              cy="45%"
              innerRadius={45}
              outerRadius={65}
              dataKey="value"
              nameKey="name"
              stroke={color2}
              fill={color2}
              fillOpacity={0.8}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Leyenda personalizada */}
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color1, opacity: 0.6 }}></div>
            <div>
              <p className="text-xs text-slate-500">{label1}</p>
              <p className="font-semibold">{total1.toFixed(2)}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color2, opacity: 0.8 }}></div>
            <div>
              <p className="text-xs text-slate-500">{label2}</p>
              <p className="font-semibold">{total2.toFixed(2)}h</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Gráfica de barras horizontales para comparación
interface GraficaBarrasProps {
  titulo: string;
  datos: {
    categoria: string;
    cotizadas: number;
    vendidas: number;
    fabricadas: number;
    facturadas: number;
  }[];
}

export function GraficaBarrasComparacion({ titulo, datos }: GraficaBarrasProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {datos.map((item) => (
            <div key={item.categoria} className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{item.categoria}</span>
              </div>
              <div className="space-y-1">
                {/* Cotizadas */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 text-slate-500">Cotizadas</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-400 h-full rounded-full"
                      style={{ width: `${Math.min((item.cotizadas / Math.max(item.cotizadas, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right">{item.cotizadas.toFixed(1)}h</span>
                </div>
                {/* Vendidas */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 text-slate-500">Vendidas</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${Math.min((item.vendidas / Math.max(item.cotizadas, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right">{item.vendidas.toFixed(1)}h</span>
                </div>
                {/* Fabricadas */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 text-slate-500">Fabricadas</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min((item.fabricadas / Math.max(item.cotizadas, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right">{item.fabricadas.toFixed(1)}h</span>
                </div>
                {/* Facturadas */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 text-slate-500">Facturadas</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${Math.min((item.facturadas / Math.max(item.cotizadas, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right">{item.facturadas.toFixed(1)}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
