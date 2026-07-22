"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GravityReveal } from "@/components/motion/GravityReveal";
import { FlowField } from "@/components/motion/FlowField";
import { gravitySpring, gravityDrop, staggerContainer } from "@/lib/motion-presets";
import { toast } from "sonner";
import { MapPin, Search, Calendar, Users, ChevronDown, ArrowRight, Star, Plane, Ship, Train, Bus, Car, Mountain, Waves, Trees, Building, Camera, Heart, Compass, Clock, DollarSign, Menu, X, Instagram, Facebook, Mail, Phone, ChevronLeft, ChevronRight, Plus, Minus, Check, AlertCircle, Info, Shield, Award, Globe, Zap, TrendingUp, Target, Sparkles, Flame, Navigation, LayoutDashboard, Binoculars, Palmtree, TreePine, CreditCard, LogIn, User, Lock, Eye, EyeOff, Send, Tag, LogOut, MessageCircle, ShoppingCart, type LucideIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContactSectionShell } from "@/components/ContactSection";
import { HeroCinematic } from "@/components/HeroCinematic";
import { WaveSeparator } from "@/components/WaveDivider";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { TourCard } from "@/components/TourCard";
import { PriceOffer } from "@/components/PriceOffer";
import { ContextualWhatsApp } from "@/components/ContextualWhatsApp";
import { MobileStickyBar } from "@/components/MobileStickyBar";
import { ReferralCapture, getReferralCode } from "@/components/ReferralCapture";
import { normalizeTourCategory } from "@/lib/tour-category";
import { tourMatchesSearch } from "@/lib/tour-search";
import { groupToursByDestination } from "@/lib/tour-destination-groups";
import { DestinationTourGroup } from "@/components/DestinationTourGroup";
import { trackGenerateLead } from "@/lib/analytics-events";
import { PromoUrgency } from "@/components/PromoUrgency";
import { AddToCartButton } from "@/components/AddToCartButton";
import { MemberAuthDialog } from "@/components/MemberAuthDialog";
import { DEFAULT_PROMOTIONS } from "@/lib/default-tours";
import { useCart } from "@/contexts/CartContext";
import { useCartStore } from "@/stores/cart-store";
import { useLandingData } from "@/hooks/use-landing-data";
import { GROUP_TOUR_META } from "@/lib/group-trips";
import { WelcomeRegisterPopup } from "@/components/WelcomeRegisterPopup";
import { scrollToHashFromLocation } from "@/lib/scroll-to-section";

const POPUP_DAY_KEY = "un_popup_day_v2";

function todayPopupKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function markPopupShownToday(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(POPUP_DAY_KEY, todayPopupKey());
}

function popupShownToday(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(POPUP_DAY_KEY) === todayPopupKey();
}
const SERNATUR_URL = "https://serviciosturisticos.sernatur.cl/63063-universo-nomada";

const AboutUsSection = dynamic(() =>
  import("@/components/AboutUsSection").then((m) => ({ default: m.AboutUsSection }))
);
const BenefitsSection = dynamic(() =>
  import("@/components/BenefitsSection").then((m) => ({ default: m.BenefitsSection }))
);
const GoogleReviewsSlider = dynamic(() =>
  import("@/components/GoogleReviewsSlider").then((m) => ({ default: m.GoogleReviewsSlider }))
);
const TourTypesSection = dynamic(() =>
  import("@/components/TourTypesSection").then((m) => ({ default: m.TourTypesSection }))
);
const LandingAdminPanel = dynamic(() =>
  import("@/components/admin/LandingAdminPanel").then((m) => ({ default: m.LandingAdminPanel }))
);
const HowItWorksSection = dynamic(() =>
  import("@/components/HowItWorksSection").then((m) => ({ default: m.HowItWorksSection }))
);
const FaqSection = dynamic(() =>
  import("@/components/FaqSection").then((m) => ({ default: m.FaqSection }))
);
const GroupTripsSection = dynamic(() =>
  import("@/components/GroupTripsSection").then((m) => ({ default: m.GroupTripsSection }))
);

/* ═══════════════════ CONSTANTS ═══════════════════ */
const WHATSAPP_URL = "https://wa.me/56974636396";
const WHATSAPP_TEXT = "?text=Hola!%20Quiero%20cotizar%20un%20viaje%20con%20Universo%20Nomada";
const WHATSAPP_FULL = WHATSAPP_URL + WHATSAPP_TEXT;
const PHONE_DISPLAY = "+56 9 7463 6396";
const EMAIL = "contacto@universonomada.cl";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

/* ═══════════════════ ANIMATION HELPERS ═══════════════════ */
function FadeIn({ children, delay = 0, direction = "up", className = "", float = false }: {
  children: React.ReactNode; delay?: number; direction?: "up" | "down" | "left" | "right"; className?: string; float?: boolean;
}) {
  const mode =
    direction === "left" ? "flowLeft" :
    direction === "right" ? "flow" :
    direction === "down" ? "drop" :
    "anti";
  return (
    <GravityReveal delay={delay} mode={mode} className={className} once float={float}>
      {children}
    </GravityReveal>
  );
}

// AnimatedCounter removed - stats section eliminated per user request

/* ═══════════════════ DATA ═══════════════════ */
interface Destination { id: string; name: string; subtitle: string; image: string; description: string; tag: string; tagColor: string; icon: LucideIcon; category: string; price: number; duration: string; originalPrice?: number; }

const destinations: Destination[] = [
  { id: "rapa-nui", name: "Rapa Nui", subtitle: "Isla de Pascua, Chile", image: "/images/rapanui.png", description: "Misteriosos moais guardians del Pacifico. Vive la cultura ancestral rapanui en medio del oceano mas remoto del planeta. Tapati 2027 con 15% OFF.", tag: "Cultura & Misterio", tagColor: "bg-violet-500/20 text-violet-300", icon: Compass, category: "internacional", price: 957100, duration: "5 dias", originalPrice: 1126000 },
  { id: "san-pedro-uyuni", name: "San Pedro de Atacama + Uyuni", subtitle: "Chile - Bolivia", image: "/images/uyuni.png", description: "Del desierto mas arido al espejo de sal mas grande del mundo. Geisers, lagunas altiplanicas y el Salar de Uyuni. Viaje grupal 10 dias.", tag: "Expedicion", tagColor: "bg-amber-500/20 text-amber-300", icon: Mountain, category: "internacional", price: 1658600, duration: "10 dias" },
  { id: "cusco-machupicchu", name: "Cusco + Machu Picchu", subtitle: "Peru", image: "/images/cusco.png", description: "La ciudadela inca entre las nubes. Recorre el Camino Inca, explora Cusco imperial y conecta con la historia viva.", tag: "Historia & Trekking", tagColor: "bg-emerald-500/20 text-emerald-300", icon: Binoculars, category: "internacional", price: 1200000, duration: "7 dias" },
  { id: "terapias-ancestrales", name: "Terapias Ancestrales", subtitle: "Experiencias Andinas, Peru", image: "/images/terapias_ancestrales.png", description: "Terapia sonora ancestral con vibraciones curativas de los Andes, sanacion con arcilla para transformacion ancestral y conexion con la tierra, terapia con alpacas para equilibrio emocional.", tag: "Bienestar & Ancestral", tagColor: "bg-orange-500/20 text-orange-300", icon: Heart, category: "experiencial", price: 350000, duration: "3 dias" },
  { id: "ballenas-elqui", name: "Ballenas + Valle del Elqui", subtitle: "Chile", image: "/images/ballenas.png", description: "Avistamiento de ballenas en Caleta Chanaral de Aceituno y noches magicas bajo los cielos mas limpios del mundo.", tag: "Naturaleza & Astro", tagColor: "bg-cyan-500/20 text-cyan-300", icon: Waves, category: "chile", price: 450000, duration: "3 dias" },
  { id: "santiago-vinedos", name: "Santiago + Vinedos", subtitle: "Chile", image: "/images/vinedos.png", description: "La vibracion de Santiago entre montanas y los mejores vinos de Chile. City tours, enoturismo y gastronomia de altura.", tag: "City & Vino", tagColor: "bg-rose-500/20 text-rose-300", icon: Palmtree, category: "chile", price: 280000, duration: "2 dias" },
  { id: "bolivia-amazonica", name: "Bolivia Amazonica", subtitle: "Pampas del Yacuma + Selva", image: "/images/bolivia.png", description: "Desde las Pampas del Yacuma hasta la selva amazonica. Caimanes, capibaras y la inmensidad verde del continente.", tag: "Selva & Wildlife", tagColor: "bg-green-500/20 text-green-300", icon: TreePine, category: "internacional", price: 980000, duration: "6 dias" },
  { id: "region-atacama", name: "Region de Atacama", subtitle: "Chile", image: "/images/atacama-new.png", description: "Valle de la Luna, Lagunas Altiplanicas, Geisers del Tatio y estrellas infinitas en el desierto mas antiguo del planeta.", tag: "Desierto & Estrellas", tagColor: "bg-yellow-500/20 text-yellow-300", icon: Star, category: "chile", price: 520000, duration: "4 dias" },
  { id: "valle-aconcagua", name: "Valle del Aconcagua", subtitle: "Chile", image: "/images/aconcagua.png", description: "Vinedos boutique al pie del techo de America. Montanismo, enoturismo y paisajes que inspiran.", tag: "Montana & Vino", tagColor: "bg-sky-500/20 text-sky-300", icon: Mountain, category: "chile", price: 320000, duration: "2 dias" },
  { id: "catedrales-marmol", name: "Catedrales de Marmol + Carretera Austral", subtitle: "Patagonia, Chile", image: "/images/marmol.png", description: "Cuevas de marmol esculpidas por el agua turquesa y la ruta mas salvaje de Patagonia. Aventura pura en el fin del mundo.", tag: "Patagonia Extrema", tagColor: "bg-teal-500/20 text-teal-300", icon: Waves, category: "chile", price: 1500000, duration: "8 dias" },
  { id: "rio-janeiro", name: "Rio de Janeiro", subtitle: "Brasil", image: "/images/rio_janeiro.png", description: "La ciudad maravillosa. Cristo Redentor, Copacabana, Ipanema y la energia carioca que lo contagia todo. Samba, playas y una cultura vibrante.", tag: "City & Playa", tagColor: "bg-yellow-500/20 text-yellow-300", icon: Palmtree, category: "internacional", price: 698000, duration: "5 dias" },
  { id: "florianopolis", name: "Florianopolis", subtitle: "Brasil", image: "/images/florianopolis.png", description: "La isla de la magia. 42 playas paradisiacas, dunas, selva atlantica y una gastronomia que enamora. El destino brasileno perfecto.", tag: "Playa & Naturaleza", tagColor: "bg-cyan-500/20 text-cyan-300", icon: Waves, category: "internacional", price: 593000, duration: "5 dias", originalPrice: 698000 },
  { id: "buenos-aires", name: "Buenos Aires", subtitle: "Argentina", image: "/images/buenos_aires.png", description: "La paris de Sudamerica. Tango en La Boca, arquitectura europea, bodegones y una noche portena que no tiene fin.", tag: "Cultura & Gastronomia", tagColor: "bg-rose-500/20 text-rose-300", icon: Compass, category: "internacional", price: 450000, duration: "4 dias" },
  { id: "mendoza", name: "Mendoza", subtitle: "Argentina", image: "/images/mendoza.png", description: "Vinos de altura al pie de los Andes. Bodegas boutique, Aconcagua imponente y la ruta del malbec mas famosa del continente. 15% OFF en abril.", tag: "Vino & Montana", tagColor: "bg-purple-500/20 text-purple-300", icon: Mountain, category: "internacional", price: 586700, duration: "5 dias", originalPrice: 690300 },
];

const promoTourIds = ["mendoza", "florianopolis", "rapa-nui", "san-pedro-uyuni", "ballenas-elqui", "catedrales-marmol"];

const destinoOptions = destinations.map((d) => d.name).concat(["Otro destino"]);

const promotions = [
  { title: "Destino del Mes ABRIL", subtitle: "Mendoza, Argentina", discount: "15% OFF", emoji: "🍷", destination: "Mendoza" },
  { title: "Travel SALE", subtitle: "Florianopolis, Brasil", discount: "15% OFF", emoji: "🌴", destination: "Florianopolis" },
  { title: "Tapati 2027", subtitle: "Rapa Nui", discount: "15% OFF", emoji: "🗿", destination: "Rapa Nui" },
  { title: "Viaje Grupal", subtitle: "Atacama + Uyuni", discount: "Reserva $200.000", emoji: "🏜️", destination: "Atacama" },
  { title: "Temporada Ballenas", subtitle: "Ballenas + Elqui", discount: "25% OFF", emoji: "🐋", destination: "Ballenas" },
  { title: "Patagonia Extrema", subtitle: "Catedrales + Carretera", discount: "20% OFF", emoji: "🏔️", destination: "Patagonia" },
];

const promoDetails = DEFAULT_PROMOTIONS;

// Stats section removed per user request

const benefits = [
  { icon: Compass, title: "Experiencias a Medida", description: "Cada viaje se diseña exclusivamente para ti. Sin paquetes genericos, solo experiencias unicas." },
  { icon: Clock, title: "Acompanamiento 24/7", description: "Estamos contigo antes, durante y despues de tu viaje. Asistencia permanente." },
  { icon: CreditCard, title: "Pagos a Plazo", description: "Cuota tu viaje en comodas cuotas sin intereses. Tu proxima aventura no tiene que esperar." },
  { icon: Heart, title: "Conexion Autentica", description: "Conexiones reales con culturas locales. No eres turista, eres un viajero que deja huella." },
  { icon: Shield, title: "Respaldo Total", description: "Viaja con la tranquilidad de tener todo cubierto. Seguros y logisticas impecables." },
  { icon: Award, title: "Mejor Precio Garantizado", description: "Accede a tarifas exclusivas y promociones que solo Universo Nomada puede ofrecerte." },
];

const filterKeys = ["todos", "nacional", "internacional", "grupal"] as const;

/* ═══════════════════ AUTH DIALOG ═══════════════════ */
function AuthDialog({ isOpen, onClose, onLogin }: {
  isOpen: boolean; onClose: () => void; onLogin: (user: { id: string; email: string; name: string | null; role: string }) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast.success(mode === "login" ? "Sesion iniciada!" : "Cuenta creada!");
      onLogin(data.user);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-navy px-6 py-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal/20 flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{mode === "login" ? "Iniciar Sesion" : "Crear Cuenta"}</h3>
                  <p className="text-white/60 text-sm">Universo Nomada</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="rounded-xl border-slate-200 pl-10 h-11" required />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-xl border-slate-200 pl-10 h-11" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Contrasena</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type={showPassword ? "text" : "password"} placeholder="Tu contrasena" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="rounded-xl border-slate-200 pl-10 pr-10 h-11" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full bg-teal hover:bg-teal-dark text-navy font-bold rounded-full h-12 shadow-lg shadow-teal/20 transition-all hover:scale-[1.02]">
                {loading ? "Cargando..." : mode === "login" ? "Iniciar Sesion" : "Crear Cuenta"}
              </Button>
              <p className="text-center text-sm text-slate-500">
                {mode === "login" ? "No tienes cuenta?" : "Ya tienes cuenta?"}{" "}
                <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="text-teal font-semibold hover:underline">
                  {mode === "login" ? "Registrate" : "Inicia sesion"}
                </button>
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════ TRAVEL FORM POPUP ═══════════════════ */
function TravelFormPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    // Datos Personales
    nombreCompleto: "",
    rutPasaporte: "",
    telefono: "",
    email: "",
    // Datos del Viaje
    destino: "",
    fechaViaje: "",
    cantidadPersonas: "1",
    // Salud y Restricciones
    saludRestricciones: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreCompleto || !formData.rutPasaporte || !formData.telefono || !formData.email) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Error");
      trackGenerateLead({ source: "formulario-viaje-detallado" });
      toast.success("Formulario enviado! Te contactaremos pronto.");
      setFormData({
        nombreCompleto: "",
        rutPasaporte: "",
        telefono: "",
        email: "",
        destino: "",
        fechaViaje: "",
        cantidadPersonas: "1",
        saludRestricciones: ""
      });
      setTimeout(onClose, 1500);
    } catch {
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-teal to-emerald-600 px-6 py-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Formulario de Registro de Viajero</h3>
                  <p className="text-white/80 text-sm">Completa tus datos para tu próxima aventura</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Datos Personales */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">Datos Personales</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nombre completo *</label>
                    <Input
                      placeholder="Juan Pérez García"
                      value={formData.nombreCompleto}
                      onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                      className="rounded-xl border-gray-200 h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">RUT / Pasaporte *</label>
                    <Input
                      placeholder="12.345.678-9"
                      value={formData.rutPasaporte}
                      onChange={(e) => setFormData({ ...formData, rutPasaporte: e.target.value })}
                      className="rounded-xl border-gray-200 h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Teléfono de contacto *</label>
                    <Input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="rounded-xl border-gray-200 h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Correo electrónico *</label>
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-xl border-gray-200 h-11"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Datos del Viaje */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">Datos del Viaje</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Destino / Tour contratado</label>
                    <select
                      value={formData.destino}
                      onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                      className="w-full rounded-xl h-11 border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      <option value="">Selecciona destino</option>
                      {destinoOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Fecha del viaje</label>
                    <Input
                      type="date"
                      value={formData.fechaViaje}
                      onChange={(e) => setFormData({ ...formData, fechaViaje: e.target.value })}
                      className="rounded-xl border-gray-200 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Cantidad de personas</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.cantidadPersonas}
                      onChange={(e) => setFormData({ ...formData, cantidadPersonas: e.target.value })}
                      className="rounded-xl border-gray-200 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Salud y Restricciones */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">Salud y Restricciones</h4>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Información médica o restricciones alimentarias</label>
                  <Textarea
                    placeholder="Por favor, menciona cualquier condición médica, alergias o restricciones alimentarias que debamos conocer..."
                    value={formData.saludRestricciones}
                    onChange={(e) => setFormData({ ...formData, saludRestricciones: e.target.value })}
                    className="rounded-xl min-h-[100px] resize-none border-gray-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-teal hover:bg-teal-dark text-white font-bold rounded-full h-12 shadow-lg shadow-teal/20 transition-all hover:scale-[1.02]"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Formulario"}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="px-6 h-12 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
              </div>
              
              <p className="text-center text-xs text-gray-400">Tu información es privada y segura.</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const nav = t("nav");
  const navLinks = [
    { label: nav.inicio, href: "#inicio" },
    { label: nav.ofertas, href: "#ofertas" },
    { label: nav.grupales, href: "#viajes-grupales" },
    { label: nav.destinos, href: "#destinos" },
    { label: nav.beneficios, href: "#beneficios" },
    { label: nav.nosotros, href: "#nosotros" },
    { label: nav.blog, href: "/blog" },
    { label: nav.contacto, href: "#contacto" },
  ];
  const formRef = useRef<HTMLDivElement>(null);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isTravelFormOpen, setIsTravelFormOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMemberAuthOpen, setIsMemberAuthOpen] = useState(false);
  const [memberAuthEmail, setMemberAuthEmail] = useState("");
  const [memberAuthForceLogin, setMemberAuthForceLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { openCart } = useCart();
  const cartCount = useCartStore((s) => s.items.length);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<(typeof filterKeys)[number]>("todos");
  const [destinationSearch, setDestinationSearch] = useState("");
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [contentRefresh, setContentRefresh] = useState(0);
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {});
    scrollToHashFromLocation();
    const onHashChange = () => scrollToHashFromLocation(80);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    // Si ya hay sesión, no abrir el popup (pero no forzar cierre:
    // tras registrarse debe verse la pantalla del código de descuento).
    if (user) return;
    if (popupShownToday()) return;

    let opened = false;
    const openWelcome = () => {
      if (opened) return;
      opened = true;
      setIsWelcomeOpen(true);
    };

    const onScroll = () => {
      if (window.scrollY > 120) openWelcome();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user]);

  const closeWelcomePopup = () => {
    markPopupShownToday();
    setIsWelcomeOpen(false);
  };

  const handleWelcomeRegistered = (u: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  }) => {
    setUser(u);
    // No cerrar: el popup muestra el código NOMAD5
  };

  const handleLogin = (u: { id: string; email: string; name: string | null; role: string }) => {
    setUser(u);
    setIsWelcomeOpen(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    toast.success(t("auth").logout);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.telefono) { toast.error("Completa los campos obligatorios"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, referralCode: getReferralCode() }),
      });
      if (!res.ok) throw new Error("Error");
      trackGenerateLead({ source: "cotizacion-home", value: 0 });
      toast.success("Cotizacion enviada! Te contactaremos pronto.");
      setFormData({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
    } catch { toast.error("Error al enviar."); }
    finally { setIsSubmitting(false); }
  };

  const { tours: liveTours, promotions: livePromos, promotionsLoaded, refetch: refetchLanding } = useLandingData();

  const staticAsCards = destinations.map((d) => ({
    id: d.id, name: d.name, subtitle: d.subtitle, image: d.image, tag: d.tag,
    price: d.price, duration: d.duration, originalPrice: d.originalPrice, category: d.category,
  }));
  const tourList = liveTours.length > 0 ? liveTours : staticAsCards;
  /** Si la API respondió, respetar ocultas (incluso lista vacía). Fallback estático solo si falló la carga. */
  const promoList = promotionsLoaded ? livePromos : (livePromos.length > 0 ? livePromos : promoDetails);

  const promoTourId = (destination: string, index: number) => {
    const map: Record<string, string> = {
      Mendoza: "mendoza", Florianopolis: "florianopolis", "Rapa Nui": "rapa-nui",
      Atacama: "san-pedro-uyuni", Ballenas: "ballenas-elqui", Patagonia: "catedrales-marmol",
    };
    const byDest = map[destination];
    if (byDest) return byDest;
    const match = tourList.find((t) =>
      t.name.toLowerCase().includes(destination.toLowerCase()) ||
      destination.toLowerCase().includes(t.name.toLowerCase().split(" ")[0])
    );
    return match?.id ?? promoTourIds[index] ?? tourList[0]?.id ?? "rapa-nui";
  };

  const filteredDestinations = useMemo(() => {
    const byCategory =
      activeFilter === "todos"
        ? tourList
        : tourList.filter((d) => normalizeTourCategory(d.category, d.id) === activeFilter);

    if (!destinationSearch.trim()) return byCategory;
    return byCategory.filter((d) => tourMatchesSearch(d, destinationSearch));
  }, [tourList, activeFilter, destinationSearch]);

  const destinationGroups = useMemo(
    () => groupToursByDestination(filteredDestinations),
    [filteredDestinations],
  );

  const dest = t("destinations");

  if (showAdmin && user?.role === "admin") {
    return <LandingAdminPanel onClose={() => { setShowAdmin(false); refetchLanding(); setContentRefresh((n) => n + 1); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ReferralCapture />
      {/* ═══════ NAV ═══════ */}
      <motion.nav
        aria-label="Navegación principal"
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled ? "bg-gradient-to-r from-navy/95 via-[#0F2440]/95 to-navy/95 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-teal/10" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 lg:gap-4 xl:gap-6">
            <a href="#inicio" className="flex items-center gap-2.5 shrink-0 min-w-0">
              <Image src="/images/logo-un.png" alt="Universo Nomada" width={40} height={40} className="rounded-full shadow-lg shadow-teal/20 ring-1 ring-white/10 shrink-0" />
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">UNIVERSO</span>
                <span className="text-[10px] sm:text-xs font-bold text-teal tracking-[0.2em] leading-none">NOMADA®</span>
              </div>
            </a>

            <nav aria-label="Secciones del sitio" className="hidden lg:flex items-center justify-center min-w-0 overflow-x-auto scrollbar-hide px-1">
              <div className="flex items-center gap-0.5 xl:gap-1">
                {navLinks.map((link) =>
                  link.href.startsWith("/") ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="nav-link-flow whitespace-nowrap px-1.5 xl:px-2.5 py-2 text-xs xl:text-sm text-white/60 hover:text-teal transition-colors font-medium rounded-lg hover:bg-white/5 shrink-0"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      className="nav-link-flow whitespace-nowrap px-1.5 xl:px-2.5 py-2 text-xs xl:text-sm text-white/60 hover:text-teal transition-colors font-medium rounded-lg hover:bg-white/5 shrink-0"
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            </nav>

            <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
              {user && (
                <>
                  {user.role === "admin" && (
                    <Button
                      onClick={() => setShowAdmin(true)}
                      size="sm"
                      variant="outline"
                      title="Admin"
                      className="hidden sm:flex bg-white/5 border-white/10 text-white/80 hover:bg-teal hover:text-navy rounded-full text-xs px-2.5 xl:px-3 shrink-0"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 xl:mr-1" />
                      <span className="hidden xl:inline">Admin</span>
                    </Button>
                  )}
                  <Button
                    onClick={handleLogout}
                    size="sm"
                    variant="ghost"
                    title={t("auth").logout}
                    className="hidden sm:flex text-white/40 hover:text-white rounded-full text-xs shrink-0 px-2"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={gravitySpring}
                onClick={openCart}
                className="relative p-2 text-white/80 hover:text-teal hover:bg-white/5 rounded-xl transition-all shrink-0"
                aria-label={t("cart").myCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </motion.button>

              {user ? (
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold rounded-full px-3 xl:px-4 shadow-lg shadow-amber/20 transition-all hover:scale-105 text-xs shrink-0"
                >
                  <Link href="/mi-cuenta">{nav.miCuenta ?? "Mi cuenta"}</Link>
                </Button>
              ) : (
                <Button
                  onClick={() => setIsMemberAuthOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold rounded-full px-3 xl:px-4 py-1.5 h-auto shadow-lg shadow-amber/20 transition-all hover:scale-105 shrink-0"
                >
                  <span className="flex flex-col items-center leading-none gap-0.5">
                    <span className="text-xs">{nav.registrarse ?? "Registrarse"}</span>
                    <span className="text-[10px] font-medium opacity-90">{t("auth").login}</span>
                  </span>
                </Button>
              )}
              <Select value={language} onValueChange={(value: "es" | "en" | "fr" | "zh" | "pt") => setLanguage(value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-2.5 h-9 text-xs w-auto shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="es">🇪🇸 ES</SelectItem>
                  <SelectItem value="en">🇬🇧 EN</SelectItem>
                  <SelectItem value="pt">🇧🇷 PT</SelectItem>
                  <SelectItem value="fr">🇫🇷 FR</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} size="sm" variant="ghost" className="lg:hidden text-white shrink-0" aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileMenuOpen}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-gradient-to-b from-navy-light to-[#0D1B2A] border-t border-white/5 overflow-hidden">
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) =>
                  link.href.startsWith("/") ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 text-white/70 hover:text-teal hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 text-white/70 hover:text-teal hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </motion.nav>

      <HeroCinematic onPlanTrip={() => setIsTravelFormOpen(true)} refreshKey={contentRefresh} />

      <main id="main-content">
      {/* ═══════ OFERTAS / PROMOCIONES ═══════ */}
      {promoList.length > 0 && (
      <section id="ofertas" className="relative py-16 sm:py-24 -mt-px bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 overflow-hidden">
        <FlowField variant="warm" className="opacity-75" intensity="medium" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="bg-rose-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md pulse-glow">{t('discounts').exclusive}</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{t('discounts').title}</h2>
              <p className="mt-4 text-slate-600 text-lg max-w-xl mx-auto">{t('discounts').subtitle}</p>
            </div>
          </FadeIn>

          <div
            className={
              promoList.length === 1
                ? "grid grid-cols-1 gap-6"
                : promoList.length === 2
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            }
          >
            {promoList.map((promo, i) => {
              const solo = promoList.length === 1;
              return (
              <FadeIn key={`promo-${i}-${"id" in promo ? promo.id : promo.title}`} delay={i * 0.1}>
                <motion.div
                  className={`group premium-card-lift bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden gradient-card-border ${
                    solo ? "lg:grid lg:grid-cols-2 lg:items-stretch" : ""
                  }`}
                  whileHover={{ y: -8, transition: gravitySpring }}
                >
                  {/* Imagen */}
                  <div
                    className={`relative overflow-hidden ${
                      solo ? "h-56 sm:h-72 lg:h-full lg:min-h-[340px]" : "h-48"
                    }`}
                  >
                    <Image src={promo.image} alt={promo.title} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-110" sizes={solo ? "100vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badge de descuento */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {promo.discount}
                      </span>
                    </div>
                    
                    {/* Emoji */}
                    <div className="absolute bottom-4 right-4">
                      <span className="text-3xl drop-shadow-lg">{promo.emoji}</span>
                    </div>
                  </div>
                  
                  {/* Contenido */}
                  <div className={`p-5 ${solo ? "lg:p-8 lg:flex lg:flex-col lg:justify-center" : ""}`}>
                    <h3 className={`text-gray-900 font-bold mb-1 ${solo ? "text-xl sm:text-2xl" : "text-lg"}`}>{promo.title}</h3>
                    <p className={`text-gray-600 mb-3 ${solo ? "text-base" : "text-sm"}`}>{promo.subtitle}</p>
                    
                    {/* Incluye */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                          ✈️ Vuelo
                        </span>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                          🏨 Hotel
                        </span>
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                          🎯 Tour
                        </span>
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
                          👥 Guías Locales
                        </span>
                      </div>
                    </div>
                    
                    {/* Precios */}
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/50 border border-emerald-200/60 p-4 mb-3">
                      <PriceOffer
                        price={promo.discountPrice}
                        originalPrice={promo.originalPrice}
                        desdeLabel={t("destinations").desde}
                        porPersonaLabel={t("destinations").porPersona}
                        ahorrasLabel={t("priceOffer").ahorras}
                        size={solo ? "lg" : "md"}
                      />
                    </div>
                    
                    {/* Fecha y botón */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />{t("discounts").hasta} {promo.validUntil}
                      </span>
                    </div>
                    <PromoUrgency validUntil={promo.validUntil} spotsLeft={i === 0 ? 5 : undefined} />
                    <div className={`flex flex-col gap-2 mt-3 ${solo ? "sm:flex-row" : ""}`} onClick={(e) => e.stopPropagation()}>
                      <Link href={`/detalle-paquete/${promoTourId(promo.destination, i)}`} className="block flex-1">
                        <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl px-4 py-3 text-sm transition-all w-full min-h-[44px] shadow-md shadow-emerald-500/20">
                          {t("discounts").verDetalles}
                        </button>
                      </Link>
                      <div className="flex-1">
                        <AddToCartButton
                          tourId={promoTourId(promo.destination, i)}
                          tourName={promo.subtitle}
                          image={promo.image}
                          basePrice={promo.discountPrice}
                          duration={tourList.find((t) => t.id === promoTourId(promo.destination, i))?.duration}
                          className="rounded-xl min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
              );
            })}
          </div>
        </div>
      </section>
      )}

      <WaveSeparator fromColor={WAVE_COLORS.roseLight} toColor={WAVE_COLORS.groupTrips} />

      <GroupTripsSection tourList={tourList} groupTourMeta={GROUP_TOUR_META} />

      <WaveSeparator fromColor={WAVE_COLORS.groupTrips} toColor={WAVE_COLORS.skyLight} />

      {/* ═══════ DESTINATIONS WITH FILTERS ═══════ */}
      <section id="destinos" className="relative py-16 sm:py-24 bg-gradient-to-b from-sky-50 to-white overflow-hidden">
        <FlowField variant="cool" className="opacity-65" intensity="medium" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn float>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{t("destinations").title}</h2>
              <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">{t("destinations").description}</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="relative max-w-xl mx-auto mb-8">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                type="search"
                value={destinationSearch}
                onChange={(e) => setDestinationSearch(e.target.value)}
                placeholder={dest.searchPlaceholder}
                className="h-12 rounded-full border-slate-200 bg-white pl-12 pr-12 text-base shadow-sm focus-visible:ring-teal"
                aria-label={dest.searchPlaceholder}
              />
              {destinationSearch.trim() && (
                <button
                  type="button"
                  onClick={() => setDestinationSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label={dest.searchClear}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {filterKeys.map((key) => (
                <button key={key} onClick={() => setActiveFilter(key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all min-h-[44px] ${
                    activeFilter === key ? "bg-teal text-white shadow-lg shadow-teal/30" : "bg-white text-slate-600 border border-slate-200 hover:border-teal"}`}>
                  {key === "todos" ? dest.todos :
                   key === "nacional" ? dest.nacional :
                   key === "internacional" ? dest.internacional :
                   dest.grupal}
                </button>
              ))}
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
            {destinationGroups.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-14 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-slate-600 font-medium">{dest.noResults}</p>
                {destinationSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => setDestinationSearch("")}
                    className="mt-4 text-sm font-semibold text-teal hover:underline"
                  >
                    {dest.searchClear}
                  </button>
                )}
              </div>
            ) : (
              destinationGroups.map((group, gi) =>
                group.tours.length > 1 ? (
                  <FadeIn key={group.key} delay={gi * 0.05} className="self-start w-full">
                    <DestinationTourGroup group={group} />
                  </FadeIn>
                ) : (
                  <FadeIn key={group.tours[0].id} delay={gi * 0.04} className="self-start w-full">
                    <TourCard tour={group.tours[0]} />
                  </FadeIn>
                ),
              )
            )}
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <BenefitsSection />

      <WaveSeparator fromColor={WAVE_COLORS.benefits} toColor={WAVE_COLORS.light} />

      <AboutUsSection />

      <WaveSeparator fromColor={WAVE_COLORS.light} toColor={WAVE_COLORS.ocean} />

      <GoogleReviewsSlider />

      <TourTypesSection />

      <FaqSection />

      {/* ═══════ CONTACT / FORM ═══════ */}
      <ContactSectionShell ref={formRef}>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={gravityDrop}>
              <div>
                <span className="text-teal font-semibold text-sm uppercase tracking-[0.2em]">{t("contacto").title}</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t("contacto").subtitle}</h2>
                <p className="mt-4 text-slate-600 text-lg leading-relaxed">{t("contacto").description}</p>
                <div className="mt-8 space-y-4">
                  <a href={`tel:${PHONE_DISPLAY.replace(/\s/g, "")}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal/30 transition-all group min-h-[72px]">
                    <div className="h-12 w-12 rounded-xl bg-teal/10 flex items-center justify-center"><Phone className="h-6 w-6 text-teal" /></div>
                    <div><p className="text-slate-900 font-semibold">{t("contacto").telefono}</p><p className="text-slate-500 text-sm">{PHONE_DISPLAY}</p></div>
                    <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-teal group-hover:translate-x-1 transition-all" />
                  </a>
                  <a href={`mailto:${EMAIL}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal/30 transition-all group">
                    <div className="h-12 w-12 rounded-xl bg-teal/10 flex items-center justify-center"><Mail className="h-6 w-6 text-teal" /></div>
                    <div><p className="text-slate-900 font-semibold">{t("contacto").email}</p><p className="text-slate-500 text-sm">{EMAIL}</p></div>
                    <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-teal group-hover:translate-x-1 transition-all" />
                  </a>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-amber/10 flex items-center justify-center"><MapPin className="h-6 w-6 text-amber" /></div>
                    <div><p className="text-slate-900 font-semibold">{t("contacto").ubicacion}</p><p className="text-slate-500 text-sm">{t("location")}</p></div>
                  </div>
                  <a
                    href={SERNATUR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group min-h-[72px]"
                  >
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Award className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-900 font-semibold">{t("contacto").sernaturLabel}</p>
                      <p className="text-slate-500 text-sm">{t("contacto").sernaturDetail}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 ml-auto shrink-0 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div variants={gravityDrop}>
              <Card className="bg-white/95 backdrop-blur-sm border-slate-200/80 shadow-xl rounded-3xl premium-card-lift">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="nombre" className="text-sm font-semibold text-slate-700">{t("contacto").nombre} *</label>
                        <Input id="nombre" placeholder="Tu nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal h-11" required />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-semibold text-slate-700">{t("contacto").email} *</label>
                        <Input id="email" type="email" placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal h-11" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="telefono" className="text-sm font-semibold text-slate-700">{t("contacto").telefono} *</label>
                        <Input id="telefono" type="tel" placeholder={PHONE_DISPLAY} value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className="rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal h-11" required />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="destino" className="text-sm font-semibold text-slate-700">{t("contacto").destino}</label>
                        <select
                          id="destino"
                          value={formData.destino}
                          onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                        >
                          <option value="">{t("common").selecciona}</option>
                          {destinoOptions.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="mensaje" className="text-sm font-semibold text-slate-700">{t("contacto").mensaje}</label>
                      <Textarea id="mensaje" placeholder="Cuentanos sobre tu viaje sonado..." value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                        className="rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal min-h-[100px] resize-none" />
                    </div>
                    <Button type="submit" disabled={isSubmitting}
                      className="w-full bg-teal hover:bg-teal-dark text-navy font-bold text-lg rounded-full h-14 shadow-lg shadow-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      {isSubmitting ? t("contacto").enviando : <span className="flex items-center gap-2"><Send className="h-5 w-5" />{t("contacto").enviar}</span>}
                    </Button>
                    <p className="text-center text-xs text-slate-400">{t("contacto").privacidad}</p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
      </ContactSectionShell>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="mt-auto -mt-px" style={{ backgroundColor: WAVE_COLORS.footer }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Image src="/images/logo-un.png" alt="Universo Nomada" width={44} height={44} className="rounded-full shadow-lg shadow-teal/20 ring-1 ring-white/10" />
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-white leading-none">UNIVERSO</span>
                  <span className="text-xs font-bold text-teal tracking-[0.2em] leading-none">NOMADA®</span>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">{t("footer").tagline}</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">{t("footer").contacto}</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5 text-white/50 hover:text-teal transition-colors">
                  <Mail className="h-4 w-4 text-teal shrink-0" /><a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </li>
                <li className="flex items-center gap-2.5 text-white/50 hover:text-teal transition-colors">
                  <Phone className="h-4 w-4 text-teal shrink-0" /><a href="https://wa.me/56974636396" target="_blank" rel="noopener noreferrer">+56 9 7463 6396</a>
                </li>
                <li className="flex items-center gap-2.5 text-white/50 hover:text-teal transition-colors">
                  <Phone className="h-4 w-4 text-teal shrink-0" /><a href="https://wa.me/56974841303" target="_blank" rel="noopener noreferrer">+56 9 7484 1303</a>
                </li>
                <li className="flex items-center gap-2.5 text-white/50 hover:text-blue-400 transition-colors">
                  <svg className="h-4 w-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <a href="https://web.facebook.com/profile.php?id=61560104283524" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Facebook</a>
                </li>
                <li className="flex items-start gap-2.5 text-white/50">
                  <MapPin className="h-4 w-4 text-teal shrink-0 mt-0.5" /><span>{t("location")}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">{t("footer").destinos}</h4>
              <ul className="space-y-2 text-sm">
                {destinations.slice(0, 8).map((d) => (
                  <li key={d.name}>
                    <Link href={`/detalle-paquete/${d.id}`} className="text-white/50 hover:text-teal transition-colors">
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">{t("footer").siguenos}</h4>
              <div className="flex flex-wrap items-center gap-3">
                <a href="https://www.instagram.com/universo.nomadaa/" target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white transition-all duration-300" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.tiktok.com/@universo.nomadaa" target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all duration-300" aria-label="TikTok">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                </a>
                <a href="https://web.facebook.com/profile.php?id=61560104283524" target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-blue-500 hover:text-white text-white/60 transition-all duration-300" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-[#25D366] hover:text-white text-white/60 transition-all duration-300" aria-label="WhatsApp">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-6 space-y-2 text-sm text-white/30">
                <Link href="/politica-privacidad" className="block hover:text-teal transition-colors">
                  {t("footer").privacidad}
                </Link>
                <Link href="/terminos-condiciones" className="block hover:text-teal transition-colors">
                  {t("footer").terminos}
                </Link>
                <Link href="/politica-seguridad" className="block hover:text-teal transition-colors">
                  {(t("footer") as { seguridad?: string }).seguridad ?? "Política de Seguridad"}
                </Link>
                <Link href="/politicas-cancelacion" className="block hover:text-teal transition-colors">
                  {t("footer").cancelacion}
                </Link>
                <Link href="/terminos-vuelos" className="block hover:text-teal transition-colors">
                  {(t("footer") as { vuelos?: string }).vuelos ?? "Términos sobre Vuelos"}
                </Link>
              </div>
              
              {/* Registro R */}
              <div className="mt-6 flex justify-center">
                <Image src="/images/logo_r-1.png" alt="Registro R" width={80} height={80} className="opacity-80 hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-10 pt-8 flex flex-col items-center gap-3 text-sm text-white/25">
            <p>&copy; {new Date().getFullYear()} Universo Nómada®. {t("footer").copyright}</p>
            <a
              href={SERNATUR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 text-xs hover:text-emerald-400/80 transition-colors"
            >
              {t("footer").sernatur}
            </a>
            {!user && (
              <div className="flex flex-col gap-1 mt-2">
                <button
                  onClick={() => setIsMemberAuthOpen(true)}
                  className="text-white/30 hover:text-teal text-xs transition-colors"
                >
                  Mi cuenta Nómada
                </button>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-white/20 hover:text-white/40 text-xs transition-colors"
                >
                  {t("footer").adminLogin}
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
      </main>

      <ContextualWhatsApp />
      <MobileStickyBar onCotizar={() => setIsTravelFormOpen(true)} />

      {/* ═══════ POPUPS ═══════ */}
      <WelcomeRegisterPopup
        isOpen={isWelcomeOpen}
        onClose={closeWelcomePopup}
        onRegistered={handleWelcomeRegistered}
        onRequestLogin={(email) => {
          setMemberAuthEmail(email ?? "");
          setMemberAuthForceLogin(true);
          setIsMemberAuthOpen(true);
        }}
      />
      <TravelFormPopup isOpen={isTravelFormOpen} onClose={() => setIsTravelFormOpen(false)} />
      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />
      <MemberAuthDialog
        isOpen={isMemberAuthOpen}
        onClose={() => {
          setIsMemberAuthOpen(false);
          setMemberAuthEmail("");
          setMemberAuthForceLogin(false);
        }}
        onLogin={handleLogin}
        initialEmail={memberAuthEmail || undefined}
        forceLogin={memberAuthForceLogin}
      />
    </div>
  );
}
