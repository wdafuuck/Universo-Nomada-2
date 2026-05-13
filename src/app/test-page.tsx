"use client";

import { useState } from "react";
import Image from "next/image";

const WHATSAPP_URL = "https://wa.me/56974636396";
const WHATSAPP_TEXT = "?text=Hola!%20Quiero%20cotizar%20un%20viaje%20con%20Universo%20Nomada";
const WHATSAPP_FULL = WHATSAPP_URL + WHATSAPP_TEXT;

export default function TestPage() {
  const [formData, setFormData] = useState({ destino: "" });

  const destinoOptions = [
    "Rapa Nui", "San Pedro de Atacama + Uyuni", "Cusco + Machu Picchu", 
    "Terapias Ancestrales", "Ballenas + Valle del Elqui", "Santiago + Vinedos",
    "Bolivia Amazonica", "Region de Atacama", "Valle del Aconcagua",
    "Catedrales de Marmol + Carretera Austral", "Rio de Janeiro", "Florianopolis",
    "Buenos Aires", "Mendoza", "Otro destino"
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Barra de descuentos */}
      <div className="bg-green-500 text-white py-2 overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          <span className="mx-4">🍷 Destino del Mes ABRIL - Mendoza, Argentina 15% OFF →</span>
          <span className="mx-4">🌴 Travel SALE - Florianopolis, Brasil 15% OFF →</span>
          <span className="mx-4">🗿 Tapati 2027 - Rapa Nui 15% OFF →</span>
          <span className="mx-4">🏜️ Viaje Grupal - Atacama + Uyuni Reserva $200.000 →</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="bg-blue-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
            <span className="font-bold text-xl">UNIVERSO NOMADA</span>
          </div>
          <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full">
            Cotiza tu Viaje
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <Image 
            src="/images/hero-new.png" 
            alt="Paisaje Patagonia Chile" 
            fill 
            className="object-cover" 
            priority 
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 text-white">
          <h1 className="text-6xl font-bold mb-4">UNIVERSO NOMADA</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Agencia de viajes boutique especializada en experiencias personalizadas y autenticas en destinos cuidadosamente seleccionados de Chile y Sudamerica.
          </p>
          
          <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4 max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <select 
                value={formData.destino} 
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                className="flex-1 bg-white bg-opacity-20 text-white p-3 rounded border border-white border-opacity-30"
              >
                <option value="">Donde quieres ir?</option>
                {destinoOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input 
                type="date" 
                className="bg-white bg-opacity-20 text-white p-3 rounded border border-white border-opacity-30"
              />
              <button className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full font-bold">
                Buscar
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-full font-bold text-lg">
              Formulario de Viajes →
            </button>
            <button className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-full font-bold text-lg">
              Cotiza tu Viaje Gratis →
            </button>
            <a href={WHATSAPP_FULL} className="bg-white bg-opacity-20 hover:bg-opacity-30 px-8 py-4 rounded-full font-bold text-lg backdrop-blur-md">
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Sección de prueba */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Si puedes ver esto, la página funciona</h2>
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 text-white">
            <p className="text-xl mb-4">✅ El servidor está funcionando</p>
            <p className="text-xl mb-4">✅ El contenido se está renderizando</p>
            <p className="text-xl mb-4">✅ Las imágenes están cargando</p>
            <p className="text-xl mb-4">✅ Los estilos están aplicados</p>
            <button className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full mt-4">
              Si ves este botón, todo está funcionando
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
