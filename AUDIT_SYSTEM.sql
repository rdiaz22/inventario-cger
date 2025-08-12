-- Script para crear el sistema de auditorías en Supabase
-- Ejecutar este SQL en el SQL Editor de Supabase

-- Tabla principal de auditorías
CREATE TABLE IF NOT EXISTS audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Progreso', 'Completada', 'Cancelada')),
    auditor_id UUID REFERENCES auth.users(id),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de listas de verificación para auditorías
CREATE TABLE IF NOT EXISTS audit_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de elementos de verificación
CREATE TABLE IF NOT EXISTS audit_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID REFERENCES audit_checklists(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de resultados de auditoría por activo
CREATE TABLE IF NOT EXISTS audit_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    checklist_item_id UUID REFERENCES audit_checklist_items(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado', 'Observación')),
    notes TEXT,
    auditor_id UUID REFERENCES auth.users(id),
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de hallazgos de auditoría
CREATE TABLE IF NOT EXISTS audit_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    severity VARCHAR(50) DEFAULT 'Baja' CHECK (severity IN ('Baja', 'Media', 'Alta', 'Crítica')),
    description TEXT NOT NULL,
    recommendation TEXT,
    status VARCHAR(50) DEFAULT 'Abierto' CHECK (status IN ('Abierto', 'En Progreso', 'Resuelto', 'Cerrado')),
    assigned_to VARCHAR(255),
    due_date DATE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_auditor_id ON audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audits_dates ON audits(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_audit_results_audit_id ON audit_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_asset_id ON audit_results(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_audit_id ON audit_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para updated_at
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_findings_updated_at BEFORE UPDATE ON audit_findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo para categorías de auditoría
INSERT INTO categories (name) VALUES 
    ('Auditoría de Inventario'),
    ('Auditoría de Seguridad'),
    ('Auditoría de Mantenimiento'),
    ('Auditoría de Cumplimiento')
ON CONFLICT (name) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE audits IS 'Tabla principal de auditorías del sistema';
COMMENT ON TABLE audit_checklists IS 'Listas de verificación para cada auditoría';
COMMENT ON TABLE audit_checklist_items IS 'Elementos individuales de verificación';
COMMENT ON TABLE audit_results IS 'Resultados de verificación por activo y elemento';
COMMENT ON TABLE audit_findings IS 'Hallazgos y observaciones de auditoría';
