import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Search, X, TrendingUp, TrendingDown, Sliders } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { submitInventoryUpdate } from '../../hooks/useInventory'

const ACTIONS = [
  { key: 'Stock In',  label: 'Stock In',  icon: TrendingUp,  active: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }, btn: '#16a34a' },
  { key: 'Stock Out', label: 'Stock Out', icon: TrendingDown, active: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }, btn: '#dc2626' },
  { key: 'Adjust',    label: 'Adjust',    icon: Sliders,      active: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, btn: '#1d4ed8' },
]

function ProductSearch({ products, selectedId, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const sorted = products
    .slice()
    .sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''))

  const selected = sorted.find((p) => p.id === selectedId)

  const filtered = query.trim()
    ? sorted.filter((p) =>
        (p.displayName || p.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(query.toLowerCase())
      )
    : sorted

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl border-2"
        style={{ background: '#f8faff', borderColor: '#bfdbfe' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: '#eff6ff', color: '#1d4ed8' }}>
          {(selected.displayName || selected.name || '?').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: '#111827' }}>
            {selected.displayName || selected.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Current stock: <strong style={{ color: '#16a34a' }}>{selected.currentStock ?? 0} units</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect('')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: '#fef2f2', color: '#dc2626' }}
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <Search size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af', pointerEvents: 'none' }} />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name or product code…"
        className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ background: '#fff', borderColor: '#e5e7eb' }}
      />

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border overflow-hidden"
          style={{ borderColor: '#f1f5f9', maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
          {filtered.length === 0 ? (
            <p className="text-sm text-center py-5" style={{ color: '#9ca3af' }}>No products found.</p>
          ) : (
            filtered.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => { onSelect(p.id); setQuery(''); setOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>
                    {p.displayName || p.name}
                  </p>
                  {p.sku && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: '#6b7280' }}>{p.sku}</p>
                  )}
                </div>
                <span className="text-xs font-bold ml-3 flex-shrink-0 px-2 py-0.5 rounded-full"
                  style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  {p.currentStock ?? 0}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function InventoryUpdate() {
  const navigate = useNavigate()
  const { products } = useProducts()
  const [form, setForm] = useState({ productId: '', action: 'Stock In', quantity: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedProduct = products.find((p) => p.id === form.productId)
  const selectedAction = ACTIONS.find((a) => a.key === form.action)

  const previewStock = (() => {
    if (!selectedProduct || !form.quantity) return null
    const qty = Number(form.quantity)
    const cur = selectedProduct.currentStock ?? 0
    if (form.action === 'Stock In') return { from: cur, to: cur + qty, color: '#16a34a', bg: '#f0fdf4' }
    if (form.action === 'Stock Out') return { from: cur, to: Math.max(cur - qty, 0), color: '#dc2626', bg: '#fef2f2' }
    return { from: cur, to: qty, color: '#1d4ed8', bg: '#eff6ff' }
  })()

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.productId || !form.quantity) return alert('Select a product and enter quantity')
    setLoading(true)
    try {
      const product = products.find((p) => p.id === form.productId)
      await submitInventoryUpdate({
        productId: form.productId,
        productName: product?.displayName || product?.name || '',
        action: form.action,
        quantity: form.quantity,
        notes: form.notes,
      })
      setSaved(true)
      setForm((prev) => ({ ...prev, quantity: '', notes: '' }))
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Failed to update inventory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden' }}>

      {/* Fixed header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2" style={{ flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: '#fff' }}
        >
          <ArrowLeft size={18} color="#374151" />
        </button>
        <h1 className="text-xl font-black tracking-tight" style={{ color: '#111827' }}>Update Inventory</h1>
      </div>

      {/* Select Product — outside scroll container so dropdown is never clipped */}
      <div className="bg-white rounded-2xl shadow-sm space-y-2" style={{ flexShrink: 0, margin: '0 16px 8px', padding: '10px 12px', position: 'relative', zIndex: 20 }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Select Product</p>
        <ProductSearch
          products={products}
          selectedId={form.productId}
          onSelect={(id) => handleChange('productId', id)}
        />
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Scrollable fields */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 16px 8px', scrollbarWidth: 'none' }} className="space-y-3">

          {/* Action — first item in scroll area */}
          <div className="bg-white rounded-2xl shadow-sm px-3 py-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Action</p>
            <div className="grid grid-cols-3 gap-2">
              {ACTIONS.map(({ key, label, icon: Icon, active }) => {
                const isSelected = form.action === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleChange('action', key)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 font-bold text-xs transition-all"
                    style={isSelected
                      ? { background: active.bg, color: active.color, borderColor: active.border }
                      : { background: '#f9fafb', color: '#9ca3af', borderColor: '#f1f5f9' }}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity + Preview */}
          <div className="bg-white rounded-2xl shadow-sm px-3 py-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
              {form.action === 'Adjust' ? 'Set Stock To' : 'Quantity'}
            </p>
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="Enter quantity"
              className="w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
            />
            {previewStock && (
              <div className="flex items-center justify-center gap-3 py-2 rounded-xl"
                style={{ background: previewStock.bg }}>
                <span className="text-base font-black" style={{ color: '#6b7280' }}>{previewStock.from}</span>
                <span className="text-sm font-bold" style={{ color: previewStock.color }}>→</span>
                <span className="text-xl font-black" style={{ color: previewStock.color }}>{previewStock.to}</span>
                <span className="text-xs font-medium" style={{ color: previewStock.color }}>units</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-sm px-3 py-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
              Notes <span className="normal-case font-normal" style={{ color: '#9ca3af' }}>(optional)</span>
            </p>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Reason, supplier, delivery note…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ background: '#f9fafb', borderColor: '#e5e7eb' }}
            />
          </div>
        </div>

        {/* Pinned save button */}
        <div style={{ flexShrink: 0, padding: '10px 16px 12px' }}>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm disabled:opacity-60 transition-all"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : selectedAction
                ? `linear-gradient(135deg, ${selectedAction.active.color}, ${selectedAction.active.color}cc)`
                : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            {loading ? 'Saving…' : saved ? 'Saved!' : 'Save Stock Update'}
          </button>
        </div>
      </form>
    </div>
  )
}
