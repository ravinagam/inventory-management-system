import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ScanLine, X, Trash2 } from 'lucide-react'
import { useCategories, addCategory } from '../../hooks/useCategories'
import { addProduct, updateProduct, deleteProduct, useProducts } from '../../hooks/useProducts'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import BarcodeScanner from '../../components/BarcodeScanner'

const TAG_SUGGESTIONS = ['Fast Moving', 'Summer', 'Seasonal', 'Fragile', 'Imported']

export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { categories } = useCategories()

  const [form, setForm] = useState({
    name: '', barcode: '', category: '', tags: [], currentStock: '', minStock: '',
  })
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [showScanner, setShowScanner] = useState(false)
  const [lookupStatus, setLookupStatus] = useState(null) // null | 'loading' | 'found' | 'not_found'
  const [dupNameError, setDupNameError] = useState('')
  const [dupBarcodeError, setDupBarcodeError] = useState('')

  const { products } = useProducts()

  useEffect(() => {
    const name = form.name.trim()
    if (!name) { setDupNameError(''); return }
    const lower = name.toLowerCase()
    const dup = products.find(p => p.id !== id && (p.displayName || p.name || '').toLowerCase() === lower)
    setDupNameError(dup ? `"${form.name}" already exists.` : '')
  }, [form.name, products, id])

  useEffect(() => {
    const bc = form.barcode.trim()
    if (!bc) { setDupBarcodeError(''); return }
    const dup = products.find(p => p.id !== id && p.barcode === bc)
    setDupBarcodeError(dup ? `Barcode "${bc}" is already used by another product.` : '')
  }, [form.barcode, products, id])

  async function lookupBarcode(code) {
    setLookupStatus('loading')
    try {
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`)
      const data = await res.json()
      if (data.code === 'OK' && data.items?.length > 0) {
        const item = data.items[0]
        setForm((prev) => ({
          ...prev,
          barcode: code,
          name: prev.name || item.title || '',
        }))
        setLookupStatus('found')
      } else {
        setForm((prev) => ({ ...prev, barcode: code }))
        setLookupStatus('not_found')
      }
    } catch {
      setForm((prev) => ({ ...prev, barcode: code }))
      setLookupStatus('not_found')
    }
    setTimeout(() => setLookupStatus(null), 3000)
  }

  // Load existing product when editing
  useEffect(() => {
    if (!isEdit) return
    getDoc(doc(db, 'products', id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setForm({
          name: d.name ?? '',
          barcode: d.barcode ?? '',
          category: d.category ?? '',
          tags: d.tags ?? [],
          currentStock: d.currentStock ?? '',
          minStock: d.minStock ?? '',
        })
      }
      setFetching(false)
    })
  }, [id, isEdit])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTag(tag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  async function handleAddCategory() {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    await addCategory(trimmed)
    setForm((prev) => ({ ...prev, category: trimmed }))
    setNewCategory('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.category) return alert('Category is required')
    if (dupNameError || dupBarcodeError) return
    setLoading(true)
    try {
      const data = {
        ...form,
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
      }
      if (isEdit) {
        await updateProduct(id, data)
      } else {
        await addProduct(data)
      }
      navigate('/products')
    } catch (err) {
      alert('Failed to save product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    navigate('/products')
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5 pb-6" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        </div>
        {isEdit && (
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Product Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Paper Cups"
            className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: dupNameError ? '#fca5a5' : '#e5e7eb' }}
          />
          {dupNameError && (
            <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>⚠ {dupNameError}</p>
          )}
        </div>

        {/* Barcode */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Barcode</label>
          <div className="relative">
            <input
              value={form.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="Scan or enter manually"
              className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-3 top-2.5 text-blue-600"
              title="Scan barcode"
            >
              <ScanLine size={20} />
            </button>
          </div>
          {lookupStatus === 'loading' && (
            <p className="text-xs text-blue-500 flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
              Looking up barcode...
            </p>
          )}
          {lookupStatus === 'found' && (
            <p className="text-xs text-green-600">Product found and name filled in.</p>
          )}
          {lookupStatus === 'not_found' && (
            <p className="text-xs text-gray-400">Barcode not found in database. Enter name manually.</p>
          )}
          {dupBarcodeError && (
            <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>⚠ {dupBarcodeError}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Category *</label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-1">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Or create new category..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <div className="flex flex-wrap gap-2">
            {TAG_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  form.tags.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {t}
                  <X size={10} className="cursor-pointer" onClick={() => toggleTag(t)} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stock fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Current Stock</label>
            <input
              type="number" min="0"
              value={form.currentStock}
              onChange={(e) => handleChange('currentStock', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Min Stock Level</label>
            <input
              type="number" min="0"
              value={form.minStock}
              onChange={(e) => handleChange('minStock', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(dupNameError) || Boolean(dupBarcodeError)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
        </button>
      </form>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setShowScanner(false)
            lookupBarcode(code)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
