# Auditoría de confiabilidad e interna — Universo Nómada
# Actualizado: 2026-07-26

## Infra aplicada hoy

| Acción | Estado |
|--------|--------|
| Swap 2 GiB (`/swapfile`, swappiness=10) | Hecho en droplet |
| `standalone.bak` válido | Hecho |
| Watchdog home + mi-cuenta | Hecho |
| Cron sin secretos en crontab (`run-cron-job.sh`) | Hecho |
| Build staging + snapshot pre-build | Hecho en repo |

## P0 — corregidos en código (pendiente deploy app)

| Hallazgo | Fix |
|----------|-----|
| Seed `LeadPayment` desde `amountDue` en transferencias pendientes | No seedear `pendiente_*` / `nuevo` / carrito no confirmado |
| Preview admin mutaba pagos | member-preview solo lectura |
| IDOR `/api/reservations/[id]` | Token HMAC `t=`, sesión dueño/admin, o email |
| Status huérfanos `pagado` / `pendiente_pago` (MP/TBK) | Mapeados a `reservado` / `pendiente_transferencia` + ledger |
| `/api/payments/create` monto arbitrario | Valida lead + monto vs reserva + email |
| SumUp sin ledger de abono | `addLeadPayment` al confirmar |
| Admin cookie sin revalidar rol | `requireAdmin` chequea DB |

## P1 — deuda restante

| Hallazgo | Riesgo | Acción |
|----------|--------|--------|
| Schema sqlite local vs postgres prod | Drift | Schema prod dedicado o override; migrar a `migrate deploy` |
| Naming `amountDue` ambiguo | Bugs humanos | Comentario en schema; UI usa “abonado” |
| LeadsAdmin edita `amountDue` sin `LeadPayment` | Desync | Unificar con TripPaymentEditor |
| MP webhook sin firma | Spoofing | Validar secret/firma MP |
| `next build` aún escribe live antes del staging | Ventana corta | Snapshot + bak + start restore (mitigado) |

## P2 — higiene

| Hallazgo | Acción |
|----------|--------|
| Archivos basura `-p` / `3001` | Eliminados |
| rsync de `skills/` `upload/` `download/` | Excluidos del deploy |
| `package.json` start con bun vs node prod | Documentar: solo local |
| CSP `unsafe-eval` | No tocar sin probar analytics/admin |
| Uptime externo | Recomendado: Better Stack / UptimeRobot a `/` y `/api/health` |

## Checks

- `tsc --noEmit` / `eslint src --quiet` — limpios al momento de la auditoría
- Smoke prod: home 200, mi-cuenta 200, health ok

## Proceso

1. Un solo `npm run deploy` a la vez (preflight bloquea solapes)
2. Tras deploy: smoke público automático
3. Watchdog cada minuto; log `/var/log/universo-nomada-watchdog.log`
4. Incidente 2026-07-26: restart mid-build sin bak → corregido con bak + validación de páginas
