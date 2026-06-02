import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface OfertaMapa {
  id_oferta: number
  descripcion: string
  info_detallada: string
  restaurante: string
  direccion: string
  telefono: string
  precio: number
  cantidad_disponible: number
  categoria: string
  alergenos: string
  lat: number
  lng: number
  distancia?: number
}

interface MapComponentProps {
  ofertas: OfertaMapa[]
  onOfertaClick?: (oferta: OfertaMapa) => void
}

export default function MapComponent({ ofertas, onOfertaClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [geoListo, setGeoListo] = useState(false)

  useEffect(() => {
    if (mapRef.current) return

    const map = L.map('map').setView([19.8313, -90.5348], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const pos: [number, number] = [coords.latitude, coords.longitude]
          map.setView(pos, 14)
          L.circleMarker(pos, {
            radius: 8, fillColor: '#16a34a', color: '#fff',
            weight: 2, opacity: 1, fillOpacity: 0.9,
          }).addTo(map).bindPopup('📍 Tu ubicación')
          setGeoListo(true)
        },
        () => setGeoListo(true)
      )
    } else {
      setGeoListo(true)
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach(m => mapRef.current!.removeLayer(m))
    markersRef.current = []

    ofertas.forEach(o => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#16a34a;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">$${o.precio % 1 === 0 ? o.precio : o.precio.toFixed(0)}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([o.lat, o.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width:160px">
            <div style="font-weight:700;font-size:13px;margin-bottom:2px">${o.restaurante}</div>
            <div style="font-size:12px;color:#555;margin-bottom:4px;text-transform:capitalize">${o.descripcion}</div>
            <div style="font-size:11px;color:#888">${o.categoria} · ${o.cantidad_disponible} disp.</div>
            <div style="font-size:14px;font-weight:800;color:#16a34a;margin-top:4px">$${o.precio.toFixed(2)} MXN</div>
            ${o.distancia !== undefined ? `<div style="font-size:11px;color:#2563eb;margin-top:2px">📍 ${o.distancia.toFixed(1)} km</div>` : ''}
          </div>
        `)

      marker.on('click', () => onOfertaClick?.(o))
      markersRef.current.push(marker)
    })
  }, [ofertas, onOfertaClick, geoListo])

  return (
    <div className="w-full h-full relative">
      <div id="map" className="w-full h-full" />
    </div>
  )
}
