"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin, Phone, Mail, Star, Heart, Shield, Clock, CreditCard,
  Compass, MessageCircle, Instagram, Facebook, Send, ArrowDown,
  Globe, Sparkles, ChevronRight, Users, Award, X, ChevronLeft,
  ArrowRight, Plane, Mountain, Waves, TreePine, Palmtree, Binoculars,
  Menu, LogIn, LogOut, LayoutDashboard, Tag, TrendingUp, Calendar,
  User, Lock, Eye, EyeOff, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ═══════════════════ CONSTANTS ═══════════════════ */
const WHATSAPP_URL = "https://wa.me/56974636396";
const WHATSAPP_TEXT = "?text=Hola!%20Quiero%20cotizar%20un%20viaje%20con%20Universo%20Nomada";
const WHATSAPP_FULL = WHATSAPP_URL + WHATSAPP_TEXT;
const PHONE_DISPLAY = "+56 9 7463 6396";
const EMAIL = "contacto@universonomada.cl";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

/* ═══════════════════ ANIMATION HELPERS ═══════════════════ */
function FadeIn({ children, delay = 0, direction = "up", className = "" }: {
  children: React.ReactNode; delay?: number; direction?: "up" | "down" | "left" | "right"; className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const dirs = { up: { y: 50 }, down: { y: -50 }, left: { x: 50 }, right: { x: -50 } };
  return (
    <motion.div ref={ref} initial={{ opacity: 0, ...dirs[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

// AnimatedCounter removed - stats section eliminated per user request

/* ═══════════════════ DATA ═══════════════════ */
interface Destination { name: string; subtitle: string; image: string; description: string; tag: string; tagColor: string; icon: LucideIcon; category: string; price: number; duration: string; originalPrice?: number; }

const destinations: Destination[] = [
  { name: "Rapa Nui", subtitle: "Isla de Pascua, Chile", image: "/images/rapanui.png", description: "Misteriosos moais guardians del Pacifico. Vive la cultura ancestral rapanui en medio del oceano mas remoto del planeta. Tapati 2027 con 15% OFF.", tag: "Cultura & Misterio", tagColor: "bg-violet-500/20 text-violet-300", icon: Compass, category: "internacional", price: 957100, duration: "5 dias", originalPrice: 1126000 },
  { name: "San Pedro de Atacama + Uyuni", subtitle: "Chile - Bolivia", image: "/images/uyuni.png", description: "Del desierto mas arido al espejo de sal mas grande del mundo. Geisers, lagunas altiplanicas y el Salar de Uyuni. Viaje grupal 10 dias.", tag: "Expedicion", tagColor: "bg-amber-500/20 text-amber-300", icon: Mountain, category: "internacional", price: 1658600, duration: "10 dias" },
  { name: "Cusco + Machu Picchu", subtitle: "Peru", image: "/images/cusco.png", description: "La ciudadela inca entre las nubes. Recorre el Camino Inca, explora Cusco imperial y conecta con la historia viva.", tag: "Historia & Trekking", tagColor: "bg-emerald-500/20 text-emerald-300", icon: Binoculars, category: "internacional", price: 1200000, duration: "7 dias" },
  { name: "Terapias Ancestrales", subtitle: "Experiencias Andinas, Peru", image: "/images/terapias_ancestrales.png", description: "Terapia sonora ancestral con vibraciones curativas de los Andes, sanacion con arcilla para transformacion ancestral y conexion con la tierra, terapia con alpacas para equilibrio emocional.", tag: "Bienestar & Ancestral", tagColor: "bg-orange-500/20 text-orange-300", icon: Heart, category: "experiencial", price: 350000, duration: "3 dias" },
  { name: "Ballenas + Valle del Elqui", subtitle: "Chile", image: "/images/ballenas.png", description: "Avistamiento de ballenas en Caleta Chanaral de Aceituno y noches magicas bajo los cielos mas limpios del mundo.", tag: "Naturaleza & Astro", tagColor: "bg-cyan-500/20 text-cyan-300", icon: Waves, category: "chile", price: 450000, duration: "3 dias" },
  { name: "Santiago + Vinedos", subtitle: "Chile", image: "/images/vinedos.png", description: "La vibracion de Santiago entre montanas y los mejores vinos de Chile. City tours, enoturismo y gastronomia de altura.", tag: "City & Vino", tagColor: "bg-rose-500/20 text-rose-300", icon: Palmtree, category: "chile", price: 280000, duration: "2 dias" },
  { name: "Bolivia Amazonica", subtitle: "Pampas del Yacuma + Selva", image: "/images/bolivia.png", description: "Desde las Pampas del Yacuma hasta la selva amazonica. Caimanes, capibaras y la inmensidad verde del continente.", tag: "Selva & Wildlife", tagColor: "bg-green-500/20 text-green-300", icon: TreePine, category: "internacional", price: 980000, duration: "6 dias" },
  { name: "Region de Atacama", subtitle: "Chile", image: "/images/atacama-new.png", description: "Valle de la Luna, Lagunas Altiplanicas, Geisers del Tatio y estrellas infinitas en el desierto mas antiguo del planeta.", tag: "Desierto & Estrellas", tagColor: "bg-yellow-500/20 text-yellow-300", icon: Star, category: "chile", price: 520000, duration: "4 dias" },
  { name: "Valle del Aconcagua", subtitle: "Chile", image: "/images/aconcagua.png", description: "Vinedos boutique al pie del techo de America. Montanismo, enoturismo y paisajes que inspiran.", tag: "Montana & Vino", tagColor: "bg-sky-500/20 text-sky-300", icon: Mountain, category: "chile", price: 320000, duration: "2 dias" },
  { name: "Catedrales de Marmol + Carretera Austral", subtitle: "Patagonia, Chile", image: "/images/marmol.png", description: "Cuevas de marmol esculpidas por el agua turquesa y la ruta mas salvaje de Patagonia. Aventura pura en el fin del mundo.", tag: "Patagonia Extrema", tagColor: "bg-teal-500/20 text-teal-300", icon: Waves, category: "chile", price: 1500000, duration: "8 dias" },
  { name: "Rio de Janeiro", subtitle: "Brasil", image: "/images/rio_janeiro.png", description: "La ciudad maravillosa. Cristo Redentor, Copacabana, Ipanema y la energia carioca que lo contagia todo. Samba, playas y una cultura vibrante.", tag: "City & Playa", tagColor: "bg-yellow-500/20 text-yellow-300", icon: Palmtree, category: "internacional", price: 698000, duration: "5 dias" },
  { name: "Florianopolis", subtitle: "Brasil", image: "/images/florianopolis.png", description: "La isla de la magia. 42 playas paradisiacas, dunas, selva atlantica y una gastronomia que enamora. El destino brasileno perfecto.", tag: "Playa & Naturaleza", tagColor: "bg-cyan-500/20 text-cyan-300", icon: Waves, category: "internacional", price: 593000, duration: "5 dias", originalPrice: 698000 },
  { name: "Buenos Aires", subtitle: "Argentina", image: "/images/buenos_aires.png", description: "La paris de Sudamerica. Tango en La Boca, arquitectura europea, bodegones y una noche portena que no tiene fin.", tag: "Cultura & Gastronomia", tagColor: "bg-rose-500/20 text-rose-300", icon: Compass, category: "internacional", price: 450000, duration: "4 dias" },
  { name: "Mendoza", subtitle: "Argentina", image: "/images/mendoza.png", description: "Vinos de altura al pie de los Andes. Bodegas boutique, Aconcagua imponente y la ruta del malbec mas famosa del continente. 15% OFF en abril.", tag: "Vino & Montana", tagColor: "bg-purple-500/20 text-purple-300", icon: Mountain, category: "internacional", price: 586700, duration: "5 dias", originalPrice: 690300 },
];

const destinoOptions = destinations.map((d) => d.name).concat(["Otro destino"]);

const promotions = [
  { title: "Destino del Mes ABRIL", subtitle: "Mendoza, Argentina", discount: "15% OFF", emoji: "🍷", destination: "Mendoza" },
  { title: "Travel SALE", subtitle: "Florianopolis, Brasil", discount: "15% OFF", emoji: "🌴", destination: "Florianopolis" },
  { title: "Tapati 2027", subtitle: "Rapa Nui", discount: "15% OFF", emoji: "🗿", destination: "Rapa Nui" },
  { title: "Viaje Grupal", subtitle: "Atacama + Uyuni", discount: "Reserva $200.000", emoji: "🏜️", destination: "Atacama" },
  { title: "Temporada Ballenas", subtitle: "Ballenas + Elqui", discount: "25% OFF", emoji: "🐋", destination: "Ballenas" },
  { title: "Patagonia Extrema", subtitle: "Catedrales + Carretera", discount: "20% OFF", emoji: "🏔️", destination: "Patagonia" },
];

const promoDetails = [
  { title: "Destino del Mes ABRIL", subtitle: "Mendoza, Argentina", discount: "15% OFF", destination: "Mendoza", validUntil: "30 Abril 2026", originalPrice: 690300, discountPrice: 586700, emoji: "🍷", image: "/images/mendoza.png" },
  { title: "Travel SALE", subtitle: "Florianopolis, Brasil", discount: "15% OFF", destination: "Florianopolis", validUntil: "31 Mayo 2026", originalPrice: 698000, discountPrice: 593000, emoji: "🌴", image: "/images/florianopolis.png" },
  { title: "Tapati 2027", subtitle: "Rapa Nui", discount: "15% OFF", destination: "Rapa Nui", validUntil: "Febrero 2027", originalPrice: 1126000, discountPrice: 957100, emoji: "🗿", image: "/images/rapanui.png" },
  { title: "Viaje Grupal Agosto", subtitle: "Atacama + Uyuni", discount: "10 dias", destination: "Atacama", validUntil: "03 Agosto 2026", originalPrice: 1658600, discountPrice: 1658600, emoji: "🏜️", image: "/images/uyuni.png" },
  { title: "Temporada Ballenas", subtitle: "Ballenas + Elqui", discount: "25% OFF", destination: "Ballenas", validUntil: "30 Sept 2026", originalPrice: 450000, discountPrice: 337500, emoji: "🐋", image: "/images/ballenas.png" },
  { title: "Patagonia Extrema", subtitle: "Catedrales + Carretera", discount: "20% OFF", destination: "Patagonia", validUntil: "31 Dic 2026", originalPrice: 1500000, discountPrice: 1200000, emoji: "🏔️", image: "/images/marmol.png" },
];

// Stats section removed per user request

const benefits = [
  { icon: Compass, title: "Experiencias a Medida", description: "Cada viaje se diseña exclusivamente para ti. Sin paquetes genericos, solo experiencias unicas." },
  { icon: Clock, title: "Acompanamiento 24/7", description: "Estamos contigo antes, durante y despues de tu viaje. Asistencia permanente." },
  { icon: CreditCard, title: "Pagos a Plazo", description: "Cuota tu viaje en comodas cuotas sin intereses. Tu proxima aventura no tiene que esperar." },
  { icon: Heart, title: "Conexion Autentica", description: "Conexiones reales con culturas locales. No eres turista, eres un viajero que deja huella." },
  { icon: Shield, title: "Respaldo Total", description: "Viaja con la tranquilidad de tener todo cubierto. Seguros y logisticas impecables." },
  { icon: Award, title: "Mejor Precio Garantizado", description: "Accede a tarifas exclusivas y promociones que solo Universo Nomada puede ofrecerte." },
];

const testimonials = [
  { name: "Erika Cerda", destination: "Cusco, Peru", rating: 5, text: "Excelente Agencia, hice un maravilloso viaje a Cusco, todo gestionado. Preocupacion constante tanto de Rocio desde Chile y Mario en Peru. Agradecida por todas sus atenciones, antes, durante y despues de mi viaje. 10000000/10. Totalmente recomendables.", avatar: "EC" },
  { name: "Renan Concha", destination: "San Pedro de Atacama", rating: 5, text: "Queremos agradecer a Universo Nomada por la excelente gestion de nuestro viaje a San Pedro de Atacama. Todo estuvo perfectamente organizado y fue una experiencia inolvidable.", avatar: "RC" },
  { name: "Andrea Cruz", destination: "Rio de Janeiro, Brasil", rating: 5, text: "Maravilloso el viaje a Rio y sus Tour, la agencia preocupada de todos los detalles y siempre disponibles, lo que hace que el viaje se cumpla de acuerdo a lo programado y uno se dedique a disfrutar de un destino hermoso. 100% recomendado viajar con Universo Nomada.", avatar: "AC" },
];

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Destinos", href: "#destinos" },
  { label: "Ofertas", href: "#ofertas" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
];

const filterTabs = ["Todos", "Chile", "Internacional", "Experienciales"];

/* ═══════════════════ DISCOUNT TICKER ═══════════════════ */
function DiscountTicker({ onCotizar }: { onCotizar: () => void }) {
  const tickerItems = [...promotions, ...promotions];
  return (
    <div className="bg-gradient-to-r from-teal via-teal-dark to-teal text-navy overflow-hidden">
      <div className="flex items-center h-10">
        <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap">
          {tickerItems.map((p, i) => (
            <button key={i} onClick={onCotizar}
              className="inline-flex items-center gap-2 px-6 text-sm font-semibold hover:bg-navy/10 transition-colors cursor-pointer">
              <span>{p.emoji}</span>
              <span>{p.title} - {p.subtitle}</span>
              <span className="bg-navy/15 px-2 py-0.5 rounded-full text-xs font-bold">{p.discount}</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

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
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

/* ═══════════════════ LEAD POPUP ═══════════════════ */
function LeadPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.telefono) { toast.error("Completa los campos obligatorios"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Error");
      toast.success("Cotizacion enviada! Te contactaremos pronto.");
      setFormData({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
      setTimeout(onClose, 1500);
    } catch { toast.error("Error al enviar. Intenta de nuevo."); }
    finally { setIsSubmitting(false); }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-navy px-6 py-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal/20 flex items-center justify-center"><Plane className="h-5 w-5 text-teal" /></div>
                <div><h3 className="text-xl font-bold">Cotiza tu Viaje</h3><p className="text-white/60 text-sm">Gratis y sin compromiso</p></div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-navy">Nombre *</label>
                  <Input placeholder="Tu nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="rounded-xl h-11" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-navy">Email *</label>
                  <Input type="email" placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="rounded-xl h-11" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-navy">Telefono *</label>
                  <Input type="tel" placeholder="+56 9 7463 6396" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="rounded-xl h-11" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-navy">Destino</label>
                  <Select value={formData.destino} onValueChange={(val) => setFormData({ ...formData, destino: val })}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>{destinoOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy">Mensaje</label>
                <Textarea placeholder="Cuentanos sobre tu viaje sonado..." value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} className="rounded-xl min-h-[80px] resize-none" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-teal hover:bg-teal-dark text-navy font-bold rounded-full h-12 shadow-lg shadow-teal/20 transition-all hover:scale-[1.02]">
                {isSubmitting ? "Enviando..." : <span className="flex items-center gap-2"><Send className="h-5 w-5" />Solicitar Cotizacion</span>}
              </Button>
              <p className="text-center text-xs text-slate-400">Tu informacion es privada y segura.</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════ ADMIN PANEL ═══════════════════ */
function AdminPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "leads" | "promos">("dashboard");
  const [leads, setLeads] = useState<unknown[]>([]);
  const [statsData, setStatsData] = useState<{ totalLeads: number; totalPromotions: number; recentLeads: unknown[]; byDestination: Record<string, number> } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, statsRes] = await Promise.all([
          fetch("/api/admin/leads"), fetch("/api/admin/stats")
        ]);
        const leadsData = await leadsRes.json();
        const statsDataRes = await statsRes.json();
        setLeads(leadsData.leads || []);
        setStatsData(statsDataRes);
      } catch { toast.error("Error cargando datos"); }
    };
    fetchData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-navy overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal to-amber flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Panel Admin</h1>
              <p className="text-white/50 text-sm">Universo Nomada</p>
            </div>
          </div>
          <Button onClick={onClose} variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
            <X className="h-4 w-4 mr-2" />Cerrar
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {([["dashboard", "Dashboard", TrendingUp], ["leads", "Leads", Users], ["promos", "Promociones", Tag]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === key ? "bg-teal text-navy" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && statsData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-navy-light border-white/5 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-teal/10 flex items-center justify-center"><Users className="h-6 w-6 text-teal" /></div>
                    <div><p className="text-white/50 text-sm">Total Leads</p><p className="text-3xl font-black text-white">{statsData.totalLeads}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-navy-light border-white/5 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber/10 flex items-center justify-center"><Tag className="h-6 w-6 text-amber" /></div>
                    <div><p className="text-white/50 text-sm">Promociones</p><p className="text-3xl font-black text-white">{statsData.totalPromotions}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-navy-light border-white/5 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center"><MapPin className="h-6 w-6 text-violet-400" /></div>
                    <div><p className="text-white/50 text-sm">Destinos</p><p className="text-3xl font-black text-white">{Object.keys(statsData.byDestination).length || 10}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {Object.keys(statsData.byDestination).length > 0 && (
              <Card className="bg-navy-light border-white/5 rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-4">Leads por Destino</h3>
                  <div className="space-y-3">
                    {Object.entries(statsData.byDestination).sort((a, b) => b[1] - a[1]).map(([dest, count]) => (
                      <div key={dest} className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">{dest}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full bg-teal" style={{ width: `${Math.min(count * 40, 200)}px` }} />
                          <span className="text-teal font-bold text-sm">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Leads Table */}
        {activeTab === "leads" && (
          <Card className="bg-navy-light border-white/5 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="text-white font-bold mb-4">Todos los Leads ({leads.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/10">
                    {["Nombre", "Email", "Telefono", "Destino", "Fecha"].map(h => (
                      <th key={h} className="text-left text-white/50 font-semibold pb-3 pr-4">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {leads.map((lead: unknown, i: number) => {
                      const l = lead as Record<string, unknown>;
                      return (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 pr-4 text-white font-medium">{l.nombre as string}</td>
                          <td className="py-3 pr-4 text-teal">{l.email as string}</td>
                          <td className="py-3 pr-4 text-white/70">{l.telefono as string}</td>
                          <td className="py-3 pr-4 text-white/70">{(l.destino as string) || "-"}</td>
                          <td className="py-3 pr-4 text-white/50">{new Date(l.createdAt as string).toLocaleDateString("es-CL")}</td>
                        </tr>
                      );
                    })}
                    {leads.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-white/30">No hay leads aun</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Promotions */}
        {activeTab === "promos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoDetails.map((p) => (
              <Card key={p.title} className="bg-navy-light border-white/5 rounded-2xl overflow-hidden">
                <div className="relative h-32">
                  <Image src={p.image} alt={p.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-light to-transparent" />
                  <div className="absolute top-2 right-2 bg-coral text-white text-xs font-bold px-2 py-1 rounded-full">{p.discount}</div>
                </div>
                <CardContent className="p-4">
                  <h4 className="text-white font-bold">{p.emoji} {p.title}</h4>
                  <p className="text-white/50 text-sm">{p.subtitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-white/30 line-through text-sm">{formatCLP(p.originalPrice)}</span>
                    <span className="text-teal font-bold">{formatCLP(p.discountPrice)}</span>
                  </div>
                  <p className="text-white/30 text-xs mt-1">Valido hasta {p.validUntil}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function LandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    // Restore session
    const stored = localStorage.getItem("un_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { const timer = setTimeout(() => setIsPopupOpen(true), 15000); return () => clearTimeout(timer); }, []);

  const handleLogin = (u: { id: string; email: string; name: string | null; role: string }) => {
    setUser(u);
    localStorage.setItem("un_user", JSON.stringify(u));
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem("un_user"); toast.success("Sesion cerrada"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.telefono) { toast.error("Completa los campos obligatorios"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Error");
      toast.success("Cotizacion enviada! Te contactaremos pronto.");
      setFormData({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
    } catch { toast.error("Error al enviar."); }
    finally { setIsSubmitting(false); }
  };

  const filteredDestinations = activeFilter === "Todos" ? destinations
    : destinations.filter(d => d.category === activeFilter.toLowerCase().slice(0, -1) || (activeFilter === "Experienciales" && d.category === "experiencial"));

  if (showAdmin && user?.role === "admin") {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-depth">
      {/* ═══════ DISCOUNT TICKER ═══════ */}
      <DiscountTicker onCotizar={() => setIsPopupOpen(true)} />

      {/* ═══════ NAV ═══════ */}
      <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-10 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled ? "bg-navy/95 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-white/5" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo-un.png" alt="Universo Nomada" width={40} height={40} className="rounded-full shadow-lg shadow-teal/20 ring-1 ring-white/10" />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">UNIVERSO</span>
              <span className="text-[10px] sm:text-xs font-bold text-teal tracking-[0.2em] leading-none">NOMADA</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-2 text-sm text-white/60 hover:text-teal transition-colors font-medium rounded-lg hover:bg-white/5">{link.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Button onClick={() => setShowAdmin(true)} size="sm" variant="outline"
                    className="hidden sm:flex bg-white/5 border-white/10 text-white/80 hover:bg-teal hover:text-navy rounded-full text-xs">
                    <LayoutDashboard className="h-3.5 w-3.5 mr-1" />Admin
                  </Button>
                )}
                <span className="hidden sm:inline text-white/60 text-xs">{user.name || user.email}</span>
                <Button onClick={handleLogout} size="sm" variant="ghost" className="text-white/40 hover:text-white rounded-full text-xs">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsAuthOpen(true)} size="sm" variant="outline"
                className="bg-white/5 border-white/10 text-white/80 hover:bg-teal hover:text-navy rounded-full text-xs">
                <LogIn className="h-3.5 w-3.5 mr-1" />Iniciar Sesion
              </Button>
            )}
            <Button onClick={() => setIsPopupOpen(true)} size="sm"
              className="bg-teal hover:bg-teal-dark text-navy font-bold rounded-full px-3 sm:px-5 shadow-lg shadow-teal/20 transition-all hover:scale-105 text-xs">
              Cotiza tu Viaje
            </Button>
            <Button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} size="sm" variant="ghost" className="lg:hidden text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-navy-light border-t border-white/5 overflow-hidden">
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-white/70 hover:text-teal hover:bg-white/5 rounded-xl transition-colors text-sm font-medium">{link.label}</a>
                ))}
                {!user && (
                  <button onClick={() => { setIsAuthOpen(true); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-white/70 hover:text-teal hover:bg-white/5 rounded-xl transition-colors text-sm font-medium flex items-center gap-2">
                    <LogIn className="h-4 w-4" />Iniciar Sesion
                  </button>
                )}
                {user?.role === "admin" && (
                  <button onClick={() => { setShowAdmin(true); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-white/70 hover:text-teal hover:bg-white/5 rounded-xl transition-colors text-sm font-medium flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />Panel Admin
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════ HERO ═══════ */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image src="/images/hero-new.png" alt="Paisaje Patagonia Chile" fill className="object-cover" priority quality={95} />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy-glow/30 to-navy" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/60 via-transparent to-navy-glow/20" />
        </div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-teal/5 rounded-full blur-3xl float-animation" />
        <div className="absolute bottom-1/3 left-1/5 w-48 h-48 bg-amber/5 rounded-full blur-3xl float-animation" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-navy-glow/10 rounded-full blur-[100px] float-animation" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto pt-28">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full glass">
              <Sparkles className="h-4 w-4 text-amber" />
              <span className="text-white/80 text-sm font-medium">Experiencias que transforman</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight mb-2">UNIVERSO</h1>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight gradient-text">NOMADA</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }}
            className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
Agencia de viajes boutique especializada en experiencias personalizadas y autenticas en destinos cuidadosamente seleccionados de Chile y Sudamerica.
          </motion.p>

          {/* Search Bar like geoterra */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.8 }}
            className="mt-8 sm:mt-10 max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5">
                <MapPin className="h-5 w-5 text-teal shrink-0" />
                <Select value={formData.destino} onValueChange={(val) => setFormData({ ...formData, destino: val })}>
                  <SelectTrigger className="border-0 bg-transparent text-white p-0 h-auto focus:ring-0"><SelectValue placeholder="Donde quieres ir?" /></SelectTrigger>
                  <SelectContent>{destinoOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5">
                <Calendar className="h-5 w-5 text-teal shrink-0" />
                <Input placeholder="Fecha" className="border-0 bg-transparent text-white placeholder:text-white/40 p-0 h-auto focus-visible:ring-0" />
              </div>
              <Button onClick={() => setIsPopupOpen(true)} className="bg-teal hover:bg-teal-dark text-navy font-bold rounded-xl px-6 h-12 shadow-lg shadow-teal/20 transition-all hover:scale-105">
                Buscar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1 }}
            className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => setIsPopupOpen(true)} size="lg"
              className="bg-teal hover:bg-teal-dark text-navy text-lg font-bold rounded-full px-10 py-6 shadow-2xl shadow-teal/30 transition-all hover:scale-105">
              Cotiza tu Viaje Gratis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="bg-white/5 backdrop-blur-sm border-white/15 text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg font-semibold" asChild>
              <a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />WhatsApp
              </a>
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }} className="mt-14">
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-white/30">
              <span className="text-xs uppercase tracking-widest">Descubre</span><ArrowDown className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats section removed per user request */}

      {/* ═══════ DESTINATIONS WITH FILTERS ═══════ */}
      <section id="destinos" className="py-16 sm:py-24 bg-navy-depth relative overflow-hidden ambient-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="text-teal font-semibold text-sm uppercase tracking-[0.2em]">Destinos</span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Explora lo imposible</h2>
              <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">Cada destino es una puerta a lo extraordinario.</p>
            </div>
          </FadeIn>

          {/* Filter Tabs */}
          <FadeIn delay={0.1}>
            <div className="flex items-center justify-center gap-2 mb-10">
              {filterTabs.map((tab) => (
                <button key={tab} onClick={() => setActiveFilter(tab)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeFilter === tab ? "bg-teal text-navy shadow-lg shadow-teal/20" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Destination Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDestinations.map((dest, i) => (
              <FadeIn key={dest.name} delay={i * 0.05}>
                <Card className="group overflow-hidden border-white/5 bg-navy-light hover:bg-navy-mid shadow-none hover:shadow-xl hover:shadow-teal/5 card-depth transition-all duration-500 rounded-2xl cursor-pointer"
                  onClick={() => setIsPopupOpen(true)}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={dest.image} alt={dest.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-light via-transparent to-transparent" />
                    <span className={`absolute top-3 left-3 inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${dest.tagColor}`}>{dest.tag}</span>
                    <button onClick={(e) => { e.stopPropagation(); }} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-coral hover:bg-coral/20 transition-all">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-white/50 text-xs flex items-center gap-1 mb-1"><MapPin className="h-3 w-3" />{dest.subtitle}</p>
                    <h3 className="text-white font-bold text-lg leading-tight mb-2">{dest.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white/40 text-xs">Desde</span>
                        {dest.originalPrice ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-white/30 line-through text-xs">{formatCLP(dest.originalPrice)}</span>
                            <p className="text-teal font-bold">{formatCLP(dest.price)}</p>
                          </div>
                        ) : (
                          <p className="text-teal font-bold">{formatCLP(dest.price)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <Clock className="h-3 w-3" />{dest.duration}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ OFERTAS / PROMOCIONES ═══════ */}
      <section id="ofertas" className="py-16 sm:py-24 bg-navy-light-depth relative overflow-hidden ambient-glow">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,201,167,0.05)_0%,_transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-amber font-semibold text-sm uppercase tracking-[0.2em]">Ofertas Exclusivas</span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Descuentos del mes</h2>
              <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">Promociones por tiempo limitado que no puedes dejar pasar.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoDetails.map((promo, i) => (
              <FadeIn key={promo.title} delay={i * 0.1}>
                <Card className="group overflow-hidden border-white/5 bg-navy hover:bg-navy-mid shadow-none hover:shadow-xl hover:shadow-teal/5 card-depth transition-all duration-500 rounded-2xl cursor-pointer"
                  onClick={() => setIsPopupOpen(true)}>
                  <div className="relative h-48 overflow-hidden">
                    <Image src={promo.image} alt={promo.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                    <div className="absolute top-3 right-3 bg-coral text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">{promo.discount}</div>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-2xl">{promo.emoji}</span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-white font-bold text-lg mb-1">{promo.title}</h3>
                    <p className="text-white/50 text-sm mb-3">{promo.subtitle}</p>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-white/30 line-through text-sm">{formatCLP(promo.originalPrice)}</span>
                      <span className="text-teal font-bold text-xl">{formatCLP(promo.discountPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/30 text-xs flex items-center gap-1"><Clock className="h-3 w-3" />Hasta {promo.validUntil}</span>
                      <Button size="sm" className="bg-teal hover:bg-teal-dark text-navy font-bold rounded-full text-xs px-4 shadow-lg shadow-teal/20">
                        Ver Oferta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ NOSOTROS ═══════ */}
      <section id="nosotros" className="py-16 sm:py-24 bg-navy-depth relative overflow-hidden ambient-glow">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <span className="text-teal font-semibold text-sm uppercase tracking-[0.2em]">Quienes Somos</span>
                <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Somos Universo Nomada</h2>
                <p className="mt-6 text-white/60 text-lg leading-relaxed">
                  Universo Nomada es una agencia de viajes boutique especializada en disenar experiencias personalizadas y autenticas en destinos cuidadosamente seleccionados de Chile y Sudamerica.
                </p>
                <p className="mt-4 text-white/60 text-lg leading-relaxed">
                  Nuestro enfoque combina naturaleza, cultura y aprendizaje, conectando a los viajeros con comunidades locales, paisajes unicos y vivencias significativas, todo con un alto estandar de calidad, sostenibilidad y atencion cercana.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {benefits.slice(0, 4).map((b) => (
                    <div key={b.title} className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><b.icon className="h-5 w-5 text-teal" /></div>
                      <div><h4 className="text-white font-semibold text-sm">{b.title}</h4><p className="text-white/40 text-xs mt-0.5">{b.description}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                  <Image src="/images/experiencia_andes.png" alt="Experiencias ancestrales en los Andes" fill className="object-cover" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-teal rounded-2xl px-6 py-4 shadow-xl shadow-teal/20">
                  <p className="text-navy font-black text-2xl">14+</p>
                  <p className="text-navy/70 text-sm font-medium">Destinos unicos</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-16 sm:py-24 bg-navy-light-depth relative overflow-hidden ambient-glow">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,201,167,0.05)_0%,_transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-amber font-semibold text-sm uppercase tracking-[0.2em]">Testimonios</span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Historias que inspiran</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.15}>
                <Card className="h-full border-white/5 bg-navy shadow-none hover:shadow-xl hover:shadow-teal/5 card-depth transition-all duration-500 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, si) => <Star key={si} className="h-4 w-4 fill-amber text-amber" />)}
                    </div>
                    <p className="text-white/80 leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal font-bold text-sm">{t.avatar}</div>
                      <div><p className="text-sm font-semibold text-white">{t.name}</p><p className="text-xs text-white/40 flex items-center gap-1"><MapPin className="h-3 w-3" />{t.destination}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA BANNER ═══════ */}
      <section className="py-16 sm:py-20 bg-navy-depth relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/elqui-new.png" alt="Valle del Elqui" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Tu proximo viaje comienza aqui</h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">Dejanos disenar la experiencia que mereces. Cotizacion gratuita y sin compromiso.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => setIsPopupOpen(true)} size="lg"
                className="bg-teal hover:bg-teal-dark text-navy font-bold rounded-full px-10 py-7 text-lg shadow-2xl shadow-teal/30 transition-all hover:scale-105">
                Cotiza Ahora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="bg-white/5 border-white/15 text-white hover:bg-white/10 rounded-full px-8 py-7 text-lg font-semibold" asChild>
                <a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-5 w-5" />WhatsApp</a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════ CONTACT / FORM ═══════ */}
      <section id="contacto" ref={formRef} className="py-16 sm:py-24 bg-navy-light-depth">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <FadeIn>
              <div>
                <span className="text-teal font-semibold text-sm uppercase tracking-[0.2em]">Contacto</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">Hablemos de tu viaje</h2>
                <p className="mt-4 text-white/50 text-lg leading-relaxed">Estamos listos para ayudarte a disenar la experiencia perfecta.</p>
                <div className="mt-8 space-y-4">
                  <a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-[#25D366]/10 border border-white/5 transition-all group">
                    <div className="h-12 w-12 rounded-xl bg-[#25D366]/20 flex items-center justify-center"><MessageCircle className="h-6 w-6 text-[#25D366]" /></div>
                    <div><p className="text-white font-semibold">WhatsApp</p><p className="text-white/50 text-sm">{PHONE_DISPLAY}</p></div>
                    <ArrowRight className="h-4 w-4 text-white/20 ml-auto group-hover:text-[#25D366] group-hover:translate-x-1 transition-all" />
                  </a>
                  <a href={`mailto:${EMAIL}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-teal/5 border border-white/5 transition-all group">
                    <div className="h-12 w-12 rounded-xl bg-teal/10 flex items-center justify-center"><Mail className="h-6 w-6 text-teal" /></div>
                    <div><p className="text-white font-semibold">Email</p><p className="text-white/50 text-sm">{EMAIL}</p></div>
                    <ArrowRight className="h-4 w-4 text-white/20 ml-auto group-hover:text-teal group-hover:translate-x-1 transition-all" />
                  </a>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="h-12 w-12 rounded-xl bg-amber/10 flex items-center justify-center"><MapPin className="h-6 w-6 text-amber" /></div>
                    <div><p className="text-white font-semibold">Ubicacion</p><p className="text-white/50 text-sm">La Serena, Chile</p></div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form */}
            <FadeIn delay={0.2}>
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5 shadow-2xl rounded-3xl">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="nombre" className="text-sm font-semibold text-white/80">Nombre *</label>
                        <Input id="nombre" placeholder="Tu nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal h-11" required />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-semibold text-white/80">Email *</label>
                        <Input id="email" type="email" placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal h-11" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="telefono" className="text-sm font-semibold text-white/80">Telefono *</label>
                        <Input id="telefono" type="tel" placeholder={PHONE_DISPLAY} value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal h-11" required />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="destino" className="text-sm font-semibold text-white/80">Destino</label>
                        <Select value={formData.destino} onValueChange={(val) => setFormData({ ...formData, destino: val })}>
                          <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white h-11 focus:ring-teal"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                          <SelectContent>{destinoOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="mensaje" className="text-sm font-semibold text-white/80">Mensaje</label>
                      <Textarea id="mensaje" placeholder="Cuentanos sobre tu viaje sonado..." value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                        className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal min-h-[100px] resize-none" />
                    </div>
                    <Button type="submit" disabled={isSubmitting}
                      className="w-full bg-teal hover:bg-teal-dark text-navy font-bold text-lg rounded-full h-14 shadow-lg shadow-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      {isSubmitting ? "Enviando..." : <span className="flex items-center gap-2"><Send className="h-5 w-5" />Solicitar Cotizacion</span>}
                    </Button>
                    <p className="text-center text-xs text-white/30">Tu informacion es privada y segura.</p>
                  </form>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-navy border-t border-navy-glow/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Image src="/images/logo-un.png" alt="Universo Nomada" width={44} height={44} className="rounded-full shadow-lg shadow-teal/20 ring-1 ring-white/10" />
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-white leading-none">UNIVERSO</span>
                  <span className="text-xs font-bold text-teal tracking-[0.2em] leading-none">NOMADA</span>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">Agencia de viajes boutique especializada en experiencias personalizadas y autenticas en Chile y Sudamerica.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5 text-white/50 hover:text-teal transition-colors">
                  <Mail className="h-4 w-4 text-teal shrink-0" /><a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </li>
                <li className="flex items-center gap-2.5 text-white/50 hover:text-teal transition-colors">
                  <Phone className="h-4 w-4 text-teal shrink-0" /><a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer">{PHONE_DISPLAY}</a>
                </li>
                <li className="flex items-start gap-2.5 text-white/50">
                  <MapPin className="h-4 w-4 text-teal shrink-0 mt-0.5" /><span>La Serena, Chile</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Destinos</h4>
              <ul className="space-y-2 text-sm">
                {destinations.slice(0, 8).map((d) => (
                  <li key={d.name}><button onClick={() => setIsPopupOpen(true)} className="text-white/50 hover:text-teal transition-colors">{d.name}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Siguenos</h4>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com/universonomada" target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-teal hover:text-navy text-white/60 transition-all duration-300" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://facebook.com/universonomada" target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-teal hover:text-navy text-white/60 transition-all duration-300" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-[#25D366] hover:text-white text-white/60 transition-all duration-300" aria-label="WhatsApp">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-6 space-y-2 text-sm text-white/30">
                <a href="#" className="block hover:text-teal transition-colors">Politica de Privacidad</a>
                <a href="#" className="block hover:text-teal transition-colors">Terminos y Condiciones</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-10 pt-8 flex flex-col items-center gap-2 text-sm text-white/25">
            <p>&copy; {new Date().getFullYear()} Universo Nomada. Todos los derechos reservados.</p>
            <p className="text-white/20 text-xs">Respaldo SERNATUR &middot; La Serena, Chile</p>
          </div>
        </div>
      </footer>

      {/* ═══════ WHATSAPP FLOATING ═══════ */}
      <motion.a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/30 hover:scale-110 transition-transform"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        aria-label="WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </motion.a>

      {/* ═══════ POPUPS ═══════ */}
      <LeadPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />
    </div>
  );
}
