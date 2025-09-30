## Despliegue de Edge Functions (Supabase)

Requisitos:

- Supabase CLI instalado
- Node.js y npm
- Referencia del proyecto (Project Ref) de Supabase
- Variables/Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 1) Variables de entorno locales (opcional)

En Windows PowerShell:

```powershell
$env:SUPABASE_REF = "your-project-ref"
$env:SUPABASE_URL = "https://xyzcompany.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "service_role_key"
```

### 2) Desplegar automáticamente con script

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-functions.ps1 -ProjectRef $env:SUPABASE_REF -SupabaseUrl $env:SUPABASE_URL -ServiceRoleKey $env:SUPABASE_SERVICE_ROLE_KEY
```

Esto realizará:

- Set de secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Deploy de `create-user` y `delete-user`

### 3) Comandos manuales equivalentes

```powershell
supabase secrets set SUPABASE_URL=$env:SUPABASE_URL --project-ref $env:SUPABASE_REF
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY --project-ref $env:SUPABASE_REF
supabase functions deploy create-user --project-ref $env:SUPABASE_REF
supabase functions deploy delete-user --project-ref $env:SUPABASE_REF
```

### 4) Verificación rápida

Desde el frontend ya se invocan así:

- `supabase.functions.invoke('create-user', { body: {...} })`
- `supabase.functions.invoke('delete-user', { body: { user_id } })`

Asegúrate de tener en `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 5) Notas de base de datos

- Deben existir las tablas `system_users` y `user_roles`
- Debe existir un rol `'user'` en `user_roles` (usado como default)
- El Service Role no está sujeto a RLS, pero mantén políticas consistentes para otros clientes


