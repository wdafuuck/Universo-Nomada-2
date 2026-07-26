# Auditoría de confiabilidad — Universo Nómada
# Actualizar tras cada incidente

## Severidad P0 (sitio caído / dinero)

| Hallazgo | Estado | Mitigación |
|----------|--------|------------|
| Deploy que reinicia con standalone incompleto | Mitigado | `standalone_is_valid` + smoke home/mi-cuenta antes de OK |
| Deploys solapados | Mitigado | `flock` + preflight en `deploy-prod.sh` |
| `server.js` / manifests ausentes → 500 | Mitigado | `start.sh` restaura bak; validación de manifests |
| Health OK pero páginas 500 | Mitigado | watchdog chequea home + mi-cuenta; rollback a bak |
| Sin `standalone.bak` | Mitigado | backup atómico pre/post deploy; watchdog recrea bak |
| rsync `--delete` a medias en live | Mitigado | `scripts/build-standalone.sh` con staging + swap |

## Severidad P1 (degradación / bugs latentes)

| Hallazgo | Riesgo | Acción |
|----------|--------|--------|
| Sin swap en droplet (~3.8 GiB) | OOM kill | Agregar 1–2 GiB swapfile |
| `prisma db push` en deploy | Drift vs migraciones | Preferir `migrate deploy` cuando el historial esté alineado |
| Cron secrets en crontab | Filtración | Usar `deploy/run-cron-job.sh` + `.env` |
| Observabilidad | Solo journal | UptimeRobot / Better Stack a `/` y `/api/health` |

## Proceso vivo

1. Antes de `npm run deploy` → no debe haber build en curso
2. Después → smoke público home + mi-cuenta + health
3. Watchdog log: `/var/log/universo-nomada-watchdog.log`
4. Incidente 2026-07-26: restart mid-build sin bak → páginas 500 con health OK
