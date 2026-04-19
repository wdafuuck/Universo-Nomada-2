"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Heart,
  Shield,
  Clock,
  CreditCard,
  Compass,
  MessageCircle,
  Instagram,
  Facebook,
  ChevronDown,
  Send,
  ArrowDown,
  Globe,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─────────────────── animation helpers ─────────────────── */

function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const dirs = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dirs[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────── data ─────────────────── */

const destinations = [
  {
    name: "Valle del Elqui",
    subtitle: "Chile",
    image: "/images/elqui.png",
    description:
      "Cielos más limpios del mundo, observatorios astronómicos y valles encantadores bajo las estrellas.",
  },
  {
    name: "Atacama",
    subtitle: "Chile",
    image: "/images/atacama.png",
    description:
      "El desierto más árido del planeta con paisajes extraterrestres, géiseres y salares impresionantes.",
  },
  {
    name: "Patagonia",
    subtitle: "Chile",
    image: "/images/patagonia.png",
    description:
      "Torres del Paine, glaciares milenarios y la naturaleza más salvaje del fin del mundo.",
  },
  {
    name: "Machu Picchu",
    subtitle: "Perú",
    image: "/images/machupicchu.png",
    description:
      "La ciudadela inca perdida entre las nubes, un viaje que transforma el alma.",
  },
];

const benefits = [
  {
    icon: Compass,
    title: "Personalización Total",
    description:
      "Cada viaje se diseña a tu medida. Sin paquetes genéricos, solo experiencias únicas creadas para ti.",
  },
  {
    icon: Clock,
    title: "Acompañamiento 24/7",
    description:
      "Estamos contigo antes, durante y después de tu viaje. Asistencia permanente cuando la necesitas.",
  },
  {
    icon: CreditCard,
    title: "Pagos a Plazo",
    description:
      "Cuota tu viaje en cómodas cuotas sin intereses. Tu próxima aventura no tiene que esperar.",
  },
  {
    icon: Heart,
    title: "Experiencias Auténticas",
    description:
      "Conexiones reales con culturas locales. No eres turista, eres un viajero que deja huella.",
  },
];

const testimonials = [
  {
    name: "Carolina Muñoz",
    destination: "Valle del Elqui",
    rating: 5,
    text: "Fue un viaje mágico. Las noches bajo las estrellas en el Elqui fueron algo que nunca olvidaré. Universo Nómada pensó en cada detalle.",
    avatar: "CM",
  },
  {
    name: "Roberto Fuentes",
    destination: "Atacama",
    rating: 5,
    text: "La atención fue impecable de principio a fin. Me sentí acompañado en todo momento y las experiencias fueron increíblemente auténticas.",
    avatar: "RF",
  },
  {
    name: "María José Soto",
    destination: "Patagonia",
    rating: 5,
    text: "Cumplieron con creces mis expectativas. El trekking en Torres del Paine fue el reto más grande y hermoso de mi vida. ¡Volveré!",
    avatar: "MS",
  },
];

const destinoOptions = [
  "Valle del Elqui",
  "Atacama",
  "Patagonia",
  "Machu Picchu",
  "Rapa Nui",
  "Norte Grande",
  "Lagos y Volcanes",
  "Caribe",
  "Europa",
  "Otro destino",
];

/* ─────────────────── page ─────────────────── */

export default function LandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    destino: "",
    mensaje: "",
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar");
      }
      toast.success("¡Cotización enviada con éxito! Te contactaremos pronto.");
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        destino: "",
        mensaje: "",
      });
    } catch {
      toast.error("Hubo un error al enviar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─────── NAV ─────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight">
              Universo{" "}
              <span className="text-primary">Nómada</span>
            </span>
          </div>
          <Button
            onClick={scrollToForm}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-4 sm:px-6 shadow-lg shadow-primary/20"
          >
            Cotiza tu Viaje
          </Button>
        </div>
      </motion.nav>

      {/* ─────── HERO ─────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero.png"
            alt="Paisaje chileno al atardecer"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm text-white/90 text-sm font-medium border border-white/10">
              <Sparkles className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Agencia de viajes en La Serena, Chile
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
          >
            Vive experiencias que{" "}
            <span className="text-accent">dejan huella</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl text-white/85 max-w-2xl mx-auto leading-relaxed"
          >
            Viajes personalizados a destinos auténticos en Chile y el mundo
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold rounded-full px-8 py-6 shadow-2xl shadow-primary/30 transition-transform hover:scale-105"
            >
              Cotiza tu Viaje Gratis
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full px-8 py-6 text-lg font-semibold"
              asChild
            >
              <a
                href="https://wa.me/56912345678?text=Hola!%20Quiero%20cotizar%20un%20viaje"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-16"
          >
            <button
              onClick={scrollToForm}
              className="text-white/60 hover:text-white/90 transition-colors"
              aria-label="Desplazar hacia abajo"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowDown className="h-7 w-7" />
              </motion.div>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─────── TRUST BAR ─────── */}
      <section className="relative -mt-1 bg-secondary text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              { icon: CreditCard, label: "Pagos Flexibles" },
              { icon: Compass, label: "Experiencias a Medida" },
              { icon: Heart, label: "Conexión Local" },
              { icon: Shield, label: "+500 Viajeros Felices" },
            ].map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.1}>
                <div className="flex flex-col items-center gap-2">
                  <item.icon className="h-6 w-6 text-accent" />
                  <span className="text-sm sm:text-base font-semibold">
                    {item.label}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── FEATURED DESTINATIONS ─────── */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">
                Destinos destacados
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Descubre tu próxima aventura
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                Destinos que despiertan los sentidos y nutren el alma. Cada
                lugar tiene una historia esperándote.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, i) => (
              <FadeIn key={dest.name} delay={i * 0.1}>
                <Card className="group overflow-hidden border-border/50 bg-card shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={dest.image}
                      alt={dest.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-white/80 text-xs font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {dest.subtitle}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-1.5">
                      {dest.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {dest.description}
                    </p>
                    <Button
                      onClick={scrollToForm}
                      variant="outline"
                      className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground font-semibold rounded-full transition-colors"
                    >
                      Cotizar
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── WHY CHOOSE US ─────── */}
      <section className="py-16 sm:py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">
                Por qué elegirnos
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Viaja diferente, viaja mejor
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                No vendemos paquetes, creamos experiencias memorables con el
                respaldo y la calidez que mereces.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <FadeIn key={benefit.title} delay={i * 0.1}>
                <Card className="h-full border-border/50 bg-card shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <benefit.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── TESTIMONIALS ─────── */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">
                Testimonios
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Lo que dicen nuestros viajeros
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                Historias reales de personas que confiaron en nosotros y
                vivieron algo extraordinario.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.15}>
                <Card className="h-full border-border/50 bg-card shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star
                          key={si}
                          className="h-4 w-4 fill-accent text-accent"
                        />
                      ))}
                    </div>
                    <p className="text-foreground leading-relaxed mb-6 italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {t.destination}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── LEAD CAPTURE FORM ─────── */}
      <section
        ref={formRef}
        className="py-16 sm:py-24 bg-gradient-to-br from-secondary via-secondary/95 to-forest/90 text-secondary-foreground"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-12">
              <span className="text-accent font-semibold text-sm uppercase tracking-widest">
                Cotización gratuita
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                Comienza a planear tu viaje
              </h2>
              <p className="mt-4 text-white/75 text-lg max-w-xl mx-auto">
                Cuéntanos sobre tu viaje soñado y te enviaremos una propuesta
                personalizada sin compromiso.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border-0">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="nombre"
                        className="text-sm font-semibold text-foreground"
                      >
                        Nombre <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="nombre"
                        placeholder="Tu nombre completo"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        className="rounded-lg border-border/60 focus-visible:ring-primary h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-semibold text-foreground"
                      >
                        Email <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="rounded-lg border-border/60 focus-visible:ring-primary h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="telefono"
                        className="text-sm font-semibold text-foreground"
                      >
                        Teléfono <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="telefono"
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, telefono: e.target.value })
                        }
                        className="rounded-lg border-border/60 focus-visible:ring-primary h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="destino"
                        className="text-sm font-semibold text-foreground"
                      >
                        Destino soñado
                      </label>
                      <Select
                        value={formData.destino}
                        onValueChange={(val) =>
                          setFormData({ ...formData, destino: val })
                        }
                      >
                        <SelectTrigger className="rounded-lg border-border/60 h-11 focus:ring-primary">
                          <SelectValue placeholder="Selecciona un destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinoOptions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="mensaje"
                      className="text-sm font-semibold text-foreground"
                    >
                      Mensaje
                    </label>
                    <Textarea
                      id="mensaje"
                      placeholder="Cuéntanos sobre el viaje que imaginas..."
                      value={formData.mensaje}
                      onChange={(e) =>
                        setFormData({ ...formData, mensaje: e.target.value })
                      }
                      className="rounded-lg border-border/60 focus-visible:ring-primary min-h-[100px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-lg rounded-full h-13 py-3 shadow-lg shadow-secondary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Solicitar Cotización Gratuita
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Tu información es privada y segura. No compartimos tus datos
                    con terceros. Al enviar, aceptas nuestra{" "}
                    <a href="#" className="text-primary hover:underline">
                      Política de Privacidad
                    </a>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* ─────── FOOTER ─────── */}
      <footer className="bg-dark-brown text-white/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-7 w-7 text-primary" />
                <span className="text-lg font-bold text-white tracking-tight">
                  Universo <span className="text-primary">Nómada</span>
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                Agencia de viajes boutique en La Serena, Chile. Creamos
                experiencias personalizadas que transforman la manera de
                viajar.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href="mailto:contacto@universonomada.cl"
                    className="hover:text-white transition-colors"
                  >
                    contacto@universonomada.cl
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href="https://wa.me/56912345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    +56 9 1234 5678
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>La Serena, Chile</span>
                </li>
              </ul>
            </div>

            {/* Destinations */}
            <div>
              <h4 className="text-white font-semibold mb-4">Destinos</h4>
              <ul className="space-y-2 text-sm">
                {destinoOptions.slice(0, 6).map((d) => (
                  <li key={d}>
                    <button
                      onClick={scrollToForm}
                      className="hover:text-white transition-colors"
                    >
                      {d}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-semibold mb-4">Síguenos</h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/universonomada"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-primary hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com/universonomada"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-primary hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/56912345678?text=Hola!%20Quiero%20cotizar%20un%20viaje"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-primary hover:text-white transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-6 space-y-2 text-sm text-white/50">
                <a href="#" className="block hover:text-white transition-colors">
                  Política de Privacidad
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  Términos y Condiciones
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-8 text-center text-sm text-white/40">
            <p>
              &copy; {new Date().getFullYear()} Universo Nómada. Todos los
              derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* ─────── WHATSAPP FLOATING BUTTON ─────── */}
      <motion.a
        href="https://wa.me/56912345678?text=Hola!%20Quiero%20cotizar%20un%20viaje"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 transition-transform"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </motion.a>
    </div>
  );
}
