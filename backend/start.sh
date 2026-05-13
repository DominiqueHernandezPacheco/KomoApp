#!/bin/bash
python servidor_core.py &
while [ ! -f pyro_uri.txt ]; do
  sleep 1
done
uvicorn api_gateway:app --host 0.0.0.0 --port 8000