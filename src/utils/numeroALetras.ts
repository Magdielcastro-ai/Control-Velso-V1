/* ─── Utilidad: Número a letras (español, para importes en documentos) ─── */

const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

export function numeroALetras(num: number): string {
  const n = Math.floor(num);
  if (n === 0) return 'cero';
  if (n === 100) return 'cien';
  if (n === 1000) return 'mil';
  if (n === 1000000) return 'un millón';

  let result = '';
  let resto = n;

  const millones = Math.floor(resto / 1000000);
  if (millones > 0) {
    result += millones === 1 ? 'un millón ' : `${numeroALetras(millones)} millones `;
    resto %= 1000000;
  }

  const miles = Math.floor(resto / 1000);
  if (miles > 0) {
    result += miles === 1 ? 'mil ' : `${numeroALetras(miles)} mil `;
    resto %= 1000;
  }

  const c = Math.floor(resto / 100);
  if (c > 0) {
    result += centenas[c] + ' ';
    resto %= 100;
  }

  if (resto >= 10 && resto < 20) {
    result += especiales[resto - 10];
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    if (d > 0) {
      result += decenas[d];
      if (u > 0) {
        result += d === 2 ? 'i' : ' y ';
        result += unidades[u];
      }
    } else if (u > 0) {
      result += unidades[u];
    }
  }

  return result.trim();
}

/** Importe completo con letra: "cinco mil quinientos treinta y seis pesos 86/100 M.N." */
export function importeConLetra(monto: number, moneda: 'MXN' | 'USD' = 'MXN'): string {
  const centavos = Math.round((monto % 1) * 100).toString().padStart(2, '0');
  const nombreMoneda = moneda === 'USD' ? 'dólares' : 'pesos';
  const sufijo = moneda === 'USD' ? 'USD' : 'M.N.';
  return `${numeroALetras(monto)} ${nombreMoneda} ${centavos}/100 ${sufijo}`;
}
