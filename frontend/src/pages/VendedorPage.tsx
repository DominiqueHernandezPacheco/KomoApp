import { useState, useEffect } from 'react'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useAuth } from '../context/AuthContext'
import { getDashboardVendedor, actualizarEstadoPedido } from '../api'
import BottomNav from '../components/BottomNav'
import LectorQR from '../components/LectorQR'
import type { DashboardVendedor } from '../types'

export default function VendedorPage() {
  const { usuario } = useAuth()
  const [data, setData]         = useState<DashboardVendedor | null>(null)
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState<number | null>(null)
  const [toast, setToast]       = useState('')
  const [escaneando, setEscaneando] = useState(false)

  const cargar = async () => {
    if (!usuario) return
    try {
      setCargando(true)
      setData(await getDashboardVendedor(usuario.id))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [usuario])
  useAutoRefresh(cargar, 15000)

  const handleEstado = async (id: number, estado: 'Entregado' | 'Cancelado') => {
    setActualizando(id)
    try {
      await actualizarEstadoPedido(id, estado)
      showToast(estado === 'Entregado' ? '✅ Pedido marcado como entregado' : '❌ Pedido cancelado')
      cargar()
    } catch {
      showToast('Error al actualizar')
    } finally {
      setActualizando(null)
    }
  }


  const handleEscaneo = async (codigo: string) => {
    setEscaneando(false)
    // Buscar el pedido por código de recolección
    const pedido = data?.pedidos.find(p => p.codigo === codigo)
    if (!pedido) {
      showToast('❌ Código no encontrado en pedidos activos')
      return
    }
    if (pedido.estado !== 'Pendiente') {
      showToast(`ℹ️ Este pedido ya está: ${pedido.estado}`)
      return
    }
    await handleEstado(pedido.id_pedido, 'Entregado')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const pendientes = data?.pedidos.filter(p => p.estado === 'Pendiente') ?? []
  const historial  = data?.pedidos.filter(p => p.estado !== 'Pendiente') ?? []

  return (
    <div className="app-shell">
      <header className="bg-green-600 text-white px-4 pt-12 pb-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-green-200 text-xs uppercase tracking-wider font-semibold">Dashboard</p>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              {usuario?.nombre}
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEscaneando(true)}
              className="bg-white/20 rounded-full p-2 active:scale-90 transition text-lg"
              title="Escanear QR">
              📷
            </button>
            <button onClick={cargar} className="bg-white/20 rounded-full p-2 active:scale-90 transition">
              🔄
            </button>
          </div>
        </div>

        {/* Métricas */}
        {data && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon="📦" label="Paquetes vendidos"
              value={data.metricas.paquetes.toString()}
            />
            <MetricCard
              icon="💰" label="Ventas recuperadas"
              value={`$${data.metricas.ventas.toFixed(0)} MXN`}
            />
          </div>
        )}
      </header>

      <main className="px-4 pb-24 pt-4 space-y-5">
        {cargando ? (
          <div className="pt-16 text-center text-gray-400">
            <div className="text-4xl animate-bounce mb-2">📊</div>
            <p className="text-sm">Cargando dashboard...</p>
          </div>
        ) : (
          <>
            {/* Pendientes */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Por entregar
                </h2>
                {pendientes.length > 0 && (
                  <span className="badge">{pendientes.length}</span>
                )}
              </div>

              {pendientes.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="text-gray-500 text-sm">Sin pendientes ahora</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendientes.map(p => (
                    <TarjetaPedidoVendedor
                      key={p.id_pedido} pedido={p}
                      onEntregar={() => handleEstado(p.id_pedido, 'Entregado')}
                      onCancelar={() => handleEstado(p.id_pedido, 'Cancelado')}
                      loading={actualizando === p.id_pedido}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Historial */}
            {historial.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Historial
                </h2>
                <div className="space-y-2">
                  {historial.slice(0, 10).map(p => (
                    <TarjetaPedidoVendedor key={p.id_pedido} pedido={p} />
                  ))}
                </div>
              </section>
            )}
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

      {escaneando && (
        <LectorQR
          onEscaneo={handleEscaneo}
          onCerrar={() => setEscaneando(false)}
        />
      )}
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white/20 backdrop-blur rounded-2xl p-3">
      <p className="text-xl mb-1">{icon}</p>
      <p className="text-white font-bold text-lg leading-tight">{value}</p>
      <p className="text-green-200 text-xs">{label}</p>
    </div>
  )
}

function TarjetaPedidoVendedor({
  pedido, onEntregar, onCancelar, loading,
}: {
  pedido: DashboardVendedor['pedidos'][0]
  onEntregar?: () => void
  onCancelar?: () => void
  loading?: boolean
}) {
  const esPendiente = pedido.estado === 'Pendiente'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm fade-up">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 text-sm capitalize">{pedido.descripcion}</p>
          <p className="text-gray-400 text-xs mt-0.5">👤 {pedido.cliente}</p>
        </div>
        <div className="text-right">
          <p className="text-green-600 font-bold text-sm">${pedido.precio} MXN</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
            esPendiente ? 'bg-yellow-100 text-yellow-700' :
            pedido.estado === 'Entregado' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-500'
          }`}>
            {pedido.estado}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-1.5 mt-2">
        <p className="font-mono text-xs text-gray-500">🔑 {pedido.codigo}</p>
      </div>

      {esPendiente && onEntregar && onCancelar && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={onEntregar} disabled={loading}
            className="bg-green-600 text-white py-2 rounded-xl text-xs font-bold
                       hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
            {loading ? '...' : '✅ Entregado'}
          </button>
          <button onClick={onCancelar} disabled={loading}
            className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold
                       hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50">
            ❌ Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
