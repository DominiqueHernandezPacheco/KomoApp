import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login, registrar } from '../api'
import type { Rol } from '../types'

export default function LoginPage() {
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [rol, setRol] = useState<Rol>('cliente')
  const [form, setForm] = useState({ nombre: '', email: '', password: '', direccion: '', telefono: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUsuario } = useAuth()
  const navigate = useNavigate()

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (modo === 'login') {
        const u = await login(form.email, form.password)
        setUsuario({ id: u.id, nombre: u.nombre, rol: u.rol as Rol, direccion: u.direccion })
        navigate(u.rol === 'restaurante' ? '/vendedor' : u.rol === 'albergue' ? '/albergue' : '/feed')
      } else {
        await registrar({ ...form, rol })
        setModo('login')
        setError('¡Cuenta creada! Ahora inicia sesión.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header verde */}
      <div className="bg-green-600 px-6 pt-14 pb-10 text-white">
        <div className="text-4xl mb-1">🥘</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Komo</h1>
        <p className="text-green-100 text-sm mt-1">Rescata comida, transforma comunidades</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['login', 'registro'] as const).map(m => (
          <button key={m} onClick={() => { setModo(m); setError('') }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              modo === m ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'
            }`}>
            {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex-1 p-6 space-y-4 fade-up">
        {error && (
          <div className={`text-sm px-4 py-3 rounded-xl ${
            error.startsWith('¡') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>{error}</div>
        )}

        {modo === 'registro' && (
          <>
            <input name="nombre" required placeholder="Nombre completo / Negocio"
              value={form.nombre} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />

            <select name="rol" value={rol} onChange={e => setRol(e.target.value as Rol)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
              <option value="cliente">👤 Soy cliente</option>
              <option value="restaurante">🍽️ Soy negocio / restaurante</option>
              <option value="albergue">🏠 Soy albergue / casa hogar</option>
            </select>

            <input name="direccion" placeholder="Dirección"
              value={form.direccion} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />

            <input name="telefono" placeholder="Teléfono (opcional)"
              value={form.telefono} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </>
        )}

        <input name="email" type="email" required placeholder="Correo electrónico"
          value={form.email} onChange={handle}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />

        <input name="password" type="password" required placeholder="Contraseña"
          value={form.password} onChange={handle}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />

        <button type="submit" disabled={loading}
          className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-sm
                     hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60">
          {loading ? '...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
