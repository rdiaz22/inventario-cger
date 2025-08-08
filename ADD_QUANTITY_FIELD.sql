-- Script para agregar el campo quantity a la tabla assets
-- Ejecutar este SQL en el SQL Editor de Supabase

-- Agregar el campo quantity a la tabla assets
ALTER TABLE assets 
ADD COLUMN quantity INTEGER DEFAULT 1;

-- Agregar un comentario al campo para documentación
COMMENT ON COLUMN assets.quantity IS 'Número de unidades de este artículo (por defecto 1)';

-- Crear un índice para mejorar el rendimiento de consultas por cantidad
CREATE INDEX IF NOT EXISTS idx_assets_quantity ON assets(quantity);

-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assets' AND column_name = 'quantity';
