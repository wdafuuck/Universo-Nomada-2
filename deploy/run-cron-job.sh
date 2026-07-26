#!/usr/bin/env bash
# Ejecuta un cron de la app leyendo CRON_SECRET desde .env (no desde crontab).
# Uso: deploy/run-cron-job.sh abandoned-cart
#      deploy/run-cron-job.sh cleanup-trip-documents
set -euo pipefail

JOB="${1:-}"
if [[ -z "$JOB" ]]; then
  echo "uso: $0 <abandoned-cart|cleanup-trip-documents>" >&2
  exit 1
fi

ROOT=/var/www/universo-nomada
cd "$ROOT"

set -a
# shellcheck disable=SC1091
source ./.env
set +a

SECRET="${CRON_SECRET:-}"
if [[ -z "$SECRET" ]]; then
  echo "CRON_SECRET ausente en .env" >&2
  exit 1
fi

case "$JOB" in
  abandoned-cart)
    PATH_JOB=/api/cron/abandoned-cart
    ;;
  cleanup-trip-documents)
    PATH_JOB=/api/cron/cleanup-trip-documents
    ;;
  *)
    echo "job desconocido: $JOB" >&2
    exit 1
    ;;
esac

curl -fsS -H "Authorization: Bearer ${SECRET}" "https://universonomada.cl${PATH_JOB}"
