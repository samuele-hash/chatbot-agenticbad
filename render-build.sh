#!/bin/bash
# Build per un unico Web Service: frontend + backend
# Eseguito dalla root del repo su Render

set -e
echo "=== Install frontend ==="
npm install
echo "=== Build frontend ==="
npm run build
echo "=== Copia dist in backend ==="
cp -r dist backend/dist
echo "=== Install backend ==="
cd backend && npm install
