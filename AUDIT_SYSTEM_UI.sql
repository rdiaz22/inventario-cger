-- Sistema de Auditorías - Estructura de Base de Datos
-- Ejecutar este script en Supabase SQL Editor

-- Tabla principal de auditorías
CREATE TABLE IF NOT EXISTS audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Progreso', 'Completada', 'Cancelada')),
    auditor_id UUID REFERENCES system_users(id),
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

-- Tabla de elementos de las listas de verificación
CREATE TABLE IF NOT EXISTS audit_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID REFERENCES audit_checklists(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de resultados de auditoría
CREATE TABLE IF NOT EXISTS audit_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    checklist_item_id UUID REFERENCES audit_checklist_items(id),
    status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado', 'Observación')),
    notes TEXT,
    checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de hallazgos de auditoría
CREATE TABLE IF NOT EXISTS audit_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    severity VARCHAR(50) DEFAULT 'Media' CHECK (severity IN ('Crítica', 'Alta', 'Media', 'Baja')),
    description TEXT NOT NULL,
    recommendation TEXT,
    status VARCHAR(50) DEFAULT 'Abierto' CHECK (status IN ('Abierto', 'En Progreso', 'Resuelto', 'Cerrado')),
    assigned_to VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_audits_auditor_id ON audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_start_date ON audits(start_date);
CREATE INDEX IF NOT EXISTS idx_audit_checklists_audit_id ON audit_checklists(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_checklist_items_checklist_id ON audit_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_audit_id ON audit_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_asset_id ON audit_results(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_audit_id ON audit_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_asset_id ON audit_findings(asset_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_results_updated_at BEFORE UPDATE ON audit_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_findings_updated_at BEFORE UPDATE ON audit_findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

-- Política para auditorías (todos los usuarios autenticados pueden ver)
CREATE POLICY "Usuarios autenticados pueden ver auditorías" ON audits
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear auditorías" ON audits
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar auditorías" ON audits
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar auditorías" ON audits
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para listas de verificación
CREATE POLICY "Usuarios autenticados pueden ver listas de verificación" ON audit_checklists
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear listas de verificación" ON audit_checklists
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar listas de verificación" ON audit_checklists
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar listas de verificación" ON audit_checklists
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para elementos de listas de verificación
CREATE POLICY "Usuarios autenticados pueden ver elementos de listas" ON audit_checklist_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear elementos de listas" ON audit_checklist_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar elementos de listas" ON audit_checklist_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar elementos de listas" ON audit_checklist_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para resultados de auditoría
CREATE POLICY "Usuarios autenticados pueden ver resultados" ON audit_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear resultados" ON audit_results
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar resultados" ON audit_results
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar resultados" ON audit_results
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para hallazgos de auditoría
CREATE POLICY "Usuarios autenticados pueden ver hallazgos" ON audit_findings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear hallazgos" ON audit_findings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar hallazgos" ON audit_findings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar hallazgos" ON audit_findings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insertar datos de ejemplo (opcional)
INSERT INTO audits (name, description, start_date, status) VALUES
('Auditoría de Seguridad Q1 2024', 'Revisión trimestral de protocolos de seguridad', '2024-01-01', 'Pendiente'),
('Auditoría de Inventario Mensual', 'Verificación mensual del inventario de activos', '2024-01-15', 'En Progreso')
ON CONFLICT DO NOTHING;

-- Mensaje de confirmación
SELECT 'Sistema de Auditorías configurado exitosamente' as mensaje;
