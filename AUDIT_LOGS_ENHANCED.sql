-- =====================================================
-- SISTEMA DE LOGS DE AUDITORÍA MEJORADO
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- Crear función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION log_configuration_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    details TEXT;
BEGIN
    -- Determinar el tipo de acción
    IF TG_OP = 'INSERT' THEN
        action_type := 'creado';
        details := 'Nuevo registro creado en ' || TG_TABLE_NAME;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'actualizado';
        details := 'Registro actualizado en ' || TG_TABLE_NAME;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'eliminado';
        details := 'Registro eliminado de ' || TG_TABLE_NAME;
    END IF;

    -- Insertar log
    INSERT INTO system_logs (
        user_id,
        action,
        details,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        COALESCE(NEW.id, OLD.id), -- Usar el ID del registro modificado
        action_type,
        details,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
        current_setting('request.headers', true)::jsonb->>'user-agent'
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para tablas importantes
CREATE TRIGGER log_company_config_changes
    AFTER INSERT OR UPDATE OR DELETE ON company_config
    FOR EACH ROW EXECUTE FUNCTION log_configuration_changes();

CREATE TRIGGER log_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION log_configuration_changes();

CREATE TRIGGER log_system_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON system_users
    FOR EACH ROW EXECUTE FUNCTION log_configuration_changes();

CREATE TRIGGER log_system_settings_changes
    AFTER INSERT OR UPDATE OR DELETE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION log_configuration_changes();

CREATE TRIGGER log_notification_config_changes
    AFTER INSERT OR UPDATE OR DELETE ON notification_config
    FOR EACH ROW EXECUTE FUNCTION log_configuration_changes();

-- Función para obtener estadísticas de auditoría
CREATE OR REPLACE FUNCTION get_audit_statistics(
    start_date TIMESTAMP DEFAULT NULL,
    end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    total_changes BIGINT,
    users_active BIGINT,
    most_active_user TEXT,
    most_changed_table TEXT,
    changes_by_action JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_changes,
        COUNT(DISTINCT user_id) as users_active,
        (
            SELECT email 
            FROM auth.users 
            WHERE id = (
                SELECT user_id 
                FROM system_logs 
                WHERE (start_date IS NULL OR created_at >= start_date)
                AND (end_date IS NULL OR created_at <= end_date)
                GROUP BY user_id 
                ORDER BY COUNT(*) DESC 
                LIMIT 1
            )
        ) as most_active_user,
        (
            SELECT table_name 
            FROM system_logs 
            WHERE (start_date IS NULL OR created_at >= start_date)
            AND (end_date IS NULL OR created_at <= end_date)
            GROUP BY table_name 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_changed_table,
        (
            SELECT jsonb_object_agg(action, count)
            FROM (
                SELECT action, COUNT(*) as count
                FROM system_logs 
                WHERE (start_date IS NULL OR created_at >= start_date)
                AND (end_date IS NULL OR created_at <= end_date)
                GROUP BY action
            ) action_counts
        ) as changes_by_action
    FROM system_logs
    WHERE (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar logs antiguos (mantener solo últimos 90 días)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log la limpieza
    INSERT INTO system_logs (
        user_id,
        action,
        details,
        table_name
    ) VALUES (
        NULL, -- Sistema automático
        'limpieza_automatica',
        'Limpieza automática de logs antiguos: ' || deleted_count || ' registros eliminados',
        'system_logs'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Crear vista para logs con información de usuario
CREATE OR REPLACE VIEW audit_logs_with_user AS
SELECT 
    sl.*,
    au.email as user_email,
    au.user_metadata->>'full_name' as user_full_name,
    su.first_name,
    su.last_name,
    ur.name as role_name
FROM system_logs sl
LEFT JOIN auth.users au ON sl.user_id = au.id
LEFT JOIN system_users su ON sl.user_id = su.id
LEFT JOIN user_roles ur ON su.role_id = ur.id
ORDER BY sl.created_at DESC;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_table_name ON system_logs(table_name);

-- Insertar datos de ejemplo para testing (opcional)
INSERT INTO system_logs (user_id, action, details, table_name) VALUES
(NULL, 'sistema_iniciado', 'Sistema de logs de auditoría configurado correctamente', 'system_logs')
ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON FUNCTION log_configuration_changes() IS 'Función trigger para registrar cambios automáticamente en el sistema';
COMMENT ON FUNCTION get_audit_statistics(TIMESTAMP, TIMESTAMP) IS 'Función para obtener estadísticas de auditoría en un rango de fechas';
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Función para limpiar logs antiguos automáticamente';
COMMENT ON VIEW audit_logs_with_user IS 'Vista que combina logs de auditoría con información de usuario';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que los triggers estén creados
SELECT '🔧 Triggers de auditoría creados:' as status;
SELECT 
    schemaname, 
    tablename, 
    triggername, 
    tgtype::text as trigger_type
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE triggername LIKE '%log_%changes%'
ORDER BY tablename;

-- Verificar que las funciones estén creadas
SELECT '📊 Funciones de auditoría creadas:' as status;
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('log_configuration_changes', 'get_audit_statistics', 'cleanup_old_audit_logs')
ORDER BY routine_name;

-- Verificar que los índices estén creados
SELECT '📈 Índices de auditoría creados:' as status;
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE '%system_logs%'
ORDER BY indexname;
