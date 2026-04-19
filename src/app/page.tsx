"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Send,
  ArrowDown,
  Globe,
  Sparkles,
  ChevronRight,
  Play,
  Users,
  Award,
  TrendingUp,
  X,
  ChevronLeft,
  ArrowRight,
  Plane,
  Mountain,
  Waves,
  TreePine,
  Palmtree,
  Binoculars,
  type LucideIcon,
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/* ═══════════════════ ANIMATION HELPERS ═══════════════════ */

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
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const dirs = {
    up: { y: 50 },
    down: { y: -50 },
    left: { x: 50 },
    right: { x: -50 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dirs[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ParallaxSection({
  children,
  className = "",
  speed = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * -100]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════ DATA ═══════════════════ */

interface Destination {
  name: string;
  subtitle: string;
  image: string;
  description: string;
  tag: string;
  tagColor: string;
  icon: LucideIcon;
}

const destinations: Destination[] = [
  {
    name: "Rapa Nui",
    subtitle: "Isla de Pascua, Chile",
    image: "/images/rapanui.png",
    description:
      "Misteriosos moais guardians del Pacifico. Vive la cultura ancestral rapanui en medio del oceano mas remoto del planeta.",
    tag: "Cultura & Misterio",
    tagColor: "bg-violet-500/20 text-violet-300",
    icon: Compass,
  },
  {
    name: "San Pedro de Atacama + Uyuni",
    subtitle: "Chile - Bolivia",
    image: "/images/uyuni.png",
    description:
      "Del desierto mas arido al espejo de sal mas grande del mundo. Geisers, lagunas altiplanicas y el Salar de Uyuni.",
    tag: "Expedicion",
    tagColor: "bg-amber-500/20 text-amber-300",
    icon: Mountain,
  },
  {
    name: "Cusco + Machu Picchu",
    subtitle: "Peru",
    image: "/images/cusco.png",
    description:
      "La ciudadela inca entre las nubes. Recorre el Camino Inca, explora Cusco imperial y conecta con la historia viva.",
    tag: "Historia & Trekking",
    tagColor: "bg-emerald-500/20 text-emerald-300",
    icon: Binoculars,
  },
  {
    name: "Turismo Vivencial",
    subtitle: "Chile",
    image: "/images/vivencial.png",
    description:
      "Conecta con comunidades locales, vive sus tradiciones, saborea su cocina y descubre Chile desde adentro.",
    tag: "Autentico",
    tagColor: "bg-orange-500/20 text-orange-300",
    icon: Users,
  },
  {
    name: "Ballenas + Valle del Elqui",
    subtitle: "Chile",
    image: "/images/ballenas.png",
    description:
      "Avistamiento de ballenas en Caleta Chanaral de Aceituno y noches magicas bajo los cielos mas limpios del mundo.",
    tag: "Naturaleza & Astro",
    tagColor: "bg-cyan-500/20 text-cyan-300",
    icon: Waves,
  },
  {
    name: "Santiago + Vinedos",
    subtitle: "Chile",
    image: "/images/vinedos.png",
    description:
      "La vibracion de Santiago entre montanas y los mejores vinos de Chile. City tours, enoturismo y gastronomia de altura.",
    tag: "City & Vino",
    tagColor: "bg-rose-500/20 text-rose-300",
    icon: Palmtree,
  },
  {
    name: "Bolivia Amazonica",
    subtitle: "Pampas del Yacuma + Selva",
    image: "/images/bolivia.png",
    description:
      "Desde las Pampas del Yacuma hasta la selva amazonica. Caimanes, capibaras y la inmensidad verde del continente.",
    tag: "Selva & Wildlife",
    tagColor: "bg-green-500/20 text-green-300",
    icon: TreePine,
  },
  {
    name: "Region de Atacama",
    subtitle: "Chile",
    image: "/images/atacama-new.png",
    description:
      "Valle de la Luna, Lagunas Altiplanicas, Geisers del Tatio y estrellas infinitas en el desierto mas antiguo del planeta.",
    tag: "Desierto & Estrellas",
    tagColor: "bg-yellow-500/20 text-yellow-300",
    icon: Star,
  },
  {
    name: "Valle del Aconcagua",
    subtitle: "Chile",
    image: "/images/aconcagua.png",
    description:
      "Vinedos boutique al pie del techo de America. Montanismo, enoturismo y paisajes que inspiran.",
    tag: "Montana & Vino",
    tagColor: "bg-sky-500/20 text-sky-300",
    icon: Mountain,
  },
  {
    name: "Catedrales de Marmol + Carretera Austral",
    subtitle: "Patagonia, Chile",
    image: "/images/marmol.png",
    description:
      "Cuevas de marmol esculpidas por el agua turquesa y la ruta mas salvaje de Patagonia. Aventura pura en el fin del mundo.",
    tag: "Patagonia Extrema",
    tagColor: "bg-teal-500/20 text-teal-300",
    icon: Waves,
  },
];

const destinoOptions = destinations.map((d) => d.name).concat(["Otro destino"]);

const stats = [
  { number: "500+", label: "Viajeros felices", icon: Users },
  { number: "10+", label: "Destinos unicos", icon: MapPin },
  { number: "24/7", label: "Asistencia", icon: Clock },
  { number: "100%", label: "Personalizable", icon: Sparkles },
];

const benefits = [
  {
    icon: Compass,
    title: "Experiencias a Medida",
    description:
      "Cada viaje se diseña exclusivamente para ti. Sin paquetes genericos, solo experiencias unicas que reflejan tu estilo de viajero.",
  },
  {
    icon: Clock,
    title: "Acompanamiento 24/7",
    description:
      "Estamos contigo antes, durante y despues de tu viaje. Asistencia permanente cuando la necesitas, donde sea que estes.",
  },
  {
    icon: CreditCard,
    title: "Pagos a Plazo",
    description:
      "Cuota tu viaje en comodas cuotas sin intereses. Tu proxima aventura no tiene que esperar, nosotros facilitamos el camino.",
  },
  {
    icon: Heart,
    title: "Conexion Autentica",
    description:
      "Conexiones reales con culturas locales. No eres turista, eres un viajero que deja huella y se transforma con cada destino.",
  },
  {
    icon: Shield,
    title: "Respaldo Total",
    description:
      "Viaja con la tranquilidad de tener todo cubierto. Seguros, logisticas impecables y un equipo dedicado a tu seguridad.",
  },
  {
    icon: Award,
    title: "Mejor Precio Garantizado",
    description:
      "Accede a tarifas exclusivas y promociones que solo Universo Nomada puede ofrecerte. Valor real por tu inversion.",
  },
];

const testimonials = [
  {
    name: "Carolina Munoz",
    destination: "Valle del Elqui",
    rating: 5,
    text: "Fue un viaje magico. Las noches bajo las estrellas en el Elqui fueron algo que nunca olvidare. Universo Nomada penso en cada detalle y se nota el amor por lo que hacen.",
    avatar: "CM",
  },
  {
    name: "Roberto Fuentes",
    destination: "Atacama + Uyuni",
    rating: 5,
    text: "La atencion fue impecable de principio a fin. El Salar de Uyuni fue una experiencia que cambio mi perspectiva del mundo. Me senti acompanado en todo momento.",
    avatar: "RF",
  },
  {
    name: "Maria Jose Soto",
    destination: "Patagonia",
    rating: 5,
    text: "Cumplieron con creces mis expectativas. El trekking fue el reto mas grande y hermoso de mi vida. La organizacion fue perfecta, sin preocupaciones. Volvere!",
    avatar: "MS",
  },
];

/* ═══════════════════ COUNTER ANIMATION ═══════════════════ */

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  const numericTarget = parseInt(target.replace(/[^0-9]/g, ""));

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = numericTarget;
    if (end === 0) return;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / end), 20);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [isInView, numericTarget]);

  const displayValue = target.includes("+") ? `${count}+` : target.includes("%") ? `${count}%` : `${count}${suffix}`;

  if (target === "24/7" || target === "100%") {
    return <span ref={ref}>{isInView ? target : "0"}</span>;
  }

  return <span ref={ref}>{displayValue}</span>;
}

/* ═══════════════════ DESTINATION CAROUSEL ═══════════════════ */

function DestinationCarousel({ onCotizar }: { onCotizar: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalItems = destinations.length;

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const dest = destinations[activeIndex];

  return (
    <div
      className="relative w-full h-[70vh] sm:h-[80vh] rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={dest.name}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={dest.image}
            alt={dest.name}
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-end p-6 sm:p-10 md:p-14 z-10">
        <motion.div
          key={`content-${dest.name}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl"
        >
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${dest.tagColor}`}>
            {dest.tag}
          </span>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            {dest.name}
          </h3>
          <p className="text-white/70 text-sm mb-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {dest.subtitle}
          </p>
          <p className="text-white/80 text-base sm:text-lg mt-3 leading-relaxed mb-6 max-w-md">
            {dest.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onCotizar}
              size="lg"
              className="bg-teal hover:bg-teal-dark text-navy font-bold rounded-full px-8 shadow-xl shadow-teal/30 transition-all hover:scale-105"
            >
              Cotizar Ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full px-8 font-semibold"
              asChild
            >
              <a
                href="https://wa.me/56912345678?text=Hola!%20Quiero%20info%20sobre%20un%20destino"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {destinations.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === activeIndex ? "w-8 bg-teal" : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Destino ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ DESTINATION GRID (DESKTOP) ═══════════════════ */

function DestinationGrid({ onCotizar }: { onCotizar: () => void }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {destinations.map((dest, i) => (
        <motion.div
          key={dest.name}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
          whileHover={{ scale: 1.02, zIndex: 10 }}
          transition={{ duration: 0.3 }}
          onClick={onCotizar}
        >
          <Image
            src={dest.image}
            alt={dest.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />

          {/* Tag */}
          <div className="absolute top-4 left-4">
            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${dest.tagColor}`}>
              {dest.tag}
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <p className="text-white/60 text-xs flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3" />
              {dest.subtitle}
            </p>
            <h3 className="text-white font-bold text-lg sm:text-xl leading-tight mb-2">
              {dest.name}
            </h3>
            <AnimatePresence>
              {hoveredIndex === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-3">
                    {dest.description}
                  </p>
                  <span className="inline-flex items-center text-teal text-sm font-semibold">
                    Cotizar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════ LEAD POPUP ═══════════════════ */

function LeadPopup({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    destino: "",
    mensaje: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success("Cotizacion enviada con exito! Te contactaremos pronto.");
      setFormData({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
      setTimeout(onClose, 1500);
    } catch {
      toast.error("Hubo un error al enviar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-navy px-6 py-8 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-teal/20 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Cotiza tu Viaje</h3>
                  <p className="text-white/60 text-sm">Es gratis y sin compromiso</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="popup-nombre" className="text-sm font-semibold text-navy">
                    Nombre <span className="text-coral">*</span>
                  </label>
                  <Input
                    id="popup-nombre"
                    placeholder="Tu nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="rounded-xl border-slate-200 focus-visible:ring-teal h-11"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="popup-email" className="text-sm font-semibold text-navy">
                    Email <span className="text-coral">*</span>
                  </label>
                  <Input
                    id="popup-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl border-slate-200 focus-visible:ring-teal h-11"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="popup-telefono" className="text-sm font-semibold text-navy">
                    Telefono <span className="text-coral">*</span>
                  </label>
                  <Input
                    id="popup-telefono"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="rounded-xl border-slate-200 focus-visible:ring-teal h-11"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="popup-destino" className="text-sm font-semibold text-navy">
                    Destino sonado
                  </label>
                  <Select
                    value={formData.destino}
                    onValueChange={(val) => setFormData({ ...formData, destino: val })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 h-11 focus:ring-teal">
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

              <div className="space-y-1.5">
                <label htmlFor="popup-mensaje" className="text-sm font-semibold text-navy">
                  Mensaje
                </label>
                <Textarea
                  id="popup-mensaje"
                  placeholder="Cuentanos sobre el viaje que imaginas..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  className="rounded-xl border-slate-200 focus-visible:ring-teal min-h-[80px] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full bg-teal hover:bg-teal-dark text-navy font-bold text-base rounded-full h-12 shadow-lg shadow-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Solicitar Cotizacion Gratuita
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-slate-400">
                Tu informacion es privada y segura. No compartimos tus datos.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════ TESTIMONIAL CAROUSEL ═══════════════════ */

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const t = testimonials[current];

  return (
    <div className="max-w-3xl mx-auto text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={t.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-1 mb-6">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber text-amber" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl md:text-3xl text-white/90 leading-relaxed font-light italic mb-8">
            &ldquo;{t.text}&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/20 text-teal font-bold">
              {t.avatar}
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">{t.name}</p>
              <p className="text-white/50 text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t.destination}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === current ? "w-8 bg-teal" : "w-2 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Testimonio ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function LandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    destino: "",
    mensaje: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto popup after 15s
  useEffect(() => {
    const timer = setTimeout(() => setIsPopupOpen(true), 15000);
    return () => clearTimeout(timer);
  }, []);

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
      toast.success("Cotizacion enviada con exito! Te contactaremos pronto.");
      setFormData({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
    } catch {
      toast.error("Hubo un error al enviar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy">
      {/* ═══════ NAV ═══════ */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled
            ? "bg-navy/95 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-teal to-amber flex items-center justify-center shadow-lg shadow-teal/30">
              <Globe className="h-5 w-5 text-navy" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-none">
                UNIVERSO
              </span>
              <span className="text-xs sm:text-sm font-bold text-teal tracking-[0.2em] leading-none">
                NOMADA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsPopupOpen(true)}
              size="sm"
              className="bg-teal hover:bg-teal-dark text-navy font-bold rounded-full px-4 sm:px-6 shadow-lg shadow-teal/20 transition-all hover:scale-105 text-xs sm:text-sm"
            >
              Cotiza tu Viaje
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-new.png"
            alt="Paisaje Patagonia Chile"
            fill
            className="object-cover"
            priority
            quality={95}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/40 to-navy" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/60 via-transparent to-transparent" />
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-teal/5 rounded-full blur-3xl float-animation" />
        <div className="absolute bottom-1/3 left-1/5 w-48 h-48 bg-amber/5 rounded-full blur-3xl float-animation" style={{ animationDelay: "1s" }} />

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full glass">
              <Sparkles className="h-4 w-4 text-amber" />
              <span className="text-white/80 text-sm font-medium">Experiencias que transforman</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight mb-2">
              UNIVERSO
            </h1>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight gradient-text">
              NOMADA
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Vive viajes que dejan huella. Destinos autenticos en Chile y Sudamerica, disenados solo para ti.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => setIsPopupOpen(true)}
              size="lg"
              className="bg-teal hover:bg-teal-dark text-navy text-lg font-bold rounded-full px-10 py-7 shadow-2xl shadow-teal/30 transition-all hover:scale-105"
            >
              Cotiza tu Viaje Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/5 backdrop-blur-sm border-white/15 text-white hover:bg-white/10 hover:text-white rounded-full px-8 py-7 text-lg font-semibold"
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

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-16 sm:mt-20"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-white/30"
            >
              <span className="text-xs uppercase tracking-widest">Descubre</span>
              <ArrowDown className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="relative -mt-1 bg-navy-light border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="text-center group">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal group-hover:bg-teal group-hover:text-navy transition-all duration-300">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white mb-1">
                    <AnimatedCounter target={stat.number} />
                  </div>
                  <div className="text-sm text-white/50 font-medium">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DESTINATIONS CAROUSEL ═══════ */}
      <section className="py-16 sm:py-24 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-teal font-semibold text-sm uppercase tracking-[0.2em]">
                Destinos
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Explora lo imposible
              </h2>
              <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
                Cada destino es una puerta a lo extraordinario. Descubre experiencias que solo Universo Nomada puede ofrecer.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <DestinationCarousel onCotizar={() => setIsPopupOpen(true)} />
          </FadeIn>
        </div>
      </section>

      {/* ═══════ DESTINATIONS GRID ═══════ */}
      <section className="py-16 sm:py-24 bg-navy-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-amber font-semibold text-sm uppercase tracking-[0.2em]">
                Todos los destinos
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Tu proxima aventura
              </h2>
              <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
                Desde el desierto mas arido hasta la selva amazonica. Tu viaje sonado esta aqui.
              </p>
            </div>
          </FadeIn>

          <DestinationGrid onCotizar={() => setIsPopupOpen(true)} />
        </div>
      </section>

      {/* ═══════ WHY CHOOSE US ═══════ */}
      <section className="py-16 sm:py-24 bg-navy relative overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber/3 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-teal font-semibold text-sm uppercase tracking-[0.2em]">
                Por que elegirnos
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Viaja diferente
              </h2>
              <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
                No vendemos paquetes, creamos experiencias memorables con el respaldo que mereces.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
            {benefits.map((benefit) => (
              <StaggerItem key={benefit.title}>
                <Card className="h-full border-white/5 bg-navy-light/80 hover:bg-white/5 shadow-none hover:shadow-xl hover:shadow-teal/5 transition-all duration-500 rounded-2xl group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal group-hover:bg-teal group-hover:text-navy transition-all duration-300">
                      <benefit.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-16 sm:py-24 bg-navy-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,201,167,0.05)_0%,_transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-amber font-semibold text-sm uppercase tracking-[0.2em]">
                Testimonios
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Historias que inspiran
              </h2>
            </div>
          </FadeIn>

          <TestimonialCarousel />
        </div>
      </section>

      {/* ═══════ CTA BANNER ═══════ */}
      <section className="py-16 sm:py-20 bg-navy relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/elqui-new.png"
            alt="Valle del Elqui estrellas"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Tu proximo viaje comienza aqui
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Dejanos disenar la experiencia que mereces. Cotizacion gratuita y sin compromiso.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setIsPopupOpen(true)}
                size="lg"
                className="bg-teal hover:bg-teal-dark text-navy font-bold rounded-full px-10 py-7 text-lg shadow-2xl shadow-teal/30 transition-all hover:scale-105"
              >
                Cotiza Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/5 border-white/15 text-white hover:bg-white/10 rounded-full px-8 py-7 text-lg font-semibold"
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
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════ LEAD CAPTURE FORM ═══════ */}
      <section
        ref={formRef}
        className="py-16 sm:py-24 bg-navy-light relative"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-12">
              <span className="text-teal font-semibold text-sm uppercase tracking-[0.2em]">
                Cotizacion gratuita
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Comienza a planear
              </h2>
              <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
                Cuentanos sobre tu viaje sonado y te enviaremos una propuesta personalizada sin compromiso.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5 shadow-2xl rounded-3xl">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="nombre"
                        className="text-sm font-semibold text-white/80"
                      >
                        Nombre <span className="text-coral">*</span>
                      </label>
                      <Input
                        id="nombre"
                        placeholder="Tu nombre completo"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-semibold text-white/80"
                      >
                        Email <span className="text-coral">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="telefono"
                        className="text-sm font-semibold text-white/80"
                      >
                        Telefono <span className="text-coral">*</span>
                      </label>
                      <Input
                        id="telefono"
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, telefono: e.target.value })
                        }
                        className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="destino"
                        className="text-sm font-semibold text-white/80"
                      >
                        Destino sonado
                      </label>
                      <Select
                        value={formData.destino}
                        onValueChange={(val) =>
                          setFormData({ ...formData, destino: val })
                        }
                      >
                        <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white h-11 focus:ring-teal">
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
                      className="text-sm font-semibold text-white/80"
                    >
                      Mensaje
                    </label>
                    <Textarea
                      id="mensaje"
                      placeholder="Cuentanos sobre el viaje que imaginas..."
                      value={formData.mensaje}
                      onChange={(e) =>
                        setFormData({ ...formData, mensaje: e.target.value })
                      }
                      className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal min-h-[100px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full bg-teal hover:bg-teal-dark text-navy font-bold text-lg rounded-full h-14 shadow-lg shadow-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Solicitar Cotizacion Gratuita
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-xs text-white/30 mt-3">
                    Tu informacion es privada y segura. No compartimos tus datos con terceros.
                  </p>
                </form>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-navy border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-teal to-amber flex items-center justify-center shadow-lg shadow-teal/20">
                  <Globe className="h-6 w-6 text-navy" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-white leading-none">
                    UNIVERSO
                  </span>
                  <span className="text-xs font-bold text-teal tracking-[0.2em] leading-none">
                    NOMADA
                  </span>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                Creamos experiencias de viaje personalizadas que transforman la manera de explorar Chile y Sudamerica.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5 text-white/50 hover:text-teal transition-colors">
                  <Mail className="h-4 w-4 text-teal shrink-0" />
                  <a href="mailto:contacto@universonomada.cl">
                    contacto@universonomada.cl
                  </a>
                </li>
                <li className="flex items-center gap-2.5 text-white/50 hover:text-teal transition-colors">
                  <Phone className="h-4 w-4 text-teal shrink-0" />
                  <a
                    href="https://wa.me/56912345678"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +56 9 1234 5678
                  </a>
                </li>
                <li className="flex items-start gap-2.5 text-white/50">
                  <MapPin className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <span>La Serena, Chile</span>
                </li>
              </ul>
            </div>

            {/* Destinations */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Destinos</h4>
              <ul className="space-y-2 text-sm">
                {destinations.slice(0, 6).map((d) => (
                  <li key={d.name}>
                    <button
                      onClick={() => setIsPopupOpen(true)}
                      className="text-white/50 hover:text-teal transition-colors"
                    >
                      {d.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Siguenos</h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/universonomada"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-teal hover:text-navy text-white/60 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com/universonomada"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-teal hover:text-navy text-white/60 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/56912345678?text=Hola!%20Quiero%20cotizar%20un%20viaje"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-teal hover:text-navy text-white/60 transition-all duration-300"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-6 space-y-2 text-sm text-white/30">
                <a href="#" className="block hover:text-teal transition-colors">
                  Politica de Privacidad
                </a>
                <a href="#" className="block hover:text-teal transition-colors">
                  Terminos y Condiciones
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/25">
            <p>
              &copy; {new Date().getFullYear()} Universo Nomada. Todos los derechos reservados.
            </p>
            <p className="flex items-center gap-1">
              Hecho con <Heart className="h-3.5 w-3.5 text-coral fill-coral" /> en La Serena, Chile
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════ WHATSAPP FLOATING BUTTON ═══════ */}
      <motion.a
        href="https://wa.me/56912345678?text=Hola!%20Quiero%20cotizar%20un%20viaje"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/30 hover:scale-110 transition-transform"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </motion.a>

      {/* ═══════ LEAD POPUP ═══════ */}
      <LeadPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </div>
  );
}
