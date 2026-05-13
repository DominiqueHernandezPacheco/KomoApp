import Pyro5.api
import hashlib
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta

# Cargar variables de entorno
load_dotenv()

@Pyro5.api.expose
class MarketplaceMermas(object):
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise Exception("Variables de entorno SUPABASE_URL y SUPABASE_KEY no configuradas")
        
        self.db: Client = create_client(self.supabase_url, self.supabase_key)

    def _limpiar_expirados(self):
        limite_segundos = 1800
        ahora = datetime.now()
        limite_tiempo = ahora - timedelta(seconds=limite_segundos)
        
        try:
            response = self.db.table("pedidos").select("id, oferta_id").eq("estado", "Pendiente").lt("fecha_creacion", limite_tiempo.isoformat()).execute()
            expirados = response.data
            
            for ped in expirados:
                self.db.table("ofertas").update({"cantidad_disponible": self.db.table("ofertas").select("cantidad_disponible").eq("id_oferta", ped["oferta_id"]).execute().data[0]["cantidad_disponible"] + 1}).eq("id_oferta", ped["oferta_id"]).execute()
                self.db.table("pedidos").update({"estado": "Cancelado"}).eq("id", ped["id"]).execute()
        except Exception as e:
            print(f"Error limpiando pedidos expirados: {e}")

    # --- AUTENTICACIÓN ---
    def registrar_usuario(self, nombre, email, password, rol, direccion="", telefono=""):
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        try:
            response = self.db.table("usuarios").insert({
                "nombre": nombre,
                "email": email,
                "password": hashed_password,
                "rol": rol,
                "direccion": direccion,
                "telefono": telefono
            }).execute()
            return {"status": "exito"}
        except Exception as e:
            if "unique" in str(e).lower():
                return {"status": "error", "mensaje": "Correo ya registrado."}
            return {"status": "error", "mensaje": str(e)}

    def login(self, email, password):
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        try:
            response = self.db.table("usuarios").select("id, nombre, rol, direccion").eq("email", email).eq("password", hashed_password).execute()
            if response.data:
                usuario = response.data[0]
                return {"status": "exito", "id": usuario["id"], "nombre": usuario["nombre"], "rol": usuario["rol"], "direccion": usuario["direccion"]}
            return {"status": "error", "mensaje": "Credenciales incorrectas."}
        except Exception as e:
            return {"status": "error", "mensaje": str(e)}

    # --- OFERTAS ---
    def publicar_oferta(self, restaurante_id, descripcion, info_detallada, precio, cantidad, categoria, alergenos):
        try:
            self.db.table("ofertas").insert({
                "restaurante_id": restaurante_id,
                "descripcion": descripcion,
                "info_detallada": info_detallada,
                "precio": precio,
                "cantidad_disponible": cantidad,
                "categoria": categoria,
                "alergenos": alergenos,
                "estado": "Activa"
            }).execute()
            return "Oferta publicada."
        except Exception as e:
            return f"Error: {str(e)}"

    def obtener_ofertas_activas(self):
        try:
            self._limpiar_expirados()
            response = self.db.table("ofertas").select(
                "id_oferta, restaurante_id, descripcion, info_detallada, precio, cantidad_disponible, categoria, alergenos"
            ).eq("estado", "Activa").gt("cantidad_disponible", 0).execute()
            
            ofertas = []
            for oferta in response.data:
                user_response = self.db.table("usuarios").select("nombre, direccion, telefono").eq("id", oferta["restaurante_id"]).execute()
                if user_response.data:
                    usuario = user_response.data[0]
                    ofertas.append({
                        "id_oferta": oferta["id_oferta"],
                        "restaurante": usuario["nombre"],
                        "direccion": usuario["direccion"],
                        "telefono": usuario["telefono"],
                        "descripcion": oferta["descripcion"],
                        "info_detallada": oferta["info_detallada"],
                        "precio": oferta["precio"],
                        "cantidad_disponible": oferta["cantidad_disponible"],
                        "categoria": oferta["categoria"],
                        "alergenos": oferta["alergenos"]
                    })
            return ofertas
        except Exception as e:
            print(f"Error en obtener_ofertas_activas: {e}")
            import traceback
            traceback.print_exc()
            return []

    # --- RESERVAS ---
    def reservar_paquete(self, usuario_id, oferta_id):
        try:
            self._limpiar_expirados()
            
            response = self.db.table("ofertas").select("cantidad_disponible").eq("id_oferta", oferta_id).execute()
            if not response.data or response.data[0]["cantidad_disponible"] <= 0:
                return {"status": "error", "mensaje": "Agotado."}
            
            self.db.table("ofertas").update({
                "cantidad_disponible": response.data[0]["cantidad_disponible"] - 1
            }).eq("id_oferta", oferta_id).execute()
            
            codigo_qr = f"RES-{usuario_id}{oferta_id}X"
            self.db.table("pedidos").insert({
                "usuario_id": usuario_id,
                "oferta_id": oferta_id,
                "codigo_recoleccion": codigo_qr,
                "estado": "Pendiente"
            }).execute()
            
            return {"status": "exito", "codigo": codigo_qr}
        except Exception as e:
            return {"status": "error", "mensaje": str(e)}

    def actualizar_estado_pedido(self, pedido_id, nuevo_estado):
        try:
            if nuevo_estado == 'Cancelado':
                response = self.db.table("pedidos").select("oferta_id, estado").eq("id", pedido_id).execute()
                if response.data and response.data[0]["estado"] == 'Pendiente':
                    oferta_response = self.db.table("ofertas").select("cantidad_disponible").eq("id_oferta", response.data[0]["oferta_id"]).execute()
                    if oferta_response.data:
                        self.db.table("ofertas").update({
                            "cantidad_disponible": oferta_response.data[0]["cantidad_disponible"] + 1
                        }).eq("id_oferta", response.data[0]["oferta_id"]).execute()
            
            self.db.table("pedidos").update({"estado": nuevo_estado}).eq("id", pedido_id).execute()
            return {"status": "exito"}
        except Exception as e:
            return {"status": "error", "mensaje": str(e)}

    # --- DASHBOARDS ---
    def obtener_pedidos_cliente(self, usuario_id):
        try:
            self._limpiar_expirados()
            response = self.db.table("pedidos").select(
                "id, codigo_recoleccion, oferta_id, estado, fecha_creacion"
            ).eq("usuario_id", usuario_id).order("id", desc=True).execute()
            
            pedidos = []
            for pedido in response.data:
                oferta_response = self.db.table("ofertas").select("descripcion, precio, categoria, restaurante_id").eq("id_oferta", pedido["oferta_id"]).execute()
                if oferta_response.data:
                    oferta = oferta_response.data[0]
                    user_response = self.db.table("usuarios").select("nombre, direccion").eq("id", oferta["restaurante_id"]).execute()
                    if user_response.data:
                        usuario = user_response.data[0]
                        pedidos.append({
                            "id_pedido": pedido["id"],
                            "codigo": pedido["codigo_recoleccion"],
                            "descripcion": oferta["descripcion"],
                            "precio": oferta["precio"],
                            "restaurante": usuario["nombre"],
                            "direccion": usuario["direccion"],
                            "estado": pedido["estado"],
                            "categoria": oferta["categoria"],
                            "fecha_creacion": pedido["fecha_creacion"]
                        })
            return pedidos
        except Exception as e:
            return {"error": str(e)}

    def obtener_dashboard_vendedor(self, restaurante_id):
        try:
            self._limpiar_expirados()
            
            pedidos_response = self.db.table("pedidos").select("id").execute()
            ofertas_response = self.db.table("ofertas").select("id_oferta, precio").eq("restaurante_id", restaurante_id).execute()
            
            total_paquetes = 0
            total_ventas = 0.0
            
            if ofertas_response.data:
                for oferta in ofertas_response.data:
                    ped_response = self.db.table("pedidos").select("id").eq("oferta_id", oferta["id_oferta"]).neq("estado", "Cancelado").execute()
                    total_paquetes += len(ped_response.data)
                    total_ventas += len(ped_response.data) * oferta["precio"]
            
            metricas = {"paquetes": total_paquetes, "ventas": total_ventas}
            
            ped_details = []
            if ofertas_response.data:
                for oferta in ofertas_response.data:
                    ped_response = self.db.table("pedidos").select("id, codigo_recoleccion, estado").eq("oferta_id", oferta["id_oferta"]).order("id", desc=True).execute()
                    for ped in ped_response.data:
                        user_response = self.db.table("usuarios").select("nombre").eq("id", ped_response.data[0].get("usuario_id")).execute() if "usuario_id" in ped_response.data[0] else None
                        ped_details.append({
                            "id_pedido": ped["id"],
                            "codigo": ped["codigo_recoleccion"],
                            "descripcion": oferta.get("descripcion", ""),
                            "cliente": user_response.data[0]["nombre"] if user_response and user_response.data else "Desconocido",
                            "precio": oferta["precio"],
                            "estado": ped["estado"]
                        })
            
            return {"metricas": metricas, "pedidos": ped_details}
        except Exception as e:
            return {"error": str(e)}

    # --- DONACIONES ---
    def listar_albergues(self):
        """Retorna todos los usuarios con rol albergue para que el restaurante elija a quién donar."""
        try:
            response = self.db.table("usuarios").select("id, nombre, direccion, telefono").eq("rol", "albergue").execute()
            albergues = response.data
            return albergues
        except Exception as e:
            return {"error": str(e)}

    def registrar_donacion(self, albergue_id, restaurante_id, descripcion, cantidad):
        try:
            response = self.db.table("donaciones").insert({
                "albergue_id": albergue_id,
                "restaurante_id": restaurante_id,
                "descripcion": descripcion,
                "cantidad": cantidad,
                "estado": "Pendiente"
            }).execute()
            return {"status": "exito", "id": response.data[0]["id"] if response.data else None}
        except Exception as e:
            return {"status": "error", "mensaje": str(e)}

    # --- DONACIONES (Versión Supabase) ---
    def obtener_donaciones_albergue(self, albergue_id):
        try:
            # Consultamos la tabla donaciones y traemos los nombres de las tablas relacionadas
            response = self.db.table("donaciones").select(
                "*, albergue:usuarios!albergue_id(nombre), restaurante:usuarios!restaurante_id(nombre)"
            ).eq("albergue_id", albergue_id).order("id", desc=True).execute()
            
            # Formateamos la respuesta para que el frontend la entienda
            donaciones = []
            for d in response.data:
                donaciones.append({
                    "id": d["id"],
                    "albergue_id": d["albergue_id"],
                    "albergue_nombre": d["albergue"]["nombre"] if d.get("albergue") else "Desconocido",
                    "restaurante_nombre": d["restaurante"]["nombre"] if d.get("restaurante") else "Desconocido",
                    "descripcion": d["descripcion"],
                    "cantidad": d["cantidad"],
                    "fecha": d["fecha"],
                    "estado": d["estado"]
                })
            return donaciones
        except Exception as e:
            print(f"Error en obtener_donaciones_albergue: {e}")
            return {"error": str(e)}

    def obtener_donaciones_restaurante(self, restaurante_id):
        try:
            response = self.db.table("donaciones").select(
                "*, albergue:usuarios!albergue_id(nombre), restaurante:usuarios!restaurante_id(nombre)"
            ).eq("restaurante_id", restaurante_id).order("id", desc=True).execute()
            
            donaciones = []
            for d in response.data:
                donaciones.append({
                    "id": d["id"],
                    "albergue_id": d["albergue_id"],
                    "albergue_nombre": d["albergue"]["nombre"] if d.get("albergue") else "Desconocido",
                    "restaurante_nombre": d["restaurante"]["nombre"] if d.get("restaurante") else "Desconocido",
                    "descripcion": d["descripcion"],
                    "cantidad": d["cantidad"],
                    "fecha": d["fecha"],
                    "estado": d["estado"]
                })
            return donaciones
        except Exception as e:
            print(f"Error en obtener_donaciones_restaurante: {e}")
            return {"error": str(e)}

    def confirmar_donacion(self, donacion_id):
        try:
            # Actualizamos el estado solo si actualmente es 'Pendiente'
            response = self.db.table("donaciones").update(
                {"estado": "Recibida"}
            ).eq("id", donacion_id).eq("estado", "Pendiente").execute()
            
            if not response.data:
                return {"status": "error", "mensaje": "Donación no encontrada o ya confirmada"}
                
            return {"status": "exito"}
        except Exception as e:
            return {"status": "error", "mensaje": str(e)}

def iniciar_servidor():
    daemon = Pyro5.api.Daemon(host="127.0.0.1", port=9090) # Forzamos puerto 9090
    uri = daemon.register(MercadoKomo, "mercado.komo")
    
    # Guardamos la URI en un archivo para que el Gateway la lea
    with open("pyro_uri.txt", "w") as f:
        f.write(str(uri))
        
    print(f"Servidor Core listo. URI: {uri}")
    daemon.requestLoop()

if __name__ == "__main__":
    iniciar_servidor()