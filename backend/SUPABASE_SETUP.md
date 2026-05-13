# Guía de Migración a Supabase

## Pasos a seguir:

### 1. Crear cuenta en Supabase
- Ve a https://supabase.com
- Registrate o inicia sesión

### 2. Crear un nuevo proyecto
- Click en "New Project"
- Nombre: `Komo` (o el que prefieras)
- Database Password: elige una segura
- Region: elige la más cercana a ti
- Click "Create new project"

### 3. Crear las tablas
- Una vez que el proyecto esté listo, ve a "SQL Editor"
- Click en "New Query"
- Copia TODO el contenido de `supabase_setup.sql`
- Pégalo en el editor
- Click "Run"

### 4. Obtener credenciales
- Ve a "Project Settings" (esquina inferior izquierda)
- Click en "API"
- Copia la `Project URL` y la `anon key` (la primera)

### 5. Configurar variables de entorno
- En la carpeta `backend/`, copia `.env.example` como `.env`
- Reemplaza los valores:
  ```
  SUPABASE_URL=https://tu-proyecto.supabase.co
  SUPABASE_KEY=tu-api-key-aqui
  ```

### 6. Instalar dependencias
```bash
cd backend
pip install -r requirements.txt
```

### 7. Probar la conexión
- Inicia el servidor normalmente
- Debería conectarse sin errores a Supabase

## Archivos creados/modificados:
- ✅ `servidor_core.py` - Migrado a Supabase
- ✅ `requirements.txt` - Añadidas dependencias (supabase, python-dotenv)
- ✅ `.env.example` - Template de configuración
- ✅ `supabase_setup.sql` - Script de tablas para Supabase

## Importante:
- No subas el archivo `.env` a GitHub (ya está en .gitignore)
- La migración mantiene la misma API, nada cambia desde el frontend
- Los datos anteriores en SQLite no se migran automáticamente (si necesitas los datos, avísame)
