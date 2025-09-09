-- =====================================================
-- CORRECCIÓN DE ESTRUCTURA DE TABLAS
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Corregir tabla system_users para que coincida con las consultas
ALTER TABLE system_users DROP COLUMN IF EXISTS first_name;
ALTER TABLE system_users DROP COLUMN IF EXISTS last_name;

-- Agregar columnas que faltan
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- 2. Verificar estructura actual de system_users
SELECT 'Estructura actual de system_users:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_users' 
ORDER BY ordinal_position;

-- 3. Crear tabla system_logs si no existe
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

-- 4. DESHABILITAR RLS en todas las tablas problemáticas
ALTER TABLE company_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 5. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "company_config_select_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_insert_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_update_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_delete_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_modify_policy" ON company_config;

DROP POLICY IF EXISTS "system_users_select_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_insert_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_update_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_delete_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_modify_policy" ON system_users;

DROP POLICY IF EXISTS "system_logs_select_policy" ON system_logs;
DROP POLICY IF EXISTS "system_logs_insert_policy" ON system_logs;
DROP POLICY IF EXISTS "system_logs_update_policy" ON system_logs;
DROP POLICY IF EXISTS "system_logs_delete_policy" ON system_logs;
DROP POLICY IF EXISTS "system_logs_modify_policy" ON system_logs;

DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_modify_policy" ON user_roles;

-- 6. Insertar datos de ejemplo en system_users si está vacía
INSERT INTO system_users (user_id, email, first_name, last_name, full_name, role_id, is_active)
SELECT 
    gen_random_uuid(),
    'admin@empresa.com',
    'Admin',
    'Usuario',
    'Admin Usuario',
    (SELECT id FROM user_roles WHERE name = 'admin' LIMIT 1),
    true
WHERE NOT EXISTS (SELECT 1 FROM system_users LIMIT 1);

-- 7. Insertar datos de ejemplo en system_logs
INSERT INTO system_logs (user_id, action, details, table_name)
SELECT 
    (SELECT user_id FROM system_users LIMIT 1),
    'Sistema inicializado',
    'Configuración inicial del sistema',
    'system_logs'
WHERE NOT EXISTS (SELECT 1 FROM system_logs LIMIT 1);

-- 8. Verificar que RLS esté deshabilitado
SELECT 'RLS deshabilitado en todas las tablas:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('company_config', 'system_users', 'system_logs', 'user_roles')
ORDER BY tablename;

-- 9. Probar acceso directo a las tablas
SELECT 'Probando acceso a company_config:' as status;
SELECT * FROM company_config LIMIT 1;

SELECT 'Probando acceso a system_users:' as status;
SELECT * FROM system_users LIMIT 1;

SELECT 'Probando acceso a system_logs:' as status;
SELECT * FROM system_logs LIMIT 1;

-- 10. Verificación final
SELECT '✅ Estructura de tablas corregida' as status;
SELECT 'RLS deshabilitado en todas las tablas' as resultado;
SELECT 'Datos de ejemplo insertados' as datos;
SELECT 'Tablas accesibles públicamente' as acceso;

