-- Script corregido para políticas de user_roles
-- Primero verificar la estructura real de la tabla

-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
-- ====================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. POLÍTICAS CORREGIDAS PARA USER_ROLES
-- ========================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Política para ver roles (usuarios autenticados pueden ver todos los roles)
CREATE POLICY "Users can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (true);

-- Política para insertar roles (solo administradores)
CREATE POLICY "Only admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('admin', 'super_admin')
    )
);

-- Política para actualizar roles (solo administradores)
CREATE POLICY "Only admins can update roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('admin', 'super_admin')
    )
);

-- Política para eliminar roles (solo administradores)
CREATE POLICY "Only admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('admin', 'super_admin')
    )
);

-- 3. VERIFICAR QUE LAS POLÍTICAS SE CREARON
-- ===========================================
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
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 4. MENSAJE DE CONFIRMACIÓN
-- ===========================
SELECT 'Políticas de user_roles configuradas exitosamente' as mensaje;
