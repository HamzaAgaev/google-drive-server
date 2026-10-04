#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

host="${DEPLOY_HOST:?DEPLOY_HOST is not set}"

ssh -t "$host" /opt/google-drive-server/deploy/update.sh
