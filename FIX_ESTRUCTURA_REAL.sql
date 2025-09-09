-- =====================================================
-- SOLUCIÓN ADAPTADA A LA ESTRUCTURA REAL
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Verificar estructura actual de system_users
SELECT 'Estructura actual de system_users:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_users' 
ORDER BY ordinal_position;

-- 2. Agregar columnas faltantes a system_users (sin user_id)
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Crear tabla company_config si no existe
CREATE TABLE IF NOT EXISTS company_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) DEFAULT 'Mi Empresa',
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    company_logo_url TEXT,
    tax_id VARCHAR(100),
    industry VARCHAR(100),
    company_cif VARCHAR(50),
    company_sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla user_roles si no existe
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla system_logs si no existe
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

-- 6. DESHABILITAR RLS en todas las tablas
ALTER TABLE company_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 7. Insertar datos por defecto
INSERT INTO company_config (company_name, company_address, company_phone, company_email) 
SELECT 'Mi Empresa', 'Dirección de la empresa', '123-456-7890', 'contacto@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM company_config LIMIT 1);

INSERT INTO user_roles (id, name, description, permissions) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador completo', '{"all": true, "users": true, "assets": true, "audits": true}'),
    ('00000000-0000-0000-0000-000000000002', 'user', 'Usuario básico', '{"all": false, "users": false, "assets": true, "audits": false}')
ON CONFLICT (name) DO NOTHING;

-- 8. Insertar usuario por defecto (SIN user_id)
INSERT INTO system_users (id, email, first_name, last_name, full_name, role_id, is_active)
SELECT 
    gen_random_uuid(),
    'admin@empresa.com',
    'Admin',
    'Usuario',
    'Admin Usuario',
    (SELECT id FROM user_roles WHERE name = 'admin' LIMIT 1),
    true
WHERE NOT EXISTS (SELECT 1 FROM system_users LIMIT 1);

-- 9. Insertar log por defecto
INSERT INTO system_logs (user_id, action, details, table_name)
SELECT 
    NULL, -- Sin user_id específico
    'Sistema inicializado',
    'Configuración inicial del sistema',
    'system_logs'
WHERE NOT EXISTS (SELECT 1 FROM system_logs LIMIT 1);

-- 10. Verificar estructura final
SELECT 'Estructura final de system_users:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_users' 
ORDER BY ordinal_position;

-- 11. Verificar que RLS esté deshabilitado
SELECT 'RLS deshabilitado:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('company_config', 'system_users', 'system_logs', 'user_roles')
ORDER BY tablename;

-- 12. Verificación final
SELECT '✅ Script ejecutado correctamente' as status;


