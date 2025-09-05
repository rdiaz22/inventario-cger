-- Políticas restrictivas para user_roles
-- Solo Super Admin, Auditor y Administrador pueden acceder

-- 1. ELIMINAR POLÍTICAS EXISTENTES
-- =================================
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can manage user_roles" ON public.user_roles;

-- 2. POLÍTICAS RESTRICTIVAS
-- ==========================

-- Política para SELECT - Solo roles autorizados pueden ver
CREATE POLICY "Only authorized roles can view user_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('super_admin', 'auditor', 'administrator')
    )
);

-- Política para INSERT - Solo Super Admin y Administrador pueden crear
CREATE POLICY "Only Super Admin and Administrator can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('super_admin', 'administrator')
    )
);

-- Política para UPDATE - Solo Super Admin y Administrador pueden modificar
CREATE POLICY "Only Super Admin and Administrator can update roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('super_admin', 'administrator')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name IN ('super_admin', 'administrator')
    )
);

-- Política para DELETE - Solo Super Admin puede eliminar
CREATE POLICY "Only Super Admin can delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_name = 'super_admin'
    )
);

-- 3. VERIFICAR POLÍTICAS CREADAS
-- ===============================
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 4. RESUMEN DE PERMISOS
-- =======================
SELECT 
    'RESUMEN DE PERMISOS PARA USER_ROLES' as titulo,
    '' as separador,
    'SELECT: Super Admin, Auditor, Administrador' as permiso_select,
    'INSERT: Super Admin, Administrador' as permiso_insert,
    'UPDATE: Super Admin, Administrador' as permiso_update,
    'DELETE: Solo Super Admin' as permiso_delete;
