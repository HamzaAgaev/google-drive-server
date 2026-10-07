#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
git pull --ff-only

sbt -batch "assembly; shutdown"
(cd frontend && npm ci && npm run build -- --outDir dist.new --emptyOutDir)

cp target/google-drive-server.jar app.jar.new
mv app.jar.new app.jar
rm -rf frontend/dist
mv frontend/dist.new frontend/dist

sudo systemctl restart google-drive-server
