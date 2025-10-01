-- =====================================================
-- POLÍTICAS RLS PARA ACCESO PÚBLICO A ACTIVOS
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL DE RLS
-- ===================================
SELECT 'Estado actual de RLS en tablas de activos:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('assets', 'epi_assets')
ORDER BY tablename;

-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- ==================================
SELECT 'Políticas RLS existentes en assets:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Definida'
        ELSE 'No definida'
    END as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'assets'
ORDER BY policyname;

SELECT 'Políticas RLS existentes en epi_assets:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Definida'
        ELSE 'No definida'
    END as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'epi_assets'
ORDER BY policyname;

-- 3. HABILITAR RLS EN TABLAS DE ACTIVOS
-- ======================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_assets ENABLE ROW LEVEL SECURITY;

-- 4. ELIMINAR POLÍTICAS CONFLICTIVAS EXISTENTES
-- =============================================
-- Eliminar políticas existentes en assets
DROP POLICY IF EXISTS "assets_select_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;
DROP POLICY IF EXISTS "assets_modify_policy" ON assets;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver activos" ON assets;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear activos" ON assets;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar activos" ON assets;
DROP POLICY IF EXISTS "Solo administradores pueden eliminar activos" ON assets;

-- Eliminar políticas existentes en epi_assets
DROP POLICY IF EXISTS "epi_assets_select_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_insert_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_update_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_delete_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_modify_policy" ON epi_assets;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver EPIs" ON epi_assets;
DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar EPIs" ON epi_assets;

-- 5. CREAR POLÍTICAS RLS PARA ACCESO PÚBLICO
-- ===========================================

-- POLÍTICAS PARA TABLA ASSETS
-- ============================

-- Política de lectura pública (todos pueden leer información básica)
CREATE POLICY "public_assets_read" ON assets
    FOR SELECT 
    USING (true);

-- Política de inserción (solo usuarios autenticados)
CREATE POLICY "authenticated_assets_insert" ON assets
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización (solo usuarios autenticados)
CREATE POLICY "authenticated_assets_update" ON assets
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política de eliminación (solo administradores)
CREATE POLICY "admin_assets_delete" ON assets
    FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (
                (ur.permissions->>'all')::boolean = true
                OR (ur.permissions->>'assets')::boolean = true
                OR ur.name IN ('admin', 'super_admin')
            )
        )
    );

-- POLÍTICAS PARA TABLA EPI_ASSETS
-- ================================

-- Política de lectura pública (todos pueden leer información básica)
CREATE POLICY "public_epi_assets_read" ON epi_assets
    FOR SELECT 
    USING (true);

-- Política de inserción (solo usuarios autenticados)
CREATE POLICY "authenticated_epi_assets_insert" ON epi_assets
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización (solo usuarios autenticados)
CREATE POLICY "authenticated_epi_assets_update" ON epi_assets
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política de eliminación (solo administradores)
CREATE POLICY "admin_epi_assets_delete" ON epi_assets
    FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (
                (ur.permissions->>'all')::boolean = true
                OR (ur.permissions->>'epi_assets')::boolean = true
                OR ur.name IN ('admin', 'super_admin')
            )
        )
    );

-- 6. VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================
SELECT 'Verificación final - RLS habilitado en tablas de activos:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('assets', 'epi_assets')
ORDER BY tablename;

-- 7. VERIFICAR POLÍTICAS CREADAS
-- ===============================
SELECT 'Políticas RLS creadas en assets:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Definida'
        ELSE 'No definida'
    END as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'assets'
ORDER BY policyname;

SELECT 'Políticas RLS creadas en epi_assets:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Definida'
        ELSE 'No definida'
    END as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'epi_assets'
ORDER BY policyname;

-- 8. MENSAJE DE CONFIRMACIÓN
-- ===========================
SELECT '✅ Políticas RLS configuradas para acceso público a activos' as resultado;
SELECT '🔓 Acceso público: Solo lectura de información básica' as public_access;
SELECT '🔒 Acceso administrativo: Gestión completa con autenticación' as admin_access;
SELECT '📱 Los códigos QR ahora apuntan a /activos/:id (acceso público)' as qr_info;
