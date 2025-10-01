-- =====================================================
-- SOLUCIÓN: ROLES DUPLICADOS EN USER_ROLES
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. VERIFICAR ROLES EXISTENTES
-- =============================
SELECT 'Roles actuales en user_roles:' as status;
SELECT 
    id,
    name,
    description,
    created_at,
    updated_at
FROM user_roles 
ORDER BY name, created_at;

-- 2. IDENTIFICAR ROLES DUPLICADOS
-- ================================
SELECT 'Roles duplicados encontrados:' as status;
SELECT 
    name,
    COUNT(*) as cantidad,
    STRING_AGG(id::text, ', ') as ids
FROM user_roles 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY name;

-- 3. CREAR ROLES ESTÁNDAR SI NO EXISTEN
-- ======================================

-- Insertar roles estándar si no existen
INSERT INTO user_roles (name, description, permissions)
SELECT 'Admin', 'Administrador del sistema con acceso completo', 
       '{"all": true, "assets": true, "users": true, "audits": true, "reports": true, "company_config": true, "notifications": true, "system_settings": true, "backup": true, "logs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE LOWER(name) = 'admin');

INSERT INTO user_roles (name, description, permissions)
SELECT 'Auditor', 'Usuario con permisos de auditoría y reportes', 
       '{"assets": true, "audits": true, "reports": true, "logs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE LOWER(name) = 'auditor');

INSERT INTO user_roles (name, description, permissions)
SELECT 'User', 'Usuario estándar con acceso básico', 
       '{"assets": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE LOWER(name) = 'user');

-- 4. (SE MUEVE DESPUÉS) NORMALIZAR NOMBRES DE ROLES
-- =================================================
-- Nota: Se normaliza DESPUÉS de consolidar y eliminar duplicados para evitar
-- violar el índice único (user_roles_name_key) al intentar renombrar 'user' a
-- 'User' cuando ya existe.

-- 5. ELIMINAR ROLES DUPLICADOS
-- =============================

-- Crear tabla temporal con los IDs de roles a mantener
WITH roles_to_keep AS (
    SELECT DISTINCT ON (LOWER(name)) 
        id,
        name,
        LOWER(name) as normalized_name
    FROM user_roles 
    ORDER BY LOWER(name), created_at ASC
),
roles_to_delete AS (
    SELECT ur.id
    FROM user_roles ur
    LEFT JOIN roles_to_keep rtk ON ur.id = rtk.id
    WHERE rtk.id IS NULL
)
-- Actualizar usuarios que tienen roles duplicados
UPDATE system_users 
SET role_id = (
    SELECT rtk.id 
    FROM roles_to_keep rtk 
    WHERE LOWER(rtk.name) = LOWER(
        (SELECT name FROM user_roles WHERE id = system_users.role_id)
    )
)
WHERE role_id IN (SELECT id FROM roles_to_delete);

-- Eliminar roles duplicados
WITH roles_to_keep AS (
    SELECT DISTINCT ON (LOWER(name)) 
        id,
        name,
        LOWER(name) as normalized_name
    FROM user_roles 
    ORDER BY LOWER(name), created_at ASC
),
roles_to_delete AS (
    SELECT ur.id
    FROM user_roles ur
    LEFT JOIN roles_to_keep rtk ON ur.id = rtk.id
    WHERE rtk.id IS NULL
)
DELETE FROM user_roles 
WHERE id IN (SELECT id FROM roles_to_delete);

-- 6. NORMALIZAR NOMBRES (DESPUÉS DE LA LIMPIEZA)
-- =============================
UPDATE user_roles
SET name = CASE LOWER(name)
  WHEN 'admin' THEN 'Admin'
  WHEN 'auditor' THEN 'Auditor'
  WHEN 'user' THEN 'User'
  ELSE name
END
WHERE LOWER(name) IN ('admin','auditor','user');

-- 7. VERIFICAR RESULTADO FINAL
-- ============================
SELECT 'Roles después de la limpieza:' as status;
SELECT 
    id,
    name,
    description,
    created_at,
    updated_at
FROM user_roles 
ORDER BY name;

-- 8. VERIFICAR USUARIOS Y SUS ROLES
-- ==================================
SELECT 'Usuarios y sus roles asignados:' as status;
SELECT 
    su.id,
    su.first_name,
    su.last_name,
    su.email,
    ur.name as role_name
FROM system_users su
LEFT JOIN user_roles ur ON su.role_id = ur.id
ORDER BY su.first_name, su.last_name;

-- 9. MENSAJE DE CONFIRMACIÓN
-- ===========================
SELECT '✅ Roles duplicados eliminados y normalizados' as resultado;
SELECT '🔧 Nombres de roles capitalizados correctamente' as normalization;
SELECT '👥 Usuarios actualizados con roles correctos' as user_update;
SELECT '📋 Solo roles únicos disponibles en el dropdown' as final_result;
