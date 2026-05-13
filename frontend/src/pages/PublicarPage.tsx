import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { publicarOferta } from '../api'
import BottomNav from '../components/BottomNav'

const CATEGORIAS = ['Panadería', 'Café', 'Sushi', 'Postre', 'Comida', 'Bebidas', 'Otro']

export default function PublicarPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    descripcion: '', info_detallada: '', precio: '',
    cantidad: '', categoria: 'Comida', alergenos: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return
    setLoading(true); setError('')
    try {
      await publicarOferta({
        restaurante_id: usuario.id,
        descripcion:    form.descripcion,
        info_detallada: form.info_detallada,
        precio:         parseFloat(form.precio),
        cantidad:       parseInt(form.cantidad),
        categoria:      form.categoria,
        alergenos:      form.alergenos,
      })
      navigate('/vendedor')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/vendedor')}
          className="text-gray-400 text-xl active:scale-90 transition">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Syne, sans-serif' }}>
            Publicar oferta
          </h1>
          <p className="text-gray-400 text-xs">Nuevo excedente disponible</p>
        </div>
      </header>

      <form onSubmit={submit} className="px-4 py-5 pb-28 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <Field label="Nombre del producto *">
          <input name="descripcion" required value={form.descripcion} onChange={handle}
            placeholder="Ej: Pan dulce surtido, Sushi del día..."
            className="input-base" />
        </Field>

        <Field label="Descripción detallada">
          <textarea name="info_detallada" value={form.info_detallada} onChange={handle}
            placeholder="Ingredientes, presentación, etc."
            rows={3} className="input-base resize-none" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio (MXN) *">
            <input name="precio" type="number" required min="1" step="0.50"
              value={form.precio} onChange={handle}
              placeholder="0.00" className="input-base" />
          </Field>
          <Field label="Cantidad *">
            <input name="cantidad" type="number" required min="1"
              value={form.cantidad} onChange={handle}
              placeholder="0" className="input-base" />
          </Field>
        </div>

        <Field label="Categoría">
          <select name="categoria" value={form.categoria} onChange={handle}
            className="input-base bg-white">
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Alérgenos (opcional)">
          <input name="alergenos" value={form.alergenos} onChange={handle}
            placeholder="Ej: Gluten, Lácteos, Frutos secos"
            className="input-base" />
        </Field>

        {/* Preview visual */}
        {form.descripcion && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 fade-up">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-2">
              Vista previa
            </p>
            <p className="font-bold text-gray-800 capitalize">{form.descripcion}</p>
            {form.info_detallada && (
              <p className="text-gray-500 text-xs mt-0.5">{form.info_detallada}</p>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-green-600 font-black text-lg">
                {form.precio ? `$${form.precio} MXN` : '$-- MXN'}
              </span>
              <span className="text-xs text-gray-400">
                {form.cantidad ? `${form.cantidad} disponibles` : '-- disponibles'}
              </span>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm
                     hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60 shadow-md">
          {loading ? 'Publicando...' : '🚀 Publicar ahora'}
        </button>
      </form>

      <BottomNav />

      <style>{`.input-base { width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 16px; font-size: 14px; outline: none; transition: ring 0.2s; }
        .input-base:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }`}
      </style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
