import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

const ROL_INFO: Record<string, { icon: string; label: string; color: string }> = {
  cliente:     { icon: '👤', label: 'Cliente',            color: 'bg-blue-100 text-blue-700' },
  restaurante: { icon: '🍽️', label: 'Negocio / Restaurante', color: 'bg-orange-100 text-orange-700' },
  albergue:    { icon: '🏠', label: 'Casa Hogar / Albergue', color: 'bg-purple-100 text-purple-700' },
}

export default function PerfilPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const info = ROL_INFO[usuario?.rol ?? 'cliente']

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Syne, sans-serif' }}>
          Mi perfil
        </h1>
      </header>

      <main className="px-4 pb-24 pt-6 space-y-4">
        {/* Avatar + nombre */}
        <div className="bg-green-50 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-3xl shadow-md">
            {info.icon}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
              {usuario?.nombre}
            </p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${info.color}`}>
              {info.label}
            </span>
          </div>
        </div>

        {/* Datos */}
        {usuario?.direccion && (
          <InfoRow icon="📍" label="Dirección" value={usuario.direccion} />
        )}
        <InfoRow icon="🔑" label="ID de usuario" value={`#${usuario?.id}`} />

        {/* Acciones rápidas según rol */}
        {usuario?.rol === 'restaurante' && (
          <button onClick={() => navigate('/vendedor/publicar')}
            className="w-full bg-green-600 text-white py-3.5 rounded-2xl font-semibold text-sm
                       hover:bg-green-700 active:scale-95 transition-all">
            ➕ Publicar nuevo excedente
          </button>
        )}

        {/* Separador */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Acerca de Komo</p>
          <div className="space-y-0.5 text-sm text-gray-600">
            <p>🌱 Reducción de desperdicio alimentario</p>
            <p>🤝 Conexión con albergues locales</p>
            <p>📍 Campeche, México</p>
            <p className="text-gray-300 text-xs pt-2">Versión 1.1 · GreenWayLab © 2026</p>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full bg-red-50 text-red-500 py-3.5 rounded-2xl font-semibold text-sm
                     hover:bg-red-100 active:scale-95 transition-all border border-red-100">
          Cerrar sesión
        </button>
      </main>

      <BottomNav />
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
        <p className="text-gray-700 text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
