-- ============================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - CONTROL VELSO V1
-- Taller CNC - Sistema Integral de Cotización, Ventas y Producción
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- 1. TABLAS DE AUTENTICACIÓN Y USUARIOS
-- ============================================================

-- Tabla de perfiles de usuario (extiende auth.users de Supabase)
-- Se crea automáticamente con el trigger handle_new_user
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  rol TEXT NOT NULL CHECK (rol IN ('superadmin', 'admin', 'vendedor', 'produccion')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Políticas RLS para perfiles
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles visibles para usuarios autenticados"
  ON perfiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admins pueden modificar perfiles"
  ON perfiles FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')
  ));

-- ============================================================
-- 2. TABLAS DE CATÁLOGOS
-- ============================================================

-- Catálogo de materiales
CREATE TABLE IF NOT EXISTS catalogo_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  forma TEXT DEFAULT 'redondo',
  unidad_medida TEXT DEFAULT 'mm',
  -- Dimensiones según forma
  diametro NUMERIC,
  lado NUMERIC,
  largo NUMERIC,
  longitud NUMERIC,
  ancho NUMERIC,
  espesor NUMERIC,
  diametro_exterior NUMERIC,
  diametro_interior NUMERIC,
  lado_a NUMERIC,
  lado_b NUMERIC,
  descripcion TEXT,
  dimensiones_libre TEXT,
  -- Costos
  costo_unitario NUMERIC DEFAULT 0,
  unidad_costo TEXT DEFAULT 'kg',
  margen_porcentaje NUMERIC DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Catálogo de procesos (configuración del taller)
-- Nota: Los procesos están hardcodeados en CATALOGO_PROCESOS_VELSO
-- pero podrían guardarse aquí para configuración dinámica
CREATE TABLE IF NOT EXISTS catalogo_procesos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  costo_por_hora NUMERIC NOT NULL,
  requiere_mano_obra TEXT DEFAULT 'ninguna',
  descripcion TEXT,
  categoria TEXT DEFAULT 'maquina',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Catálogo de piezas (piezas recurrentes)
CREATE TABLE IF NOT EXISTS catalogo_piezas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  cantidad INTEGER DEFAULT 1,
  material JSONB,
  procesos JSONB DEFAULT '[]',
  costos_adicionales JSONB DEFAULT '{}',
  subtotal_pieza NUMERIC DEFAULT 0,
  utilidad_pieza NUMERIC DEFAULT 0,
  iva_pieza NUMERIC DEFAULT 0,
  total_pieza NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. TABLAS DE CLIENTES
-- ============================================================

-- Tabla de clientes (empresas)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  nombre_empresa TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  rfc TEXT,
  terminos_pago TEXT DEFAULT '50% anticipo, 50% contra entrega',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contactos por cliente
CREATE TABLE IF NOT EXISTS contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  departamento TEXT,
  email TEXT,
  telefono TEXT,
  celular TEXT,
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. TABLAS DE COTIZACIONES
-- ============================================================

-- Cotizaciones principales
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  tipo TEXT DEFAULT 'proyecto',
  usuario_id UUID REFERENCES auth.users(id),
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre TEXT,
  proyecto_nombre TEXT,
  -- Datos JSONB
  proyecto JSONB DEFAULT '{}',
  datos_taller JSONB DEFAULT '{}',
  datos_cliente JSONB DEFAULT '{}',
  piezas JSONB DEFAULT '[]',
  materiales JSONB DEFAULT '[]',  -- Legacy
  procesos JSONB DEFAULT '[]',    -- Legacy
  costos_adicionales JSONB DEFAULT '{}',
  condiciones JSONB DEFAULT '{}',
  -- Totales
  margen_utilidad NUMERIC DEFAULT 30,
  iva_porcentaje NUMERIC DEFAULT 16,
  subtotal NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  -- Estado
  estado TEXT DEFAULT 'borrador',
  moneda TEXT DEFAULT 'MXN',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para cotizaciones
CREATE INDEX IF NOT EXISTS idx_cotizaciones_usuario ON cotizaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created ON cotizaciones(created_at DESC);

-- ============================================================
-- 5. TABLAS DE PROYECTOS / VENTAS
-- ============================================================

-- Proyectos (convertidos desde cotizaciones)
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  cotizacion_id UUID REFERENCES cotizaciones(id),
  numero_cotizacion TEXT,
  orden_compra TEXT,
  numero_factura TEXT,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre TEXT,
  proyecto_nombre TEXT,
  -- Totales
  total_cotizado NUMERIC DEFAULT 0,
  total_facturado NUMERIC,
  margen_utilidad NUMERIC DEFAULT 30,
  iva_porcentaje NUMERIC DEFAULT 16,
  -- Datos
  materiales JSONB DEFAULT '[]',
  procesos JSONB DEFAULT '[]',
  costos_adicionales JSONB DEFAULT '{}',
  materiales_reales JSONB,
  procesos_reales JSONB,
  costo_total_real NUMERIC,
  utilidad_real NUMERIC,
  porcentaje_utilidad_real NUMERIC,
  -- Estado y fechas
  estado TEXT DEFAULT 'en_fabricacion' CHECK (estado IN ('en_fabricacion', 'fabricado', 'entregado', 'facturado')),
  fecha_venta TIMESTAMPTZ DEFAULT now(),
  fecha_fabricado DATE,
  fecha_entregado DATE,
  fecha_facturado DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para proyectos
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_fecha ON proyectos(fecha_venta DESC);
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON proyectos(cliente_id);

-- ============================================================
-- 6. TABLAS DE PRODUCCIÓN
-- ============================================================

-- Registros de producción (tiempos reales por proceso)
CREATE TABLE IF NOT EXISTS registros_produccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  pieza_id TEXT NOT NULL,
  pieza_nombre TEXT,
  proceso_tipo TEXT NOT NULL,
  proceso_nombre TEXT,
  operador_id UUID REFERENCES perfiles(id),
  operador_nombre TEXT,
  -- Tiempos
  tiempo_estimado_minutos NUMERIC DEFAULT 0,
  tiempo_real_minutos NUMERIC DEFAULT 0,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  -- Costos
  costo_estimado NUMERIC DEFAULT 0,
  costo_real NUMERIC DEFAULT 0,
  -- Estado
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'pausado', 'completado', 'retrasado', 'rechazado')),
  notas TEXT,
  incidencias JSONB DEFAULT '[]',
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para producción
CREATE INDEX IF NOT EXISTS idx_registros_proyecto ON registros_produccion(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros_produccion(estado);
CREATE INDEX IF NOT EXISTS idx_registros_operador ON registros_produccion(operador_id);

-- ============================================================
-- 7. TABLAS DE TALLERES
-- ============================================================

-- Datos de talleres (para encabezado de cotizaciones)
CREATE TABLE IF NOT EXISTS talleres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  rfc TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. TABLAS DE PENDIENTES / COBRANZA
-- ============================================================

-- Pendientes de cobro
CREATE TABLE IF NOT EXISTS pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  cliente_nombre TEXT,
  proyecto_nombre TEXT,
  monto NUMERIC DEFAULT 0,
  fecha_vencimiento DATE,
  estado TEXT DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. FUNCIONES Y TRIGGERS
-- ============================================================

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'vendedor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que lo necesiten
DO $$
BEGIN
  -- cotizaciones
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cotizaciones_updated_at') THEN
    CREATE TRIGGER update_cotizaciones_updated_at
      BEFORE UPDATE ON cotizaciones
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- catalogo_piezas
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_catalogo_piezas_updated_at') THEN
    CREATE TRIGGER update_catalogo_piezas_updated_at
      BEFORE UPDATE ON catalogo_piezas
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- registros_produccion
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_registros_produccion_updated_at') THEN
    CREATE TRIGGER update_registros_produccion_updated_at
      BEFORE UPDATE ON registros_produccion
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- 10. POLÍTICAS RLS ADICIONALES
-- ============================================================

-- Cotizaciones: usuarios ven las suyas, admins ven todas
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cotizaciones acceso por usuario"
  ON cotizaciones FOR ALL
  TO authenticated
  USING (
    usuario_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin'))
  );

-- Proyectos: mismas reglas
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proyectos acceso por usuario"
  ON proyectos FOR ALL
  TO authenticated
  USING (
    usuario_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin'))
  );

-- Clientes: visibles para todos los autenticados
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes visibles para autenticados"
  ON clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clientes modificables por admins y vendedores"
  ON clientes FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin', 'vendedor'))
  );

-- Contactos: visibles para autenticados
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contactos visibles para autenticados"
  ON contactos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contactos modificables por admins y vendedores"
  ON contactos FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin', 'vendedor'))
  );

-- Catálogo de materiales: visible para todos, editable por admins
ALTER TABLE catalogo_materiales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materiales visibles para autenticados"
  ON catalogo_materiales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Materiales modificables por admins"
  ON catalogo_materiales FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin'))
  );

-- Catálogo de piezas
ALTER TABLE catalogo_piezas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Piezas visibles para autenticados"
  ON catalogo_piezas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Piezas modificables por admins"
  ON catalogo_piezas FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin'))
  );

-- Registros de producción
ALTER TABLE registros_produccion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producción visible para autenticados"
  ON registros_produccion FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Producción modificable por producción y admins"
  ON registros_produccion FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin', 'produccion'))
  );

-- Talleres
ALTER TABLE talleres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talleres visibles para autenticados"
  ON talleres FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Talleres modificables por admins"
  ON talleres FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin'))
  );

-- Pendientes
ALTER TABLE pendientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pendientes acceso por usuario"
  ON pendientes FOR ALL
  TO authenticated
  USING (
    usuario_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin'))
  );

-- ============================================================
-- 11. DATOS INICIALES (Opcional)
-- ============================================================

-- Insertar procesos del catálogo Velso si la tabla está vacía
INSERT INTO catalogo_procesos (id, nombre, costo_por_hora, requiere_mano_obra, descripcion, categoria)
SELECT * FROM (VALUES
  ('codigo_07', 'Código 07', 707.96, 'ninguna', 'Costo indirecto. Se asigna proporcionalmente a cada proyecto.', 'indirecto'),
  ('mo_s', 'MO-S (Operador Sencillo)', 191.19, 'ninguna', 'Tareas básicas, limpieza, apoyo, procesos simples.', 'mano_obra'),
  ('mo_e', 'MO-E (Operador Especializado)', 286.78, 'ninguna', 'Operación especializada, CNC, procesos críticos.', 'mano_obra'),
  ('hora_diseno', 'Hora Diseño', 360.97, 'ninguna', 'Ingeniería, modelado, planos, ajustes técnicos.', 'servicio'),
  ('hora_ensamble', 'Hora Ensamble', 347.56, 'ninguna', 'Ensamble mecánico, ajustes finales, armado.', 'servicio'),
  ('torno_convencional', 'Torno Convencional', 63.24, 'mo_s', 'Máquina + operador.', 'maquina'),
  ('perfiladora', 'Perfiladora', 36.68, 'mo_s', 'Máquina + operador.', 'maquina'),
  ('torno_cnc', 'Torno CNC', 206.06, 'mo_e', 'Máquina + operador especializado.', 'maquina'),
  ('cnc_vertical', 'CNC Vertical (Pool 4)', 338.47, 'mo_e', 'Incluye máquina parada. Requiere operador especializado.', 'maquina'),
  ('otro', 'Otro Proceso', 0, 'ninguna', 'Proceso personalizado con costo manual.', 'servicio')
) AS v(id, nombre, costo_por_hora, requiere_mano_obra, descripcion, categoria)
WHERE NOT EXISTS (SELECT 1 FROM catalogo_procesos);

-- ============================================================
-- 12. VISTAS ÚTILES
-- ============================================================

-- Vista de proyectos con resumen
CREATE OR REPLACE VIEW vista_proyectos_resumen AS
SELECT
  p.id,
  p.numero_cotizacion,
  p.cliente_nombre,
  p.proyecto_nombre,
  p.total_cotizado,
  p.estado,
  p.fecha_venta,
  p.fecha_fabricado,
  p.fecha_entregado,
  p.fecha_facturado,
  p.numero_factura,
  COUNT(rp.id) FILTER (WHERE rp.estado = 'completado') as procesos_completados,
  COUNT(rp.id) as total_procesos,
  CASE 
    WHEN COUNT(rp.id) > 0 THEN 
      ROUND((COUNT(rp.id) FILTER (WHERE rp.estado = 'completado')::NUMERIC / COUNT(rp.id)) * 100, 1)
    ELSE 0 
  END as porcentaje_avance
FROM proyectos p
LEFT JOIN registros_produccion rp ON rp.proyecto_id = p.id
GROUP BY p.id;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
