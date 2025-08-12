# Sistema de Configuración - Inventory App

## 📋 Descripción

El Sistema de Configuración es un módulo completo que permite gestionar todos los aspectos de configuración de la aplicación de inventario, incluyendo:

- **Configuración de Empresa**: Datos de la empresa, logo, información de contacto
- **Gestión de Usuarios y Roles**: Crear, editar y gestionar usuarios del sistema con roles y permisos
- **Configuración de Notificaciones**: Personalizar notificaciones por usuario
- **Configuración del Sistema**: Ajustes generales del sistema
- **Gestión de Backups**: Crear y gestionar backups del sistema

## 🚀 Instalación

**⚠️ IMPORTANTE:** Para evitar errores de duplicados, usa **SOLO UNO** de estos métodos:

### **Método Recomendado: Script Completo**
1. Ejecuta **SOLO** el archivo `SYSTEM_CONFIG.sql` en Supabase
2. **NO ejecutes** las instrucciones SQL del README por separado
3. El script completo ya incluye todo lo necesario

### **Método Alternativo: Instrucciones Manuales**
Solo si prefieres hacerlo paso a paso o tienes problemas con el script completo.

### 1. Ejecutar Scripts SQL

**Recomendado:** Ejecuta el script completo `SYSTEM_CONFIG.sql` en tu base de datos Supabase:

```sql
-- Copia y pega el contenido del archivo SYSTEM_CONFIG.sql
-- en el SQL Editor de Supabase
```

### 2. Configurar Variables de Entorno

Asegúrate de que tu archivo `.env` contenga las variables necesarias:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 3. Configurar Storage de Supabase

Crea un bucket llamado `activos` en Supabase Storage para almacenar logos y archivos:

**Opción A: Desde la interfaz de Supabase (Recomendado)**
1. Ve a **Storage** en el sidebar de Supabase
2. Haz clic en **"New bucket"**
3. Nombre: `activos`
4. Marca **"Public bucket"**
5. Haz clic en **"Create bucket"**

**Opción B: Desde SQL Editor (Solo si no existe)**
```sql
-- Verificar si el bucket ya existe
SELECT * FROM storage.buckets WHERE id = 'activos';

-- Solo crear si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('activos', 'activos', true)
ON CONFLICT (id) DO NOTHING;
```

### 4. Configurar Políticas de Seguridad

**IMPORTANTE:** Las políticas RLS ya están incluidas en el script principal `SYSTEM_CONFIG.sql`. 
Si quieres configurarlas manualmente o tienes problemas, puedes usar este script:

```sql
-- Habilitar RLS en las tablas (solo si no está habilitado)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'company_config' AND rowsecurity = true) THEN
        ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND rowsecurity = true) THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_users' AND rowsecurity = true) THEN
        ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notification_config' AND rowsecurity = true) THEN
        ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_settings' AND rowsecurity = true) THEN
        ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_logs' AND rowsecurity = true) THEN
        ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_backups' AND rowsecurity = true) THEN
        ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Políticas para company_config (solo admins pueden modificar)
CREATE POLICY "company_config_select_policy" ON company_config
    FOR SELECT USING (true);

CREATE POLICY "company_config_insert_policy" ON company_config
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'company_config')::boolean = true
        )
    );

-- Políticas para user_roles (solo admins pueden modificar)
CREATE POLICY "user_roles_select_policy" ON user_roles
    FOR SELECT USING (true);

CREATE POLICY "user_roles_modify_policy" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'users')::boolean = true
        )
    );

-- Políticas para system_users
CREATE POLICY "system_users_select_policy" ON system_users
    FOR SELECT USING (true);

CREATE POLICY "system_users_modify_policy" ON system_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'users')::boolean = true
        )
    );

-- Políticas para notification_config (usuarios solo pueden ver/modificar sus propias configuraciones)
CREATE POLICY "notification_config_own_policy" ON notification_config
    FOR ALL USING (user_id = auth.uid());

-- Políticas para system_settings
CREATE POLICY "system_settings_select_policy" ON system_settings
    FOR SELECT USING (true);

CREATE POLICY "system_settings_modify_policy" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'system_settings')::boolean = true
        )
    );

-- Políticas para system_logs (solo admins pueden ver logs)
CREATE POLICY "system_logs_select_policy" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'system_logs')::boolean = true
        )
    );

-- Políticas para system_backups (solo admins pueden gestionar backups)
CREATE POLICY "system_backups_select_policy" ON system_backups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'backup')::boolean = true
        )
    );

CREATE POLICY "system_backups_modify_policy" ON system_backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.id = auth.uid() 
            AND (ur.permissions->>'all')::boolean = true
            OR (ur.permissions->>'backup')::boolean = true
        )
    );
```

## 🔧 Configuración Inicial

### 1. Crear Usuario Administrador

Después de ejecutar los scripts SQL, crea un usuario administrador:

```sql
-- Insertar rol de Super Admin si no existe
INSERT INTO user_roles (name, description, permissions) 
VALUES ('Super Admin', 'Acceso completo al sistema', '{"all": true}')
ON CONFLICT (name) DO NOTHING;

-- Obtener el ID del rol Super Admin
SELECT id FROM user_roles WHERE name = 'Super Admin';

-- Crear usuario en system_users (reemplaza USER_ID con el ID real del usuario)
INSERT INTO system_users (id, role_id, first_name, last_name, is_active)
VALUES ('USER_ID', 'ROLE_ID', 'Admin', 'Sistema', true);
```

### 2. Configurar Empresa

La primera vez que accedas a la configuración, se creará automáticamente un registro de empresa con valores por defecto.

## 📱 Uso del Sistema

### Acceso a la Configuración

1. Inicia sesión en la aplicación
2. Navega a **Configuración** en el sidebar
3. Selecciona la pestaña deseada

### Gestión de Usuarios

- **Ver Usuarios**: Lista todos los usuarios del sistema
- **Agregar Usuario**: Crea nuevos usuarios con roles específicos
- **Editar Usuario**: Modifica información de usuarios existentes
- **Activar/Desactivar**: Cambia el estado de los usuarios
- **Eliminar Usuario**: Elimina usuarios del sistema

### Configuración de Empresa

- **Información Básica**: Nombre, dirección, teléfono, email
- **Logo**: Subir y gestionar el logo de la empresa
- **Datos Fiscales**: CIF/NIF y sector industrial

### Configuración de Notificaciones

- **Email**: Notificaciones por correo electrónico
- **Push**: Notificaciones en tiempo real
- **Tipos**: Auditorías, mantenimiento, préstamos, stock bajo

### Configuración del Sistema

- **Nombre del Sistema**: Personalizar el nombre de la aplicación
- **Tamaño de Archivos**: Límite máximo de archivos
- **Tiempo de Sesión**: Duración de las sesiones
- **Modo Mantenimiento**: Activar/desactivar modo mantenimiento

### Gestión de Backups

- **Crear Backup**: Generar copias de seguridad
- **Ver Historial**: Lista de backups realizados
- **Estado**: Seguimiento del estado de los backups

## 🔐 Sistema de Permisos

El sistema utiliza un sistema de permisos basado en roles:

### Roles Predefinidos

1. **Super Admin**: Acceso completo a todas las funcionalidades
2. **Admin**: Administrador del sistema (usuarios, activos, auditorías, reportes)
3. **Auditor**: Realizar auditorías y generar reportes
4. **Usuario**: Acceso básico a activos y reportes

### Permisos por Funcionalidad

- `company_config`: Configuración de empresa
- `users`: Gestión de usuarios y roles
- `notifications`: Configuración de notificaciones
- `system_settings`: Configuración del sistema
- `backup`: Gestión de backups
- `all`: Acceso completo (Super Admin)

## 🚨 Solución de Problemas

### Error de Permisos

Si recibes errores de permisos:

1. Verifica que el usuario tenga un rol asignado
2. Confirma que el rol tenga los permisos necesarios
3. Revisa las políticas RLS en Supabase

### Error de Conexión

Si hay problemas de conexión:

1. Verifica las variables de entorno
2. Confirma que Supabase esté funcionando
3. Revisa la consola del navegador para errores

### Usuarios No Aparecen

Si los usuarios no aparecen en la lista:

1. Verifica que existan en `auth.users`
2. Confirma que tengan registros en `system_users`
3. Revisa que las políticas RLS permitan acceso

## 📚 Archivos del Sistema

- `SYSTEM_CONFIG.sql`: Scripts de base de datos
- `src/components/Configuracion.jsx`: Componente principal
- `src/components/UserManagement.jsx`: Gestión de usuarios
- `src/App.jsx`: Rutas de la aplicación

## 🔄 Actualizaciones Futuras

### Funcionalidades Planificadas

- [ ] Gestión avanzada de roles con permisos granulares
- [ ] Sistema de auditoría de cambios de configuración
- [ ] Integración con servicios de notificación externos
- [ ] Sistema de backups automáticos programados
- [ ] Exportación de configuraciones en múltiples formatos
- [ ] Plantillas de configuración predefinidas

### Mejoras de Seguridad

- [ ] Autenticación de dos factores para configuraciones críticas
- [ ] Logs de auditoría más detallados
- [ ] Encriptación de configuraciones sensibles
- [ ] Validación de datos más estricta

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación:

1. Revisa este README
2. Consulta la documentación de Supabase
3. Revisa los logs de la consola del navegador
4. Verifica las políticas de seguridad en Supabase

---

**Nota**: Este sistema requiere permisos de administrador en Supabase para funcionar correctamente. Asegúrate de tener los permisos necesarios antes de la implementación.
