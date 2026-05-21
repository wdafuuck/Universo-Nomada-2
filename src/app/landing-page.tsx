"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MapPin, Search, Calendar, Users, ChevronDown, ArrowRight, Star, Plane, Ship, Train, Bus, Car, Mountain, Waves, Trees, Building, Camera, Heart, Compass, Clock, DollarSign, Menu, X, Instagram, Facebook, Mail, Phone, ChevronLeft, ChevronRight, Plus, Minus, Check, AlertCircle, Info, Shield, Award, Globe, Zap, Target, Sparkles, Flame, Navigation, Binoculars, Palmtree, TreePine, CreditCard, Send, MessageCircle } from 'lucide-react';
import type { Destination, Promotion } from "@prisma/client";
import { formatCLP, isValidPhone } from "@/lib/format";
import { Honeypot } from "@/components/honeypot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

/* ═══════════════════ CONSTANTS ═══════════════════ */
const WHATSAPP_URL = "https://wa.me/56974636396";
const WHATSAPP_TEXT = "?text=Hola!%20Quiero%20cotizar%20un%20viaje%20con%20Universo%20Nomada";
const WHATSAPP_FULL = WHATSAPP_URL + WHATSAPP_TEXT;
const PHONE_DISPLAY = "+56 9 7463 6396";
const EMAIL = "contacto@universonomada.cl";

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

/* ═══════════════════ DATA HELPERS ═══════════════════ */
const VALID_UNTIL_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
function formatValidUntil(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return VALID_UNTIL_FORMATTER.format(date);
}

const benefits = [
  { icon: Compass, title: "Experiencias a Medida", description: "Cada viaje se diseña exclusivamente para ti. Sin paquetes genericos, solo experiencias unicas." },
  { icon: Clock, title: "Acompanamiento 24/7", description: "Estamos contigo antes, durante y despues de tu viaje. Asistencia permanente." },
  { icon: CreditCard, title: "Pagos a Plazo", description: "Cuota tu viaje en comodas cuotas sin intereses. Tu proxima aventura no tiene que esperar." },
  { icon: Heart, title: "Conexion Autentica", description: "Conexiones reales con culturas locales. No eres turista, eres un viajero que deja huella." },
  { icon: Shield, title: "Respaldo Total", description: "Viaja con la tranquilidad de tener todo cubierto. Seguros y logisticas impecables." },
  { icon: Award, title: "Mejor Precio Garantizado", description: "Accede a tarifas exclusivas y promociones que solo Universo Nomada puede ofrecerte." },
];

const testimonials = [
  { name: "Tania Lovera", destination: "Cusco, Peru", rating: 5, text: "Infinitamente agradecida de Universo Nómada, más que una agencia fue una constante compañera de ruta!!!", avatar: "TL" },
  { name: "Erika Cerda", destination: "Cusco, Peru", rating: 5, text: "Excelente Agencia, hice un maravilloso viaje a Cusco, todo gestionado. Preocupacion constante tanto de Rocio desde Chile y Mario en Peru. Agradecida por todas sus atenciones, antes, durante y despues de mi viaje. 10000000/10. Totalmente recomendables.", avatar: "EC" },
  { name: "Renan Concha", destination: "San Pedro de Atacama", rating: 5, text: "Queremos agradecer a Universo Nomada por la excelente gestion de nuestro viaje a San Pedro de Atacama. Todo estuvo perfectamente organizado y fue una experiencia inolvidable.", avatar: "RC" },
  { name: "Andrea Cruz", destination: "Rio de Janeiro, Brasil", rating: 5, text: "Maravilloso el viaje a Rio y sus Tour, la agencia preocupada de todos los detalles y siempre disponibles, lo que hace que el viaje se cumpla de acuerdo a lo programado y uno se dedique a disfrutar de un destino hermoso. 100% recomendado viajar con Universo Nomada.", avatar: "AC" },
  { name: "María José Pérez", destination: "Mendoza, Argentina", rating: 5, text: "Increíble experiencia en Mendoza! Los viñedos eran espectaculares y el Aconcagua impresionante. El guía fue muy profesional y nos llevó a lugares que no encontraríamos solos. Sin duda volveré a viajar con ellos.", avatar: "MP" },
  { name: "Carlos González", destination: "Uyuni, Bolivia", rating: 5, text: "El viaje al Salar de Uyuni fue mágico. Todo perfectamente coordinado, desde los hoteles hasta los tours. La atención de Universo Nomada fue excepcional durante todo el proceso. 100% confiable.", avatar: "CG" },
  { name: "Fernanda López", destination: "Rapa Nui", rating: 5, text: "Mi sueño era conocer Rapa Nui y Universo Nomada lo hizo posible. Todo impecable, desde los vuelos hasta los tours. La cultura rapanui es fascinante y gracias a ellos pudimos vivirla plenamente.", avatar: "FL" },
  { name: "Diego Martín", destination: "Patagonia, Chile", rating: 5, text: "Expeditión Patagonia fue una aventura increíble. Las Catedrales de Marmol son espectaculares. La logística fue perfecta a pesar de lo remoto de los lugares. Muy profesionales!", avatar: "DM" },
  { name: "Camila Silva", destination: "Valle del Elqui", rating: 5, text: "Noches mágicas en Elqui observando estrellas. Universo Nomada organizó todo perfecto, desde el alojamiento hasta los tours astronómicos. Una experiencia que nunca olvidaré.", avatar: "CS" }
];

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Ofertas", href: "#ofertas" },
  { label: "Viajes Grupales", href: "#viajes-grupales" },
  { label: "Destinos", href: "#destinos" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
];

const groupTrips = [
  {
    name: "San Pedro de Atacama",
    duration: "4D/3N",
    dates: ["Del 25 al 28 de junio", "Del 16 al 19 de junio"],
    price: 784000,
    reservation: 100000,
    includes: ["Vuelo", "Seguro", "Transfer", "Hotel + desayuno", "5 tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    image: "/images/atacama-new.png",
    gradient: "from-orange-500 to-red-600"
  },
  {
    name: "Uyuni",
    duration: "6D/5N",
    dates: ["Del 14 al 19 de Septiembre"],
    price: 968700,
    reservation: 100000,
    includes: ["Vuelo + equipaje", "Seguro", "Transfer", "Hotel + desayuno + almuerzo + cena", "Tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    image: "/images/uyuni.png",
    gradient: "from-cyan-500 to-blue-600"
  },
  {
    name: "Rapa Nui",
    duration: "5D/4N",
    dates: ["Del 14 al 18 de agosto"],
    price: 1205000,
    reservation: 200000,
    includes: ["Vuelo + equipaje", "Seguro", "Transfer + collar de Flores", "Hotel + desayuno", "Tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    image: "/images/rapanui.png",
    gradient: "from-violet-500 to-purple-600"
  }
];

const filterTabs = ["Todos", "Chile", "Internacional", "Experienciales"];

/* ═══════════════════ TRAVEL FORM POPUP ═══════════════════ */
function TravelFormPopup({ isOpen, onClose, destinoOptions }: { isOpen: boolean; onClose: () => void; destinoOptions: string[] }) {
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    // Datos Personales
    nombreCompleto: "",
    rutPasaporte: "",
    telefono: "",
    email: "",
    instagram: "",
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
    if (!isValidPhone(formData.telefono)) {
      toast.error("Ingresa un teléfono válido");
      return;
    }
    setIsSubmitting(true);
    try {
      const extras = [
        formData.rutPasaporte && `RUT/Pasaporte: ${formData.rutPasaporte}`,
        formData.instagram && `Instagram: ${formData.instagram}`,
        formData.fechaViaje && `Fecha de viaje: ${formData.fechaViaje}`,
        formData.cantidadPersonas && `Personas: ${formData.cantidadPersonas}`,
        formData.saludRestricciones && `Salud/Restricciones: ${formData.saludRestricciones}`,
      ].filter(Boolean).join(" · ");

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombreCompleto,
          email: formData.email,
          telefono: formData.telefono,
          destino: formData.destino || null,
          mensaje: extras || null,
          _website: honeypotRef.current?.value ?? "",
        })
      });
      if (!res.ok) throw new Error("Error");
      toast.success("Formulario enviado! Te contactaremos pronto.");
      setFormData({
        nombreCompleto: "",
        rutPasaporte: "",
        telefono: "",
        email: "",
        instagram: "",
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
              <Honeypot ref={honeypotRef} />
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
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Instagram</label>
                    <Input
                      placeholder="@usuario"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="rounded-xl border-gray-200 h-11"
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
                    <Select value={formData.destino} onValueChange={(val) => setFormData({ ...formData, destino: val })}>
                      <SelectTrigger className="rounded-xl h-11 border-gray-200">
                        <SelectValue placeholder="Selecciona destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinoOptions.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
/* ═══════════════════ LEAD POPUP ═══════════════════ */
function LeadPopup({ isOpen, onClose, destinoOptions }: { isOpen: boolean; onClose: () => void; destinoOptions: string[] }) {
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.telefono) { toast.error("Completa los campos obligatorios"); return; }
    if (!isValidPhone(formData.telefono)) { toast.error("Ingresa un teléfono válido"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, _website: honeypotRef.current?.value ?? "" }) });
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
              <Honeypot ref={honeypotRef} />
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

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function LandingPage({
  destinations,
  promotions,
}: {
  destinations: Destination[];
  promotions: Promotion[];
}) {
  const destinoOptions = useMemo(
    () => [...destinations.map((d) => d.name), "Otro destino"],
    [destinations],
  );
  const { t } = useLanguage();
  const formRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isTravelFormOpen, setIsTravelFormOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Show the auto lead popup once per browser session, 15s after first mount.
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("un_popup_shown")) return;
    const timer = setTimeout(() => {
      setIsPopupOpen(true);
      sessionStorage.setItem("un_popup_shown", "1");
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.telefono) { toast.error("Completa los campos obligatorios"); return; }
    if (!isValidPhone(formData.telefono)) { toast.error("Ingresa un teléfono válido"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, _website: honeypotRef.current?.value ?? "" }) });
      if (!res.ok) throw new Error("Error");
      toast.success("Cotizacion enviada! Te contactaremos pronto.");
      setFormData({ nombre: "", email: "", telefono: "", destino: "", mensaje: "" });
    } catch { toast.error("Error al enviar."); }
    finally { setIsSubmitting(false); }
  };

  const FILTER_TO_CATEGORY: Record<string, string> = {
    Chile: "chile",
    Internacional: "internacional",
    Experienciales: "experiencial",
  };
  const filteredDestinations = activeFilter === "Todos"
    ? destinations
    : destinations.filter((d) => d.category === FILTER_TO_CATEGORY[activeFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-navy-depth">
      {/* ═══════ NAV ═══════ */}
      <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled ? "bg-gradient-to-r from-navy/95 via-[#0F2440]/95 to-navy/95 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-teal/10" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo-un.png" alt="Universo Nomada" width={40} height={40} className="rounded-full shadow-lg shadow-teal/20 ring-1 ring-white/10" />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">UNIVERSO</span>
              <span className="text-[10px] sm:text-xs font-bold text-teal tracking-[0.2em] leading-none">NOMADA</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-2 text-sm text-white/60 hover:text-teal transition-colors font-medium rounded-lg hover:bg-white/5">{link.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setIsTravelFormOpen(true)} size="sm"
                className="bg-gradient-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold rounded-full px-3 sm:px-5 shadow-lg shadow-amber/20 transition-all hover:scale-105 text-xs">
                Formulario de Viajes
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
              className="lg:hidden bg-gradient-to-b from-navy-light to-[#0D1B2A] border-t border-white/5 overflow-hidden">
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-white/70 hover:text-teal hover:bg-white/5 rounded-xl transition-colors text-sm font-medium">{link.label}</a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </motion.nav>

      {/* ═══════ HERO - DISEÑO ELEGANTE Y SIMPLE ═══════ */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background - Imagen de playa con pareja feliz */}
        <div className="absolute inset-0">
          <Image 
            src="/images/portada.png" 
            alt="Playa paradisíaca - Universo Nomada" 
            fill 
            className="object-cover object-center" 
            priority 
            quality={100} 
          />
          {/* Overlay sutil para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
        </div>

        {/* Content - Más hacia la izquierda */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full h-full flex items-center">
          <div className="lg:w-1/2 xl:w-2/5 lg:pr-8">
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-white text-left lg:text-left"
            >
            {/* Logo o marca sutil */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <span className="text-sm font-light tracking-widest text-white/80 uppercase">Universo Nomada</span>
            </motion.div>

            {/* Título Principal - Minimalista y poderoso */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-6 leading-tight">
              <span className="block mb-2 text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)' }}>Viajes que</span>
              <span className="block font-semibold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)' }}>transforman</span>
              <span className="block font-light text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)' }}>vidas</span>
            </h1>

            {/* Subtítulo emocional */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-lg sm:text-xl text-white/90 mb-12 leading-relaxed font-light"
            >
              <span className="text-white block" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.6), -1px -1px 1px rgba(0,0,0,0.6)' }}>Descubre destinos que despiertan tu alma y crean recuerdos que durarán para siempre.</span>
              <span className="block mt-2 text-white/80" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.6), -1px -1px 1px rgba(0,0,0,0.6)' }}>Tu próxima gran aventura comienza aquí.</span>
            </motion.p>

            {/* Llamada a la acción simple y elegante */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-start items-center"
            >
              <button 
                onClick={() => setIsPopupOpen(true)}
                className="group bg-white text-gray-900 hover:bg-gray-100 font-medium py-4 px-10 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 text-lg tracking-wide"
              >
                Explorar Destinos
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setIsTravelFormOpen(true)}
                className="text-white hover:text-white/80 font-medium py-4 px-10 rounded-full transition-all duration-300 border border-white/30 hover:border-white/50 text-lg tracking-wide"
              >
                Planificar Viaje
              </button>
            </motion.div>

            {/* Elementos de confianza - Minimalistas */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="mt-20 flex flex-col sm:flex-row gap-8 justify-start items-center text-white/70 text-sm"
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>Excelencia 5 estrellas</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>Viajes 100% seguros</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400" />
                <span>Hecho con amor</span>
              </div>
            </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Indicador de scroll sutil */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-light tracking-widest uppercase">Descubre más</span>
            <motion.div 
              animate={{ y: [0, 6, 0] }} 
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Clean divider - Hero to Ofertas */}
      <div className="relative bg-black">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 block">
          <path d="M0,30 C360,60 720,0 1440,30 L1440,60 L0,60 Z" className="fill-pink-500" />
        </svg>
      </div>

      {/* Stats section removed per user request */}

      {/* ═══════ OFERTAS / PROMOCIONES ═══════ */}
      <section id="ofertas" className="py-16 sm:py-24 bg-gradient-to-b from-pink-500 via-rose-400 to-orange-300 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="bg-white/20 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full">{t('discounts').exclusive}</span>
              <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">{t('discounts').title}</h2>
              <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">{t('discounts').subtitle}</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo, i) => (
              <FadeIn key={promo.title} delay={i * 0.1}>
                <div className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:scale-105"
                  onClick={() => setIsPopupOpen(true)}>
                  {/* Imagen */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {promo.image ? (
                      <Image src={promo.image} alt={promo.title} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-6xl">{promo.emoji}</div>
                    )}
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
                  <div className="p-5">
                    <h3 className="text-gray-900 font-bold text-lg mb-1">{promo.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{promo.subtitle}</p>
                    
                    {/* Precios */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-gray-400 line-through text-sm">Antes: {formatCLP(promo.originalPrice)}</span>
                      <span className="text-green-600 font-black text-2xl">Ahora: {formatCLP(promo.discountPrice)}</span>
                    </div>
                    
                    {/* Fecha y botón */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />Hasta {formatValidUntil(promo.validUntil)}
                      </span>
                      <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full px-4 py-2 text-sm shadow-lg transition-all">
                        Cotizar
                      </button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Clean divider - Ofertas to Viajes */}
      <div className="relative bg-orange-300">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 block">
          <path d="M0,30 C360,0 720,60 1440,30 L1440,60 L0,60 Z" fill="#1A1508" />
        </svg>
      </div>

      {/* ═══════ VIAJES GRUPALES ═══════ */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#1A1508] to-[#0D2818] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,119,6,0.08)_0%,_transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-amber font-semibold text-sm uppercase tracking-[0.2em]">Viajes Grupales</span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Aventura Compartida</h2>
              <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">Viaza con gente apasionada por descubrir nuevos horizontes.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {groupTrips.map((trip, i) => (
              <FadeIn key={trip.name} delay={i * 0.15}>
                <div className={`group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:scale-105 border-2 ${
                  trip.name === 'San Pedro de Atacama' ? 'border-orange-300' :
                  trip.name === 'Uyuni' ? 'border-cyan-300' :
                  'border-purple-300'
                }`}>
                  {/* Badge de descuento */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {trip.reservation === 100000 ? 'Reserva $100.000' : 'Reserva $200.000'}
                    </span>
                  </div>
                  
                  {/* Imagen */}
                  <div className="relative h-80 overflow-hidden rounded-t-2xl">
                    <Image src={trip.image} alt={trip.name} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-110" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${trip.gradient} via-transparent to-transparent opacity-80`} />
                    
                    {/* Duración */}
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
                        {trip.duration}
                      </span>
                    </div>
                    
                    {/* Nombre del destino */}
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-white font-black text-2xl mb-1">{trip.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-white/90 text-sm">(4.9)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido */}
                  <div className="p-6">
                    {/* Fechas */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <span className="font-semibold">Fechas Disponibles:</span>
                      </div>
                      {trip.dates.map((date, idx) => (
                        <div key={idx} className="text-gray-700 text-sm mb-1">
                          • {date}
                        </div>
                      ))}
                    </div>
                    
                    {/* Incluye */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">Todo Incluido:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {trip.includes.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-gray-600 text-xs">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Precio y botón */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-gray-500 line-through text-sm">${(trip.price * 1.2).toLocaleString('es-CL')}</span>
                          <p className="text-gray-900 font-black text-2xl">{formatCLP(trip.price)}</p>
                        </div>
                        <p className="text-gray-600 text-xs font-medium">Por persona</p>
                      </div>
                      <Button onClick={() => setIsPopupOpen(true)} className={`bg-gradient-to-r ${
                        trip.name === 'San Pedro de Atacama' ? 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700' :
                        trip.name === 'Uyuni' ? 'from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700' :
                        'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                      } text-white font-bold rounded-full px-6 py-3 shadow-lg transition-all hover:scale-105`}>
                        Reservar
                      </Button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mountain divider - Viajes to Destinos */}
      <div className="mountain-divider bg-[#0D2818]">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,80 L0,55 Q180,15 360,45 Q540,75 720,30 Q900,0 1080,40 Q1260,70 1440,35 L1440,80 Z" fill="#0A1A14" />
        </svg>
      </div>

      {/* ═══════ DESTINATIONS WITH FILTERS ═══════ */}
      <section id="destinos" className="py-16 sm:py-24 bg-destinos-adventure relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6">
                <div className="h-2 w-2 rounded-full bg-teal animate-pulse" />
                <span className="text-teal text-sm font-semibold">{t('destinations').title}</span>
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mb-6">
                Explora lo
                <span className="block text-teal mt-2">imposible</span>
              </h2>
              <p className="text-white/60 text-xl max-w-3xl mx-auto leading-relaxed">
                {t('destinations').description}
              </p>
            </div>
          </FadeIn>

          {/* Filter Tabs */}
          <FadeIn delay={0.1}>
            <div className="flex items-center justify-center gap-2 mb-10">
              {filterTabs.map((tab) => (
                <button key={tab} onClick={() => setActiveFilter(tab)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeFilter === tab ? "bg-teal text-navy shadow-lg shadow-teal/20" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                  {tab === 'Todos' ? t('destinations').todos : 
                   tab === 'Chile' ? t('destinations').chile : 
                   tab === 'Internacional' ? t('destinations').internacional : 
                   tab === 'Experienciales' ? t('destinations').experienciales : tab}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Destination Cards - Estilo Minimalista Moderno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDestinations.map((dest, i) => (
              <FadeIn key={dest.name} delay={i * 0.05}>
                <Link href={`/detalle-paquete/${dest.id}`} className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Imagen */}
                  <div className="relative h-48 overflow-hidden">
                    <Image src={dest.image} alt={dest.name} fill className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />

                    {/* Badge de categoría */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                        {dest.tag}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    {/* Nombre y ubicación */}
                    <div className="mb-3">
                      <h3 className="text-gray-900 font-bold text-lg leading-tight mb-1">{dest.name}</h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{dest.subtitle}
                      </p>
                    </div>

                    {/* Tipo de destino */}
                    <div className="mb-3">
                      <div className="flex gap-1">
                        {dest.category === 'chile' ? (
                          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                            🇨🇱 Nacional
                          </span>
                        ) : dest.category === 'internacional' ? (
                          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                            🌍 Internacional
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                            ✨ Experiencial
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precio y duración */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-gray-500 text-xs">{t('destinations').desde}</span>
                        {dest.originalPrice ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-gray-400 line-through text-xs">{formatCLP(dest.originalPrice)}</span>
                            <p className="font-bold text-lg text-gray-900">{formatCLP(dest.price)}</p>
                          </div>
                        ) : (
                          <p className="font-bold text-lg text-gray-900">{formatCLP(dest.price)}</p>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />{dest.duration}
                      </div>
                    </div>

                    {/* Botón visual (el card entero es el link) */}
                    <span className="block w-full bg-green-600 group-hover:bg-green-700 text-white font-medium rounded-lg py-2 text-sm text-center transition-colors">
                      {t('destinations').verDetalles}
                    </span>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mountain divider - Destinos to Nosotros */}
      <div className="mountain-divider bg-[#0D1B2A]">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,80 L0,55 Q180,15 360,45 Q540,75 720,30 Q900,0 1080,40 Q1260,70 1440,35 L1440,80 Z" fill="#0D0B1F" />
        </svg>
      </div>

      {/* ═══════ NOSOTROS ═══════ */}
      <section id="nosotros" className="py-16 sm:py-24 bg-nosotros-adventure relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-mountain/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal/3 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
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
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal/10 to-mountain/10 flex items-center justify-center shrink-0"><b.icon className="h-5 w-5 text-teal" /></div>
                      <div><h4 className="text-white font-semibold text-sm">{b.title}</h4><p className="text-white/40 text-xs mt-0.5">{b.description}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="relative">
                <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-900 ring-4 ring-teal/20 ring-offset-4 ring-offset-gray-900">
                  <Image src="/images/nosotros.png" alt="Experiencias Universo Nomada" fill className="object-contain object-center" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-teal to-emerald-600 rounded-2xl px-6 py-4 shadow-xl shadow-teal/20">
                  <p className="text-navy font-black text-2xl">14+</p>
                  <p className="text-navy/70 text-sm font-medium">Destinos unicos</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Mountain divider - Nosotros to Testimonials */}
      <div className="mountain-divider bg-[#0D1B2A]">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,80 L0,40 Q240,80 480,35 Q720,-5 960,40 Q1200,80 1440,30 L1440,80 Z" fill="#1A1508" />
        </svg>
      </div>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-16 sm:py-24 bg-testimonials-adventure relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,119,6,0.06)_0%,_transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-amber font-semibold text-sm uppercase tracking-[0.2em]">Testimonios</span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Historias que inspiran</h2>
            </div>
          </FadeIn>

          {/* Google Reviews Badge */}
          <FadeIn delay={0.05}>
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-white/70 text-sm font-medium">Resenas de Google</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber text-amber" />
                  ))}
                </div>
                <span className="text-amber font-bold text-sm">5.0</span>
              </div>
            </div>
          </FadeIn>

          {/* Slider Automatico de Testimonios - Perfectamente Centrado */}
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="overflow-hidden">
              <div className="flex gap-6 animate-scroll"
                   style={{
                     width: 'fit-content'
                   }}>
                {[...testimonials, ...testimonials].map((t, i) => (
                  <div key={i} className="w-80 flex-shrink-0">
                    <Card className="h-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(t.rating)].map((_, si) => (
                            <Star key={si} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="text-gray-600 text-sm ml-2">{t.rating}.0</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-6 italic text-sm">&ldquo;{t.text}&rdquo;</p>
                        <div className="flex items-center gap-3 border-t pt-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-teal to-emerald-500 text-white font-bold text-sm ring-2 ring-teal/20">
                            {t.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{t.destination}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
            <style jsx>{`
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-scroll {
                animation: scroll 25s linear infinite;
              }
            `}</style>
          </div>
        </div>
      </section>

      
      {/* ═══════ CTA BANNER ═══════ */}
      <section className="py-16 sm:py-20 bg-nosotros-adventure relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/elqui-new.png" alt="Valle del Elqui" fill className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0B1F] via-[#0D0B1F]/80 to-[#0D0B1F]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Tu proximo viaje comienza aqui</h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">Dejanos disenar la experiencia que mereces. Cotizacion gratuita y sin compromiso.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => setIsTravelFormOpen(true)} size="lg"
                className="bg-gradient-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold rounded-full px-10 py-7 text-lg shadow-2xl shadow-amber/30 transition-all hover:scale-105">
                Formulario de Viajes <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <a href={WHATSAPP_FULL} target="_blank" rel="noopener noreferrer" 
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-10 py-7 text-lg shadow-lg shadow-green-500/20 transition-all hover:scale-105 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />WhatsApp
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════ CONTACT / FORM ═══════ */}
      <section id="contacto" ref={formRef} className="py-16 sm:py-24 bg-contacto-adventure relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                    <Honeypot ref={honeypotRef} />
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
      <footer className="bg-navy border-t border-teal/10 mt-auto">
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
                  <MapPin className="h-4 w-4 text-teal shrink-0 mt-0.5" /><span>La Serena, Chile</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Destinos</h4>
              <ul className="space-y-2 text-sm">
                {destinations.slice(0, 8).map((d) => (
                  <li key={d.name}>
                    <Link href={`/detalle-paquete/${d.id}`} className="text-white/50 hover:text-teal transition-colors">{d.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Siguenos</h4>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/universo.nomadaa/" target="_blank" rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white transition-all duration-300" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
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
                <a href="#" className="block hover:text-teal transition-colors">Politica de Privacidad</a>
                <a href="#" className="block hover:text-teal transition-colors">Terminos y Condiciones</a>
              </div>
              
              {/* Registro R */}
              <div className="mt-6 flex justify-center">
                <Image src="/images/logo_r-1.png" alt="Registro R" width={80} height={80} className="opacity-80 hover:opacity-100 transition-opacity" />
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
      <LeadPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} destinoOptions={destinoOptions} />
      <TravelFormPopup isOpen={isTravelFormOpen} onClose={() => setIsTravelFormOpen(false)} destinoOptions={destinoOptions} />
    </div>
  );
}
