# Plan de Correcciones - Control Velso V1

## Issues Identificados

### 1. ClienteStep - Pantalla en blanco al abrir cotización con cliente renombrado
**Problema**: Cuando un cliente fue renombrado (ej: Sunni → Sunningdale), el `clienteId` guardado en la cotización ya no existe en `clientesGuardados`. El Select recibe un value que no está en las opciones, causando crash.
**Fix**: En `ClienteStep.tsx`, cuando el cliente no se encuentra, mostrar un mensaje de "Cliente no disponible" en lugar de intentar renderizar el Select con un value inválido.

### 2. Procesos Externos - Costo por pieza vs Costo total
**Problema**: El usuario indica que el costo de procesos externos es por el TOTAL de piezas, pero la app debe desglosar el valor unitario por pieza.
**Fix**: En `PiezasStep.tsx`, el proceso externo debe:
- Recibir el costo TOTAL para todas las piezas
- Calcular y mostrar el costo unitario por pieza
- Guardar el costoTotal como el valor ingresado
- Mostrar ambos valores: unitario y total

### 3. Unidad de medida mm/in en dimensiones
**Problema**: Cuando se selecciona "in" en el selector, los placeholders de los inputs siguen mostrando "mm".
**Fix**: En `PiezasStep.tsx`, asegurar que `getDimensionesConfig` reciba la unidad correcta y los placeholders se actualicen.

### 4. Guardar datos de proyecto al cambiar pestaña
**Problema**: Los datos ingresados en la pestaña "Proyecto" no se guardan al cambiar de pestaña o cerrar sesión.
**Fix**: En `App.tsx`, asegurar que `actualizarProyecto` guarde en Supabase inmediatamente, no solo en estado local.

### 5. Fórmula de margen 30%
**Verificación**: La fórmula actual es: `subtotal = costoDirecto / (1 - margen%)`
- Si costo = $800 y margen = 30%
- subtotal = $800 / 0.70 = $1,142.86
- utilidad = $1,142.86 - $800 = $342.86 (30% del precio de venta)
**Estado**: La fórmula ya está correcta. Verificar que se esté aplicando correctamente en todos los cálculos.

## Archivos a Modificar
1. `/Users/magv/Documents/Control-Velso-V1/src/components/steps/ClienteStep.tsx`
2. `/Users/magv/Documents/Control-Velso-V1/src/components/steps/PiezasStep.tsx`
3. `/Users/magv/Documents/Control-Velso-V1/src/App.tsx` (o donde esté el manejo de pestañas)
4. `/Users/magv/Documents/Control-Velso-V1/src/hooks/useCotizacionStore.ts` (verificar guardado automático)

## Estrategia de Deploy
1. Hacer commit de los cambios
2. Push a GitHub
3. Vercel hará deploy automático
4. Verificar en app.velso.mx
