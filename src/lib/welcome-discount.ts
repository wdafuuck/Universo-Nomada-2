import type { PrismaClient } from "@prisma/client";

/** Código de bienvenida: 5% al registrarse desde el popup. */
export const WELCOME_DISCOUNT_CODE = "NOMAD5";
export const WELCOME_DISCOUNT_PERCENT = 5;
export const WELCOME_CODE_LS_KEY = "un_welcome_discount";

export async function ensureWelcomeDiscountCode(db: PrismaClient): Promise<string> {
  await db.discountCode.upsert({
    where: { code: WELCOME_DISCOUNT_CODE },
    create: {
      code: WELCOME_DISCOUNT_CODE,
      description: "5% de bienvenida por registrarte (1 uso por persona)",
      discountType: "percent",
      discountValue: WELCOME_DISCOUNT_PERCENT,
      active: true,
      oncePerEmail: true,
    },
    update: {
      active: true,
      discountType: "percent",
      discountValue: WELCOME_DISCOUNT_PERCENT,
      description: "5% de bienvenida por registrarte (1 uso por persona)",
      oncePerEmail: true,
    },
  });
  return WELCOME_DISCOUNT_CODE;
}

export function saveWelcomeDiscountCode(code: string = WELCOME_DISCOUNT_CODE): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WELCOME_CODE_LS_KEY, code);
  } catch {
    // ignore
  }
}

export function getStoredWelcomeDiscountCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(WELCOME_CODE_LS_KEY);
    return v?.trim() || null;
  } catch {
    return null;
  }
}
