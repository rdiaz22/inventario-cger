-- =====================================================
-- Security by Default: RLS para public.assets
-- - Lectura anónima SOLO si publico = true
-- - Escrituras restringidas a Admin / Super Admin
-- - Idempotente: crea políticas solo si no existen
--   Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1) Activar RLS en la tabla
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 2) Política de lectura anónima (solo activos públicos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'assets'
      AND policyname = 'select_public_assets'
  ) THEN
    CREATE POLICY select_public_assets
    ON public.assets
    FOR SELECT
    USING (publico = true);
  END IF;
END $$;

-- 3) Política de escritura (insert/update/delete) solo Admin / Super Admin
--    Requiere que el usuario exista en system_users y tenga user_roles.name IN ('Admin','Super Admin')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'assets'
      AND policyname = 'write_admin_assets'
  ) THEN
    CREATE POLICY write_admin_assets
    ON public.assets
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.system_users su
        JOIN public.user_roles ur ON su.role_id = ur.id
        WHERE su.id = auth.uid()
          AND ur.name IN ('Admin','Super Admin')
      )
    );
  END IF;
END $$;

-- 4) Índice recomendado para búsquedas públicas por código
CREATE INDEX IF NOT EXISTS idx_assets_publico_codigo
  ON public.assets(publico, codigo);

-- Nota:
-- - La clave primaria en id ya optimiza búsquedas por id. El índice anterior
--   ayuda si se consultará por "codigo" en vistas públicas.
-- - Supabase aplica RLS tras permisos GRANT; se asume configuración por defecto.
-- - Verifica que ningún otro policy permita más de lo deseado.


