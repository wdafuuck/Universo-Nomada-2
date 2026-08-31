"use client";

import { useEffect, useState } from "react";
import { Mail, LogIn, User, Phone, CreditCard, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getReferralCode } from "@/components/ReferralCapture";
import { AntiBotFields } from "@/components/AntiBotFields";
import { useAntiBot } from "@/hooks/useAntiBot";

type AuthStep = "main" | "code";
type AuthFlow = "register" | "login";

type Props = {
  onSuccess: (user: { id: string; email: string; name: string | null; role: string }) => void;
  compact?: boolean;
  /** Prefill login y forzar flujo de inicio de sesión */
  initialEmail?: string;
  initialFlow?: AuthFlow;
};

export function MemberAuthPanel({ onSuccess, compact, initialEmail, initialFlow = "login" }: Props) {
  const [step, setStep] = useState<AuthStep>("main");
  const [flow, setFlow] = useState<AuthFlow>(initialFlow);
  const [activeEmail, setActiveEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [register, setRegister] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rut: "",
  });

  const [loginEmail, setLoginEmail] = useState(initialEmail ?? "");

  const [pendingName, setPendingName] = useState("");
  const antiBot = useAntiBot();

  useEffect(() => {
    if (initialEmail) {
      setLoginEmail(initialEmail);
      setFlow("login");
      setStep("main");
    }
  }, [initialEmail]);

  useEffect(() => {
    if (initialFlow) setFlow(initialFlow);
  }, [initialFlow]);

  const sendOtp = async (email: string) => {
    const botErr = antiBot.validate();
    if (botErr) throw new Error(botErr);

    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...antiBot.payload() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error");
    if (data.devCode) {
      toast.message(`Modo desarrollo: código ${data.devCode}`);
    }
    return data;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = register.nombre.trim();
    const email = register.email.trim().toLowerCase();
    const telefono = register.telefono.trim();
    const rut = register.rut.trim();

    if (!nombre || !email || !telefono || !rut) {
      toast.error("Completa todos los campos para registrarte");
      return;
    }

    const botErr = antiBot.validate();
    if (botErr) {
      toast.error(botErr);
      return;
    }

    setLoading(true);
    try {
      const leadRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          mensaje: `[CUENTA NÓMADA] RUT/Pasaporte: ${rut}`,
          source: "registro-cuenta",
          referralCode: getReferralCode(),
          ...antiBot.payload(),
        }),
      });
      if (!leadRes.ok) {
        const err = await leadRes.json();
        throw new Error(err.error || "Error al registrar");
      }

      await sendOtp(email);
      setPendingName(nombre);
      setActiveEmail(email);
      setFlow("register");
      setStep("code");
      toast.success("Te enviamos un código a tu correo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Ingresa tu correo");
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email);
      setActiveEmail(email);
      setFlow("login");
      setPendingName("");
      setStep("code");
      toast.success("Te enviamos un código a tu correo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: activeEmail,
          code,
          name: flow === "register" ? pendingName : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast.success(flow === "register" ? "¡Cuenta creada!" : "¡Bienvenido!");
      onSuccess(data.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "code") {
    return (
      <div className={compact ? "w-full" : "w-full max-w-md"}>
        <form onSubmit={handleVerify} className="space-y-5">
          <button
            type="button"
            onClick={() => { setStep("main"); setCode(""); }}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <p className="text-sm text-slate-600">
            {flow === "register" ? "Confirma tu registro" : "Inicia sesión"} — código enviado a{" "}
            <strong>{activeEmail}</strong>
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-11 w-11 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-teal hover:bg-teal-dark text-navy font-bold rounded-full h-12"
          >
            {loading ? "Verificando..." : "Confirmar"}
          </Button>
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await sendOtp(activeEmail);
                toast.success("Código reenviado");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              } finally {
                setLoading(false);
              }
            }}
            className="w-full text-sm text-teal font-semibold hover:underline"
          >
            Reenviar código
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? "w-full" : "w-full max-w-md"}`}>
      <AntiBotFields
        honeypot={antiBot.honeypot}
        onHoneypotChange={antiBot.setHoneypot}
        onTurnstileToken={antiBot.setTurnstileToken}
        onTurnstileExpire={() => antiBot.setTurnstileToken("")}
      />
      {/* Registrarse */}
      <form onSubmit={handleRegister} className="space-y-3 rounded-2xl border border-teal/20 bg-teal/5 p-4 relative z-10">
        <div>
          <h4 className="font-bold text-slate-900">Registrarse</h4>
          <p className="text-xs text-slate-500 mt-0.5">Para viajeros — usa cualquier correo personal (no el del admin)</p>
        </div>
        <Field label="Nombre completo" icon={User}>
          <Input
            value={register.nombre}
            onChange={(e) => setRegister({ ...register, nombre: e.target.value })}
            placeholder="María González"
            className="rounded-xl h-10 bg-white pl-10"
            autoComplete="name"
          />
        </Field>
        <Field label="Correo electrónico" icon={Mail}>
          <Input
            type="email"
            value={register.email}
            onChange={(e) => setRegister({ ...register, email: e.target.value })}
            placeholder="tu@email.com"
            className="rounded-xl h-10 bg-white pl-10"
            autoComplete="email"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono" icon={Phone}>
            <Input
              type="tel"
              value={register.telefono}
              onChange={(e) => setRegister({ ...register, telefono: e.target.value })}
              placeholder="+56 9 ..."
              className="rounded-xl h-10 bg-white pl-10"
              autoComplete="tel"
            />
          </Field>
          <Field label="RUT / Pasaporte" icon={CreditCard}>
            <Input
              value={register.rut}
              onChange={(e) => setRegister({ ...register, rut: e.target.value })}
              placeholder="12.345.678-9"
              className="rounded-xl h-10 bg-white pl-10"
              autoComplete="off"
            />
          </Field>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-teal hover:bg-teal-dark text-navy font-bold rounded-full h-11"
        >
          {loading ? "Enviando..." : "Registrarse"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-semibold">Iniciar sesión</span>
        </div>
      </div>

      {/* Iniciar sesión */}
      <form onSubmit={handleLoginRequest} className="space-y-3">
        <p className="text-sm text-slate-500">Si ya tienes cuenta, ingresa tu correo y te enviamos un código.</p>
        <Field label="Correo electrónico" icon={Mail}>
          <Input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="tu@email.com"
            className="rounded-xl h-11 pl-10"
            autoComplete="email"
          />
        </Field>
        <Button
          type="submit"
          variant="outline"
          disabled={loading}
          className="w-full rounded-full h-11 border-slate-300 font-semibold"
        >
          {loading ? "Enviando..." : "Enviar código de verificación"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
        {children}
      </div>
    </div>
  );
}
