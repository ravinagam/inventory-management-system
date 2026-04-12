import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const scannerId = 'barcode-scanner-container'
    const scanner = new Html5Qrcode(scannerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' }, // rear camera
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          onScan(decodedText)
          scanner.stop().catch(() => {})
        },
        () => {} // suppress per-frame errors
      )
      .catch((err) => {
        setError('Camera access denied. Please allow camera permissions and try again.')
        console.error(err)
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-800">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Scanner viewport */}
        {error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div id="barcode-scanner-container" className="w-full" />
            <p className="text-center text-xs text-gray-500 py-3 px-4">
              Point your camera at the barcode. It will scan automatically.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
