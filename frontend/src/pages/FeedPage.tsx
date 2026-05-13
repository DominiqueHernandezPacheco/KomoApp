import { useState, useEffect } from 'react'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useAuth } from '../context/AuthContext'
import { getOfertas, reservar } from '../api'
import CardOferta from '../components/CardOferta'
import BottomNav from '../components/BottomNav'
import type { Oferta } from '../types'

const CATEGORIAS = ['Todas', 'Panadería', 'Café', 'Sushi', 'Postre', 'Comida']

export default function FeedPage() {
  const { usuario } = useAuth()
  const [ofertas, setOfertas]     = useState<Oferta[]>([])
  const [filtro, setFiltro]       = useState('Todas')
  const [busqueda, setBusqueda]   = useState('')
  const [cargando, setCargando]   = useState(true)
  const [reservando, setReservando] = useState<number | null>(null)
  const [toast, setToast]         = useState('')

const cargar = async (mostrarCargando = false) => {
    try {
      // Solo mostramos el spinner si lo pedimos explícitamente
      if (mostrarCargando) setCargando(true) 
      
      const nuevasOfertas = await getOfertas()
      setOfertas(nuevasOfertas)
    } catch {
      setToast('Error al cargar ofertas')
    } finally {
      setCargando(false)
    }
  }

  // La primera vez que carga, sí mostramos el spinner
  useEffect(() => { cargar(true) }, [])

  // El autorefresco ahora será silencioso (sin spinner)
  useAutoRefresh(() => cargar(false), 30000) // Lo subí a 30 segundos

  const mostrar = ofertas.filter(o => {
    const matchFiltro = filtro === 'Todas' || o.categoria.toLowerCase().includes(filtro.toLowerCase())
    const matchBusqueda = o.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
                          o.restaurante.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  const handleReservar = async (oferta_id: number) => {
    if (!usuario) return
    setReservando(oferta_id)
    try {
      const res = await reservar(usuario.id, oferta_id)
      showToast(`✅ Reservado · Código: ${res.codigo}`)
      cargar()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al reservar')
    } finally {
      setReservando(null)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-green-600 text-white px-4 pt-10 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">Hola,</p>
            <p className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
              {usuario?.nombre?.split(' ')[0]} 👋
            </p>
          </div>
          <button onClick={cargar} className="bg-white/20 rounded-full p-2 text-sm active:scale-90 transition">
            🔄
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-white/15 backdrop-blur rounded-xl flex items-center px-3 py-2 gap-2">
          <span className="text-white/70">🔍</span>
          <input
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="¿Qué quieres rescatar hoy?"
            className="bg-transparent flex-1 text-white placeholder-white/60 text-sm outline-none"
          />
        </div>
      </header>

      {/* Filtros de categoría */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {CATEGORIAS.map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filtro === cat
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Lista */}
      <main className="px-4 pb-24 space-y-3">
        {cargando ? (
          <div className="pt-20 text-center text-gray-400">
            <div className="text-4xl animate-bounce mb-2">🍱</div>
            <p className="text-sm">Buscando ofertas...</p>
          </div>
        ) : mostrar.length === 0 ? (
          <div className="pt-20 text-center text-gray-400">
            <p className="text-4xl mb-2">😕</p>
            <p className="text-sm">No hay ofertas disponibles ahora</p>
            <button onClick={cargar} className="mt-3 text-green-600 text-sm font-semibold">
              Recargar
            </button>
          </div>
        ) : (
          mostrar.map(oferta => (
            <CardOferta
              key={oferta.id_oferta}
              oferta={oferta}
              onReservar={handleReservar}
              loading={reservando === oferta.id_oferta}
            />
          ))
        )}
      </main>

      <BottomNav />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white
                        text-xs font-medium px-4 py-2.5 rounded-full shadow-xl max-w-[90%] text-center fade-up">
          {toast}
        </div>
      )}
    </div>
  )
}
