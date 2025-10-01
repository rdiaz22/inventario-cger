-- =====================================================
-- SOLUCIÓN ESPECÍFICA: ERRORES RLS EN company_config
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL DE RLS
-- ===================================
SELECT 'Estado actual de RLS en company_config:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'company_config';

-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- ==================================
SELECT 'Políticas RLS existentes en company_config:' as status;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'company_config';

-- 3. HABILITAR RLS EN company_config
-- ===================================
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;

-- 4. ELIMINAR POLÍTICAS CONFLICTIVAS EXISTENTES
-- =============================================
DROP POLICY IF EXISTS "company_config_select_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_insert_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_update_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_delete_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_modify_policy" ON company_config;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver configuración de empresa" ON company_config;
DROP POLICY IF EXISTS "Solo administradores pueden modificar configuración" ON company_config;

-- 5. CREAR POLÍTICAS RLS CORRECTAS
-- =================================

-- Política de lectura (todos los usuarios autenticados pueden leer)
CREATE POLICY "company_config_read_policy" ON company_config
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Política de inserción (solo administradores)
CREATE POLICY "company_config_insert_policy" ON company_config
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (
                (ur.permissions->>'all')::boolean = true
                OR (ur.permissions->>'company_config')::boolean = true
                OR ur.name IN ('admin', 'super_admin')
            )
        )
    );

-- Política de actualización (solo administradores)
CREATE POLICY "company_config_update_policy" ON company_config
    FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (
                (ur.permissions->>'all')::boolean = true
                OR (ur.permissions->>'company_config')::boolean = true
                OR ur.name IN ('admin', 'super_admin')
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (
                (ur.permissions->>'all')::boolean = true
                OR (ur.permissions->>'company_config')::boolean = true
                OR ur.name IN ('admin', 'super_admin')
            )
        )
    );

-- Política de eliminación (solo super administradores)
CREATE POLICY "company_config_delete_policy" ON company_config
    FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND ur.name = 'super_admin'
        )
    );

-- 6. VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================
SELECT 'Verificación final - RLS habilitado en company_config:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'company_config';

-- 7. VERIFICAR POLÍTICAS CREADAS
-- ===============================
SELECT 'Políticas RLS creadas en company_config:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Definida'
        ELSE 'No definida'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Definida'
        ELSE 'No definida'
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'company_config'
ORDER BY policyname;

-- 8. MENSAJE DE CONFIRMACIÓN
-- ===========================
SELECT '✅ RLS habilitado y políticas de seguridad configuradas correctamente para company_config' as resultado;
SELECT '🔒 Security Advisor debería mostrar 0 errores para company_config' as siguiente_paso;
