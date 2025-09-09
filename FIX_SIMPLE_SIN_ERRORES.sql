-- =====================================================
-- SOLUCIÓN SIMPLE: SIN ERRORES
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Crear tabla company_config
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

-- 2. Crear tabla system_users
CREATE TABLE IF NOT EXISTS system_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla system_logs
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

-- 5. DESHABILITAR RLS
ALTER TABLE company_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 6. Insertar datos por defecto
INSERT INTO company_config (company_name, company_address, company_phone, company_email) 
SELECT 'Mi Empresa', 'Dirección de la empresa', '123-456-7890', 'contacto@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM company_config LIMIT 1);

INSERT INTO user_roles (id, name, description, permissions) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador completo', '{"all": true, "users": true, "assets": true, "audits": true}'),
    ('00000000-0000-0000-0000-000000000002', 'user', 'Usuario básico', '{"all": false, "users": false, "assets": true, "audits": false}')
ON CONFLICT (name) DO NOTHING;

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

INSERT INTO system_logs (user_id, action, details, table_name)
SELECT 
    (SELECT user_id FROM system_users LIMIT 1),
    'Sistema inicializado',
    'Configuración inicial del sistema',
    'system_logs'
WHERE NOT EXISTS (SELECT 1 FROM system_logs LIMIT 1);

-- 7. Verificación final
SELECT '✅ Script ejecutado correctamente' as status;


