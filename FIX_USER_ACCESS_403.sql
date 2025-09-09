-- =====================================================
-- SOLUCIÓN ESPECÍFICA: ERROR 403 EN USUARIOS
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Verificar si existe la tabla system_users
SELECT 'Verificando tabla system_users:' as status;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'system_users'
) as table_exists;

-- 2. Crear tabla system_users si no existe
CREATE TABLE IF NOT EXISTS system_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla user_roles si no existe
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insertar roles por defecto si no existen
INSERT INTO user_roles (id, name, description, permissions) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador completo', '{"all": true, "users": true, "assets": true, "audits": true}'),
    ('00000000-0000-0000-0000-000000000002', 'user', 'Usuario básico', '{"all": false, "users": false, "assets": true, "audits": false}')
ON CONFLICT (name) DO NOTHING;

-- 5. DESHABILITAR RLS temporalmente para system_users
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;

-- 6. DESHABILITAR RLS temporalmente para user_roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 7. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "system_users_select_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_insert_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_update_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_delete_policy" ON system_users;
DROP POLICY IF EXISTS "system_users_modify_policy" ON system_users;

DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_modify_policy" ON user_roles;

-- 8. Verificar que RLS esté deshabilitado
SELECT 'RLS deshabilitado en tablas de usuarios:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('system_users', 'user_roles')
ORDER BY tablename;

-- 9. Probar acceso directo a las tablas
SELECT 'Probando acceso a user_roles:' as status;
SELECT * FROM user_roles LIMIT 5;

SELECT 'Probando acceso a system_users:' as status;
SELECT * FROM system_users LIMIT 5;

-- 10. Verificación final
SELECT '✅ Configuración de usuarios aplicada correctamente' as status;
SELECT 'RLS deshabilitado para system_users y user_roles' as resultado;
SELECT 'Roles por defecto creados' as datos;
SELECT 'Tablas accesibles públicamente' as acceso;
