/** Roles de staff del panel admin (la web pública no cambia). */
export const STAFF_ROLES = ["admin", "ops", "finance", "marketing"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type AdminTabId =
  | "dashboard"
  | "trafico"
  | "portada"
  | "paquetes"
  | "precios"
  | "codigos"
  | "grupales"
  | "contenido"
  | "blog"
  | "anuncios"
  | "noticias"
  | "clientes"
  | "leads"
  | "beneficios"
  | "pasaporte"
  | "abandonos"
  | "plataforma";

const ALL_TABS: AdminTabId[] = [
  "dashboard",
  "trafico",
  "portada",
  "paquetes",
  "precios",
  "codigos",
  "grupales",
  "contenido",
  "blog",
  "anuncios",
  "noticias",
  "clientes",
  "leads",
  "beneficios",
  "pasaporte",
  "abandonos",
  "plataforma",
];

const ROLE_TABS: Record<StaffRole, AdminTabId[]> = {
  admin: ALL_TABS,
  ops: ["dashboard", "trafico", "grupales", "leads", "clientes", "abandonos"],
  finance: ["dashboard", "leads", "codigos", "precios", "abandonos"],
  marketing: [
    "dashboard",
    "trafico",
    "portada",
    "paquetes",
    "contenido",
    "blog",
    "anuncios",
    "beneficios",
    "pasaporte",
  ],
};

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function isFullAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}

export function tabsForRole(role: string | null | undefined): AdminTabId[] {
  if (!isStaffRole(role)) return [];
  return ROLE_TABS[role];
}

export function canAccessTab(role: string | null | undefined, tab: AdminTabId): boolean {
  return tabsForRole(role).includes(tab);
}
