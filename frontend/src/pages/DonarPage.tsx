import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAlbergues, getDonacionesRestaurante, registrarDonacion } from '../api'
import BottomNav from '../components/BottomNav'
import type { Donacion } from '../types'

interface Albergue {
  id: number
  nombre: string
  direccion: string
  telefono: string
}

export default function DonarPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [albergues, setAlbergues]     = useState<Albergue[]>([])
  const [donaciones, setDonaciones]   = useState<Donacion[]>([])
  const [cargando, setCargando]       = useState(true)
  const [enviando, setEnviando]       = useState(false)
  const [toast, setToast]             = useState('')
  const [vista, setVista]             = useState<'form' | 'historial'>('form')

  const [form, setForm] = useState({
    albergue_id: '',
    descripcion: '',
    cantidad: '',
  })

  useEffect(() => {
    if (!usuario) return
    Promise.all([
      getAlbergues(),
      getDonacionesRestaurante(usuario.id),
    ]).then(([a, d]) => {
      setAlbergues(a)
      setDonaciones(d)
      if (a.length > 0) setForm(f => ({ ...f, albergue_id: String(a[0].id) }))
    }).catch(() => {
      setAlbergues([])
      setDonaciones([])
    }).finally(() => setCargando(false))
  }, [usuario])

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario || !form.albergue_id) return
    setEnviando(true)
    try {
      await registrarDonacion({
        albergue_id:   parseInt(form.albergue_id),
        restaurante_id: usuario.id,
        descripcion:   form.descripcion,
        cantidad:      parseInt(form.cantidad),
      })
      showToast('✅ Donación registrada correctamente')
      setForm(f => ({ ...f, descripcion: '', cantidad: '' }))
      // recargar historial
      const d = await getDonacionesRestaurante(usuario.id)
      setDonaciones(d)
      setVista('historial')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setEnviando(false)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const albergueSeleccionado = albergues.find(a => a.id === parseInt(form.albergue_id))
  const pendientes = donaciones.filter(d => d.estado === 'Pendiente')
  const recibidas  = donaciones.filter(d => d.estado === 'Recibida')

  return (
    <div className="app-shell">
      <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-0">
        <div className="flex items-center gap-3 pb-3">
          <button onClick={() => navigate('/vendedor')}
            className="text-gray-400 text-xl active:scale-90 transition">←</button>
          <div>
            <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Syne, sans-serif' }}>
              Donar excedentes
            </h1>
            <p className="text-gray-400 text-xs">Conecta con albergues y casas hogar</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          {(['form', 'historial'] as const).map(t => (
            <button key={t} onClick={() => setVista(t)}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                vista === t
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-400'
              }`}>
              {t === 'form' ? '➕ Nueva donación' : `📋 Historial (${donaciones.length})`}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 pb-24 pt-4">
        {cargando ? (
          <div className="pt-16 text-center text-gray-400">
            <div className="text-4xl animate-bounce mb-2">🤝</div>
            <p className="text-sm">Cargando...</p>
          </div>
        ) : vista === 'form' ? (
          /* ── FORMULARIO ── */
          <div className="space-y-4 fade-up">
            {albergues.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
                <p className="text-3xl mb-2">🏠</p>
                <p className="font-semibold text-yellow-800 text-sm">Sin albergues registrados</p>
                <p className="text-yellow-600 text-xs mt-1">
                  Aún no hay casas hogar registradas en la plataforma.
                  Cuando se registre un albergue, aparecerá aquí.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">

                {/* Selector de albergue */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Albergue destinatario *
                  </label>
                  <select name="albergue_id" value={form.albergue_id} onChange={handle} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-green-400">
                    {albergues.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>

                  {/* Info del albergue seleccionado */}
                  {albergueSeleccionado && (
                    <div className="mt-2 bg-green-50 rounded-xl px-3 py-2 text-xs text-green-700 space-y-0.5">
                      {albergueSeleccionado.direccion && (
                        <p>📍 {albergueSeleccionado.direccion}</p>
                      )}
                      {albergueSeleccionado.telefono && (
                        <p>📞 {albergueSeleccionado.telefono}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    ¿Qué vas a donar? *
                  </label>
                  <textarea name="descripcion" required value={form.descripcion} onChange={handle}
                    placeholder="Ej: Pan del día, pasteles surtidos, tamales..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none
                               focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Número de porciones / piezas *
                  </label>
                  <input name="cantidad" type="number" required min="1" value={form.cantidad} onChange={handle}
                    placeholder="Ej: 20"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>

                {/* Preview */}
                {form.descripcion && form.cantidad && albergueSeleccionado && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 fade-up">
                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-2">
                      Resumen de la donación
                    </p>
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">🤝</span>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{form.descripcion}</p>
                        <p className="text-green-700 text-xs mt-0.5">
                          {form.cantidad} porciones → {albergueSeleccionado.nombre}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={enviando}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm
                             hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60 shadow-md">
                  {enviando ? 'Registrando...' : '🤝 Registrar donación'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── HISTORIAL ── */
          <div className="space-y-5 fade-up">
            {donaciones.length === 0 ? (
              <div className="pt-10 text-center text-gray-400">
                <p className="text-4xl mb-2">📭</p>
                <p className="font-semibold text-gray-600 text-sm">Sin donaciones aún</p>
                <p className="text-xs mt-1">Las donaciones que registres aparecerán aquí</p>
                <button onClick={() => setVista('form')}
                  className="mt-4 bg-green-600 text-white px-5 py-2 rounded-full text-xs font-bold">
                  Registrar primera donación
                </button>
              </div>
            ) : (
              <>
                {/* Métricas rápidas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-yellow-50 rounded-2xl p-3 text-center">
                    <p className="text-yellow-600 font-black text-xl">{pendientes.length}</p>
                    <p className="text-yellow-700 text-xs">Por recoger</p>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-3 text-center">
                    <p className="text-green-600 font-black text-xl">
                      {recibidas.reduce((s, d) => s + d.cantidad, 0)}
                    </p>
                    <p className="text-green-700 text-xs">Porciones entregadas</p>
                  </div>
                </div>

                {/* Lista */}
                <div className="space-y-2">
                  {donaciones.map(d => (
                    <TarjetaDonacionVendedor key={d.id} donacion={d} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <BottomNav />

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white
                        text-xs px-4 py-2.5 rounded-full shadow-xl max-w-[90%] text-center fade-up">
          {toast}
        </div>
      )}
    </div>
  )
}

function TarjetaDonacionVendedor({ donacion }: { donacion: Donacion }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 text-sm capitalize">{donacion.descripcion}</p>
          <p className="text-gray-400 text-xs mt-0.5">🏠 {donacion.albergue_nombre}</p>
          <p className="text-green-600 text-xs font-semibold mt-1">{donacion.cantidad} porciones</p>
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
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })}
      </p>
    </div>
  )
}
