#!/usr/bin/env bash
set -euo pipefail

# start_tunnel.sh
# Este proyecto usa exclusivamente el reenvío de puertos de GitHub Codespaces.
# No se emplean túneles externos ni herramientas como ngrok o localtunnel.

PORT=${1:-3000}

echo "El puerto ${PORT} debe estar reenviado desde GitHub Codespaces."
echo "En la UI de Codespaces usa 'Ports' y expón el puerto ${PORT} como público."
echo "La URL pública resultante tendrá el formato https://*.app.github.dev"
