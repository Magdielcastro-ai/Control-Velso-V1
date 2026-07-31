import { useState, useCallback, useEffect } from 'react';
import type { Moneda } from '@/types/cotizacion';

const MONEDA_STORAGE_KEY = 'velso_moneda_preferida';

export const useMonedaStore = () => {
  const [moneda, setMoneda] = useState<Moneda>(() => {
    try {
      const guardada = localStorage.getItem(MONEDA_STORAGE_KEY);
      if (guardada && ['MXN', 'USD'].includes(guardada)) {
        return guardada as Moneda;
      }
    } catch {
      // localStorage no disponible
    }
    return 'MXN';
  });

  useEffect(() => {
    try {
      localStorage.setItem(MONEDA_STORAGE_KEY, moneda);
    } catch {
      // localStorage no disponible
    }
  }, [moneda]);

  const cambiarMoneda = useCallback((nuevaMoneda: Moneda) => {
    setMoneda(nuevaMoneda);
  }, []);

  return {
    moneda,
    cambiarMoneda,
  };
};
