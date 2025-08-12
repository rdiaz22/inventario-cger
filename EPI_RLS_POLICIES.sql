-- =====================================================
-- POLÍTICAS RLS PARA TABLAS DE EPIs
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- Habilitar RLS en las tablas de EPIs
ALTER TABLE epi_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_sizes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA epi_assets
-- =====================================================

-- Política de lectura (todos pueden leer EPIs)
CREATE POLICY "epi_assets_select_policy" ON epi_assets
    FOR SELECT USING (true);

-- Política de inserción (solo usuarios con permisos de activos)
CREATE POLICY "epi_assets_insert_policy" ON epi_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'assets')::boolean = true
        )
    );

-- Política de actualización (solo usuarios con permisos de activos)
CREATE POLICY "epi_assets_update_policy" ON epi_assets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'assets')::boolean = true
        )
    );

-- Política de eliminación (solo usuarios con permisos de activos)
CREATE POLICY "epi_assets_delete_policy" ON epi_assets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'assets')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA epi_sizes
-- =====================================================

-- Política de lectura (todos pueden leer tallas de EPIs)
CREATE POLICY "epi_sizes_select_policy" ON epi_sizes
    FOR SELECT USING (true);

-- Política de inserción (solo usuarios con permisos de activos)
CREATE POLICY "epi_sizes_insert_policy" ON epi_sizes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'assets')::boolean = true
        )
    );

-- Política de actualización (solo usuarios con permisos de activos)
CREATE POLICY "epi_sizes_update_policy" ON epi_sizes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'assets')::boolean = true
        )
    );

-- Política de eliminación (solo usuarios con permisos de activos)
CREATE POLICY "epi_sizes_delete_policy" ON epi_sizes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'assets')::boolean = true
        )
    );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que RLS esté habilitado en las tablas de EPIs
SELECT '🔐 RLS habilitado en tablas de EPIs:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('epi_assets', 'epi_sizes')
ORDER BY tablename;

-- Verificar políticas creadas para EPIs
SELECT '📋 Políticas RLS creadas para EPIs:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('epi_assets', 'epi_sizes')
ORDER BY tablename, policyname;

-- Verificar estado general de RLS en todas las tablas del sistema
SELECT '🔐 Estado general de RLS en todas las tablas:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('company_config', 'user_roles', 'system_users', 'notification_config', 'system_settings', 'system_logs', 'system_backups', 'epi_assets', 'epi_sizes')
ORDER BY tablename;
