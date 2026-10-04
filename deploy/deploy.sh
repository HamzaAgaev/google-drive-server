#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

host="${DEPLOY_HOST:?DEPLOY_HOST is not set}"

sbt -batch assembly
scp target/google-drive-server.jar "$host:/tmp/google-drive-server.jar"
ssh -t "$host" 'sudo mv /tmp/google-drive-server.jar /opt/google-drive-server/app.jar && sudo systemctl restart google-drive-server'
