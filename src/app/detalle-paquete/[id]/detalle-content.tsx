'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Users, CheckCircle, Send } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Destination } from '@prisma/client'
import { formatCLP, isValidPhone } from '@/lib/format'
import { Honeypot } from '@/components/honeypot'

const WHATSAPP_NUMBER = '56974636396'

export default function DetallePaquete({ dbDestination }: { dbDestination: Destination }) {
  const router = useRouter()

  // Defensive — older Prisma clients in dev (before restart) may not yet know
  // about these array columns, so they come through as undefined.
  const highlights = dbDestination.highlights ?? []
  const includes = dbDestination.includes ?? []
  const notIncludes = dbDestination.notIncludes ?? []

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, quiero cotizar el viaje a ${dbDestination.name}.`
  )}`

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <div className="relative h-96 overflow-hidden">
        <Image
          src={dbDestination.image}
          alt={dbDestination.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
              {dbDestination.name}
            </h1>
            <p className="text-xl text-white/80 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {dbDestination.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Descripción</h2>
              <p className="text-gray-300 leading-relaxed">{dbDestination.description}</p>
            </section>

            {highlights.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Destacados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-teal mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{highlight}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {includes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">¿Qué incluye?</h2>
                <div className="bg-gray-800 rounded-xl p-6 space-y-3">
                  {includes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {notIncludes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">¿Qué no incluye?</h2>
                <div className="bg-gray-800 rounded-xl p-6 space-y-3">
                  {notIncludes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 border-2 border-red-500 rounded-full mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <LeadFormInline destinationName={dbDestination.name} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{dbDestination.duration}</span>
                </div>
                {dbDestination.originalPrice && dbDestination.originalPrice > dbDestination.price && (
                  <div className="text-gray-500 line-through text-sm">
                    {formatCLP(dbDestination.originalPrice)}
                  </div>
                )}
                <div className="text-3xl font-black text-white mb-1">
                  {formatCLP(dbDestination.price)}
                </div>
                <p className="text-gray-400 text-sm">Por persona</p>
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3 rounded-xl text-center transition-colors"
              >
                Cotizar por WhatsApp
              </a>

              <p className="text-gray-500 text-xs text-center mt-3">
                O completa el formulario y te contactamos.
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Información rápida</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-teal" />
                  <span className="text-gray-300">{dbDestination.subtitle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-teal" />
                  <span className="text-gray-300">{dbDestination.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-teal" />
                  <span className="text-gray-300">Grupos reducidos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeadFormInline({ destinationName }: { destinationName: string }) {
  const honeypotRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.telefono) {
      toast.error('Completa nombre, email y teléfono')
      return
    }
    if (!isValidPhone(form.telefono)) {
      toast.error('Ingresa un teléfono válido')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          destino: destinationName,
          _website: honeypotRef.current?.value ?? '',
        }),
      })
      if (!res.ok) throw new Error('Error')
      toast.success('¡Recibido! Te contactaremos pronto.')
      setSent(true)
    } catch {
      toast.error('Error al enviar. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <section className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-6 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-white">Solicitud enviada</h3>
        <p className="text-gray-300 text-sm mt-1">Te contactaremos por email o WhatsApp en las próximas horas.</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-4">Solicita tu cotización</h2>
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <Honeypot ref={honeypotRef} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-white/80">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-white/80">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="tu@email.com"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-white/80">Teléfono *</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="+56 9 1234 5678"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-white/80">Mensaje (opcional)</label>
          <textarea
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            placeholder={`Cuéntanos sobre tu viaje a ${destinationName}…`}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal hover:bg-teal-dark text-navy font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Enviando…' : `Cotizar ${destinationName}`}
        </button>
        <p className="text-xs text-gray-500 text-center">Te respondemos en menos de 24 horas.</p>
      </form>
    </section>
  )
}
