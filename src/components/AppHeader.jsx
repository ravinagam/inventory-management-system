import { Package2 } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'

export default function AppHeader() {
  const { settings } = useSettings()
  const name = settings.companyName || 'Retail Inventory Pro'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 max-w-lg mx-auto">
      <div
        className="relative flex items-center justify-center px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)',
        }}
      >
        {/* Left — icon */}
        <div className="absolute left-4 bg-white/20 rounded-xl p-1.5">
          <Package2 size={20} className="text-white" />
        </div>

        {/* Centre — company name */}
        <div className="text-center">
          <p className="text-white font-bold text-base leading-tight">
            {name}
          </p>
          <p className="text-blue-100 text-xs">Inventory Management</p>
        </div>
      </div>
    </header>
  )
}
