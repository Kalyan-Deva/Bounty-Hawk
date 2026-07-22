#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[+] Starting MongoDB"
sudo docker start bounty-hawk-mongo >/dev/null 2>&1 ||
    sudo docker run -d \
        --name bounty-hawk-mongo \
        --restart unless-stopped \
        -p 127.0.0.1:27017:27017 \
        -v bounty-hawk-mongo-data:/data/db \
        mongo:7.0

echo "[+] Checking MongoDB"
until mongosh \
    "mongodb://127.0.0.1:27017/wapt_db" \
    --quiet \
    --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1
do
    sleep 1
done

echo "[+] Starting Express"
(
    cd "$ROOT_DIR/server"
    node server.js
) &

echo "[+] Starting toolkit"
(
    cd "$ROOT_DIR/toolkit"
    source .venv/bin/activate
    python toolkit-service.py
) &

echo "[+] Starting React"
(
    cd "$ROOT_DIR/client"
    npm start
) &

wait
