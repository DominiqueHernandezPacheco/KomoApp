import { useState, useEffect } from 'react'
import { MapPin, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOfertas, reservar } from '../api'
import MapComponent from '../components/MapComponent'
import type { Oferta } from '../types'

interface OfertaMapa extends Oferta {
  lat: number
  lng: number
  distancia?: number
}

async function geocodificar(direccion: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(direccion)}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch { /* dirección no geocodificable */ }
  return null
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function MapPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [ofertasMapa, setOfertasMapa] = useState<OfertaMapa[]>([])
  const [filtradas, setFiltradas] = useState<OfertaMapa[]>([])
  const [maxDistancia, setMaxDistancia] = useState(50)
  const [selectedOferta, setSelectedOferta] = useState<OfertaMapa | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservando, setReservando] = useState(false)
  const [toast, setToast] = useState('')
  const [geocodificando, setGeocodificando] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const ofertas = await getOfertas()
        if (ofertas.length === 0) {
          setLoading(false)
          return
        }

        setGeocodificando(true)

        // Agrupar por dirección para no geocodificar duplicados
        const cacheCoordenadas: Record<string, { lat: number; lng: number } | null> = {}
        const direccionesUnicas = [...new Set(ofertas.map(o => o.direccion))]

        for (const dir of direccionesUnicas) {
          cacheCoordenadas[dir] = await geocodificar(dir)
          await new Promise(r => setTimeout(r, 250)) // Respetar límite Nominatim
        }

        const conCoords: OfertaMapa[] = ofertas
          .filter(o => cacheCoordenadas[o.direccion] !== null)
          .map(o => ({
            ...o,
            lat: cacheCoordenadas[o.direccion]!.lat,
            lng: cacheCoordenadas[o.direccion]!.lng,
          }))

        // Calcular distancia si hay geolocalización
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              const conDist = conCoords.map(o => ({
                ...o,
                distancia: calcularDistancia(coords.latitude, coords.longitude, o.lat, o.lng),
              }))
              setOfertasMapa(conDist)
              setFiltradas(conDist.filter(o => o.distancia! <= maxDistancia))
              setGeocodificando(false)
              setLoading(false)
            },
            () => {
              setOfertasMapa(conCoords)
              setFiltradas(conCoords)
              setGeocodificando(false)
              setLoading(false)
            }
          )
        } else {
          setOfertasMapa(conCoords)
          setFiltradas(conCoords)
          setGeocodificando(false)
          setLoading(false)
        }
      } catch {
        setLoading(false)
        setGeocodificando(false)
      }
    }
    cargar()
  }, [])

  useEffect(() => {
    setFiltradas(ofertasMapa.filter(o => !o.distancia || o.distancia <= maxDistancia))
  }, [maxDistancia, ofertasMapa])

  const handleReservar = async () => {
    if (!usuario || !selectedOferta) return
    setReservando(true)
    try {
      const res = await reservar(usuario.id, selectedOferta.id_oferta)
      showToast(`✅ Reservado · Código: ${res.codigo}`)
      setSelectedOferta(null)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al reservar')
    } finally {
      setReservando(false)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  if (loading || geocodificando) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          <p className="mt-2 text-gray-600 text-sm">
            {geocodificando ? 'Localizando restaurantes...' : 'Cargando mapa...'}
          </p>
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
              <MapPin className="w-5 h-5 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Ofertas cerca de ti</h1>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Radio de búsqueda: <span className="text-green-600 font-semibold">{maxDistancia} km</span>
            </label>
            <input
              type="range" min="1" max="100" value={maxDistancia}
              onChange={e => setMaxDistancia(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500">
              {filtradas.length} oferta{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
              {ofertasMapa.length > 0 && ` de ${ofertasMapa.length} localizadas`}
            </p>
          </div>
        </div>

        {/* Mapa + Lista */}
        <div className="grid flex-1 gap-4 p-4 overflow-hidden md:grid-cols-[2fr_1fr]">
          <div className="w-full h-[560px] rounded-[32px] overflow-hidden shadow-xl border border-gray-200 bg-white md:h-[760px]">
            <MapComponent
              ofertas={filtradas}
              onOfertaClick={(o: OfertaMapa) => setSelectedOferta(o)}
            />
          </div>

          {/* Panel lateral */}
          <div className="w-full bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Ofertas disponibles</h2>
            </div>
            <div className="divide-y overflow-y-auto max-h-[720px]">
              {filtradas.length > 0 ? (
                filtradas.map(o => (
                  <div
                    key={o.id_oferta}
                    onClick={() => setSelectedOferta(o)}
                    className={`p-4 cursor-pointer hover:bg-green-50 transition-colors ${
                      selectedOferta?.id_oferta === o.id_oferta ? 'bg-green-100' : ''
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{o.restaurante}</div>
                    <div className="text-xs text-gray-600 mt-1 capitalize">{o.descripcion}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{o.categoria}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-green-600">${o.precio.toFixed(2)} MXN</span>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{o.cantidad_disponible} disp.</span>
                        {o.distancia !== undefined && (
                          <div className="text-xs text-blue-600 font-medium">📍 {o.distancia.toFixed(1)} km</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <p className="text-3xl mb-2">🗺️</p>
                  <p>No hay ofertas en este radio</p>
                  <button onClick={() => setMaxDistancia(100)} className="mt-2 text-green-600 text-xs font-semibold">
                    Ampliar búsqueda
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal detalle */}
        {selectedOferta && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setSelectedOferta(null)}>
            <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedOferta.restaurante}</h2>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    {selectedOferta.categoria}
                  </span>
                </div>
                <p className="text-gray-700 font-medium capitalize">{selectedOferta.descripcion}</p>
                {selectedOferta.info_detallada && (
                  <p className="text-sm text-gray-500 mt-1">{selectedOferta.info_detallada}</p>
                )}
                {selectedOferta.alergenos && (
                  <p className="text-xs text-orange-500 mt-1">⚠️ Alérgenos: {selectedOferta.alergenos}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">📍 {selectedOferta.direccion}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-green-600">${selectedOferta.precio.toFixed(2)}</span>
                    <span className="text-gray-400 text-sm ml-1">MXN</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{selectedOferta.cantidad_disponible} disponibles</p>
                    {selectedOferta.distancia !== undefined && (
                      <p className="text-sm font-bold text-blue-600">📍 {selectedOferta.distancia.toFixed(1)} km</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={handleReservar}
                    disabled={reservando}
                    className="bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {reservando ? 'Reservando...' : '🛒 Reservar'}
                  </button>
                  <button
                    onClick={() => setSelectedOferta(null)}
                    className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-full shadow-xl">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
