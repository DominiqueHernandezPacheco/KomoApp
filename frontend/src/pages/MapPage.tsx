import { useState, useEffect } from 'react'
import { MapPin, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MapComponent from '../components/MapComponent'

interface Oferta {
  id: string
  titulo: string
  descripcion: string
  comercio: string
  precio_original: number
  precio_descuento: number
  imagen?: string
  lat?: number
  lng?: number
  distancia?: number
}

export default function MapPage() {
  const navigate = useNavigate()
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [filteredOfertas, setFilteredOfertas] = useState<Oferta[]>([])
  const [maxDistancia, setMaxDistancia] = useState(10)
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null)
  const [loading, setLoading] = useState(true)

  // Función para calcular distancia entre dos coordenadas (Haversine)
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    // Simular carga de ofertas desde API
    const ofertas_mock: Oferta[] = [
      {
        id: '1',
        titulo: 'Pasta integral',
        descripcion: '500g - Vence hoy',
        comercio: 'Supermercado Lerma',
        precio_original: 22.0,
        precio_descuento: 8.0,
        lat: 19.801212,
        lng: -90.608524,
      },
      {
        id: '2',
        titulo: 'Queso fresco',
        descripcion: '250g - Vence en 2 días',
        comercio: 'La Quesería Lerma',
        precio_original: 45.0,
        precio_descuento: 18.0,
        lat: 19.808307,
        lng: -90.594833,
      },
      {
        id: '3',
        titulo: 'Pan artesanal',
        descripcion: '800g - Vence mañana',
        comercio: 'Panadería El Tilín',
        precio_original: 18.0,
        precio_descuento: 7.0,
        lat: 19.848754,
        lng: -90.493273,
      },
      {
        id: '4',
        titulo: 'Frutas variadas',
        descripcion: 'Manzana, pera, naranja - Vence hoy',
        comercio: 'Mercado Centro',
        precio_original: 50.0,
        precio_descuento: 15.0,
        lat: 19.8280,
        lng: -90.5280,
      },
      {
        id: '5',
        titulo: 'Yogurt natural',
        descripcion: '4 unidades - Vence en 1 día',
        comercio: 'Lácteos del Sureste',
        precio_original: 28.0,
        precio_descuento: 12.0,
        lat: 19.8345,
        lng: -90.5420,
      },
      {
        id: '6',
        titulo: 'Tacos campechanos',
        descripcion: '4 piezas - Listo para llevar',
        comercio: 'Taquería Lerma',
        precio_original: 60.0,
        precio_descuento: 25.0,
        lat: 19.8332,
        lng: -90.5318,
      },
      {
        id: '7',
        titulo: 'Café y pan',
        descripcion: 'Café + bizcocho - Sólo hoy',
        comercio: 'Cafetería La Esquina',
        precio_original: 32.0,
        precio_descuento: 11.0,
        lat: 19.8338,
        lng: -90.5362,
      },
      {
        id: '8',
        titulo: 'Carnes frías',
        descripcion: 'Paquete deli 200g - Vence 2 días',
        comercio: 'Carnicería El Buen Corte',
        precio_original: 70.0,
        precio_descuento: 28.0,
        lat: 19.769031,
        lng: -90.496978,
      },
      {
        id: '9',
        titulo: 'Frutas frescas',
        descripcion: 'Cajas surtidas - Vence hoy',
        comercio: 'Frutería El Paraíso',
        precio_original: 55.0,
        precio_descuento: 18.0,
        lat: 19.812965,
        lng: -90.545152,
      },
      {
        id: '10',
        titulo: 'Paquete de pan',
        descripcion: 'Pan dulce - Vence mañana',
        comercio: 'Panadería Champotón',
        precio_original: 38.0,
        precio_descuento: 15.0,
        lat: 19.350161,
        lng: -90.725993,
      },
    ]

    // Simular obtención de ubicación actual para filtrar por distancia
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const ofertasConDistancia = ofertas_mock.map((oferta) => ({
            ...oferta,
            distancia: oferta.lat && oferta.lng ? 
              calcularDistancia(latitude, longitude, oferta.lat, oferta.lng) : 
              undefined,
          }))
          setOfertas(ofertasConDistancia)
          setFilteredOfertas(ofertasConDistancia.filter((o) => !o.distancia || o.distancia <= maxDistancia))
          setLoading(false)
        },
        () => {
          // Si geolocalización falla, mostrar todas las ofertas sin distancia
          setOfertas(ofertas_mock)
          setFilteredOfertas(ofertas_mock)
          setLoading(false)
        }
      )
    }
  }, [])

  useEffect(() => {
    // Filtrar ofertas por distancia
    const filtered = ofertas.filter((o) => !o.distancia || o.distancia <= maxDistancia)
    setFilteredOfertas(filtered)
  }, [maxDistancia, ofertas])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 sm:p-8 rounded-b-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Volver al feed</span>
            </button>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Ofertas cerca de ti</h1>
            </div>
          </div>

          {/* Filtro de distancia */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Radio de búsqueda: <span className="text-indigo-600 font-semibold">{maxDistancia} km</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={maxDistancia}
              onChange={(e) => setMaxDistancia(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500">
              {filteredOfertas.length} oferta{filteredOfertas.length !== 1 ? 's' : ''} encontrada{filteredOfertas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Contenedor del mapa y lista */}
        <div className="grid flex-1 gap-4 p-4 overflow-hidden md:grid-cols-[2fr_1fr]">
          {/* Mapa */}
          <div className="w-full h-[560px] rounded-[32px] overflow-hidden shadow-xl border border-gray-200 bg-white md:h-[760px]">
            <MapComponent 
  ofertas={filteredOfertas} 
  onOfertaClick={(oferta: any) => setSelectedOferta(oferta)} 
/>
          </div>

          {/* Panel lateral con ofertas */}
          <div className="w-full bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Ofertas próximas</h2>
            </div>
            <div className="divide-y">
              {filteredOfertas.length > 0 ? (
                filteredOfertas.map((oferta) => (
                  <div
                    key={oferta.id}
                    onClick={() => setSelectedOferta(oferta)}
                    className={`p-4 cursor-pointer hover:bg-indigo-50 transition-colors ${
                      selectedOferta?.id === oferta.id ? 'bg-indigo-100' : ''
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{oferta.comercio}</div>
                    <div className="text-xs text-gray-600 mt-1">{oferta.titulo}</div>
                    <div className="text-xs text-gray-500 mt-1">{oferta.descripcion}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-gray-400">${oferta.precio_original.toFixed(2)}</span>
                        <span className="text-lg font-bold text-green-600">${oferta.precio_descuento.toFixed(2)}</span>
                      </div>
                      {oferta.distancia && (
                        <span className="text-xs text-blue-600 font-medium">📍 {oferta.distancia.toFixed(1)} km</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No hay ofertas en este radio
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de detalle (si está seleccionado) */}
        {selectedOferta && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900">{selectedOferta.comercio}</h2>
                <p className="text-gray-600 mt-2">{selectedOferta.titulo}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedOferta.descripcion}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl line-through text-gray-400">${selectedOferta.precio_original.toFixed(2)}</span>
                    <span className="text-3xl font-bold text-green-600 ml-2">${selectedOferta.precio_descuento.toFixed(2)}</span>
                  </div>
                  {selectedOferta.distancia && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Distancia</p>
                      <p className="text-lg font-bold text-blue-600">{selectedOferta.distancia.toFixed(1)} km</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedOferta(null)}
                  className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}