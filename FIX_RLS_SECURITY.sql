-- Script para resolver problemas de RLS identificados por Security Advisor
-- Ejecutar en Supabase SQL Editor

-- 1. HABILITAR RLS EN TODAS LAS TABLAS CRÍTICAS
-- ================================================

-- Tablas del sistema principal
ALTER TABLE IF EXISTS company_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_config ENABLE ROW LEVEL SECURITY;

-- Tablas de EPIs
ALTER TABLE IF EXISTS epi_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS epi_sizes ENABLE ROW LEVEL SECURITY;

-- Tabla de activos
ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;

-- Tabla de categorías
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR Y CREAR POLÍTICAS RLS BÁSICAS
-- ============================================

-- Política para company_config (configuración de empresa)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver configuración de empresa" ON company_config;
CREATE POLICY "Usuarios autenticados pueden ver configuración de empresa" ON company_config
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo administradores pueden modificar configuración" ON company_config;
CREATE POLICY "Solo administradores pueden modificar configuración" ON company_config
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para system_users
DROP POLICY IF EXISTS "Usuarios pueden ver su propia información" ON system_users;
CREATE POLICY "Usuarios pueden ver su propia información" ON system_users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (id = auth.uid() OR 
         EXISTS (
             SELECT 1 FROM user_roles 
             WHERE user_id = auth.uid() 
             AND role_name IN ('admin', 'super_admin')
         ))
    );

DROP POLICY IF EXISTS "Solo administradores pueden gestionar usuarios" ON system_users;
CREATE POLICY "Solo administradores pueden gestionar usuarios" ON system_users
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para user_roles
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios roles" ON user_roles;
CREATE POLICY "Usuarios pueden ver sus propios roles" ON user_roles
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (user_id = auth.uid() OR 
         EXISTS (
             SELECT 1 FROM user_roles ur 
             WHERE ur.user_id = auth.uid() 
             AND ur.role_name IN ('admin', 'super_admin')
         ))
    );

DROP POLICY IF EXISTS "Solo administradores pueden gestionar roles" ON user_roles;
CREATE POLICY "Solo administradores pueden gestionar roles" ON user_roles
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para assets (activos)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver activos" ON assets;
CREATE POLICY "Usuarios autenticados pueden ver activos" ON assets
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear activos" ON assets;
CREATE POLICY "Usuarios autenticados pueden crear activos" ON assets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar activos" ON assets;
CREATE POLICY "Usuarios autenticados pueden actualizar activos" ON assets
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo administradores pueden eliminar activos" ON assets;
CREATE POLICY "Solo administradores pueden eliminar activos" ON assets
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para categories
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver categorías" ON categories;
CREATE POLICY "Usuarios autenticados pueden ver categorías" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo administradores pueden gestionar categorías" ON categories;
CREATE POLICY "Solo administradores pueden gestionar categorías" ON categories
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para epi_assets
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver EPIs" ON epi_assets;
CREATE POLICY "Usuarios autenticados pueden ver EPIs" ON epi_assets
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar EPIs" ON epi_assets;
CREATE POLICY "Usuarios autenticados pueden gestionar EPIs" ON epi_assets
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para epi_sizes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver tallas EPI" ON epi_sizes;
CREATE POLICY "Usuarios autenticados pueden ver tallas EPI" ON epi_sizes
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo administradores pueden gestionar tallas EPI" ON epi_sizes;
CREATE POLICY "Solo administradores pueden gestionar tallas EPI" ON epi_sizes
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para system_logs
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver logs del sistema" ON system_logs;
CREATE POLICY "Usuarios autenticados pueden ver logs del sistema" ON system_logs
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo administradores pueden gestionar logs" ON system_logs;
CREATE POLICY "Solo administradores pueden gestionar logs" ON system_logs
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para system_settings
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver configuraciones" ON system_settings;
CREATE POLICY "Usuarios autenticados pueden ver configuraciones" ON system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo administradores pueden modificar configuraciones" ON system_settings;
CREATE POLICY "Solo administradores pueden modificar configuraciones" ON system_settings
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para notification_config
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver configuración de notificaciones" ON notification_config;
CREATE POLICY "Usuarios autenticados pueden ver configuración de notificaciones" ON notification_config
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo administradores pueden gestionar notificaciones" ON notification_config;
CREATE POLICY "Solo administradores pueden gestionar notificaciones" ON notification_config
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- Política para system_backups
DROP POLICY IF EXISTS "Solo administradores pueden ver backups" ON system_backups;
CREATE POLICY "Solo administradores pueden ver backups" ON system_backups
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Solo administradores pueden gestionar backups" ON system_backups;
CREATE POLICY "Solo administradores pueden gestionar backups" ON system_backups
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'super_admin')
        )
    );

-- 3. VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================

-- Consulta para verificar el estado de RLS en todas las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'company_config',
    'system_users', 
    'user_roles',
    'system_settings',
    'system_logs',
    'system_backups',
    'notification_config',
    'epi_assets',
    'epi_sizes',
    'assets',
    'categories'
)
ORDER BY tablename;

-- 4. MENSAJE DE CONFIRMACIÓN
-- ===========================
SELECT 'RLS habilitado y políticas de seguridad configuradas exitosamente' as mensaje;
