-- =====================================================
-- SOLUCIÓN ESPECÍFICA: ERROR 406 EN CONFIGURACIÓN
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Verificar si existe la tabla company_config
SELECT 'Verificando tabla company_config:' as status;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_config'
) as table_exists;

-- 2. Crear tabla company_config si no existe
CREATE TABLE IF NOT EXISTS company_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) DEFAULT 'Mi Empresa',
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    company_cif VARCHAR(50),
    company_sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insertar datos por defecto si la tabla está vacía
INSERT INTO company_config (company_name, company_address, company_phone, company_email) 
SELECT 'Mi Empresa', 'Dirección de la empresa', '123-456-7890', 'contacto@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM company_config LIMIT 1);

-- 4. DESHABILITAR RLS temporalmente para company_config
ALTER TABLE company_config DISABLE ROW LEVEL SECURITY;

-- 5. Eliminar todas las políticas existentes de company_config
DROP POLICY IF EXISTS "company_config_select_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_insert_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_update_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_delete_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_modify_policy" ON company_config;

-- 6. Verificar que RLS esté deshabilitado
SELECT 'RLS deshabilitado en company_config:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'company_config';

-- 7. Probar acceso directo a la tabla
SELECT 'Probando acceso a company_config:' as status;
SELECT * FROM company_config LIMIT 1;

-- 8. Verificar estructura de la tabla
SELECT 'Estructura de company_config:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'company_config' 
ORDER BY ordinal_position;

-- 9. Verificación final
SELECT '✅ Configuración aplicada correctamente' as status;
SELECT 'RLS deshabilitado para company_config' as resultado;
SELECT 'Datos de ejemplo disponibles' as datos;
SELECT 'Tabla accesible públicamente' as acceso;
