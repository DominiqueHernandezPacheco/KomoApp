#!/usr/bin/env python
import sys
import os
from dotenv import load_dotenv

# Cargar variables de entorno PRIMERO
load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from servidor_core import MarketplaceMermas
import Pyro5.api

print("Iniciando servidor Pyro5...")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY: {os.getenv('SUPABASE_KEY')[:20]}..." if os.getenv('SUPABASE_KEY') else "SUPABASE_KEY: None")

try:
    daemon = Pyro5.api.Daemon(port=0)
    obj = MarketplaceMermas()
    uri = daemon.register(obj)
    print(f"✓ Servidor registrado en: {uri}")
    print(f"✓ URI para api_gateway.py: {uri}")
    print("\nServidor escuchando... (presiona CTRL+C para detener)")
    daemon.requestLoop()
except KeyboardInterrupt:
    print("\nServidor detenido")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
