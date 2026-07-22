"use client";

import { useEffect, useState } from "react";
import { Gift, Mail, Phone, User, X, Copy, Check, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getReferralCode } from "@/components/ReferralCapture";
import {
  saveWelcomeDiscountCode,
  WELCOME_DISCOUNT_CODE,
  WELCOME_DISCOUNT_PERCENT,
} from "@/lib/welcome-discount";

type Phase = "form" | "otp" | "success" | "already";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (user: { id: string; email: string; name: string | null; role: string }) => void;
  onRequestLogin: (email?: string) => void;
};

export function WelcomeRegisterPopup({ isOpen, onClose, onRegistered, onRequestLogin }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [otp, setOtp] = useState("");
  const [discountCode, setDiscountCode] = useState(WELCOME_DISCOUNT_CODE);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) return;
    const t = window.setTimeout(() => {
      setPhase("form");
      setForm({ nombre: "", email: "", telefono: "" });
      setOtp("");
      setDiscountCode(WELCOME_DISCOUNT_CODE);
      setLoading(false);
      setCopied(false);
      setError("");
    }, 200);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Correo ya registrado → mensaje y abrir login automáticamente
  useEffect(() => {
    if (phase !== "already") return;
    const email = form.email.trim().toLowerCase();
    toast.message("Usuario ya registrado. Ingresa a tu cuenta.");
    const t = window.setTimeout(() => {
      onClose();
      onRequestLogin(email);
    }, 1200);
    return () => window.clearTimeout(t);
    // Solo al pasar a "already" (evitar re-disparos por identidad de callbacks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const nombre = form.nombre.trim();
    const email = form.email.trim().toLowerCase();
    const telefono = form.telefono.trim();
    if (!nombre || !email || !telefono) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/welcome-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          referralCode: getReferralCode(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        message?: string;
        discountCode?: string;
        needsOtp?: boolean;
        devCode?: string;
      };

      if (res.status === 409 || data.code === "already_registered") {
        setPhase("already");
        return;
      }
      if (!res.ok) {
        setError(data.error || "No se pudo registrar");
        return;
      }

      if (data.discountCode) setDiscountCode(data.discountCode);
      if (data.devCode) toast.message(`Tu código de verificación: ${data.devCode}`);
      toast.success(data.message || "Te enviamos un código a tu correo");
      setPhase("otp");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          code: otp,
          name: form.nombre.trim(),
          welcomeDiscount: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: { id: string; email: string; name: string | null; role: string };
        discountCode?: string;
      };
      if (!res.ok || !data.user) {
        // Si el correo ya tenía cuenta y el OTP era de un intento viejo
        if (res.status === 409 || data.error?.toLowerCase().includes("registrado")) {
          setPhase("already");
          return;
        }
        setError(data.error || "Código incorrecto");
        return;
      }

      const codeToSave = data.discountCode || discountCode || WELCOME_DISCOUNT_CODE;
      setDiscountCode(codeToSave);
      saveWelcomeDiscountCode(codeToSave);
      setPhase("success");
      try {
        onRegistered(data.user);
      } catch {
        // no bloquear la pantalla del código
      }
      toast.success(`Tu código de descuento: ${codeToSave}`);
    } catch {
      setError("Error al verificar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback móvil: seleccionar texto
      toast.message(`Tu código: ${discountCode}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      onClick={phase === "success" ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-navy via-navy to-teal-900 px-5 py-5 text-white sm:px-6 sm:py-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/25">
              <Gift className="h-5 w-5 text-teal-200" />
            </div>
            <div>
              <h2 id="welcome-popup-title" className="text-lg font-bold leading-tight sm:text-xl">
                {phase === "success"
                  ? "¡Listo! Este es tu descuento"
                  : `Regístrate y obtén un ${WELCOME_DISCOUNT_PERCENT}% de descuento`}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {phase === "success"
                  ? "Guárdalo o cópialo para usarlo en el carrito"
                  : "Únete a la familia Nómada y úsalo en tu próxima reserva"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {phase === "form" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 h-12 text-base"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 h-12 text-base"
                  type="email"
                  placeholder="Correo"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 h-12 text-base"
                  type="tel"
                  placeholder="Teléfono / WhatsApp"
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  autoComplete="tel"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="h-12 w-full bg-teal text-base hover:bg-teal/90" disabled={loading}>
                {loading ? "Enviando…" : "Registrarme y obtener 5%"}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Ahora no
              </button>
            </form>
          )}

          {phase === "otp" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <button
                type="button"
                onClick={() => setPhase("form")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver
              </button>
              <p className="text-sm text-muted-foreground">
                Escribe el código de 6 dígitos que enviamos a{" "}
                <span className="font-medium break-all text-foreground">{form.email.trim()}</span>
              </p>
              <div className="flex justify-center overflow-x-auto py-1">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && <p className="text-center text-sm text-red-600">{error}</p>}
              <Button type="submit" className="h-12 w-full bg-teal text-base hover:bg-teal/90" disabled={loading}>
                {loading ? "Verificando…" : "Confirmar registro"}
              </Button>
            </form>
          )}

          {phase === "success" && (
            <div className="space-y-4 text-center">
              <p className="text-base font-semibold text-emerald-700">¡Ya estás en la familia Nómada!</p>
              <p className="text-sm text-muted-foreground">
                Tu código de {WELCOME_DISCOUNT_PERCENT}% de descuento:
              </p>
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-5">
                <p
                  className="select-all font-mono text-3xl font-black tracking-[0.2em] text-emerald-900 sm:text-4xl"
                  aria-label={`Código de descuento ${discountCode}`}
                >
                  {discountCode}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full border-emerald-300 text-base text-emerald-900"
                onClick={copyCode}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" /> Copiar código
                  </>
                )}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                También te lo enviamos al correo. Válido una sola vez por persona; úsalo en el
                carrito al reservar.
              </p>
              <Button type="button" className="h-12 w-full bg-navy text-base hover:bg-navy/90" onClick={onClose}>
                Empezar a explorar
              </Button>
            </div>
          )}

          {phase === "already" && (
            <div className="space-y-4 text-center">
              <p className="text-base font-semibold text-navy">Usuario ya registrado</p>
              <p className="text-sm text-muted-foreground">
                Ingresa a tu cuenta para ver tus beneficios. Te redirigimos al inicio de sesión…
              </p>
              <Button
                type="button"
                className="h-12 w-full bg-teal text-base hover:bg-teal/90"
                onClick={() => {
                  const email = form.email.trim().toLowerCase();
                  onClose();
                  onRequestLogin(email);
                }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
