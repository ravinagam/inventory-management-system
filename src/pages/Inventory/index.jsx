import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { submitInventoryUpdate } from '../../hooks/useInventory'

const ACTIONS = ['Stock In', 'Stock Out', 'Adjust']

function ProductSearch({ products, selectedId, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = products.find((p) => p.id === selectedId)

  const sorted = products.slice().sort((a, b) =>
    (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '')
  )
  const filtered = query.trim()
    ? sorted.filter((p) =>
        (p.displayName || p.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(query.toLowerCase())
      )
    : sorted

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(product) {
    onSelect(product.id)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onSelect('')
    setQuery('')
  }

  return (
    <div className="space-y-1" ref={ref}>
      <label className="text-sm font-medium text-gray-700">Select Product</label>

      {/* Selected product chip */}
      {selected ? (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-blue-300 bg-blue-50">
          <div>
            <p className="text-sm font-semibold text-gray-800">{selected.displayName || selected.name}</p>
            <p className="text-xs text-gray-500">Stock: {selected.currentStock ?? 0}</p>
          </div>
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-red-500 ml-2">
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name or product code…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Dropdown results */}
          {open && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No products found.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => handleSelect(p)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.displayName || p.name}</p>
                      {p.sku && <p className="text-xs font-mono text-blue-500">{p.sku}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">Stock: {p.currentStock ?? 0}</span>
                  </button>
                ))
              )}
            </div>
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
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Update Inventory</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl shadow-sm p-4">
        {/* Product search */}
        <ProductSearch
          products={products}
          selectedId={form.productId}
          onSelect={(id) => handleChange('productId', id)}
        />

        {/* Action */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Action</label>
          <div className="grid grid-cols-3 gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleChange('action', action)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  form.action === action
                    ? action === 'Stock In'
                      ? 'bg-green-600 text-white border-green-600'
                      : action === 'Stock Out'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {form.action === 'Adjust' ? 'Set Stock To' : 'Quantity'}
          </label>
          <input
            type="number" min="0"
            value={form.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="Enter quantity"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Reason, supplier, etc."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </button>
      </form>
    </div>
  )
}
