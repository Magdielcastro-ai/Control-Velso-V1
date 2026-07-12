# Plan de Desarrollo - Control Velso V1
## Sistema Integral de Control para Taller CNC

---

## Visión General del Proceso de Negocio

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. COTIZAR  │───▶│ 2. VENDER   │───▶│ 3. COMPRAR  │───▶│ 4. PRODUCIR │
│  (Vendedor) │    │  (Vendedor) │    │  (Compras)  │    │ (Producción)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 8. HISTORIA │◀───│ 7. CERRAR   │◀───│ 6. COMPARAR │◀───│ 5. FACTURAR │
│  (Solo lectura)  │  (Admin)    │    │  (Admin)    │    │  (Admin)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Fases de Desarrollo

### ✅ FASE 1: Cotización Funcional (COMPLETADA - Verificar)
**Responsable:** Vendedor / Admin
**Estado:** Parcialmente completa, necesita verificación

**Funcionalidades existentes:**
- [x] Crear cotización con datos de taller, cliente, proyecto
- [x] Agregar piezas con materiales y procesos
- [x] Calcular costos con margen de utilidad del 30%
- [x] Generar PDF de cotización
- [x] Guardar cotización en Supabase

**Pendientes de verificación:**
- [ ] Verificar cálculo correcto del 30% de utilidad (antes de IVA)
- [ ] Verificar que el material se coloca por total y se desglosa por pieza
- [ ] Verificar que tiempos se colocan por pieza y se calcula total
- [ ] Verificar unidades mm/pulgadas en dimensiones
- [ ] Verificar que procesos externos se desglosan por pieza
- [ ] Verificar que al cambiar número de piezas se actualizan todos los datos

**Dependencias:** Ninguna (es el inicio)

---

### ✅ FASE 2: Transformar Cotización a Venta (COMPLETADA - Verificar)
**Responsable:** Vendedor / Admin
**Estado:** Existe funcionalidad, necesita verificación

**Funcionalidades existentes:**
- [x] Botón "Convertir a Venta" en cotizaciones
- [x] Crear proyecto de venta con orden de compra
- [x] Cambiar estado a "EN FABRICACIÓN"

**Pendientes de verificación:**
- [ ] Verificar que los datos de la cotización se transfieren correctamente
- [ ] Verificar que se crea el proyecto con todos los datos necesarios
- [ ] Verificar que Producción puede ver el proyecto nuevo

**Dependencias:** Fase 1

---

### 🔄 FASE 3: Módulo de Compras con Órdenes de Compra (PENDIENTE)
**Responsable:** Compras / Admin
**Estado:** No existe, necesita desarrollo completo
**Prioridad:** ALTA (bloquea Fase 4)

**Funcionalidades requeridas:**
- [ ] Crear órdenes de compra relacionadas a un proyecto
- [ ] Seleccionar proveedor
- [ ] Listar materiales a comprar (heredados de la cotización)
- [ ] Agregar materiales adicionales si es necesario
- [ ] Calcular totales de orden de compra
- [ ] Guardar orden de compra con relación al proyecto
- [ ] Estado de orden: Pendiente, Enviada, Recibida, Cancelada
- [ ] Historial de órdenes por proyecto

**Nuevos tipos de datos:**
```typescript
interface OrdenCompra {
  id: string;
  proyectoId: string;
  numeroOrden: string;
  proveedor: string;
  fecha: Date;
  materiales: MaterialCompra[];
  total: number;
  estado: 'pendiente' | 'enviada' | 'recibida' | 'cancelada';
  fechaRecepcion?: Date;
  notas: string;
}

interface MaterialCompra {
  materialId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  total: number;
}
```

**Nuevas tablas Supabase:**
- `ordenes_compra`
- `materiales_orden`

**Dependencias:** Fase 2

---

### 🔄 FASE 4: Producción - Registro de Tiempos Reales (PARCIAL)
**Responsable:** Producción
**Estado:** Esqueleto creado, necesita funcionalidad completa
**Prioridad:** ALTA

**Funcionalidades requeridas:**
- [x] Ver lista de proyectos en fabricación
- [ ] Ver detalle de proyecto con piezas y procesos
- [ ] Iniciar/finalizar proceso de fabricación por pieza
- [ ] Registrar tiempo real de cada proceso (torno, CNC, etc.)
- [ ] Registrar tiempos de setup
- [ ] Comparar tiempo real vs tiempo cotizado
- [ ] Registrar materiales reales utilizados
- [ ] Registrar desperdicios o ajustes

**Nuevos tipos de datos:**
```typescript
interface RegistroProceso {
  id: string;
  proyectoId: string;
  piezaId: string;
  procesoId: string;
  nombreProceso: string;
  tiempoCotizado: number;
  tiempoReal: number;
  fechaInicio: Date;
  fechaFin: Date;
  operador: string;
  notas: string;
}

interface RegistroMaterial {
  id: string;
  proyectoId: string;
  piezaId: string;
  materialId: string;
  cantidadCotizada: number;
  cantidadReal: number;
  costoCotizado: number;
  costoReal: number;
}
```

**Nuevas tablas Supabase:**
- `registros_procesos`
- `registros_materiales`

**Dependencias:** Fase 2, Fase 3 (para materiales comprados)

---

### 🔄 FASE 5: Facturación y Seguimiento de Pagos (PARCIAL)
**Responsable:** Administración
**Estado:** Existe funcionalidad básica, necesita mejoras
**Prioridad:** MEDIA

**Funcionalidades existentes:**
- [x] Marcar proyecto como facturado
- [x] Asignar número de factura

**Funcionalidades requeridas:**
- [ ] Ver lista de proyectos facturados vs pendientes
- [ ] Registrar pagos parciales
- [ ] Calcular saldo pendiente
- [ ] Alertas de pagos vencidos
- [ ] Historial de pagos por proyecto
- [ ] Reporte de cuentas por cobrar

**Nuevos tipos de datos:**
```typescript
interface Pago {
  id: string;
  proyectoId: string;
  monto: number;
  fecha: Date;
  metodoPago: string;
  referencia: string;
  notas: string;
}
```

**Nuevas tablas Supabase:**
- `pagos`

**Dependencias:** Fase 2

---

### 🔄 FASE 6: Dashboard de Comparativa Cotizado vs Real (PENDIENTE)
**Responsable:** Administración
**Estado:** No existe, necesita desarrollo completo
**Prioridad:** MEDIA (depende de Fase 4 y 5)

**Funcionalidades requeridas:**
- [ ] Ver proyecto con datos cotizados vs reales
- [ ] Comparar materiales: costo cotizado vs costo real de compra
- [ ] Comparar procesos: tiempo cotizado vs tiempo real
- [ ] Calcular utilidad en tiempo real
- [ ] Alertas cuando costos reales superan cotizados
- [ ] Gráficos de desviación
- [ ] Exportar reporte de comparativa

**Dashboards requeridos:**
- Comparativa por proyecto
- Comparativa por pieza
- Comparativa por proceso
- Tendencias de desviación

**Dependencias:** Fase 4, Fase 5

---

### 🔄 FASE 7: Cierre de Proyecto y Trazabilidad Histórica (PENDIENTE)
**Responsable:** Administración
**Estado:** No existe, necesita desarrollo completo
**Prioridad:** BAJA (es el final del flujo)

**Funcionalidades requeridas:**
- [ ] Cerrar proyecto (estado final)
- [ ] Congelar todos los datos (solo lectura)
- [ ] Generar reporte final de proyecto
- [ ] Acceso a historial de proyectos cerrados
- [ ] Búsqueda en historial
- [ ] Reutilizar datos de proyecto para nueva cotización
- [ ] Reportes: semanal, mensual, trimestral, semestral, anual

**Reportes requeridos:**
- Utilidad por proyecto
- Utilidad por período
- Tiempos promedio por proceso
- Comparación de cotizaciones vs reales
- Métricas de producción

**Dependencias:** Fase 5, Fase 6

---

## Cronograma Propuesto

| Fase | Descripción | Duración Estimada | Prioridad | Dependencias |
|------|-------------|-------------------|-----------|--------------|
| 1 | Verificar cotización funcional | 1-2 sesiones | URGENTE | Ninguna |
| 2 | Verificar transformación a venta | 1 sesión | URGENTE | Fase 1 |
| 3 | Módulo de Compras | 2-3 sesiones | ALTA | Fase 2 |
| 4 | Producción - Tiempos reales | 2-3 sesiones | ALTA | Fase 2, 3 |
| 5 | Facturación y pagos | 1-2 sesiones | MEDIA | Fase 2 |
| 6 | Dashboard comparativa | 2 sesiones | MEDIA | Fase 4, 5 |
| 7 | Cierre y trazabilidad | 2 sesiones | BAJA | Fase 6 |

**Total estimado:** 11-15 sesiones de desarrollo

---

## Reglas de Desarrollo para No Romper lo Existente

### 1. Principio de No Tocar lo que Funciona
- Antes de modificar cualquier archivo, verificar qué dependencias tiene
- Crear copias de seguridad o usar git branches si es necesario
- Probar localmente antes de hacer push

### 2. Orden de Desarrollo
1. **Tipos/Interfaces** primero (src/types/)
2. **Hooks/Stores** segundo (src/hooks/)
3. **Componentes** tercero (src/components/)
4. **Integración** cuarto (src/App.tsx)
5. **Supabase** quinto (tablas y políticas)

### 3. Verificación Obligatoria
- [ ] Build local pasa sin errores
- [ ] No hay errores TypeScript
- [ ] La app carga correctamente
- [ ] Las funcionalidades anteriores siguen funcionando
- [ ] Push a GitHub exitoso
- [ ] Deploy en Vercel exitoso

### 4. Convenciones de Nombres
- Tipos: `PascalCase` (ej: `OrdenCompra`)
- Hooks: `use` + `camelCase` (ej: `useComprasStore`)
- Componentes: `PascalCase` (ej: `ComprasView`)
- Tablas Supabase: `snake_case` (ej: `ordenes_compra`)

---

## Próximo Paso Inmediato

**FASE 1: Verificar Cotización Funcional**

Necesitamos revisar punto por punto:
1. Crear una cotización de prueba
2. Verificar cálculo del 30% de utilidad
3. Verificar desglose de materiales por pieza
4. Verificar unidades mm/pulgadas
5. Verificar actualización al cambiar número de piezas

¿Quieres que comencemos con la verificación de la Fase 1?
