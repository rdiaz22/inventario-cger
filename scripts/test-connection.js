import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Probando conexión a Supabase...')
console.log(`📡 URL: ${supabaseUrl ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`🔑 API Key: ${supabaseAnonKey ? '✅ Configurada' : '❌ No configurada'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Error: Variables de entorno requeridas no están configuradas')
  console.error('Asegúrate de tener un archivo .env con:')
  console.error('VITE_SUPABASE_URL=tu_url_de_supabase')
  console.error('VITE_SUPABASE_ANON_KEY=tu_clave_anonima')
  process.exit(1)
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🚀 Probando conexión...')
    
    // Hacer una consulta simple
    const { data, error } = await supabase
      .from('company_config')
      .select('company_name')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    console.log('✅ Conexión exitosa!')
    console.log(`📊 Datos obtenidos: ${data ? data.length : 0} registros`)
    
    if (data && data.length > 0) {
      console.log(`🏢 Empresa: ${data[0].company_name || 'Sin nombre'}`)
    }
    
    // Probar inserción de log (opcional)
    try {
      const { error: logError } = await supabase
        .from('system_logs')
        .insert([{
          action: 'connection_test',
          details: 'Prueba de conexión exitosa',
          status: 'success',
          timestamp: new Date().toISOString()
        }])
      
      if (logError) {
        console.log('ℹ️ No se pudo insertar log (tabla no existe o sin permisos)')
      } else {
        console.log('📝 Log de prueba insertado correctamente')
      }
    } catch (logError) {
      console.log('ℹ️ No se pudo insertar log (tabla no existe)')
    }
    
    console.log('\n🎉 ¡Todo está funcionando correctamente!')
    console.log('Puedes proceder a configurar el workflow de GitHub Actions')
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message)
    console.error('\n🔧 Posibles soluciones:')
    console.error('1. Verifica que las credenciales sean correctas')
    console.error('2. Asegúrate de que la base de datos esté activa')
    console.error('3. Verifica que la tabla company_config exista')
    console.error('4. Revisa los permisos de RLS (Row Level Security)')
    
    process.exit(1)
  }
}

// Ejecutar la prueba
testConnection()
