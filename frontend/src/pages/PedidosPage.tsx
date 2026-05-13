import { useState, useEffect } from 'react'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import { getPedidosCliente, actualizarEstadoPedido } from '../api'
import BottomNav from '../components/BottomNav'
import type { Pedido } from '../types'

const ESTADO_STYLE: Record<string, string> = {
  Pendiente:  'bg-yellow-100 text-yellow-700',
  Entregado:  'bg-green-100 text-green-700',
  Cancelado:  'bg-red-100 text-red-500',
}

const ESTADO_ICON: Record<string, string> = {
  Pendiente: '⏳', Entregado: '✅', Cancelado: '❌',
}

export default function PedidosPage() {
  const { usuario } = useAuth()
  const [pedidos, setPedidos]   = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [qrAbierto, setQrAbierto] = useState<Pedido | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)

  const cargar = () => {
    if (!usuario) return
    getPedidosCliente(usuario.id)
      .then(setPedidos)
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [usuario])
  useAutoRefresh(cargar, 20000)

  // FUNCIÓN ACTUALIZADA: Ahora cambia el estado localmente para reflejar el cambio al instante
  const cancelarPedido = async (pedido_id: number) => {
    setCancelando(pedido_id)
    try {
      // 1. Llamada al backend (Supabase a través del Gateway)
      await actualizarEstadoPedido(pedido_id, 'Cancelado')
      
      // 2. ACTUALIZACIÓN INSTANTÁNEA: 
      // Mapeamos los pedidos y cambiamos el estado del que acabamos de cancelar.
      // Esto hace que React mueva el pedido de lista automáticamente.
      setPedidos(prev => 
        prev.map(p => p.id_pedido === pedido_id ? { ...p, estado: 'Cancelado' } : p)
      )
      
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al cancelar pedido')
    } finally {
      setCancelando(null)
    }
  }

  // Estas variables se recalculan solas cuando cambia el estado 'pedidos'
  const pendientes  = pedidos.filter(p => p.estado === 'Pendiente')
  const completados = pedidos.filter(p => p.estado !== 'Pendiente')

  return (
    <div className="app-shell">
      <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Syne, sans-serif' }}>
          Mis Pedidos
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">{pedidos.length} en total</p>
      </header>

      <main className="px-4 pb-24 pt-3 space-y-5">
        {cargando ? (
          <div className="pt-20 text-center text-gray-400">
            <div className="text-4xl animate-pulse mb-2">🧾</div>
            <p className="text-sm">Cargando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="pt-20 text-center text-gray-400">
            <p className="text-5xl mb-3">🛒</p>
            <p className="font-semibold text-gray-600">Sin pedidos aún</p>
            <p className="text-sm mt-1">¡Reserva algo del feed!</p>
          </div>
        ) : (
          <>
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Por recoger
                </h2>
                <div className="space-y-2">
                  {pendientes.map(p => (
                    <TarjetaPedido 
                      key={p.id_pedido} 
                      pedido={p} 
                      onVerQR={() => setQrAbierto(p)} 
                      onCancelar={() => cancelarPedido(p.id_pedido)}
                      estaCancelando={cancelando === p.id_pedido}
                    />
                  ))}
                </div>
              </section>
            )}

            {completados.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Historial
                </h2>
                <div className="space-y-2">
                  {completados.map(p => (
                    <TarjetaPedido 
                      key={p.id_pedido} 
                      pedido={p} 
                      onVerQR={() => setQrAbierto(p)} 
                      onCancelar={() => {}} 
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />

      {/* Modal QR */}
      {qrAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
          onClick={() => setQrAbierto(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-10 fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <h2 className="text-center font-bold text-gray-800 text-lg mb-1"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              Tu código de retiro
            </h2>
            <p className="text-center text-gray-400 text-xs mb-6">
              Muéstralo al llegar al local
            </p>

            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                <QRCodeSVG
                  value={qrAbierto.codigo}
                  size={180}
                  fgColor="#15803d"
                  level="M"
                />
              </div>
            </div>

            <p className="text-center font-mono text-green-700 font-bold tracking-widest text-lg mb-1">
              {qrAbierto.codigo}
            </p>
            <p className="text-center text-gray-500 text-sm">{qrAbierto.descripcion}</p>
            <p className="text-center text-green-600 font-bold mt-1">${qrAbierto.precio} MXN</p>
            <p className="text-center text-gray-400 text-xs mt-1">📍 {qrAbierto.restaurante} · {qrAbierto.direccion}</p>

            <button onClick={() => setQrAbierto(null)}
              className="mt-6 w-full bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-semibold">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TarjetaPedido({ pedido, onVerQR, onCancelar, estaCancelando }: { 
  pedido: Pedido; 
  onVerQR: () => void;
  onCancelar: () => void;
  estaCancelando?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm fade-up">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 text-sm capitalize">{pedido.descripcion}</p>
          <p className="text-gray-400 text-xs mt-0.5">🍽 {pedido.restaurante}</p>
          <p className="text-gray-400 text-xs">📍 {pedido.direccion}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-green-600 font-bold text-sm">${pedido.precio} MXN</p>
          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_STYLE[pedido.estado]}`}>
            {ESTADO_ICON[pedido.estado]} {pedido.estado}
          </span>
        </div>
      </div>

      {pedido.estado === 'Pendiente' && (
        <div className="mt-3 flex gap-2">
          <button onClick={onVerQR} disabled={estaCancelando}
            className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold
                       hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
            <span>Ver código QR</span>
            <span className="text-base">📲</span>
          </button>
          <button onClick={onCancelar} disabled={estaCancelando}
            className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold
                       hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
            {estaCancelando ? <span>Cancelando...</span> : (
              <>
                <span>Cancelar</span>
                <span className="text-base">❌</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}