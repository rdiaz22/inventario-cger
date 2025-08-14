# 🗄️ Sistema de Mantenimiento Automático de Base de Datos

## 📋 Descripción

Este sistema mantiene activa tu base de datos de Supabase ejecutando consultas automáticas cada 12 horas, evitando que se ponga en pausa por inactividad.

## 🚀 Características

- ✅ **Ejecución automática cada 12 horas** (00:00 y 12:00 UTC)
- ✅ **Consulta simple y eficiente** a la tabla `company_config`
- ✅ **Logs automáticos** de cada ejecución
- ✅ **Notificaciones** de éxito/error
- ✅ **Ejecución manual** desde GitHub
- ✅ **Monitoreo** del tiempo de respuesta

## 📁 Archivos del Sistema

```
scripts/
├── keep-alive.js          # Script principal de mantenimiento
├── test-connection.js     # Script de prueba de conexión
└── package.json           # Dependencias del script

.github/workflows/
└── keep-database-alive.yml # Workflow de GitHub Actions

docs/
└── DATABASE_KEEP_ALIVE.md  # Esta documentación
```

## ⚙️ Configuración

### 1. Instalar Dependencias

```bash
cd scripts
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### 3. Probar Conexión

```bash
cd scripts
npm run test-connection
```

Si todo está bien, verás:
```
✅ Conexión exitosa!
🎉 ¡Todo está funcionando correctamente!
```

## 🔧 Configuración de GitHub Actions

### 1. Configurar Secrets

Ve a tu repositorio en GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. Agrega estos secrets:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase

### 2. Activar el Workflow

El workflow se activará automáticamente una vez que:
- Los secrets estén configurados
- El código esté en la rama principal
- GitHub Actions esté habilitado en tu repositorio

## 📅 Programación

El sistema se ejecuta automáticamente:

- **Cada 12 horas**: 00:00 y 12:00 UTC
- **Manual**: Puedes ejecutarlo manualmente desde GitHub Actions
- **Logs**: Cada ejecución se registra en la consola y opcionalmente en la base de datos

## 🔍 Monitoreo

### Verificar Ejecuciones

1. Ve a tu repositorio en GitHub
2. **Actions** → **Keep Database Alive**
3. Revisa el historial de ejecuciones

### Logs de Ejecución

Cada ejecución muestra:
```
🚀 Iniciando mantenimiento de base de datos: 2024-01-15T12:00:00.000Z
✅ Base de datos mantenida exitosamente
📊 Consulta completada en: 245ms
🕐 Hora de finalización: 2024-01-15T12:00:00.245Z
```

## 🛠️ Solución de Problemas

### Error: Variables de entorno no configuradas

```bash
❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas
```

**Solución**: Verifica que el archivo `.env` exista y contenga las variables correctas.

### Error: Conexión fallida

```bash
❌ Error de conexión: [mensaje de error]
```

**Soluciones**:
1. Verifica las credenciales de Supabase
2. Asegúrate de que la base de datos esté activa
3. Verifica que la tabla `company_config` exista
4. Revisa las políticas RLS (Row Level Security)

### Error: Tabla no existe

```bash
ℹ️ No se pudo registrar en logs (tabla no existe)
```

**Solución**: Esto no es crítico. El script funciona sin la tabla de logs.

## 🔒 Seguridad

- ✅ Solo usa la clave anónima de Supabase
- ✅ No expone credenciales en el código
- ✅ Las variables se configuran como secrets de GitHub
- ✅ Consultas de solo lectura (SELECT)

## 📊 Personalización

### Cambiar Frecuencia

Edita `.github/workflows/keep-database-alive.yml`:

```yaml
schedule:
  # Cada 6 horas
  - cron: '0 */6 * * *'
  
  # Diario a las 8:00 AM UTC
  - cron: '0 8 * * *'
```

### Cambiar Consulta

Edita `scripts/keep-alive.js`:

```javascript
// Ejemplo: consultar otra tabla
const { data, error } = await supabase
  .from('assets')
  .select('id')
  .limit(1)
```

### Agregar Notificaciones

Puedes integrar con:
- Slack
- Discord
- Email
- Webhooks personalizados

## 🎯 Beneficios

1. **Base de datos siempre activa** - No más pausas por inactividad
2. **Cero intervención manual** - Totalmente automático
3. **Monitoreo completo** - Logs y notificaciones
4. **Gratis** - Usa GitHub Actions sin costo
5. **Confiable** - Ejecución programada garantizada

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de GitHub Actions
2. Ejecuta `npm run test-connection` localmente
3. Verifica la configuración de secrets
4. Revisa el estado de Supabase

---

**¡Tu base de datos nunca más se pondrá en pausa! 🎉**
