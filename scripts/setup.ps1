# Script de configuración para Windows PowerShell
# Sistema de Mantenimiento de Base de Datos

Write-Host "🚀 Configurando Sistema de Mantenimiento de Base de Datos" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Por favor instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar si npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: npm no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar archivo .env
if (-not (Test-Path "../.env")) {
    Write-Host "⚠️  Advertencia: Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "Crea un archivo .env en la raíz del proyecto con:" -ForegroundColor Yellow
    Write-Host "VITE_SUPABASE_URL=https://tu-proyecto.supabase.co" -ForegroundColor Cyan
    Write-Host "VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "¿Quieres continuar sin el archivo .env? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "❌ Configuración cancelada" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
}

# Instalar dependencias
Write-Host ""
Write-Host "📦 Instalando dependencias..." -ForegroundColor Blue
try {
    npm install
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

# Probar conexión
Write-Host ""
Write-Host "🔍 Probando conexión a Supabase..." -ForegroundColor Blue
try {
    npm run test-connection
    Write-Host ""
    Write-Host "🎉 ¡Configuración completada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Configura los secrets en GitHub Actions:" -ForegroundColor White
    Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor White
    Write-Host "   - VITE_SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host "2. Haz commit y push de los cambios" -ForegroundColor White
    Write-Host "3. El workflow se ejecutará automáticamente cada 12 horas" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Para más información, consulta: docs/DATABASE_KEEP_ALIVE.md" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Error en la prueba de conexión" -ForegroundColor Red
    Write-Host "Revisa la configuración y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}
