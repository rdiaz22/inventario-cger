-- Verificar existencia de tablas y rol por defecto 'user'

-- 1) Estructura básica de system_users
SELECT 'Columns en system_users' AS section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'system_users'
ORDER BY ordinal_position;

-- 2) Estructura básica de user_roles
SELECT 'Columns en user_roles' AS section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- 3) Crear user_roles si falta (idempotente)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb
);

-- 4) Insertar rol 'user' si no existe (idempotente)
INSERT INTO user_roles (name, description, permissions)
VALUES ('user', 'Rol básico', '{"users": false, "assets": true, "audits": false}')
ON CONFLICT (name) DO NOTHING;

-- 5) Comprobar existencia del rol 'user'
SELECT 'Rol user existente' AS section;
SELECT id, name FROM user_roles WHERE name = 'user';


