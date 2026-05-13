import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onEscaneo: (codigo: string) => void
  onCerrar: () => void
}

export default function LectorQR({ onEscaneo, onCerrar }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState('')
  const [activo, setActivo] = useState(false)
  const regionId = 'komo-qr-reader'

  useEffect(() => {
    const scanner = new Html5Qrcode(regionId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (texto) => {
        // Éxito — detener cámara y notificar
        scanner.stop().catch(() => {})
        onEscaneo(texto)
      },
      () => { /* ignorar errores de frame */ }
    )
    .then(() => setActivo(true))
    .catch(() => {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
      onClick={onCerrar}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-[430px] pb-8 fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-4" />

        <div className="px-5">
          <h2 className="text-center font-bold text-gray-800 text-lg mb-1"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Escanear código QR
          </h2>
          <p className="text-center text-gray-400 text-xs mb-4">
            Apunta la cámara al código del cliente
          </p>

          {error ? (
            <div className="bg-red-50 rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">📵</p>
              <p className="text-red-600 text-sm font-semibold">{error}</p>
              <p className="text-gray-400 text-xs mt-2">
                En Chrome: Configuración → Privacidad → Permisos del sitio → Cámara
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Área de escaneo */}
              <div
                id={regionId}
                className="w-full rounded-2xl overflow-hidden bg-black"
                style={{ minHeight: 280 }}
              />

              {/* Marco de apuntado */}
              {activo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-52 h-52 border-2 border-green-400 rounded-2xl relative">
                    {/* Esquinas */}
                    <span className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                    {/* Línea de escaneo animada */}
                    <div className="absolute left-2 right-2 h-0.5 bg-green-400/70 rounded animate-bounce"
                      style={{ top: '50%' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <button onClick={onCerrar}
            className="mt-4 w-full bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-semibold
                       hover:bg-gray-200 active:scale-95 transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
