-- =====================================================
-- SOLUCIÓN SIMPLE: SOLO CREAR TABLAS FALTANTES
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

-- 2. Crear tabla audits si no existe
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

-- 3. Habilitar RLS en las tablas
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "system_logs_select_policy" ON system_logs;
DROP POLICY IF EXISTS "system_logs_insert_policy" ON system_logs;
DROP POLICY IF EXISTS "company_config_select_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_modify_policy" ON company_config;
DROP POLICY IF EXISTS "audits_select_policy" ON audits;
DROP POLICY IF EXISTS "audits_modify_policy" ON audits;

-- 5. Crear políticas RLS básicas
CREATE POLICY "system_logs_select_policy" ON system_logs
    FOR SELECT USING (true);

CREATE POLICY "system_logs_insert_policy" ON system_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "company_config_select_policy" ON company_config
    FOR SELECT USING (true);

CREATE POLICY "company_config_modify_policy" ON company_config
    FOR ALL USING (true);

CREATE POLICY "audits_select_policy" ON audits
    FOR SELECT USING (true);

CREATE POLICY "audits_modify_policy" ON audits
    FOR ALL USING (true);

-- 6. Insertar datos de ejemplo para company_config (usando los nombres correctos)
INSERT INTO company_config (company_name, company_address, company_phone, company_email) 
SELECT 'Mi Empresa', 'Dirección de la empresa', '123-456-7890', 'contacto@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM company_config LIMIT 1);

-- 7. Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

-- 8. Verificar que las tablas existen
SELECT '🔍 Verificación de tablas creadas:' as status;
SELECT 
    schemaname, 
    tablename, 
    n_tup_ins as registros_insertados
FROM pg_stat_user_tables 
WHERE tablename IN ('system_logs', 'company_config', 'audits')
ORDER BY tablename;

-- 9. Verificar políticas RLS
SELECT '🔐 Verificación de políticas RLS:' as status;
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive
FROM pg_policies 
WHERE tablename IN ('system_logs', 'company_config', 'audits')
ORDER BY tablename, policyname;

-- 10. Verificar que RLS está habilitado
SELECT '🔒 Verificación de RLS habilitado:' as status;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('system_logs', 'company_config', 'audits')
ORDER BY tablename;

-- 11. Verificar datos insertados
SELECT '📊 Verificación de datos insertados:' as status;
SELECT 'company_config' as tabla, COUNT(*) as registros FROM company_config
UNION ALL
SELECT 'audits' as tabla, COUNT(*) as registros FROM audits
UNION ALL
SELECT 'system_logs' as tabla, COUNT(*) as registros FROM system_logs;
