-- =====================================================
-- SOLUCIÓN: PROBLEMAS DE ACCESO ADMINISTRATIVO
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
AND tablename IN ('assets', 'epi_assets', 'categories')
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

-- 3. HABILITAR RLS EN TABLAS NECESARIAS
-- ======================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ===========================================
-- Eliminar políticas existentes en assets
DROP POLICY IF EXISTS "public_assets_read" ON assets;
DROP POLICY IF EXISTS "authenticated_assets_insert" ON assets;
DROP POLICY IF EXISTS "authenticated_assets_update" ON assets;
DROP POLICY IF EXISTS "admin_assets_delete" ON assets;
DROP POLICY IF EXISTS "assets_select_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;
DROP POLICY IF EXISTS "assets_modify_policy" ON assets;

-- Eliminar políticas existentes en epi_assets
DROP POLICY IF EXISTS "public_epi_assets_read" ON epi_assets;
DROP POLICY IF EXISTS "authenticated_epi_assets_insert" ON epi_assets;
DROP POLICY IF EXISTS "authenticated_epi_assets_update" ON epi_assets;
DROP POLICY IF EXISTS "admin_epi_assets_delete" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_select_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_insert_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_update_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_delete_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_modify_policy" ON epi_assets;

-- Eliminar políticas existentes en categories
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;
DROP POLICY IF EXISTS "categories_modify_policy" ON categories;

-- 5. CREAR POLÍTICAS RLS CORRECTAS
-- =================================

-- POLÍTICAS PARA TABLA ASSETS
-- ============================

-- Política de lectura pública (todos pueden leer)
CREATE POLICY "public_assets_read" ON assets
    FOR SELECT 
    USING (true);

-- Política de inserción (usuarios autenticados)
CREATE POLICY "authenticated_assets_insert" ON assets
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización (usuarios autenticados)
CREATE POLICY "authenticated_assets_update" ON assets
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política de eliminación (usuarios autenticados)
CREATE POLICY "authenticated_assets_delete" ON assets
    FOR DELETE 
    USING (auth.role() = 'authenticated');

-- POLÍTICAS PARA TABLA EPI_ASSETS
-- ================================

-- Política de lectura pública (todos pueden leer)
CREATE POLICY "public_epi_assets_read" ON epi_assets
    FOR SELECT 
    USING (true);

-- Política de inserción (usuarios autenticados)
CREATE POLICY "authenticated_epi_assets_insert" ON epi_assets
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización (usuarios autenticados)
CREATE POLICY "authenticated_epi_assets_update" ON epi_assets
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política de eliminación (usuarios autenticados)
CREATE POLICY "authenticated_epi_assets_delete" ON epi_assets
    FOR DELETE 
    USING (auth.role() = 'authenticated');

-- POLÍTICAS PARA TABLA CATEGORIES
-- ================================

-- Política de lectura (usuarios autenticados)
CREATE POLICY "authenticated_categories_read" ON categories
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Política de inserción (usuarios autenticados)
CREATE POLICY "authenticated_categories_insert" ON categories
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización (usuarios autenticados)
CREATE POLICY "authenticated_categories_update" ON categories
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política de eliminación (usuarios autenticados)
CREATE POLICY "authenticated_categories_delete" ON categories
    FOR DELETE 
    USING (auth.role() = 'authenticated');

-- 6. VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================
SELECT 'Verificación final - RLS habilitado:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('assets', 'epi_assets', 'categories')
ORDER BY tablename;

-- 7. VERIFICAR POLÍTICAS CREADAS
-- ===============================
SELECT 'Políticas RLS creadas en assets:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'assets'
ORDER BY policyname;

SELECT 'Políticas RLS creadas en epi_assets:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'epi_assets'
ORDER BY policyname;

SELECT 'Políticas RLS creadas en categories:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'categories'
ORDER BY policyname;

-- 8. MENSAJE DE CONFIRMACIÓN
-- ===========================
SELECT '✅ Políticas RLS corregidas para acceso administrativo' as resultado;
SELECT '🔓 Acceso público: Solo lectura de activos' as public_access;
SELECT '🔒 Acceso administrativo: Gestión completa con autenticación' as admin_access;
SELECT '📱 Los usuarios autenticados ahora pueden ver todos los activos' as admin_fix;
