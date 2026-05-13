import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage    from './pages/LoginPage'
import FeedPage     from './pages/FeedPage'
import MapPage      from './pages/MapPage'
import PedidosPage  from './pages/PedidosPage'
import VendedorPage from './pages/VendedorPage'
import PublicarPage from './pages/PublicarPage'
import DonarPage    from './pages/DonarPage'
import AlberguePage from './pages/AlberguePage'
import PerfilPage   from './pages/PerfilPage'

function RutaProtegida({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && !roles.includes(usuario.rol)) {
    const home = usuario.rol === 'restaurante' ? '/vendedor'
               : usuario.rol === 'albergue'    ? '/albergue'
               : '/feed'
    return <Navigate to={home} replace />
  }
  return <>{children}</>
}

function RedirectHome() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.rol === 'restaurante') return <Navigate to="/vendedor" replace />
  if (usuario.rol === 'albergue')    return <Navigate to="/albergue" replace />
  return <Navigate to="/feed" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RedirectHome />} />

      {/* Cliente */}
      <Route path="/feed" element={<RutaProtegida roles={['cliente']}><FeedPage /></RutaProtegida>} />
      <Route path="/mapa" element={<RutaProtegida roles={['cliente']}><MapPage /></RutaProtegida>} />
      <Route path="/pedidos" element={<RutaProtegida roles={['cliente']}><PedidosPage /></RutaProtegida>} />

      {/* Restaurante */}
      <Route path="/vendedor" element={<RutaProtegida roles={['restaurante']}><VendedorPage /></RutaProtegida>} />
      <Route path="/vendedor/publicar" element={<RutaProtegida roles={['restaurante']}><PublicarPage /></RutaProtegida>} />
      <Route path="/vendedor/donar" element={<RutaProtegida roles={['restaurante']}><DonarPage /></RutaProtegida>} />

      {/* Albergue */}
      <Route path="/albergue" element={<RutaProtegida roles={['albergue']}><AlberguePage /></RutaProtegida>} />

      {/* Compartido */}
      <Route path="/perfil" element={<RutaProtegida><PerfilPage /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
