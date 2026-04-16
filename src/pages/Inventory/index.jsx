import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { submitInventoryUpdate } from '../../hooks/useInventory'

const ACTIONS = ['Stock In', 'Stock Out', 'Adjust']

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
    } catch (err) {
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
        {/* Product */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Select Product</label>
          <select
            value={form.productId}
            onChange={(e) => handleChange('productId', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName || p.name} — Stock: {p.currentStock ?? 0}
              </option>
            ))}
          </select>
        </div>

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
