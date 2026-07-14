-- Migración de cotizaciones antiguas al nuevo formato
-- Problemas a corregir:
-- 1. piezas con 'materiales' array (viejo) → 'material' object (nuevo)
-- 2. procesos sin 'tiempoMinutosPorPieza' → calcularlo
-- 3. Recalcular totales con la nueva fórmula de material (costoTotal / cantidad)

-- Primero, veamos cuántas cotizaciones necesitan migración
SELECT 
  id,
  numero,
  cliente_nombre,
  jsonb_array_length(piezas) as num_piezas
FROM cotizaciones
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(piezas) as p
  WHERE (p->>'materiales') IS NOT NULL 
     OR (p->'procesos') @? '$[*] ? (@.tiempoMinutosPorPieza == null)'
)
ORDER BY created_at DESC;
