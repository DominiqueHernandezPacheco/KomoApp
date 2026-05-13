export type Rol = 'cliente' | 'restaurante' | 'albergue'

export interface Usuario {
  id: number
  nombre: string
  rol: Rol
  direccion: string
}

export interface Oferta {
  id_oferta: number
  restaurante: string
  direccion: string
  telefono: string
  descripcion: string
  info_detallada: string
  precio: number
  cantidad_disponible: number
  categoria: string
  alergenos: string
}

export interface Pedido {
  id_pedido: number
  codigo: string
  descripcion: string
  precio: number
  restaurante: string
  direccion: string
  estado: 'Pendiente' | 'Entregado' | 'Cancelado'
  categoria: string
  fecha_creacion: string
}

export interface DashboardVendedor {
  metricas: { paquetes: number; ventas: number }
  pedidos: {
    id_pedido: number
    codigo: string
    descripcion: string
    cliente: string
    precio: number
    estado: string
  }[]
}

export interface Donacion {
  id: number
  albergue_id: number
  albergue_nombre: string
  restaurante_nombre: string
  descripcion: string
  cantidad: number
  fecha: string
  estado: 'Pendiente' | 'Recibida'
}
