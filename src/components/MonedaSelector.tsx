import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MONEDAS, type Moneda } from '@/types/cotizacion';
import { Coins } from 'lucide-react';

interface MonedaSelectorProps {
  moneda: Moneda;
  onChange: (moneda: Moneda) => void;
}

export function MonedaSelector({ moneda, onChange }: MonedaSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Coins className="w-3.5 h-3.5 text-slate-400" />
      <Select value={moneda} onValueChange={(val) => onChange(val as Moneda)}>
        <SelectTrigger className="h-7 text-xs w-[100px] border-slate-200 bg-white">
          <SelectValue placeholder="Moneda" />
        </SelectTrigger>
        <SelectContent>
          {MONEDAS.map((m) => (
            <SelectItem key={m.codigo} value={m.codigo} className="text-xs">
              {m.simbolo} {m.codigo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
