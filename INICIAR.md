# 🚀 Cómo levantar Komo en local

## Backend (2 terminales)

```bash
cd backend
pip install -r requirements.txt

# Terminal 1 — servidor de objetos Pyro5
python servidor_core.py
# → Copia la URI que aparece: PYRO:obj_XXXX@localhost:XXXXX

# Edita api_gateway.py línea 14 y pega tu URI:
# URI_PYRO = "PYRO:obj_XXXX@localhost:XXXXX"

# Terminal 2 — API REST
uvicorn api_gateway:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
# → Abre http://localhost:5173
```

## Usuarios de prueba

| Email | Rol |
|-------|-----|
| domipachecodominique27@hotmail.com | restaurante |
| jordiyael27@gmail.com | cliente |
| Paul@gmail.com | cliente |

> Para crear un **albergue**: regístrate desde la app eligiendo ese rol.
