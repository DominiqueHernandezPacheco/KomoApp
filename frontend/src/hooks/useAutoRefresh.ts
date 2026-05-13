import { useEffect, useRef } from 'react'

/**
 * Llama a `fn` cada `intervalo` ms mientras la pestaña esté visible.
 * Si el usuario cambia de pestaña, pausa. Al volver, recarga inmediatamente.
 * No muestra ningún spinner — el refresh es completamente transparente.
 */
export function useAutoRefresh(fn: () => void, intervalo = 15000) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    // Recarga al volver a la pestaña
    const onVisible = () => {
      if (document.visibilityState === 'visible') fnRef.current()
    }
    document.addEventListener('visibilitychange', onVisible)

    // Recarga periódica
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fnRef.current()
    }, intervalo)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalo])
}
