#!/usr/bin/env bash
echo "==================================================="
echo "  Noborup Full-Stack E-Commerce - Auto Launcher"
echo "  Kedargonj Bazar, Mujibnagar, Meherpur"
echo "==================================================="

if ! command -v node &> /dev/null; then
  echo "[ERROR] Node.js is not installed. Download from https://nodejs.org"
  exit 1
fi

if [ ! -f "node_modules/.bin/vite" ]; then
  echo "[1/2] Preparing project packages..."
  npm install
fi

echo "[2/2] Starting Noborup server at http://localhost:3000 ..."
npm run dev
