-- =====================================================
-- SCRIPT SIMPLE PARA SISTEMA DE CONFIGURACIÓN
-- Ejecutar paso a paso en Supabase SQL Editor
-- =====================================================

-- PASO 1: Crear tablas básicas
-- =====================================================

-- Tabla de configuración de empresa
CREATE TABLE IF NOT EXISTS company_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    company_logo_url TEXT,
    tax_id VARCHAR(100),
    industry VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS system_users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role_id UUID REFERENCES user_roles(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notification_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    audit_notifications BOOLEAN DEFAULT true,
    maintenance_notifications BOOLEAN DEFAULT true,
    loan_notifications BOOLEAN DEFAULT true,
    low_stock_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de backups
CREATE TABLE IF NOT EXISTS system_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('full', 'partial', 'schema')),
    file_path TEXT,
    file_size BIGINT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    created_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: Crear índices
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_system_users_role_id ON system_users(role_id);
CREATE INDEX IF NOT EXISTS idx_system_users_department ON system_users(department);
CREATE INDEX IF NOT EXISTS idx_notification_config_user_id ON notification_config(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at);

-- PASO 3: Crear función para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASO 4: Crear triggers
-- =====================================================

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_company_config_updated_at ON company_config;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS update_system_users_updated_at ON system_users;
DROP TRIGGER IF EXISTS update_notification_config_updated_at ON notification_config;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

-- Crear triggers
CREATE TRIGGER update_company_config_updated_at 
    BEFORE UPDATE ON company_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_users_updated_at 
    BEFORE UPDATE ON system_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_config_updated_at 
    BEFORE UPDATE ON notification_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASO 5: Insertar datos iniciales
-- =====================================================

-- Insertar roles
INSERT INTO user_roles (name, description, permissions) VALUES 
    ('Super Admin', 'Acceso completo al sistema', '{"all": true}'),
    ('Admin', 'Administrador del sistema', '{"users": true, "assets": true, "audits": true, "reports": true, "company_config": true, "system_settings": true, "backup": true}'),
    ('Auditor', 'Realizar auditorías', '{"audits": true, "reports": true}'),
    ('Usuario', 'Usuario básico', '{"assets": {"read": true}, "reports": {"read": true}}')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Insertar empresa
INSERT INTO company_config (company_name, company_address, company_phone, company_email) VALUES 
    ('Mi Empresa', 'Dirección de la empresa', '+34 123 456 789', 'info@miempresa.com')
ON CONFLICT DO NOTHING;

-- Insertar configuraciones del sistema
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES 
    ('system_name', 'Inventory Management System', 'string', 'Nombre del sistema', true),
    ('max_file_size', '10485760', 'number', 'Tamaño máximo de archivo en bytes (10MB)', false),
    ('session_timeout', '3600', 'number', 'Tiempo de sesión en segundos', false),
    ('maintenance_mode', 'false', 'boolean', 'Modo mantenimiento del sistema', true),
    ('backup_retention_days', '30', 'number', 'Días de retención de backups', false)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    setting_type = EXCLUDED.setting_type,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

-- PASO 6: Verificar que todo se creó correctamente
-- =====================================================

SELECT '✅ Tablas creadas exitosamente:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('company_config', 'user_roles', 'system_users', 'notification_config', 'system_settings', 'system_logs', 'system_backups')
ORDER BY table_name;

SELECT '✅ Roles creados:' as status;
SELECT name, description FROM user_roles ORDER BY name;

SELECT '✅ Configuración de empresa:' as status;
SELECT company_name, company_email FROM company_config;

SELECT '✅ Configuraciones del sistema:' as status;
SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key;
