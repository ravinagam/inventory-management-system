import { useState, useEffect, useRef } from 'react'
import { Save, RefreshCw, Search, X, ChevronDown } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useLevelItems } from '../../hooks/useHierarchyConfig'
import { useProducts } from '../../hooks/useProducts'

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanStr(s) {
  return (s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function buildAutoSKU(productName, selections) {
  const parts = [
    ...selections.map((s) => cleanStr(s?.name).slice(0, 4)),
    cleanStr(productName).slice(0, 6),
  ]
  return parts.filter(Boolean).join('-')
}

function autoProductName(selections) {
  return selections.map((s) => s?.name).filter(Boolean).join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProductAssign({ levels, optionalLevels = [] }) {
  const [selections, setSelections]       = useState(() => Array(levels.length).fill(null))
  const [productName, setProductName]     = useState('')
  const [userEditedName, setUserEditedName] = useState(false)
  const [customSKU, setCustomSKU]         = useState('')
  const [skuEdited, setSkuEdited]         = useState(false)
  const [currentStock, setCurrentStock]   = useState('0')
  const [minStock, setMinStock]           = useState('0')
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState('')
  const [dupNameError, setDupNameError]   = useState('')
  const [dupSkuError,  setDupSkuError]    = useState('')

  const { products } = useProducts()

  // Auto-populate product name from selections
  useEffect(() => {
    if (!userEditedName) setProductName(autoProductName(selections))
  }, [selections, userEditedName])

  // Auto-populate SKU from product name + selections
  const autoSKU = buildAutoSKU(productName, selections)
  useEffect(() => {
    if (!skuEdited) setCustomSKU(autoSKU)
  }, [autoSKU, skuEdited])

  const sku = skuEdited ? customSKU : autoSKU

  // Duplicate checks — must come after `sku` is declared
  useEffect(() => {
    if (!productName.trim()) { setDupNameError(''); return }
    const lower = productName.trim().toLowerCase()
    const dup = products.find(p => (p.displayName || p.name || '').toLowerCase() === lower)
    setDupNameError(dup ? `"${productName.trim()}" already exists.` : '')
  }, [productName, products])

  useEffect(() => {
    if (!sku.trim()) { setDupSkuError(''); return }
    const lower = sku.trim().toLowerCase()
    const dup = products.find(p => (p.sku || '').toLowerCase() === lower)
    setDupSkuError(dup ? `Product code "${sku.trim()}" is already in use.` : '')
  }, [sku, products])

  function handleSelect(levelIndex, itemId, itemName) {
    setSelections((prev) => {
      const next = [...prev]
      next[levelIndex] = itemId ? { id: itemId, name: itemName } : null
      return next
    })
  }

  function resetForm() {
    setSelections(Array(levels.length).fill(null))
    setProductName('')
    setUserEditedName(false)
    setCustomSKU('')
    setSkuEdited(false)
    setCurrentStock('0')
    setMinStock('0')
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!productName.trim()) {
      setError('Product name is required.')
      return
    }
    const missingRequired = levels.filter((_, i) => !optionalLevels[i] && !selections[i])
    if (missingRequired.length > 0) {
      setError(`Required: ${missingRequired.join(', ')}`)
      return
    }
    if (dupNameError || dupSkuError) return
    setError('')
    setSaving(true)
    try {
      const hierarchyLevels = selections
        .map((s, i) => s ? ({ levelIndex: i, levelName: levels[i], itemId: s.id, itemName: s.name }) : null)
        .filter(Boolean)

      await addDoc(collection(db, 'products'), {
        hierarchyLevels,
        displayName: productName.trim(),
        sku: sku.trim(),
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        source: 'config',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setSaved(true)
      resetForm()
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Failed to save. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Assign Hierarchy to Product
        </p>

        {/* Hierarchy dropdowns — all optional except product name */}
        {levels.map((levelName, i) => (
          <LevelDropdown
            key={i}
            levelIndex={i}
            levelName={levelName}
            isOptional={optionalLevels[i] ?? true}
            value={selections[i]?.id || ''}
            onChange={(id, name) => handleSelect(i, id, name)}
          />
        ))}

        {/* Product Name */}
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Product Name <span className="text-red-400">*</span>
            </label>
            {userEditedName && (
              <button type="button" onClick={() => { setUserEditedName(false) }}
                className="flex items-center gap-1 text-xs text-blue-500">
                <RefreshCw size={11} /> Reset
              </button>
            )}
          </div>
          <input
            type="text"
            value={productName}
            onChange={(e) => { setProductName(e.target.value); setUserEditedName(true) }}
            placeholder="Auto-filled from selections, or type your own…"
            autoCapitalize="words"
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: dupNameError ? '#fca5a5' : '#e5e7eb' }}
          />
          {dupNameError && (
            <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>⚠ {dupNameError}</p>
          )}
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
            placeholder="Auto-generated product code"
            className="w-full px-3 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: dupSkuError ? '#fca5a5' : '#e5e7eb' }}
          />
          {dupSkuError
            ? <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>⚠ {dupSkuError}</p>
            : <p className="text-xs text-gray-400">Auto-generated product code. Edit to customise.</p>
          }
        </div>

        {/* Stock fields */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-600">Current Stock</label>
            <input type="number" min={0} value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-600">Min Stock</label>
            <input type="number" min={0} value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Live preview */}
      {productName && (
        <div className={`rounded-2xl p-4 space-y-2 ${dupNameError || dupSkuError ? 'bg-red-50 border border-red-200' : 'bg-blue-50'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: dupNameError || dupSkuError ? '#dc2626' : '#1d4ed8' }}>
            {dupNameError || dupSkuError ? 'Duplicate detected' : 'Preview'}
          </p>
          <p className="text-sm font-semibold text-gray-800">{productName}</p>
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{sku}</span>
          {dupNameError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>⚠ {dupNameError}</p>}
          {dupSkuError  && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>⚠ {dupSkuError}</p>}
        </div>
      )}

      {error && <p className="text-xs text-red-500 px-1">{error}</p>}

      <button type="submit" disabled={saving || Boolean(dupNameError) || Boolean(dupSkuError)}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60">
        <Save size={16} />
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Product'}
      </button>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function LevelDropdown({ levelIndex, levelName, isOptional, value, onChange }) {
  const rawItems = useLevelItems(levelIndex)
  const items = rawItems.slice().sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  )

  const selected = items.find(it => it.id === value) || null
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  const filtered = query.trim()
    ? items.filter(it => it.name.toLowerCase().includes(query.toLowerCase()))
    : items

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(item) {
    onChange(item.id, item.name)
    setOpen(false)
    setQuery('')
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null, '')
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="space-y-1" ref={ref}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {levelName}
          {!isOptional && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {isOptional && <span className="text-xs text-gray-400">Optional</span>}
      </div>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery('') }}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
        style={{ borderColor: open ? '#93c5fd' : '#e5e7eb' }}
      >
        <span style={{ color: selected ? '#111827' : '#9ca3af' }}>
          {selected ? selected.name : `— Select ${levelName} —`}
        </span>
        <span className="flex items-center gap-1 ml-2 flex-shrink-0">
          {selected && (
            <span onMouseDown={clear} className="p-0.5 rounded hover:bg-gray-100">
              <X size={13} color="#9ca3af" />
            </span>
          )}
          <ChevronDown size={15} color="#9ca3af" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="relative z-30">
          <div className="absolute top-1 left-0 right-0 bg-white rounded-2xl shadow-xl border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
            {/* Search input */}
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
              <Search size={14} color="#9ca3af" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${levelName}…`}
                className="flex-1 text-sm focus:outline-none"
                style={{ color: '#111827' }}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X size={13} color="#9ca3af" />
                </button>
              )}
            </div>

            {/* Options list */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', scrollbarWidth: 'none' }}>
              {filtered.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#9ca3af' }}>No results.</p>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => select(item)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors"
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none',
                      color: item.id === value ? '#1d4ed8' : '#111827',
                      fontWeight: item.id === value ? 600 : 400,
                      background: item.id === value ? '#eff6ff' : 'transparent',
                    }}
                  >
                    {item.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
