import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas')
  process.exit(1)
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function keepDatabaseAlive() {
  const startTime = new Date()
  console.log(`🚀 Iniciando mantenimiento de base de datos: ${startTime.toISOString()}`)
  
  try {
    // Hacer una consulta simple para mantener activa la base de datos
    const { data, error } = await supabase
      .from('company_config')
      .select('company_name')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    const endTime = new Date()
    const durationMs = endTime - startTime
    
    console.log(`✅ Base de datos mantenida exitosamente`)
    console.log(`📊 Consulta completada en: ${durationMs}ms`)
    console.log(`🕐 Hora de finalización: ${endTime.toISOString()}`)
    
    // También podemos hacer un log en la base de datos si quieres
    try {
      await supabase
        .from('system_logs')
        .insert([{
          action: 'database_keep_alive',
          details: `Mantenimiento automático ejecutado exitosamente en ${durationMs}ms`,
          status: 'success',
          timestamp: new Date().toISOString()
        }])
    } catch (logError) {
      // Si no existe la tabla de logs, no es crítico
      console.log('ℹ️ No se pudo registrar en logs (tabla no existe)')
    }
    
  } catch (error) {
    const endTime = new Date()
    const duration = endTime - startTime
    
    console.error(`❌ Error al mantener la base de datos: ${error.message}`)
    console.error(`🕐 Hora del error: ${endTime.toISOString()}`)
    console.error(`⏱️ Duración: ${duration.getTime()}ms`)
    
    // Intentar registrar el error
    try {
      await supabase
        .from('system_logs')
        .insert([{
          action: 'database_keep_alive',
          details: `Error: ${error.message}`,
          status: 'error',
          timestamp: new Date().toISOString()
        }])
    } catch (logError) {
      console.error('❌ No se pudo registrar el error en logs')
    }
    
    process.exit(1)
  }
}

// Ejecutar la función
keepDatabaseAlive()
