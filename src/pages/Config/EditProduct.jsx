import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2, RefreshCw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useHierarchyConfig, useLevelItems } from '../../hooks/useHierarchyConfig'

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanStr(s) {
  return (s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function buildSKU(productName, selections) {
  const parts = [
    ...selections.map((s) => cleanStr(s?.name).slice(0, 4)),
    cleanStr(productName).slice(0, 6),
  ]
  return parts.filter(Boolean).join('-')
}

function autoName(selections) {
  return selections.map((s) => s?.name).filter(Boolean).join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()

  const { config, loading: configLoading } = useHierarchyConfig()
  const optionalLevels = config?.optionalLevels || []

  const [fetching, setFetching] = useState(true)
  const [selections, setSelections] = useState([])
  const [productName, setProductName] = useState('')
  const [userEditedName, setUserEditedName] = useState(false)
  const [customSKU, setCustomSKU] = useState('')
  const [skuEdited, setSkuEdited] = useState(false)
  const [currentStock, setCurrentStock] = useState('0')
  const [minStock, setMinStock] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load product once config is ready
  useEffect(() => {
    if (configLoading || !config?.levels?.length) return
    getDoc(doc(db, 'products', id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data()
        const levels = config.levels
        const sel = levels.map((_, i) => {
          const found = (d.hierarchyLevels || []).find((l) => l.levelIndex === i)
          return found ? { id: found.itemId, name: found.itemName } : null
        })
        setSelections(sel)
        setProductName(d.displayName || autoName(sel))
        setUserEditedName(true)
        setCustomSKU(d.sku || '')
        setSkuEdited(true)
        setCurrentStock(String(d.currentStock ?? 0))
        setMinStock(String(d.minStock ?? 0))
      }
      setFetching(false)
    })
  }, [id, config, configLoading])

  const levels = config?.levels || []
  const autoSKU = buildSKU(productName, selections)
  const sku = skuEdited ? customSKU : autoSKU

  function handleSelect(levelIndex, itemId, itemName) {
    setSelections((prev) => {
      const next = [...prev]
      next[levelIndex] = itemId ? { id: itemId, name: itemName } : null
      return next
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!productName.trim()) {
      setError('Product name is required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const hierarchyLevels = selections
        .map((s, i) => s ? ({ levelIndex: i, levelName: levels[i], itemId: s.id, itemName: s.name }) : null)
        .filter(Boolean)
      await updateDoc(doc(db, 'products', id), {
        hierarchyLevels,
        displayName: productName.trim(),
        sku: sku.trim(),
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        updatedAt: serverTimestamp(),
      })
      navigate('/products')
    } catch {
      setError('Failed to save. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    try {
      await deleteDoc(doc(db, 'products', id))
      navigate('/products')
    } catch {
      setError('Failed to delete.')
    }
  }

  if (configLoading || fetching) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-6" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Edit Product</h1>
        </div>
        <button onClick={handleDelete} className="text-red-400 hover:text-red-600 p-1">
          <Trash2 size={20} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Hierarchy
          </p>

          {/* Dynamic level dropdowns */}
          {levels.map((levelName, i) => (
            <LevelDropdown
              key={i}
              levelIndex={i}
              levelName={levelName}
              isOptional={optionalLevels[i] ?? true}
              value={selections[i]?.id || ''}
              onChange={(itemId, itemName) => handleSelect(i, itemId, itemName)}
            />
          ))}

          {/* Product Name */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700">
              Product Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => { setProductName(e.target.value); setUserEditedName(true) }}
              autoCapitalize="words"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SKU */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Product Code</label>
              {skuEdited && (
                <button type="button" onClick={() => setSkuEdited(false)}
                  className="flex items-center gap-1 text-xs text-blue-500">
                  <RefreshCw size={11} /> Reset
                </button>
              )}
            </div>
            <input
              type="text"
              value={customSKU}
              onChange={(e) => { setCustomSKU(e.target.value.toUpperCase()); setSkuEdited(true) }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">Edit to customise. Reset to auto-generate product code.</p>
          </div>

          {/* Stock fields */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-600">Current Stock</label>
              <input
                type="number"
                min={0}
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-600">Min Stock</label>
              <input
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {productName && (
          <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Preview</p>
            <p className="text-sm font-semibold text-gray-800">{productName}</p>
            <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
              {sku}
            </span>
          </div>
        )}

        {error && <p className="text-xs text-red-500 px-1">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Update Product'}
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function LevelDropdown({ levelIndex, levelName, isOptional, value, onChange }) {
  const items = useLevelItems(levelIndex)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {levelName}
          {!isOptional && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {isOptional && <span className="text-xs text-gray-400">Optional</span>}
      </div>
      <select
        value={value}
        onChange={(e) => {
          const selected = items.find((it) => it.id === e.target.value)
          onChange(e.target.value || null, selected?.name || '')
        }}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">— Select {levelName} —</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
    </div>
  )
}
