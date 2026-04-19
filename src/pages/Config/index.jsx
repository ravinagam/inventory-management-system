import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useHierarchyConfig } from '../../hooks/useHierarchyConfig'
import HierarchySetup from './HierarchySetup'
import LevelManager from './LevelManager'
import ProductAssign from './ProductAssign'

const TABS = ['Setup', 'Manage Data', 'Add Product']

export default function ConfigPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 0)
  const { config, loading } = useHierarchyConfig()

  const hasLevels = config?.levels?.length > 0

  return (
    <div className="p-4 space-y-4 pb-6" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Hierarchy Config</h1>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => { if (i === 0 || hasLevels) setActiveTab(i) }}
            disabled={i > 0 && !hasLevels}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === i
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 disabled:opacity-40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 0 && (
            <HierarchySetup config={config} onSaved={() => setActiveTab(1)} />
          )}
          {activeTab === 1 && hasLevels && (
            <LevelManager levels={config.levels} />
          )}
          {activeTab === 2 && hasLevels && (
            <ProductAssign
              levels={config.levels}
              optionalLevels={config.optionalLevels || config.levels.map(() => false)}
            />
          )}
        </>
      )}
    </div>
  )
}
