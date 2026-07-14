import json
import os
from datetime import datetime

# Simulación de la migración - Este script se ejecutará con PythonRun
# para procesar las cotizaciones de Supabase

def migrar_cotizacion(cotizacion):
    """
    Migra una cotización del formato antiguo al nuevo:
    1. Convierte materiales[] → material{} (primer material del array)
    2. Agrega tiempoMinutosPorPieza a procesos que no lo tengan
    3. Recalcula totales con nueva fórmula: material.costoTotal / cantidad
    """
    piezas_migradas = []
    
    for pieza in cotizacion.get('piezas', []):
        # 1. Migrar materiales[] → material{}
        if 'materiales' in pieza and pieza['materiales'] and len(pieza['materiales']) > 0:
            # Tomar el primer material del array
            mat = pieza['materiales'][0]
            # Asegurar que tenga los campos necesarios del nuevo formato
            pieza['material'] = {
                'id': mat.get('id', ''),
                'nombre': mat.get('nombre', ''),
                'tipo': mat.get('tipo', ''),
                'forma': mat.get('forma', 'redondo'),
                'unidadMedida': mat.get('unidadMedida', 'mm'),
                'cantidad': mat.get('cantidad', pieza.get('cantidad', 1)),
                'unidad': mat.get('unidad', 'pieza'),
                'costoUnitario': mat.get('costoUnitario', 0),
                'margenPorcentaje': mat.get('margenPorcentaje', 0),
                'costoTotal': mat.get('costoTotal', 0),
                # Dimensiones opcionales
                'diametro': mat.get('diametro'),
                'lado': mat.get('lado'),
                'largo': mat.get('largo'),
                'ancho': mat.get('ancho'),
                'espesor': mat.get('espesor'),
                'diametro_exterior': mat.get('diametro_exterior'),
                'diametro_interior': mat.get('diametro_interior'),
                'lado_a': mat.get('lado_a'),
                'lado_b': mat.get('lado_b'),
                'descripcion': mat.get('descripcion'),
                'dimensiones_libre': mat.get('dimensiones_libre'),
            }
            # Eliminar el array antiguo
            del pieza['materiales']
        
        # 2. Migrar procesos: agregar tiempoMinutosPorPieza si no existe
        procesos_migrados = []
        for proceso in pieza.get('procesos', []):
            if 'tiempoMinutosPorPieza' not in proceso:
                # Calcular tiempo por pieza = tiempoTotal / cantidad
                cantidad = pieza.get('cantidad', 1)
                tiempo_total = proceso.get('tiempoMinutos', 0)
                proceso['tiempoMinutosPorPieza'] = tiempo_total / cantidad if cantidad > 0 else tiempo_total
            procesos_migrados.append(proceso)
        pieza['procesos'] = procesos_migrados
        
        piezas_migradas.append(pieza)
    
    cotizacion['piezas'] = piezas_migradas
    return cotizacion


def recalcular_totales(cotizacion, margen_utilidad=30, iva_porcentaje=16):
    """
    Recalcula los totales de la cotización con la nueva fórmula:
    - Material: costoTotal / cantidad (costo por pieza)
    - Procesos: tiempoMinutosPorPieza × cantidad = tiempoTotal
    - Margen: subtotal = costoDirecto / (1 - margen%)
    """
    total_general = 0
    
    for pieza in cotizacion.get('piezas', []):
        cantidad = pieza.get('cantidad', 1)
        
        # Material: costoTotal es para TODAS las piezas, dividir por cantidad
        costo_material = 0
        if pieza.get('material'):
            costo_material = pieza['material'].get('costoTotal', 0) / cantidad if cantidad > 0 else 0
        
        # Procesos: recalcular con tiempoMinutosPorPieza
        costo_procesos = 0
        for proceso in pieza.get('procesos', []):
            if proceso.get('tipo') == 'otro':
                # Proceso externo: costoTotal es fijo (no cambia con cantidad)
                costo_procesos += proceso.get('costoTotalIngresado', proceso.get('costoTotal', 0))
            else:
                # Proceso de máquina: recalcular
                tiempo_min_por_pieza = proceso.get('tiempoMinutosPorPieza', 0)
                tiempo_total = tiempo_min_por_pieza * cantidad
                tiempo_horas = tiempo_total / 60
                costo_maquina = tiempo_horas * proceso.get('costoPorHora', 0)
                costo_mo = tiempo_horas * proceso.get('costoManoObraPorHora', 0)
                costo_total_proceso = costo_maquina + costo_mo
                
                proceso['tiempoMinutos'] = tiempo_total
                proceso['costoTotal'] = costo_total_proceso
                costo_procesos += costo_total_proceso
        
        # Costos adicionales por pieza
        costos_adic = pieza.get('costosAdicionales', {})
        costo_adicionales = sum(costos_adic.values()) if costos_adic else 0
        
        # Costo directo por pieza
        costo_directo = costo_material + costo_procesos + costo_adicionales
        
        # Margen financiero: utilidad sobre precio de venta
        # subtotal = costoDirecto / (1 - margen%)
        margen = max(0, min(99, margen_utilidad))
        factor = 1 - (margen / 100)
        subtotal_pieza = costo_directo / factor if factor > 0 else costo_directo
        iva_pieza = subtotal_pieza * (iva_porcentaje / 100)
        total_pieza = subtotal_pieza + iva_pieza
        
        pieza['subtotalPieza'] = round(subtotal_pieza, 2)
        pieza['ivaPieza'] = round(iva_pieza, 2)
        pieza['totalPieza'] = round(total_pieza, 2)
        
        total_general += subtotal_pieza
    
    # Costos adicionales generales
    costos_gen = cotizacion.get('costosAdicionales', {})
    costo_general = sum(costos_gen.values()) if costos_gen else 0
    
    subtotal = total_general + costo_general
    iva = subtotal * (iva_porcentaje / 100)
    total = subtotal + iva
    
    cotizacion['subtotal'] = round(subtotal, 2)
    cotizacion['iva'] = round(iva, 2)
    cotizacion['total'] = round(total, 2)
    
    return cotizacion


# Función principal para ejecutar la migración
def main(ctx):
    """
    Este script se ejecutará con PythonRun para migrar las cotizaciones.
    Como no podemos acceder directamente a Supabase desde PythonRun,
    generaremos los comandos SQL necesarios.
    """
    
    # Leer las cotizaciones desde un archivo JSON (se exportarán de Supabase)
    # Por ahora, generamos el script SQL de migración
    
    sql_migracion = """
-- ============================================
-- MIGRACIÓN DE COTIZACIONES ANTIGUAS
-- ============================================
-- Backup: Las cotizaciones originales se guardan en cotizaciones_backup

-- 1. Crear tabla de backup si no existe
CREATE TABLE IF NOT EXISTS cotizaciones_backup (
    LIKE cotizaciones INCLUDING ALL
);

-- 2. Guardar cotizaciones antiguas en backup (solo las que necesitan migración)
INSERT INTO cotizaciones_backup
SELECT * FROM cotizaciones
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(piezas) as p
  WHERE (p->>'materiales') IS NOT NULL 
     OR (p->'procesos') @? '$[*] ? (@.tiempoMinutosPorPieza == null)'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Actualizar cada cotización: migrar materiales[] → material{}
-- y agregar tiempoMinutosPorPieza a procesos
UPDATE cotizaciones
SET piezas = (
  SELECT jsonb_agg(
    CASE 
      WHEN (p->>'materiales') IS NOT NULL AND jsonb_array_length(p->'materiales') > 0 THEN
        -- Migrar primer material del array a objeto material
        jsonb_set(
          p - 'materiales',
          '{material}',
          p->'materiales'->0
        )
      ELSE p
    END
  )
  FROM jsonb_array_elements(piezas) as p
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(piezas) as p
  WHERE (p->>'materiales') IS NOT NULL
);

-- 4. Agregar tiempoMinutosPorPieza a procesos que no lo tengan
-- Esto requiere un procedimiento más complejo en PostgreSQL
-- Se hará vía aplicación (Edge Function o script Python)

SELECT 'Migración de materiales completada' as status;
"""
    
    # Guardar el SQL
    output_path = os.path.join(ctx['runDir'], 'migracion_cotizaciones.sql')
    with open(output_path, 'w') as f:
        f.write(sql_migracion)
    
    return {
        'sql_file': output_path,
        'message': 'Script SQL de migración generado. Ejecutar en Supabase SQL Editor.',
        'next_steps': [
            '1. Ejecutar el SQL en Supabase SQL Editor',
            '2. Para la migración de procesos (tiempoMinutosPorPieza), usar el script Python',
            '3. Verificar que las cotizaciones se carguen correctamente en la app'
        ]
    }


if __name__ == '__main__':
    # Para pruebas locales
    import sys
    
    # Ejemplo de cotización antigua
    cotizacion_ejemplo = {
        "id": "test-123",
        "piezas": [
            {
                "id": "p1",
                "nombre": "Buje",
                "cantidad": 3,
                "materiales": [
                    {
                        "id": "m1",
                        "nombre": "Bronce",
                        "tipo": "bronce",
                        "forma": "redondo",
                        "costoTotal": 8400,
                        "costoUnitario": 2800,
                        "cantidad": 3
                    }
                ],
                "procesos": [
                    {
                        "id": "pr1",
                        "nombre": "Torno CNC",
                        "tipo": "torno_cnc",
                        "tiempoMinutos": 90,  # 30 min × 3 piezas
                        "costoPorHora": 206.06,
                        "costoTotal": 309.09
                    }
                ]
            }
        ]
    }
    
    print("=== COTIZACIÓN ORIGINAL ===")
    print(json.dumps(cotizacion_ejemplo, indent=2, ensure_ascii=False))
    
    # Migrar
    cotizacion_migrada = migrar_cotizacion(cotizacion_ejemplo)
    
    print("\n=== COTIZACIÓN MIGRADA ===")
    print(json.dumps(cotizacion_migrada, indent=2, ensure_ascii=False))
    
    # Verificar
    pieza = cotizacion_migrada['piezas'][0]
    print(f"\n=== VERIFICACIÓN ===")
    print(f"Material: {pieza.get('material') is not None}")
    print(f"TiempoMinutosPorPieza: {pieza['procesos'][0].get('tiempoMinutosPorPieza')}")
