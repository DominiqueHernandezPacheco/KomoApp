import type { Oferta, Pedido, DashboardVendedor, Donacion } from '../types'

const BASE = 'https://komo-backend.onrender.com/api'                                 // En local usa el proxy

// ── Auth ──────────────────────────────────────────────
export async function registrar(data: {
  nombre: string; email: string; password: string
  rol: string; direccion?: string; telefono?: string
}) {
  const res = await fetch(`${BASE}/auth/registro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al registrar')
  return res.json()
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Credenciales incorrectas')
  return res.json() as Promise<{ id: number; nombre: string; rol: string; direccion: string }>
}

// ── Ofertas ───────────────────────────────────────────
export async function getOfertas(): Promise<Oferta[]> {
  const res = await fetch(`${BASE}/ofertas`)
  if (!res.ok) throw new Error('Error al cargar ofertas')
  return (await res.json()).ofertas
}

export async function publicarOferta(oferta: {
  restaurante_id: number; descripcion: string; info_detallada: string
  precio: number; cantidad: number; categoria: string; alergenos: string
}) {
  const res = await fetch(`${BASE}/ofertas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oferta),
  })
  if (!res.ok) throw new Error('Error al publicar oferta')
  return res.json()
}

// ── Reservas ──────────────────────────────────────────
export async function reservar(usuario_id: number, oferta_id: number) {
  const res = await fetch(`${BASE}/reservas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id, oferta_id }),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al reservar')
  return res.json() as Promise<{ status: string; codigo: string }>
}

export async function getPedidosCliente(usuario_id: number): Promise<Pedido[]> {
  const res = await fetch(`${BASE}/pedidos/cliente/${usuario_id}`)
  if (!res.ok) throw new Error('Error al cargar pedidos')
  return (await res.json()).pedidos
}

export async function getDashboardVendedor(restaurante_id: number): Promise<DashboardVendedor> {
  const res = await fetch(`${BASE}/pedidos/vendedor/${restaurante_id}`)
  if (!res.ok) throw new Error('Error al cargar dashboard')
  return res.json()
}

export async function actualizarEstadoPedido(pedido_id: number, nuevo_estado: 'Entregado' | 'Cancelado') {
  const res = await fetch(`${BASE}/pedidos/${pedido_id}/estado`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevo_estado }),
  })
  if (!res.ok) throw new Error('Error al actualizar estado')
  return res.json()
}

// ── Donaciones ────────────────────────────────────────
export async function getAlbergues(): Promise<{ id: number; nombre: string; direccion: string; telefono: string }[]> {
  const res = await fetch(`${BASE}/albergues`)
  if (!res.ok) throw new Error('Error al cargar albergues')
  return (await res.json()).albergues
}

export async function getDonacionesAlbergue(albergue_id: number): Promise<Donacion[]> {
  const res = await fetch(`${BASE}/donaciones/albergue/${albergue_id}`)
  if (!res.ok) throw new Error('Error al cargar donaciones')
  return (await res.json()).donaciones
}

export async function getDonacionesRestaurante(restaurante_id: number): Promise<Donacion[]> {
  const res = await fetch(`${BASE}/donaciones/restaurante/${restaurante_id}`)
  if (!res.ok) throw new Error('Error al cargar donaciones')
  return (await res.json()).donaciones
}

export async function registrarDonacion(data: {
  albergue_id: number; restaurante_id: number; descripcion: string; cantidad: number
}) {
  const res = await fetch(`${BASE}/donaciones`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al registrar donación')
  return res.json()
}

export async function confirmarDonacion(donacion_id: number) {
  const res = await fetch(`${BASE}/donaciones/${donacion_id}/confirmar`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error('Error al confirmar donación')
  return res.json()
}
