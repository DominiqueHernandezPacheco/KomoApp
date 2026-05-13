import { useState, useEffect } from 'react'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useAuth } from '../context/AuthContext'
import { getDonacionesAlbergue, confirmarDonacion } from '../api'
import BottomNav from '../components/BottomNav'
import type { Donacion } from '../types'

export default function AlberguePage() {
  const { usuario } = useAuth()
  const [donaciones, setDonaciones] = useState<Donacion[]>([])
  const [cargando, setCargando]     = useState(true)
  const [confirmando, setConfirmando] = useState<number | null>(null)
  const [toast, setToast]           = useState('')

  const cargar = async () => {
    if (!usuario) return
    try {
      setCargando(true)
      setDonaciones(await getDonacionesAlbergue(usuario.id))
    } catch {
      // backend de donaciones aún en construcción — mostramos estado vacío
      setDonaciones([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [usuario])
  useAutoRefresh(cargar, 20000)

  const handleConfirmar = async (id: number) => {
    setConfirmando(id)
    try {
      await confirmarDonacion(id)
      showToast('✅ Donación confirmada, ¡gracias!')
      cargar()
    } catch {
      showToast('Error al confirmar')
    } finally {
      setConfirmando(null)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const pendientes  = donaciones.filter(d => d.estado === 'Pendiente')
  const recibidas   = donaciones.filter(d => d.estado === 'Recibida')
  const totalItems  = recibidas.reduce((acc, d) => acc + d.cantidad, 0)

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-12 pb-5">
        <p className="text-green-200 text-xs uppercase tracking-wider font-semibold">Bienvenido</p>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
          {usuario?.nombre}
        </h1>

        {/* Stat de impacto */}
        <div className="mt-4 bg-white/20 rounded-2xl p-4 flex items-center gap-4">
          <span className="text-4xl">🤝</span>
          <div>
            <p className="text-white font-black text-2xl">{totalItems}</p>
            <p className="text-green-100 text-xs">porciones recibidas en total</p>
          </div>
        </div>
      </header>

      <main className="px-4 pb-24 pt-4 space-y-5">
        {cargando ? (
          <div className="pt-16 text-center text-gray-400">
            <div className="text-4xl animate-bounce mb-2">🏠</div>
            <p className="text-sm">Cargando donaciones...</p>
          </div>
        ) : (
          <>
            {/* Pendientes de confirmar */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Por recoger
                </h2>
                {pendientes.length > 0 && <span className="badge">{pendientes.length}</span>}
              </div>

              {pendientes.length === 0 ? (
                <EmptyCard
                  icon="📭"
                  titulo="Sin donaciones pendientes"
                  desc="Los negocios te avisarán cuando tengan excedentes disponibles"
                />
              ) : (
                <div className="space-y-2">
                  {pendientes.map(d => (
                    <TarjetaDonacion key={d.id} donacion={d}
                      onConfirmar={() => handleConfirmar(d.id)}
                      loading={confirmando === d.id} />
                  ))}
                </div>
              )}
            </section>

            {/* Historial */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Historial de recepciones
              </h2>
              {recibidas.length === 0 ? (
                <EmptyCard
                  icon="📋"
                  titulo="Sin historial aún"
                  desc="Aquí aparecerán las donaciones que hayas confirmado"
                />
              ) : (
                <div className="space-y-2">
                  {recibidas.map(d => <TarjetaDonacion key={d.id} donacion={d} />)}
                </div>
              )}
            </section>

            {/* Info del convenio */}
            <section className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="font-bold text-green-800 text-sm mb-1">📄 Tu convenio activo</p>
              <p className="text-green-700 text-xs">
                Como institución registrada en Komo, tienes acceso a los excedentes
                de los comercios participantes. Los negocios publican sus donaciones
                disponibles y tú las confirmas al recogerlas.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="bg-green-200 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full">
                  ✅ Convenio activo
                </span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  🏙 Campeche
                </span>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white
                        text-xs px-4 py-2.5 rounded-full shadow-xl fade-up">
          {toast}
        </div>
      )}
    </div>
  )
}

function TarjetaDonacion({
  donacion, onConfirmar, loading,
}: {
  donacion: Donacion; onConfirmar?: () => void; loading?: boolean
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm fade-up">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 text-sm capitalize">{donacion.descripcion}</p>
          <p className="text-gray-400 text-xs mt-0.5">🍽 {donacion.restaurante_nombre}</p>
          <p className="text-green-600 text-xs font-semibold mt-1">
            {donacion.cantidad} porciones disponibles
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
          donacion.estado === 'Pendiente'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {donacion.estado === 'Pendiente' ? '⏳ Pendiente' : '✅ Recibida'}
        </span>
      </div>

      <p className="text-gray-300 text-[10px] mt-2">
        {new Date(donacion.fecha).toLocaleDateString('es-MX', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })}
      </p>

      {donacion.estado === 'Pendiente' && onConfirmar && (
        <button onClick={onConfirmar} disabled={loading}
          className="mt-3 w-full bg-green-600 text-white py-2 rounded-xl text-xs font-bold
                     hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
          {loading ? 'Confirmando...' : '✅ Confirmar recepción'}
        </button>
      )}
    </div>
  )
}

function EmptyCard({ icon, titulo, desc }: { icon: string; titulo: string; desc: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 text-center">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="font-semibold text-gray-600 text-sm">{titulo}</p>
      <p className="text-gray-400 text-xs mt-1">{desc}</p>
    </div>
  )
}
