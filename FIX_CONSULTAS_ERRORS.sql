-- =====================================================
-- CORRECCIÓN DE ERRORES DE CONSULTAS
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Verificar estructura de epi_assets
SELECT 'Verificando estructura de epi_assets:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'epi_assets' 
ORDER BY ordinal_position;

-- 2. Agregar columnas faltantes a epi_assets si no existen
DO $$ 
BEGIN
    -- Agregar maintenance_frequency si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'maintenance_frequency') THEN
        ALTER TABLE epi_assets ADD COLUMN maintenance_frequency INTEGER DEFAULT 90;
    END IF;
    
    -- Agregar last_maintenance_date si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'last_maintenance_date') THEN
        ALTER TABLE epi_assets ADD COLUMN last_maintenance_date DATE;
    END IF;
    
    -- Agregar category si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'epi_assets' AND column_name = 'category') THEN
        ALTER TABLE epi_assets ADD COLUMN category VARCHAR(100);
    END IF;
END $$;

-- 3. Verificar estructura de epi_sizes
SELECT 'Verificando estructura de epi_sizes:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'epi_sizes' 
ORDER BY ordinal_position;

-- 4. Crear tabla epi_sizes si no existe
CREATE TABLE IF NOT EXISTS epi_sizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epi_id UUID REFERENCES epi_assets(id) ON DELETE CASCADE,
    size VARCHAR(50) NOT NULL,
    units INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Verificar estructura de company_config
SELECT 'Verificando estructura de company_config:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company_config' 
ORDER BY ordinal_position;

-- 6. Crear tabla company_config si no existe
CREATE TABLE IF NOT EXISTS company_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) DEFAULT 'Mi Empresa',
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Insertar datos por defecto en company_config
INSERT INTO company_config (company_name, company_address, company_phone, company_email) 
SELECT 'Mi Empresa', 'Dirección de la empresa', '123-456-7890', 'contacto@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM company_config LIMIT 1);

-- 8. Habilitar RLS en todas las tablas
ALTER TABLE epi_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas RLS básicas
DROP POLICY IF EXISTS "epi_assets_select_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_assets_modify_policy" ON epi_assets;
DROP POLICY IF EXISTS "epi_sizes_select_policy" ON epi_sizes;
DROP POLICY IF EXISTS "epi_sizes_modify_policy" ON epi_sizes;
DROP POLICY IF EXISTS "company_config_select_policy" ON company_config;
DROP POLICY IF EXISTS "company_config_modify_policy" ON company_config;

CREATE POLICY "epi_assets_select_policy" ON epi_assets FOR SELECT USING (true);
CREATE POLICY "epi_assets_modify_policy" ON epi_assets FOR ALL USING (true);
CREATE POLICY "epi_sizes_select_policy" ON epi_sizes FOR SELECT USING (true);
CREATE POLICY "epi_sizes_modify_policy" ON epi_sizes FOR ALL USING (true);
CREATE POLICY "company_config_select_policy" ON company_config FOR SELECT USING (true);
CREATE POLICY "company_config_modify_policy" ON company_config FOR ALL USING (true);

-- 10. Verificación final
SELECT '✅ Correcciones aplicadas correctamente' as status;
SELECT 'Tablas verificadas: epi_assets, epi_sizes, company_config' as resultado;
SELECT 'Políticas RLS configuradas' as seguridad;
SELECT 'Datos de ejemplo insertados' as datos;
