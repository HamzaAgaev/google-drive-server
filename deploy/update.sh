#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
git pull --ff-only
sbt -batch "assembly; shutdown"
cp target/google-drive-server.jar app.jar.new
mv app.jar.new app.jar
(cd frontend && npm ci && npm run build)
sudo systemctl restart google-drive-server
