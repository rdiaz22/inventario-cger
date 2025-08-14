#!/bin/bash

echo "🚀 Configurando Sistema de Mantenimiento de Base de Datos"
echo "=================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "Por favor instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Verificar archivo .env
if [ ! -f "../.env" ]; then
    echo "⚠️  Advertencia: Archivo .env no encontrado"
    echo "Crea un archivo .env en la raíz del proyecto con:"
    echo "VITE_SUPABASE_URL=https://tu-proyecto.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui"
    echo ""
    read -p "¿Quieres continuar sin el archivo .env? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuración cancelada"
        exit 1
    fi
else
    echo "✅ Archivo .env encontrado"
fi

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

# Probar conexión
echo ""
echo "🔍 Probando conexión a Supabase..."
npm run test-connection

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡Configuración completada exitosamente!"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Configura los secrets en GitHub Actions:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "2. Haz commit y push de los cambios"
    echo "3. El workflow se ejecutará automáticamente cada 12 horas"
    echo ""
    echo "📚 Para más información, consulta: docs/DATABASE_KEEP_ALIVE.md"
else
    echo ""
    echo "❌ Error en la prueba de conexión"
    echo "Revisa la configuración y vuelve a intentar"
    exit 1
fi
