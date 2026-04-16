import { Store, Layers, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Settings</h1>

      {/* Company Name */}
      <button
        onClick={() => navigate('/settings/company')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-4 text-left"
      >
        <div className="bg-orange-50 rounded-xl p-2">
          <Store size={18} className="text-orange-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">Company / Shop Name</p>
          <p className="text-xs text-gray-400 truncate">
            {settings.companyName || 'Not set — tap to configure'}
          </p>
        </div>
        <ArrowLeft size={16} className="text-gray-400 rotate-180" />
      </button>

      {/* Product Hierarchy */}
      <button
        onClick={() => navigate('/config')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-4 text-left"
      >
        <div className="bg-blue-50 rounded-xl p-2">
          <Layers size={18} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">Product Hierarchy</p>
          <p className="text-xs text-gray-400">Configure levels, manage data, add products</p>
        </div>
        <ArrowLeft size={16} className="text-gray-400 rotate-180" />
      </button>
    </div>
  )
}
