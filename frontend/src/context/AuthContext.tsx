import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Usuario } from '../types'

interface AuthCtx {
  usuario: Usuario | null
  setUsuario: (u: Usuario | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({
  usuario: null,
  setUsuario: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('komo_user')
    return saved ? JSON.parse(saved) : null
  })

  const setUsuario = (u: Usuario | null) => {
    setUsuarioState(u)
    if (u) localStorage.setItem('komo_user', JSON.stringify(u))
    else localStorage.removeItem('komo_user')
  }

  const logout = () => setUsuario(null)

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
