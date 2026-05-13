import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navCliente = [
  { path: '/feed',    icon: '🏠', label: 'Inicio' },
  { path: '/mapa',    icon: '🗺️', label: 'Mapa' },
  { path: '/pedidos', icon: '🧾', label: 'Pedidos' },
  { path: '/perfil',  icon: '👤', label: 'Perfil' },
]
const navVendedor = [
  { path: '/vendedor',          icon: '📊', label: 'Dashboard' },
  { path: '/vendedor/publicar', icon: '➕', label: 'Publicar' },
  { path: '/vendedor/donar',    icon: '🤝', label: 'Donar' },
  { path: '/perfil',            icon: '👤', label: 'Perfil' },
]
const navAlbergue = [
  { path: '/albergue', icon: '🏠', label: 'Donaciones' },
  { path: '/perfil',   icon: '👤', label: 'Perfil' },
]

export default function BottomNav() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const items =
    usuario?.rol === 'restaurante' ? navVendedor :
    usuario?.rol === 'albergue'    ? navAlbergue :
    navCliente

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center gap-0.5 px-3 transition-all ${
            pathname === item.path
              ? 'text-green-600 scale-110'
              : 'text-gray-400 hover:text-gray-600'
          }`}>
          <span className="text-xl">{item.icon}</span>
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
