/**
 * Crea o actualiza el usuario administrador definido en .env
 * Uso: npm run admin:create
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrador";

  if (!email || !password) {
    console.error("❌ Define ADMIN_EMAIL y ADMIN_PASSWORD en tu archivo .env");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ ADMIN_PASSWORD debe tener al menos 8 caracteres");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    create: { email, name, password: hashedPassword, role: "admin" },
    update: { name, password: hashedPassword, role: "admin" },
  });

  console.log("✅ Usuario admin listo:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Nombre: ${user.name}`);
  console.log(`   Rol: ${user.role}`);
  console.log("\n👉 Inicia sesión desde el footer de la web → Acceso administradores");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
