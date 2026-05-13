import type { Oferta } from '../types'

const FOTOS: Record<string, string> = {
  panaderia:  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=70',
  cafe:       'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=70',
  sushi:      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=70',
  postre:     'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&q=70',
  comida:     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70',
  default:    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70',
}

function fotoCategoria(cat: string) {
  const c = cat.toLowerCase()
  for (const key of Object.keys(FOTOS)) {
    if (c.includes(key)) return FOTOS[key]
  }
  return FOTOS.default
}

interface Props {
  oferta: Oferta
  onReservar: (id: number) => void
  loading?: boolean
}

export default function CardOferta({ oferta, onReservar, loading }: Props) {
  const mins = Math.floor(Math.random() * 40) + 10 // placeholder visual
  const pct  = Math.round((1 - oferta.cantidad_disponible / 10) * 100)

  return (
    <div className="card-oferta bg-white shadow-sm fade-up">
      {/* Imagen */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        <img
          src={fotoCategoria(oferta.categoria)}
          alt={oferta.descripcion}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badges flotantes */}
        <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
          ⏱ {mins} min
        </span>
        {oferta.cantidad_disponible <= 3 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            ¡Últimos {oferta.cantidad_disponible}!
          </span>
        )}

        {/* Restaurante sobre la imagen */}
        <p className="absolute bottom-2 left-3 text-white text-xs font-semibold drop-shadow">
          🍽 {oferta.restaurante}
        </p>
      </div>

      {/* Contenido */}
      <div className="p-3">
        <h3 className="font-bold text-gray-800 text-sm capitalize">{oferta.descripcion}</h3>
        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{oferta.info_detallada || oferta.categoria}</p>

        {oferta.alergenos && (
          <p className="text-[10px] text-orange-500 mt-1">⚠️ {oferta.alergenos}</p>
        )}

        {/* Barra de disponibilidad */}
        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: `${Math.max(5, 100 - pct)}%` }} />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-green-600 font-black text-lg">${oferta.precio}</span>
            <span className="text-gray-400 text-xs ml-1">MXN</span>
          </div>
          <button
            onClick={() => onReservar(oferta.id_oferta)}
            disabled={loading}
            className="bg-green-600 text-white px-5 py-1.5 rounded-full text-xs font-bold
                       hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
            {loading ? '...' : 'Reservar'}
          </button>
        </div>
      </div>
    </div>
  )
}
