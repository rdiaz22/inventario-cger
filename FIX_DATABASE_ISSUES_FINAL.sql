-- =====================================================
-- SOLUCIÓN DE PROBLEMAS DE BASE DE DATOS (VERSIÓN FINAL)
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Crear tabla system_logs si no existe
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla epi_assets si no existe (versión simplificada)
CREATE TABLE IF NOT EXISTS epi_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    codigo VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    assigned_to VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Disponible',
    last_maintenance_date DATE,
    maintenance_frequency INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agregar columnas faltantes a epi_assets si no existen
DO $$ 
BEGIN
    -- Agregar columna category si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'category') THEN
        ALTER TABLE epi_assets ADD COLUMN category VARCHAR(100);
    END IF;
    
    -- Agregar columna codigo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'codigo') THEN
        ALTER TABLE epi_assets ADD COLUMN codigo VARCHAR(100);
    END IF;
    
    -- Agregar columna brand si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'brand') THEN
        ALTER TABLE epi_assets ADD COLUMN brand VARCHAR(100);
    END IF;
    
    -- Agregar columna model si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'model') THEN
        ALTER TABLE epi_assets ADD COLUMN model VARCHAR(100);
    END IF;
    
    -- Agregar columna serial_number si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'serial_number') THEN
        ALTER TABLE epi_assets ADD COLUMN serial_number VARCHAR(100);
    END IF;
    
    -- Agregar columna assigned_to si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'assigned_to') THEN
        ALTER TABLE epi_assets ADD COLUMN assigned_to VARCHAR(255);
    END IF;
    
    -- Agregar columna status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'status') THEN
        ALTER TABLE epi_assets ADD COLUMN status VARCHAR(50) DEFAULT 'Disponible';
    END IF;
    
    -- Agregar columna last_maintenance_date si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'last_maintenance_date') THEN
        ALTER TABLE epi_assets ADD COLUMN last_maintenance_date DATE;
    END IF;
    
    -- Agregar columna maintenance_frequency si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'maintenance_frequency') THEN
        ALTER TABLE epi_assets ADD COLUMN maintenance_frequency INTEGER DEFAULT 90;
    END IF;
    
    -- Agregar columna updated_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'updated_at') THEN
        ALTER TABLE epi_assets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Crear tabla epi_sizes si no existe
CREATE TABLE IF NOT EXISTS epi_sizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla audits si no existe
CREATE TABLE IF NOT EXISTS audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Progreso', 'Completada', 'Cancelada')),
    auditor_id UUID REFERENCES auth.users(id),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Habilitar RLS en todas las tablas
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- 7. Eliminar políticas existentes si existen (para evitar conflictos)
DROP POLICY IF EXISTS "system_logs_select_policy" ON system_logs;
DROP POLICY IF EXISTS "system_logs_insert_policy" ON system_logs;
DROP POLICY IF EXISTS "company_config_select_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_modify_policy" ON company_config;
DROP POLICY IF EXISTS "epi_assets_select_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_modify_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_sizes_select_policy" ON epi_sizes;
DROP POLICY IF EXISTS "epi_sizes_modify_policy" ON epi_sizes;
DROP POLICY IF EXISTS "audits_select_policy" ON audits;
DROP POLICY IF EXISTS "audits_modify_policy" ON audits;

-- 8. Crear políticas RLS básicas para system_logs
CREATE POLICY "system_logs_select_policy" ON system_logs
    FOR SELECT USING (true);

CREATE POLICY "system_logs_insert_policy" ON system_logs
    FOR INSERT WITH CHECK (true);

-- 9. Crear políticas RLS básicas para company_config
CREATE POLICY "company_config_select_policy" ON company_config
    FOR SELECT USING (true);

CREATE POLICY "company_config_modify_policy" ON company_config
    FOR ALL USING (true);

-- 10. Crear políticas RLS básicas para epi_assets
CREATE POLICY "epi_assets_select_policy" ON epi_assets
    FOR SELECT USING (true);

CREATE POLICY "epi_assets_modify_policy" ON epi_assets
    FOR ALL USING (true);

-- 11. Crear políticas RLS básicas para epi_sizes
CREATE POLICY "epi_sizes_select_policy" ON epi_sizes
    FOR SELECT USING (true);

CREATE POLICY "epi_sizes_modify_policy" ON epi_sizes
    FOR ALL USING (true);

-- 12. Crear políticas RLS básicas para audits
CREATE POLICY "audits_select_policy" ON audits
    FOR SELECT USING (true);

CREATE POLICY "audits_modify_policy" ON audits
    FOR ALL USING (true);

-- 13. Insertar datos de ejemplo para company_config (usando los nombres correctos de columnas)
INSERT INTO company_config (company_name, company_address, company_phone, company_email) 
SELECT 'Mi Empresa', 'Dirección de la empresa', '123-456-7890', 'contacto@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM company_config LIMIT 1);

-- 14. Insertar datos de ejemplo para epi_sizes
INSERT INTO epi_sizes (name, description) VALUES
('Cascos', 'Equipos de protección para la cabeza'),
('Guantes', 'Protección para las manos'),
('Calzado', 'Calzado de seguridad'),
('Ropa', 'Ropa de protección')
ON CONFLICT DO NOTHING;

-- 15. Insertar algunos EPIs de ejemplo
INSERT INTO epi_assets (name, category, codigo, brand, model, status) VALUES
('Casco de Seguridad', 'Cascos', 'CAS-001', '3M', 'H-700', 'Disponible'),
('Guantes de Nitrilo', 'Guantes', 'GUA-001', 'Ansell', 'Microflex', 'Disponible'),
('Botas de Seguridad', 'Calzado', 'BOT-001', 'Timberland', 'Pro', 'Disponible')
ON CONFLICT DO NOTHING;

-- 16. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 17. Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_company_config_updated_at ON company_config;
DROP TRIGGER IF EXISTS update_epi_assets_updated_at ON epi_assets;
DROP TRIGGER IF EXISTS update_audits_updated_at ON audits;

-- 18. Crear triggers para updated_at
CREATE TRIGGER update_company_config_updated_at 
    BEFORE UPDATE ON company_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_epi_assets_updated_at 
    BEFORE UPDATE ON epi_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audits_updated_at 
    BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. Crear índices para mejorar el rendimiento (si no existen)
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_epi_assets_category ON epi_assets(category);
CREATE INDEX IF NOT EXISTS idx_epi_assets_status ON epi_assets(status);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

-- 20. Verificar que las tablas existen y tienen datos
SELECT '🔍 Verificación de tablas creadas:' as status;
SELECT 
    schemaname, 
    tablename, 
    n_tup_ins as registros_insertados
FROM pg_stat_user_tables 
WHERE tablename IN ('system_logs', 'company_config', 'epi_assets', 'epi_sizes', 'audits')
ORDER BY tablename;

-- 21. Verificar políticas RLS
SELECT '🔐 Verificación de políticas RLS:' as status;
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive
FROM pg_policies 
WHERE tablename IN ('system_logs', 'company_config', 'epi_assets', 'epi_sizes', 'audits')
ORDER BY tablename, policyname;

-- 22. Verificar que RLS está habilitado
SELECT '🔒 Verificación de RLS habilitado:' as status;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('system_logs', 'company_config', 'epi_assets', 'epi_sizes', 'audits')
ORDER BY tablename;

-- 23. Verificar datos insertados
SELECT '📊 Verificación de datos insertados:' as status;
SELECT 'company_config' as tabla, COUNT(*) as registros FROM company_config
UNION ALL
SELECT 'epi_sizes' as tabla, COUNT(*) as registros FROM epi_sizes
UNION ALL
SELECT 'epi_assets' as tabla, COUNT(*) as registros FROM epi_assets
UNION ALL
SELECT 'audits' as tabla, COUNT(*) as registros FROM audits
UNION ALL
SELECT 'system_logs' as tabla, COUNT(*) as registros FROM system_logs;

-- 24. Verificar estructura de company_config
SELECT '🏗️ Estructura de company_config:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_config'
ORDER BY ordinal_position;
