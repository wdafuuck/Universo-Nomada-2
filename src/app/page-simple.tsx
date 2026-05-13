export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-green-500 text-white p-4 text-center">
        <p>🍷 Destino del Mes ABRIL - Mendoza, Argentina 15% OFF</p>
      </div>
      
      <div className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-blue-600"></div>
        
        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl font-bold mb-4">UNIVERSO NOMADA</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Agencia de viajes boutique especializada en experiencias personalizadas
          </p>
          
          <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">✅ Página de Prueba Funcionando</h2>
            <p className="mb-4">Si puedes ver esto, el servidor funciona correctamente</p>
            <button className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full">
              Botón de Prueba
            </button>
          </div>
        </div>
      </div>
      
      <div className="py-20 px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">Sección de Prueba</h2>
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 max-w-4xl mx-auto">
          <p className="text-xl mb-4">✅ Contenido visible</p>
          <p className="text-xl mb-4">✅ Estilos aplicados</p>
          <p className="text-xl mb-4">✅ Todo funciona correctamente</p>
        </div>
      </div>
    </div>
  );
}
