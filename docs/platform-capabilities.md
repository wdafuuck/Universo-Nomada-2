# Capacidades de plataforma (interno)

Inventario de producto para valoración / white-label futuro. La **experiencia pública de Universo Nómada no se modifica** por estos módulos.

## Activo hoy

- Catálogo de tours / grupales / blog / hero / promociones
- Checkout 5 pasos, descuentos, ruleta, carrito abandonado
- Pagos: SumUp (exento) + elección SumUp/MP (afecto)
- Mi cuenta, documentos de viaje, beneficios, pasaporte
- Admin embebido (14+ tabs) + Tráfico/SEO + GA4 opcional
- Multi-idioma UI (ES/EN/FR/ZH/PT); CMS solo override en ES
- Tenant default + `tenantId` en modelos clave
- RBAC staff: admin / ops / finance / marketing
- Feature flags (`src/lib/feature-flags.ts`)
- Conciliación de pagos (admin)
- Stub channel manager (`src/lib/channel-manager.ts`)
- Reglas overbooking/cupos (`src/lib/overbooking.ts`)
- Observabilidad opcional Sentry (`SENTRY_DSN`)
- Export CSV leads, notas/timeline de lead, abandonos UI

## Preparado / stub

- Multi-tenant completo (segunda agencia, branding por dominio)
- Channel manager live / GDS
- Marketplace split payments
- Billing SaaS de la plataforma

## Fuera de código

- ARR / clientes pagos
- SOC2 / auditorías PCI formales
- Contratos legales de transferencia
