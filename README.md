# 🥘 Komo — Kitchen Overstock Meal Outlet

Plataforma PWA para rescate de excedentes alimentarios de comercios locales.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Python · FastAPI · Pyro5 |
| Base de datos | SQLite (local) → Supabase (producción) |
| PWA | vite-plugin-pwa |
| Hosting | Vercel (frontend) + Render/Railway (backend) |

---

## Cómo levantar en local (desarrollo)

### 1. Backend

```bash
cd backend

# Instalar dependencias
pip install fastapi uvicorn Pyro5

# Terminal A — levantar el servidor de objetos Pyro5
python servidor_core.py
# → Copia la URI que imprime, por ejemplo:
#   🔗 URI: PYRO:obj_abc123@localhost:59709

# Editar api_gateway.py y pegar la URI en la variable URI_PYRO
# URI_PYRO = "PYRO:obj_abc123@localhost:59709"

# Terminal B — levantar el API gateway
uvicorn api_gateway:app --reload --port 8000
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend   # (o la carpeta komo-app si es la nueva)

npm install
npm run dev
# → http://localhost:5173
```

---

## Usuarios de prueba (base de datos incluida)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| domipachecodominique27@hotmail.com | (la que usaron al registrarse) | restaurante |
| jordiyael27@gmail.com | (ídem) | cliente |
| jenn@hotmail.com | (ídem) | restaurante |
| Paul@gmail.com | (ídem) | cliente |

Para crear un usuario **albergue**, registrarse desde la app seleccionando ese rol.

---

## Módulos implementados

- [x] Autenticación con roles (cliente / restaurante / albergue)
- [x] Feed de ofertas con filtros y búsqueda
- [x] Reserva de productos con código QR
- [x] Cancelación automática de pedidos (30 min)
- [x] Dashboard del vendedor (métricas + gestión de pedidos)
- [x] Publicación de excedentes (formulario con preview)
- [x] Módulo de donaciones para albergues
- [x] Confirmación de recepción de donaciones
- [x] PWA instalable (manifest + service worker)
- [ ] Geolocalización / mapa (próximo)
- [ ] Migración a Supabase + despliegue Vercel (próximo)

---

## Estructura del proyecto

```
Pyro-Project/
├── backend/
│   ├── servidor_core.py   # Lógica de negocio (Pyro5)
│   ├── api_gateway.py     # API REST (FastAPI)
│   └── app_mermas.db      # SQLite con datos de prueba
│
└── frontend/  (o komo-app/)
    ├── src/
    │   ├── api/           # Capa de llamadas al backend
    │   ├── context/       # AuthContext (sesión global)
    │   ├── components/    # BottomNav, CardOferta
    │   ├── pages/         # FeedPage, VendedorPage, etc.
    │   └── types/         # Tipos TypeScript compartidos
    └── vite.config.ts     # Config Vite + PWA + proxy
```
