#!/bin/bash
# Borrar URI antigua si existe
rm -f pyro_uri.txt

# Iniciar el servidor core en segundo plano
python servidor_core.py &

# Esperar a que el archivo de la URI sea creado
while [ ! -f pyro_uri.txt ]; do
  sleep 1
done

# Iniciar la API con Uvicorn
uvicorn api_gateway:app --host 0.0.0.0 --port 8000