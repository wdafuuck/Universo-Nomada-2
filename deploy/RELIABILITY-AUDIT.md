# Auditoría de confiabilidad — Universo Nómada
# Actualizar tras cada incidente (junto a .cursor/rules/prod-reliability.mdc)

## Severidad P0 (sitio caído / dinero)

| Hallazgo | Estado | Mitigación |
|----------|--------|------------|
| Deploy que `stop` + borra `.next` antes de build listo | Mitigado | `remote-build.sh` atómico: backup, build vivo, restart corto, rollback |
| Deploys solapados | Mitigado | `flock` en `/var/lock/universo-nomada-build.lock` |
| `server.js` ausente → 502 | Mitigado | start.sh restaura `.bak`; watchdog cada 1 min |
| Health no monitoreado | Mitigado | cron watchdog + `/api/health` (DB) |
| Uploads 404 en standalone | Mitigado | Caddy `file_server` + symlink |

## Severidad P1 (degradación / bugs latentes)

| Hallazgo | Riesgo | Acción recomendada |
|----------|--------|--------------------|
| Sin swap en droplet (~3.8 GiB) | OOM kill bajo pico | Agregar 1–2 GiB swapfile |
| `prisma db push` en deploy | Drift vs migraciones | Preferir `prisma migrate deploy` en prod |
| Cron secrets en crontab en claro | Filtración vía backup logs | Usar env file + wrapper script |
| Restart=always sin backoff largo | Restart storm | Ya RestartSec=5; OK |
| CI sin smoke post-deploy | Deploy “verde” con sitio roto | Healthcheck ya en remote-build; agregar a GH Actions |

## Severidad P2 (calidad / deuda)

| Hallazgo | Nota |
|----------|------|
| TypeScript `ignoreBuildErrors` | Evitar ampliar (regla proyecto) |
| Muchos untracked en git | Riesgo de deploy incompleto vía CI parcial |
| Observabilidad | Solo journal + health; considerar uptime externo (UptimeRobot / Better Stack) ping a `/api/health` |

## Proceso vivo (cómo se alimenta)

1. Cada caída/incidente → entrada en bitácora de `prod-reliability.mdc`
2. Si el patrón es nuevo → cambiar script en `deploy/` + redeploy ops
3. Antes de `npm run deploy` → health; después → health + home 200
4. Watchdog log: `/var/log/universo-nomada-watchdog.log`
