-- Script para crear el sistema de configuración en Supabase
-- Ejecutar este SQL en el SQL Editor de Supabase
-- Este script es seguro de ejecutar múltiples veces

-- =====================================================
-- CREAR TABLAS (IF NOT EXISTS para evitar duplicados)
-- =====================================================

-- Tabla de configuración de la empresa/organización
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

-- Tabla de roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios del sistema (extensión de auth.users)
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

-- Tabla de configuración de notificaciones
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

-- Tabla de configuración del sistema
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

-- Tabla de logs del sistema
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

-- Tabla de backups del sistema
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

-- =====================================================
-- CREAR ÍNDICES (IF NOT EXISTS para evitar duplicados)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_system_users_role_id ON system_users(role_id);
CREATE INDEX IF NOT EXISTS idx_system_users_department ON system_users(department);
CREATE INDEX IF NOT EXISTS idx_notification_config_user_id ON notification_config(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at);

-- =====================================================
-- CREAR FUNCIÓN (OR REPLACE para evitar duplicados)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- CREAR TRIGGERS (DROP IF EXISTS + CREATE para evitar duplicados)
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

-- =====================================================
-- INSERTAR DATOS INICIALES (ON CONFLICT para evitar duplicados)
-- =====================================================

-- Insertar roles de usuario
INSERT INTO user_roles (name, description, permissions) VALUES 
    ('Super Admin', 'Acceso completo al sistema', '{"all": true}'),
    ('Admin', 'Administrador del sistema', '{"users": true, "assets": true, "audits": true, "reports": true, "company_config": true, "system_settings": true, "backup": true}'),
    ('Auditor', 'Realizar auditorías', '{"audits": true, "reports": true}'),
    ('Usuario', 'Usuario básico', '{"assets": {"read": true}, "reports": {"read": true}}')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Insertar configuración de empresa (solo si no existe)
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

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE company_config IS 'Configuración de la empresa/organización';
COMMENT ON TABLE user_roles IS 'Roles de usuario del sistema';
COMMENT ON TABLE system_users IS 'Usuarios del sistema con información extendida';
COMMENT ON TABLE notification_config IS 'Configuración de notificaciones por usuario';
COMMENT ON TABLE system_settings IS 'Configuraciones generales del sistema';
COMMENT ON TABLE system_logs IS 'Logs de auditoría del sistema';
COMMENT ON TABLE system_backups IS 'Registro de backups del sistema';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar las tablas creadas
SELECT 'Tablas creadas exitosamente:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('company_config', 'user_roles', 'system_users', 'notification_config', 'system_settings', 'system_logs', 'system_backups')
ORDER BY table_name;

-- =====================================================
-- CONFIGURAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA company_config
-- =====================================================

-- Política de lectura (todos pueden leer)
CREATE POLICY "company_config_select_policy" ON company_config
    FOR SELECT USING (true);

-- Política de inserción (solo admins)
CREATE POLICY "company_config_insert_policy" ON company_config
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'company_config')::boolean = true
        )
    );

-- Política de actualización (solo admins)
CREATE POLICY "company_config_update_policy" ON company_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'company_config')::boolean = true
        )
    );

-- Política de eliminación (solo admins)
CREATE POLICY "company_config_delete_policy" ON company_config
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'company_config')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA user_roles
-- =====================================================

-- Política de lectura (todos pueden leer)
CREATE POLICY "user_roles_select_policy" ON user_roles
    FOR SELECT USING (true);

-- Política de modificación (solo admins)
CREATE POLICY "user_roles_modify_policy" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'users')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA system_users
-- =====================================================

-- Política de lectura (todos pueden leer)
CREATE POLICY "system_users_select_policy" ON system_users
    FOR SELECT USING (true);

-- Política de modificación (solo admins)
CREATE POLICY "system_users_modify_policy" ON system_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'users')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA notification_config
-- =====================================================

-- Política de lectura (usuarios solo ven sus propias configuraciones)
CREATE POLICY "notification_config_select_policy" ON notification_config
    FOR SELECT USING (user_id = auth.uid());

-- Política de inserción (usuarios solo pueden crear para sí mismos)
CREATE POLICY "notification_config_insert_policy" ON notification_config
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política de actualización (usuarios solo pueden modificar las suyas)
CREATE POLICY "notification_config_update_policy" ON notification_config
    FOR UPDATE USING (user_id = auth.uid());

-- Política de eliminación (usuarios solo pueden eliminar las suyas)
CREATE POLICY "notification_config_delete_policy" ON notification_config
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA system_settings
-- =====================================================

-- Política de lectura (todos pueden leer configuraciones públicas)
CREATE POLICY "system_settings_select_policy" ON system_settings
    FOR SELECT USING (is_public = true OR (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'system_settings')::boolean = true
        )
    ));

-- Política de modificación (solo admins)
CREATE POLICY "system_settings_modify_policy" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'system_settings')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA system_logs
-- =====================================================

-- Política de lectura (solo admins pueden ver logs)
CREATE POLICY "system_logs_select_policy" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'system_logs')::boolean = true
        )
    );

-- Política de inserción (solo admins pueden crear logs)
CREATE POLICY "system_logs_insert_policy" ON system_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'system_logs')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA system_backups
-- =====================================================

-- Política de lectura (solo admins pueden ver backups)
CREATE POLICY "system_backups_select_policy" ON system_backups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'backup')::boolean = true
        )
    );

-- Política de modificación (solo admins pueden gestionar backups)
CREATE POLICY "system_backups_modify_policy" ON system_backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'backup')::boolean = true
        )
    );

-- =====================================================
-- VERIFICACIÓN FINAL COMPLETA
-- =====================================================

-- Verificar que RLS esté habilitado
SELECT '🔐 RLS habilitado en tablas:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('company_config', 'user_roles', 'system_users', 'notification_config', 'system_settings', 'system_logs', 'system_backups')
ORDER BY tablename;

-- Verificar políticas creadas
SELECT '📋 Políticas RLS creadas:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('company_config', 'user_roles', 'system_users', 'notification_config', 'system_settings', 'system_logs', 'system_backups')
ORDER BY tablename, policyname;
