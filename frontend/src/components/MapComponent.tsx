import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Oferta {
  id: string
  titulo: string
  descripcion: string
  comercio: string
  lat?: number
  lng?: number
  distancia?: number
}

interface MapComponentProps {
  ofertas: Oferta[]
  onOfertaClick?: (oferta: Oferta) => void
}

export default function MapComponent({ ofertas, onOfertaClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Inicializar el mapa
    if (mapRef.current) return

    const map = L.map('map').setView([19.8313, -90.5348], 12) // Centro de Campeche por defecto

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Obtener geolocalización del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const userCoords: [number, number] = [latitude, longitude]
          map.setView(userCoords, 14)

          // Agregar marcador del usuario
          L.circleMarker(userCoords, {
            radius: 8,
            fillColor: '#4f46e5',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .addTo(map)
            .bindPopup('📍 Tu ubicación')

          setLoading(false)
        },
        () => {
          console.log('Geolocalización no disponible, usando ubicación por defecto')
          setLoading(false)
        }
      )
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Actualizar marcadores de ofertas
  useEffect(() => {
    if (!mapRef.current) return

    // Limpiar marcadores antiguos
    markersRef.current.forEach((marker) => mapRef.current!.removeLayer(marker))
    markersRef.current = []

    // Agregar nuevos marcadores
    ofertas.forEach((oferta) => {
      if (!oferta.lat || !oferta.lng) return

      const marker = L.marker([oferta.lat, oferta.lng])
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="text-sm font-semibold">${oferta.comercio}</div>
          <div class="text-xs text-gray-600">${oferta.titulo}</div>
          ${oferta.distancia ? `<div class="text-xs text-blue-600">📍 ${oferta.distancia.toFixed(1)} km</div>` : ''}
        `)

      marker.on('click', () => onOfertaClick?.(oferta))
      markersRef.current.push(marker)
    })
  }, [ofertas, onOfertaClick])

  return (
    <div className="w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-600">Obteniendo ubicación...</p>
          </div>
        </div>
      )}
      <div id="map" className="w-full h-full rounded-lg"></div>
    </div>
  )
}
