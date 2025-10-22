# Deploy de Edge Functions (Supabase) para Windows PowerShell

param(
  [string]$ProjectRef = "",
  [string]$SupabaseUrl = "",
  [string]$ServiceRoleKey = ""
)

Write-Host "🚀 Despliegue de Edge Functions" -ForegroundColor Green

function Assert-Cli($name, $check) {
  try {
    & $check | Out-Null
    Write-Host "✅ $name encontrado" -ForegroundColor Green
  } catch {
    Write-Host "❌ $name no encontrado. Instálalo antes de continuar." -ForegroundColor Red
    exit 1
  }
}

Assert-Cli "Node.js" { node --version }
Assert-Cli "npm" { npm --version }
Assert-Cli "Supabase CLI" { supabase --version }

# Validar parámetros o variables de entorno
if (-not $ProjectRef) { $ProjectRef = $env:SUPABASE_REF }
if (-not $ProjectRef) {
  Write-Host "❌ Falta Project Ref. Pasa -ProjectRef o define SUPABASE_REF" -ForegroundColor Red
  exit 1
}

if (-not $SupabaseUrl) { $SupabaseUrl = $env:SUPABASE_URL }
if (-not $ServiceRoleKey) { $ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY }

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
  Write-Host "⚠️  SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no provistos. Se necesitarán como secrets remotos." -ForegroundColor Yellow
}

Push-Location (Join-Path $PSScriptRoot "..")
try {
  # Login si hace falta (no interactivo si ya hay sesión)
  Write-Host "🔐 Verificando sesión Supabase CLI..." -ForegroundColor Cyan
  supabase projects list | Out-Null

  # Setear variables para funciones (secrets)
  if ($SupabaseUrl) {
    Write-Host "🔧 Seteando secret SUPABASE_URL" -ForegroundColor Cyan
    supabase secrets set SUPABASE_URL=$SupabaseUrl --project-ref $ProjectRef | Out-Null
  }
  if ($ServiceRoleKey) {
    Write-Host "🔧 Seteando secret SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$ServiceRoleKey --project-ref $ProjectRef | Out-Null
  }

  # Desplegar funciones
  Write-Host "📤 Desplegando create-user" -ForegroundColor Cyan
  supabase functions deploy create-user --project-ref $ProjectRef | Out-Null
  Write-Host "📤 Desplegando delete-user" -ForegroundColor Cyan
  supabase functions deploy delete-user --project-ref $ProjectRef | Out-Null
  Write-Host "📤 Desplegando update-user-password" -ForegroundColor Cyan
  supabase functions deploy update-user-password --project-ref $ProjectRef | Out-Null

  Write-Host "🎉 Despliegue completado" -ForegroundColor Green
} catch {
  Write-Host "❌ Error en el despliegue: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
} finally {
  Pop-Location
}


