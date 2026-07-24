'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Star, Calendar, CheckCircle, Plus, Minus, ShoppingCart, CreditCard, Plane, Hotel, Car, Camera, X, Mountain } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'
import { PriceOffer } from '@/components/PriceOffer'
import { useTourById } from '@/hooks/use-tour-by-id'
import { PackageDetailExtras } from '@/components/package/PackageDetailExtras'
import { PackageAccommodationsSection } from '@/components/package/PackageAccommodationsSection'
import { PackageDetailStickyBar } from '@/components/PackageDetailStickyBar'
import { PackageDetailHero } from '@/components/package/PackageDetailHero'
import { GravityReveal } from '@/components/motion/GravityReveal'
import { CheckoutTrustBar, PaymentMethodBadges } from '@/components/CheckoutTrustBar'
import { PackageViewTracker } from '@/components/seo/PackageViewTracker'

const destinations = [
  {
    id: 'rapa-nui',
    name: 'Rapa Nui',
    subtitle: 'Isla de Pascua, Chile',
    category: 'chile',
    price: 850000,
    duration: '7 días / 6 noches',
    image: '/images/rapanui.png',
    description: 'Descubre el misterio y la belleza de la Isla de Pascua, hogar de los famosos moais.',
    highlights: [
      'Visita a los moais en Ahu Tongariki',
      'Playa de Anakena y sus palmeras',
      'Volcán Rano Raraku',
      'Ceremonia de Takona tradicional',
      'Observación de estrellas en el pacífico'
    ],
    tours: [
      {
        id: 'rapa-full',
        name: 'Tour Completo Rapa Nui',
        duration: '7 días',
        price: 850000,
        description: 'Experiencia completa incluyendo todos los atractivos principales',
        includes: ['Todos los traslados', 'Alojamiento 3 estrellas', 'Guía bilingüe', 'Entradas a todos los sitios', 'Desayunos'],
        icon: Plane
      },
      {
        id: 'rapa-cultural',
        name: 'Tour Cultural 5 Días',
        duration: '5 días',
        price: 650000,
        description: 'Enfoque en la cultura y tradiciones rapanui',
        includes: ['Traslados principales', 'Alojamiento', 'Guía cultural', 'Ceremonias tradicionales', 'Desayunos'],
        icon: Camera
      },
      {
        id: 'rapa-aventura',
        name: 'Tour Aventura 4 Días',
        duration: '4 días',
        price: 550000,
        description: 'Aventura y exploración de los sitios más icónicos',
        includes: ['Traslados terrestres', 'Alojamiento básico', 'Guía de aventura', 'Trekking', 'Equipamiento'],
        icon: Car
      }
    ],
    includes: [
      'Traslados aeropuerto-hotel-aeropuerto',
      'Alojamiento en hotel 3 estrellas',
      'Desayuno diario',
      'Guías locales bilingües',
      'Entradas a parques y sitios arqueológicos',
      '3 tours a elección'
    ],
    notIncludes: [
      'Pasajes aéreos',
      'Almuerzos y cenas',
      'Seguro de viaje',
      'Propinas'
    ]
  },
  {
    id: 'patagonia',
    name: 'Patagonia',
    subtitle: 'Torres del Paine, Chile',
    category: 'chile',
    price: 1200000,
    duration: '5 días / 4 noches',
    image: '/images/patagonia.png',
    description: 'Explora la naturaleza salvaje de la Patagonia chilena con sus imponentes glaciares y montañas.',
    highlights: [
      'Torres del Paine Base Las Torres',
      'Glaciar Grey navegación',
      'Fauna nativa: guanacos, cóndores',
      'Lagos de colores turquesa',
      'Senderismo en el corazón de la Patagonia'
    ],
    tours: [
      {
        id: 'paine-full',
        name: 'Torres del Paine Completo',
        duration: '5 días',
        price: 1200000,
        description: 'Experiencia completa en el corazón de la Patagonia',
        includes: ['Traslados', 'Refugios premium', 'Todas las comidas', 'Guía experto', 'Equipo completo'],
        icon: Mountain
      },
      {
        id: 'paine-trekking',
        name: 'Trekking Paine W',
        duration: '4 días',
        price: 950000,
        description: 'Ruta clásica W con los mejores paisajes',
        includes: ['Traslados', 'Refugios básicos', 'Comidas', 'Guía de trekking', 'Permisos'],
        icon: Car
      },
      {
        id: 'paine-glacier',
        name: 'Glaciares y Navegación',
        duration: '3 días',
        price: 750000,
        description: 'Enfoque en glaciares y navegación por lagos',
        includes: ['Traslados', 'Alojamiento', 'Comidas', 'Navegación glaciar', 'Equipamiento'],
        icon: Camera
      }
    ],
    includes: [
      'Traslados desde Puerto Natales',
      'Refugios de montaña',
      'Todas las comidas',
      'Guía profesional de montaña',
      'Equipo de seguridad',
      'Permisos de parque nacional'
    ],
    notIncludes: [
      'Equipamiento personal',
      'Pasajes aéreos',
      'Seguro de rescate',
      'Alquiler de equipo especializado'
    ]
  },
  {
    id: 'atacama',
    name: 'Desierto de Atacama',
    subtitle: 'San Pedro de Atacama, Chile',
    category: 'chile',
    price: 650000,
    duration: '4 días / 3 noches',
    image: '/images/atacama.png',
    description: 'El lugar más seco del mundo te espera con sus geiseres, lagunas coloridas y cielos estrellados.',
    highlights: [
      'Geiseres del Tatio al amanecer',
      'Lagunas Cejar y Chaxa',
      'Valle de la Luna',
      'Observatorio astronómico',
      'Pukará de Quitor'
    ],
    tours: [
      {
        id: 'atacama-full',
        name: 'Atacama Completo',
        duration: '4 días',
        price: 650000,
        description: 'Experiencia completa del desierto más árido del mundo',
        includes: ['Alojamiento cabañas', 'Todos los traslados', 'Desayunos', 'Guías expertos', 'Entradas completas'],
        icon: Star
      },
      {
        id: 'atacama-astronomico',
        name: 'Tour Astronómico',
        duration: '3 días',
        price: 500000,
        description: 'Enfoque en observación de estrellas y fenómenos celestes',
        includes: ['Alojamiento', 'Traslados principales', 'Desayunos', 'Guía astrónomo', 'Equipamiento'],
        icon: Camera
      },
      {
        id: 'atacama-geiseres',
        name: 'Geiseres del Tatio',
        duration: '2 días',
        price: 350000,
        description: 'Visita a los geiseres más altos del mundo',
        includes: ['Traslados', 'Alojamiento básico', 'Guía especializado', 'Entradas', 'Equipamiento'],
        icon: Car
      }
    ],
    includes: [
      'Alojamiento en cabañas',
      'Traslados desde Calama',
      'Desayunos',
      'Guías especializados',
      'Entradas a todos los atractivos',
      'Equipamiento astronómico'
    ],
    notIncludes: [
      'Pasajes aéreos',
      'Almuerzos y cenas',
      'Propinas',
      'Seguro de viaje'
    ]
  },
  {
    id: 'machupicchu',
    name: 'Machu Picchu',
    subtitle: 'Cusco, Perú',
    category: 'internacional',
    price: 1500000,
    duration: '6 días / 5 noches',
    image: '/images/machupicchu.png',
    description: 'La maravilla del mundo inca te espera en esta aventura por los Andes peruanos.',
    highlights: [
      'Ciudadela de Machu Picchu',
      'Camino Inca corto',
      'Valle Sagrado de los Incas',
      'Cusco ciudad imperial',
      'Mercado de Pisac'
    ],
    tours: [
      {
        id: 'machu-full',
        name: 'Machu Picchu Imperial',
        duration: '6 días',
        price: 1500000,
        description: 'Experiencia imperial completa con todo incluido',
        includes: ['Pasajes internos', 'Tren premium', 'Hoteles 4 estrellas', 'Todas las comidas', 'Guías certificados'],
        icon: Plane
      },
      {
        id: 'machu-inca',
        name: 'Camino Inca Corto',
        duration: '4 días',
        price: 1200000,
        description: 'Aventura por el Camino Inca con trekking',
        includes: ['Pasajes', 'Tren', 'Refugios', 'Comidas', 'Guía de montaña', 'Equipamiento'],
        icon: Mountain
      },
      {
        id: 'machu-cultural',
        name: 'Tour Cultural Cusco',
        duration: '3 días',
        price: 800000,
        description: 'Enfoque cultural en Cusco y alrededores',
        includes: ['Pasajes', 'Hotel 3 estrellas', 'Comidas', 'Guía cultural', 'Entradas a museos'],
        icon: Camera
      }
    ],
    includes: [
      'Pasajes Lima-Cusco-Lima',
      'Tren Cusco-Aguas Calientes-Cusco',
      'Hoteles 3 estrellas',
      'Todas las comidas',
      'Guías certificados',
      'Entradas a todos los sitios'
    ],
    notIncludes: [
      'Pasajes internacionales',
      'Seguro de viaje',
      'Propinas',
      'Gastos personales'
    ]
  },
  {
    id: 'uyuni',
    name: 'Salar de Uyuni',
    subtitle: 'Potosí, Bolivia',
    category: 'internacional',
    price: 950000,
    duration: '3 días / 2 noches',
    image: '/images/uyuni.png',
    description: 'El espejo de sal más grande del mundo te ofrecerá paisajes de otro planeta.',
    highlights: [
      'Salar de Uyuni y espejo de agua',
      'Isla Incahuasi con cactus gigantes',
      'Hotel de sal',
      'Lagunas de colores',
      'Flamencos y fauna nativa'
    ],
    tours: [
      {
        id: 'uyuni-classic',
        name: 'Uyuni Clásico 3 Días',
        duration: '3 días',
        price: 950000,
        description: 'Experiencia clásica del salar más grande del mundo',
        includes: ['Traslados', 'Hotel de sal', 'Todas las comidas', 'Guía 4x4', 'Equipamiento'],
        icon: Camera
      },
      {
        id: 'uyuni-luxury',
        name: 'Uyuni Luxury',
        duration: '4 días',
        price: 1200000,
        description: 'Experiencia premium con hotel de lujo en el salar',
        includes: ['Traslados privados', 'Hotel de sal premium', 'Gastronomía gourmet', 'Guía experto', 'Equipamiento completo'],
        icon: Star
      },
      {
        id: 'uyuni-express',
        name: 'Uyuni Express',
        duration: '2 días',
        price: 650000,
        description: 'Tour rápido por los puntos principales del salar',
        includes: ['Traslados básicos', 'Alojamiento', 'Comidas principales', 'Guía', 'Entradas'],
        icon: Car
      }
    ],
    includes: [
      'Traslados desde Uyuni',
      'Alojamiento en hotel de sal',
      'Todas las comidas',
      'Guía local 4x4',
      'Equipamiento para sal',
      'Permiso de ingreso'
    ],
    notIncludes: [
      'Pasajes aéreos',
      'Seguro de viaje',
      'Alquiler de ropa especializada',
      'Propinas'
    ]
  }
]

export default function DetallePaquete() {
  const params = useParams()
  const packageId = params.id as string
  const { tour: liveTour, loading: tourLoading } = useTourById(packageId)

  const [showTourSelection, setShowTourSelection] = useState(false)
  const [selectedTours, setSelectedTours] = useState<string[]>([])
  const [selectedOptionalTours, setSelectedOptionalTours] = useState<string[]>([])

  const toggleOptionalTour = (id: string) => {
    const pickCount = liveTour?.optionalTours?.pickCount ?? 0
    setSelectedOptionalTours((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (pickCount > 0 && prev.length >= pickCount) {
        return [...prev.slice(1), id]
      }
      return [...prev, id]
    })
  }
  const [passengers, setPassengers] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    seniors: 0
  })
  const [showDinnerOption, setShowDinnerOption] = useState(false)
  const [addDinner, setAddDinner] = useState(false)

  const staticDetail = destinations.find(dest => dest.id === packageId)

  const dbIncludes = liveTour?.includes?.length ? liveTour.includes : null
  const dbExcludes = liveTour?.excludes?.length ? liveTour.excludes : null
  const hasBundledTours = Boolean(
    liveTour?.optionalTours?.hasBundledIncluded &&
      liveTour.optionalTours.bundledIncludedTours?.some((t) => t.name?.trim()),
  )
  const hasDbContent = !!(
    dbIncludes ||
    dbExcludes ||
    liveTour?.gallery?.length ||
    liveTour?.faq?.length ||
    liveTour?.pdfUrl ||
    (liveTour?.optionalTours?.pickCount ?? 0) > 0 ||
    (liveTour?.optionalTours?.additionalActivities?.length ?? 0) > 0 ||
    hasBundledTours
  )

  const packageDetail = staticDetail
    ? {
        ...staticDetail,
        ...(liveTour
          ? {
              name: liveTour.name,
              subtitle: liveTour.subtitle,
              image: liveTour.image,
              price: liveTour.price,
              duration: liveTour.duration,
              description: liveTour.description || staticDetail.description,
              highlights: liveTour.highlights ?? [],
            }
          : {}),
      }
    : liveTour
      ? {
          id: liveTour.tourId,
          name: liveTour.name,
          subtitle: liveTour.subtitle,
          image: liveTour.image,
          price: liveTour.price,
          duration: liveTour.duration,
          description: liveTour.description || '',
          category: 'chile',
          highlights: liveTour.highlights ?? [],
          tours: [] as typeof destinations[0]['tours'],
          includes: [] as string[],
          notIncludes: [] as string[],
        }
      : undefined
  
  const calculateTotal = () => {
    const adultPrice = packageDetail?.price || 0
    const childPrice = adultPrice * 0.7 // 30% descuento para niños
    const infantPrice = 0 // Gratis para infantes
    const seniorPrice = adultPrice * 0.9 // 10% descuento para adultos mayores
    
    const total = (passengers.adults * adultPrice) + 
                  (passengers.children * childPrice) + 
                  (passengers.infants * infantPrice) + 
                  (passengers.seniors * seniorPrice)
    
    return addDinner ? total + 45000 : total
  }

  if (!packageDetail && tourLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white/60">Cargando paquete...</p>
      </div>
    )
  }

  if (!packageDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Paquete no encontrado</h1>
          <Link href="/#destinos" className="text-teal hover:text-teal-400 underline">
            Volver a todos los paquetes
          </Link>
        </div>
      </div>
    )
  }

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-0">
      <main id="main-content">
      <PackageViewTracker tourId={packageId} tourName={packageDetail.name} price={packageDetail.price} />
      <PackageDetailHero
        name={packageDetail.name}
        subtitle={packageDetail.subtitle}
        image={packageDetail.image}
        duration={packageDetail.duration}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <GravityReveal once mode="up">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Descripción</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {packageDetail.description}
              </p>
            </section>
            </GravityReveal>

            <GravityReveal once mode="up" delay={0.05}>
            {packageDetail.highlights.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Destacados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {packageDetail.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-teal mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{highlight}</span>
                  </div>
                ))}
              </div>
            </section>
            )}
            </GravityReveal>

            <GravityReveal once mode="up" delay={0.08}>
            {hasDbContent && liveTour ? (
              <PackageDetailExtras
                tour={liveTour}
                selectedTours={selectedOptionalTours}
                onToggleTour={toggleOptionalTour}
              />
            ) : (
              <>
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">¿Qué incluye?</h2>
                  <div className="bg-gray-800 rounded-xl p-6 space-y-3">
                    {packageDetail.includes.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">¿Qué no incluye?</h2>
                  <div className="bg-gray-800 rounded-xl p-6 space-y-3">
                    {packageDetail.notIncludes.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-5 w-5 border-2 border-red-500 rounded-full mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <PackageAccommodationsSection
                  tourId={packageId}
                  tourName={packageDetail.name}
                  fallbackPrice={packageDetail.price}
                />
              </>
            )}
            </GravityReveal>
          </div>

          {/* Sidebar */}
          <div className="md:sticky md:top-6 self-start">
            {/* Price Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-teal/20 shadow-xl shadow-black/30">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
                  <Clock className="h-4 w-4 text-teal" />
                  <span className="text-sm font-medium">{packageDetail.duration}</span>
                </div>
                <PriceOffer
                  price={packageDetail.price}
                  originalPrice={liveTour?.originalPrice}
                  size="lg"
                  theme="dark"
                />
                <p className="mt-3 text-sm text-teal font-semibold leading-snug">
                  {(liveTour?.minDepositPerPerson ?? 0) > 0
                    ? `Abono desde $${(liveTour!.minDepositPerPerson!).toLocaleString("es-CL")} · cuotas sin interés · transferencia`
                    : "Abono mínimo · cuotas sin interés · transferencia"}
                </p>
              </div>

              <AddToCartButton
                tourId={packageId}
                tourName={packageDetail.name}
                image={packageDetail.image}
                basePrice={packageDetail.price}
                duration={packageDetail.duration}
                preselectedOptionalTours={selectedOptionalTours}
                variant="primary"
                className="py-3 rounded-xl min-h-[48px]"
              />

              <div className="mt-4 space-y-3">
                <CheckoutTrustBar minDepositPerPerson={liveTour?.minDepositPerPerson} />
                <PaymentMethodBadges variant="dark" />
              </div>

              {/* Contact Info */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm text-center">
                  También contáctanos en:<br/>
                  <span className="text-teal">+56 9 7463 6396</span><br/>
                  <span className="text-teal">+56 9 7484 1303</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PackageDetailStickyBar
        tourId={packageId}
        tourName={packageDetail.name}
        image={packageDetail.image}
        basePrice={packageDetail.price}
        duration={packageDetail.duration}
        preselectedOptionalTours={selectedOptionalTours}
      />

      {/* Tour Selection Section */}
      {showTourSelection && (
        <section className="py-12 bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-white">Selecciona tus Tours</h3>
              <button
                onClick={() => setShowTourSelection(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {packageId === 'rapa-nui' && (
              <div className="space-y-8">
                {/* Tours Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Full Day Anakena */}
                  <div className={`border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedTours.includes('anakena') ? 'border-teal bg-teal/10' : 'border-gray-600 hover:border-gray-500'
                  }`} onClick={() => {
                    const newSelection = selectedTours.includes('anakena') 
                      ? selectedTours.filter(t => t !== 'anakena')
                      : [...selectedTours, 'anakena']
                    setSelectedTours(newSelection)
                  }}>
                                        <h4 className="font-bold text-white mb-2">Full Day Anakena</h4>
                    <p className="text-gray-400 text-sm mb-4">Disfruta de las playas más hermosas de Rapa Nui con sus palmeras nativas y arena blanca.</p>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-teal font-semibold text-sm mb-1">Lugares a visitar:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Playa de Anakena</li>
                          <li>• Ahu Nau Nau</li>
                          <li>• Ahu Ature Huki</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-green-500 font-semibold text-sm mb-1">Incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Traslado</li>
                          <li>• Guía bilingüe</li>
                          <li>• Box lunch</li>
                          <li>• Entrada al parque</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-red-500 font-semibold text-sm mb-1">No incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Snacks adicionales</li>
                          <li>• Propinas</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Full Day Rano Kau */}
                  <div className={`border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedTours.includes('rano-kau') ? 'border-teal bg-teal/10' : 'border-gray-600 hover:border-gray-500'
                  }`} onClick={() => {
                    const newSelection = selectedTours.includes('rano-kau') 
                      ? selectedTours.filter(t => t !== 'rano-kau')
                      : [...selectedTours, 'rano-kau']
                    setSelectedTours(newSelection)
                  }}>
                                        <h4 className="font-bold text-white mb-2">Full Day Rano Kau</h4>
                    <p className="text-gray-400 text-sm mb-4">Explora el cráter volcánico y los acantilados ceremoniales del suroeste de la isla.</p>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-teal font-semibold text-sm mb-1">Lugares a visitar:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Cráter Rano Kau</li>
                          <li>• Acantilados de Orongo</li>
                          <li>• Ceremoniales de Tangata Manu</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-green-500 font-semibold text-sm mb-1">Incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Traslado 4x4</li>
                          <li>• Guía especializado</li>
                          <li>• Entradas</li>
                          <li>• Equipamiento de seguridad</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-red-500 font-semibold text-sm mb-1">No incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Almuerzo</li>
                          <li>• Calzado especializado</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Cabalgata */}
                  <div className={`border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedTours.includes('cabalgata') ? 'border-teal bg-teal/10' : 'border-gray-600 hover:border-gray-500'
                  }`} onClick={() => {
                    const newSelection = selectedTours.includes('cabalgata') 
                      ? selectedTours.filter(t => t !== 'cabalgata')
                      : [...selectedTours, 'cabalgata']
                    setSelectedTours(newSelection)
                  }}>
                                        <h4 className="font-bold text-white mb-2">Cabalgata por la Isla</h4>
                    <p className="text-gray-400 text-sm mb-4">Recorre paisajes volcánicos a caballo como los antiguos rapanui.</p>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-teal font-semibold text-sm mb-1">Lugares a visitar:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Vistas panorámicas</li>
                          <li>• Campos de lava</li>
                          <li>• Zonas agrícolas antiguas</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-green-500 font-semibold text-sm mb-1">Incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Caballos entrenados</li>
                          <li>• Guía experto</li>
                          <li>• Equipo de equitación</li>
                          <li>• Seguro</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-red-500 font-semibold text-sm mb-1">No incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Botas de montar</li>
                          <li>• Bebidas</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Show de Danzas */}
                  <div className={`border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedTours.includes('danzas') ? 'border-teal bg-teal/10' : 'border-gray-600 hover:border-gray-500'
                  }`} onClick={() => {
                    const newSelection = selectedTours.includes('danzas') 
                      ? selectedTours.filter(t => t !== 'danzas')
                      : [...selectedTours, 'danzas']
                    setSelectedTours(newSelection)
                    setShowDinnerOption(newSelection.includes('danzas'))
                  }}>
                                        <h4 className="font-bold text-white mb-2">Show de Danzas Tradicionales</h4>
                    <p className="text-gray-400 text-sm mb-4">Vive la cultura rapanui con danzas ancestrales y música tradicional.</p>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-teal font-semibold text-sm mb-1">Lugares a visitar:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Centro cultural</li>
                          <li>• Escenario tradicional</li>
                          <li>• Exposición de artesanías</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-green-500 font-semibold text-sm mb-1">Incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Entrada al show</li>
                          <li>• Traslado</li>
                          <li>• Bebida de bienvenida</li>
                          <li>• Explicación cultural</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-red-500 font-semibold text-sm mb-1">No incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Cena</li>
                          <li>• Souvenirs</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Amanecer Tongariki */}
                  <div className={`border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedTours.includes('tongariki') ? 'border-teal bg-teal/10' : 'border-gray-600 hover:border-gray-500'
                  }`} onClick={() => {
                    const newSelection = selectedTours.includes('tongariki') 
                      ? selectedTours.filter(t => t !== 'tongariki')
                      : [...selectedTours, 'tongariki']
                    setSelectedTours(newSelection)
                  }}>
                                        <h4 className="font-bold text-white mb-2">Amanecer en Tongariki</h4>
                    <p className="text-gray-400 text-sm mb-4">Presencia el amanecer mágico con 15 moais alineados mirando al sol.</p>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-teal font-semibold text-sm mb-1">Lugares a visitar:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Ahu Tongariki</li>
                          <li>• Punto de observación</li>
                          <li>• Ruta panorámica</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-green-500 font-semibold text-sm mb-1">Incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Traslado temprano</li>
                          <li>• Café caliente</li>
                          <li>• Guía fotográfico</li>
                          <li>• Entrada especial</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-red-500 font-semibold text-sm mb-1">No incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Desayuno completo</li>
                          <li>• Equipo fotográfico</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Navegación Motus */}
                  <div className={`border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedTours.includes('motus') ? 'border-teal bg-teal/10' : 'border-gray-600 hover:border-gray-500'
                  }`} onClick={() => {
                    const newSelection = selectedTours.includes('motus') 
                      ? selectedTours.filter(t => t !== 'motus')
                      : [...selectedTours, 'motus']
                    setSelectedTours(newSelection)
                  }}>
                                        <h4 className="font-bold text-white mb-2">Navegación por los Motus</h4>
                    <p className="text-gray-400 text-sm mb-4">Explora los islotes volcánicos y observa aves marinas en su hábitat natural.</p>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-teal font-semibold text-sm mb-1">Lugares a visitar:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Motu Nui</li>
                          <li>• Motu Iti</li>
                          <li>• Cuevas marinas</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-green-500 font-semibold text-sm mb-1">Incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Embarcación segura</li>
                          <li>• Guía náutico</li>
                          <li>• Equipo de snorkel</li>
                          <li>• Chaleco salvavidas</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-red-500 font-semibold text-sm mb-1">No incluye:</h5>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Traje de neopreno</li>
                          <li>• Toalla</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dinner Option */}
                {showDinnerOption && selectedTours.includes('danzas') && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addDinner}
                        onChange={(e) => setAddDinner(e.target.checked)}
                        className="w-6 h-6 text-teal bg-gray-700 border-gray-600 rounded focus:ring-teal"
                      />
                      <div>
                        <span className="text-white font-bold text-lg">Adicionar Cena Tradicional</span>
                        <p className="text-black/70">Disfruta de una cena rapanui auténtica con platos típicos <span className="text-black font-bold">+$45.000</span></p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Passenger Selection */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h4 className="font-bold text-white text-xl mb-6">Selecciona Cantidad de Personas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Adultos (12+ años)</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPassengers({...passengers, adults: Math.max(0, passengers.adults - 1)})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="text-white font-bold text-lg w-12 text-center">{passengers.adults}</span>
                        <button
                          onClick={() => setPassengers({...passengers, adults: passengers.adults + 1})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Niños (2-11 años)</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPassengers({...passengers, children: Math.max(0, passengers.children - 1)})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="text-white font-bold text-lg w-12 text-center">{passengers.children}</span>
                        <button
                          onClick={() => setPassengers({...passengers, children: passengers.children + 1})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Infantes (0-2 años)</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPassengers({...passengers, infants: Math.max(0, passengers.infants - 1)})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="text-white font-bold text-lg w-12 text-center">{passengers.infants}</span>
                        <button
                          onClick={() => setPassengers({...passengers, infants: passengers.infants + 1})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Adultos Mayores (60+ años)</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPassengers({...passengers, seniors: Math.max(0, passengers.seniors - 1)})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="text-white font-bold text-lg w-12 text-center">{passengers.seniors}</span>
                        <button
                          onClick={() => setPassengers({...passengers, seniors: passengers.seniors + 1})}
                          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total and Actions */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white font-bold text-2xl">Total:</span>
                    <span className="text-black font-bold text-3xl">{formatCLP(calculateTotal())}</span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowTourSelection(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTours.length === 0) {
                          alert('Por favor selecciona al menos 1 tour')
                          return
                        }
                        if (selectedTours.length > 3) {
                          alert('Solo puedes seleccionar máximo 3 tours')
                          return
                        }
                        const totalPeople = passengers.adults + passengers.children + passengers.infants + passengers.seniors
                        if (totalPeople === 0) {
                          alert('Por favor selecciona al menos 1 persona')
                          return
                        }
                        alert(`¡Reserva confirmada! ${selectedTours.length} tours para ${totalPeople} personas. Total: ${formatCLP(calculateTotal())}`)
                        setShowTourSelection(false)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                    >
                      Confirmar Reserva
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      </main>
    </div>
  )
}
