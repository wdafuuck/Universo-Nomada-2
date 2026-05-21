import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceso · Universo Nomada",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo?.startsWith("/")
    ? params.redirectTo
    : "/admin";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-[#0F2440] to-navy px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-navy px-6 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/images/logo-un.png"
              alt="Universo Nomada"
              width={56}
              height={56}
              className="rounded-full ring-2 ring-teal/40"
            />
          </div>
          <h1 className="text-2xl font-bold">Panel de administración</h1>
          <p className="text-white/60 text-sm mt-1">
            Acceso exclusivo del equipo Universo Nomada
          </p>
        </div>
        <div className="p-6">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
