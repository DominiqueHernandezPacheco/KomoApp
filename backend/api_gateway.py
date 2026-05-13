from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import Pyro5.api
import os
import time

app = FastAPI(title="Komo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# ── Lógica de Conexión Automática ─────────────────────────────────────────────
def obtener_uri_auto():
    """Busca el archivo pyro_uri.txt generado por servidor_core.py"""
    archivo_uri = "pyro_uri.txt"
    # Reintenta durante 10 segundos por si el core tarda en arrancar
    for _ in range(10):
        if os.path.exists(archivo_uri):
            with open(archivo_uri, "r") as f:
                uri = f.read().strip()
                print(f"✅ Conectado al Core mediante URI: {uri}")
                return uri
        time.sleep(1)
    return None

# Intentamos obtener la URI al arrancar la app
URI_PYRO = obtener_uri_auto()

# ── Modelos ───────────────────────────────────────────────────────────────────
class UsuarioRegistro(BaseModel):
    nombre: str; email: str; password: str; rol: str; direccion: str = ""; telefono: str = ""

class UsuarioLogin(BaseModel):
    email: str; password: str

class Oferta(BaseModel):
    restaurante_id: int; descripcion: str; info_detallada: str
    precio: float; cantidad: int; categoria: str; alergenos: str

class Reserva(BaseModel):
    usuario_id: int; oferta_id: int

class ActualizacionEstado(BaseModel):
    nuevo_estado: str

class Donacion(BaseModel):
    albergue_id: int; restaurante_id: int; descripcion: str; cantidad: int

# ── Helper para Proxy ─────────────────────────────────────────────────────────
def get_core_proxy():
    """Retorna el proxy de Pyro5 asegurándose de que la URI exista"""
    global URI_PYRO
    if not URI_PYRO:
        URI_PYRO = obtener_uri_auto()
    
    if not URI_PYRO:
        raise HTTPException(status_code=503, detail="El servidor lógico (Core) no está disponible")
    
    return Pyro5.api.Proxy(URI_PYRO)

# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/api/auth/registro")
def registrar_usuario(usuario: UsuarioRegistro):
    with get_core_proxy() as s:
        resp = s.registrar_usuario(usuario.nombre, usuario.email, usuario.password, usuario.rol, usuario.direccion, usuario.telefono)
        if resp["status"] == "error": raise HTTPException(400, resp.get("mensaje", "Error"))
        return resp

@app.post("/api/auth/login")
def iniciar_sesion(credenciales: UsuarioLogin):
    with get_core_proxy() as s:
        resp = s.login(credenciales.email, credenciales.password)
        if resp["status"] == "error": raise HTTPException(401, resp.get("mensaje", "Error"))
        return resp

# ── Ofertas ───────────────────────────────────────────────────────────────────
@app.get("/api/ofertas")
def obtener_ofertas():
    with get_core_proxy() as s:
        return {"ofertas": s.obtener_ofertas_activas()}

@app.post("/api/ofertas")
def publicar_oferta(oferta: Oferta):
    with get_core_proxy() as s:
        return {"mensaje": s.publicar_oferta(oferta.restaurante_id, oferta.descripcion, oferta.info_detallada, oferta.precio, oferta.cantidad, oferta.categoria, oferta.alergenos)}

# ── Reservas ──────────────────────────────────────────────────────────────────
@app.post("/api/reservas")
def reservar(reserva: Reserva):
    with get_core_proxy() as s:
        resp = s.reservar_paquete(reserva.usuario_id, reserva.oferta_id)
        if resp["status"] == "error": raise HTTPException(400, resp.get("mensaje", "Error"))
        return resp

@app.get("/api/pedidos/cliente/{usuario_id}")
def pedidos_cliente(usuario_id: int):
    with get_core_proxy() as s:
        return {"pedidos": s.obtener_pedidos_cliente(usuario_id)}

@app.get("/api/pedidos/vendedor/{restaurante_id}")
def dashboard_vendedor(restaurante_id: int):
    with get_core_proxy() as s:
        return s.obtener_dashboard_vendedor(restaurante_id)

@app.put("/api/pedidos/{pedido_id}/estado")
def actualizar_estado(pedido_id: int, body: ActualizacionEstado):
    with get_core_proxy() as s:
        resp = s.actualizar_estado_pedido(pedido_id, body.nuevo_estado)
        if resp["status"] == "error": raise HTTPException(400, resp.get("mensaje", "Error"))
        return resp

# ── Donaciones ────────────────────────────────────────────────────────────────
@app.get("/api/albergues")
def listar_albergues():
    with get_core_proxy() as s:
        return {"albergues": s.listar_albergues()}

@app.post("/api/donaciones")
def registrar_donacion(donacion: Donacion):
    with get_core_proxy() as s:
        resp = s.registrar_donacion(donacion.albergue_id, donacion.restaurante_id, donacion.descripcion, donacion.cantidad)
        if resp["status"] == "error": raise HTTPException(400, resp.get("mensaje", "Error"))
        return resp

@app.get("/api/donaciones/albergue/{albergue_id}")
def donaciones_albergue(albergue_id: int):
    with get_core_proxy() as s:
        return {"donaciones": s.obtener_donaciones_albergue(albergue_id)}

@app.get("/api/donaciones/restaurante/{restaurante_id}")
def donaciones_restaurante(restaurante_id: int):
    with get_core_proxy() as s:
        return {"donaciones": s.obtener_donaciones_restaurante(restaurante_id)}

@app.put("/api/donaciones/{donacion_id}/confirmar")
def confirmar_donacion(donacion_id: int):
    with get_core_proxy() as s:
        resp = s.confirmar_donacion(donacion_id)
        if resp["status"] == "error": raise HTTPException(400, resp.get("mensaje", "Error"))
        return resp