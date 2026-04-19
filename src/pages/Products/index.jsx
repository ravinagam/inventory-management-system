import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useMainCategories } from '../../hooks/useHierarchy'

function StockBar({ current, min }) {
  if (!min) return null
  const pct = Math.min((current / (min * 2)) * 100, 100)
  const isLow = current < min
  return (
    <div className="h-1 rounded-full mt-2" style={{ background: '#f1f5f9' }}>
      <div className="h-1 rounded-full" style={{
        width: `${pct}%`,
        background: isLow
          ? 'linear-gradient(90deg, #f97316, #ef4444)'
          : 'linear-gradient(90deg, #22c55e, #16a34a)',
      }} />
    </div>
  )
}

const CATEGORY_COLORS = [
  { bg: '#eff6ff', text: '#1d4ed8' },
  { bg: '#f0fdf4', text: '#16a34a' },
  { bg: '#fff7ed', text: '#ea580c' },
  { bg: '#fdf4ff', text: '#9333ea' },
  { bg: '#fef2f2', text: '#dc2626' },
  { bg: '#f0fdfa', text: '#0f766e' },
]

function categoryColor(name, categories) {
  const idx = categories.findIndex((c) => c.name === name)
  return CATEGORY_COLORS[(idx < 0 ? 0 : idx) % CATEGORY_COLORS.length]
}

export default function ProductList() {
  const [search, setSearch] = useState('')
  const [mainCat, setMainCat] = useState('All')
  const navigate = useNavigate()
  const { products, loading } = useProducts()
  const { mainCategories } = useMainCategories()

  const filtered = products
    .slice()
    .sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''))
    .filter((p) => {
      const name = (p.displayName || p.name || '').toLowerCase()
      const sku = (p.sku || '').toLowerCase()
      return (
        (name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase())) &&
        (mainCat === 'All' || p.mainCategoryName === mainCat)
      )
    })

  const lowCount = products.filter((p) => (p.currentStock ?? 0) < (p.minStock ?? 0)).length

  return (
    <div style={{
      height: 'calc(100vh - 4.5rem - 3.75rem)',
      display: 'flex',
      flexDirection: 'column',
      background: '#f1f5f9',
      overflow: 'hidden',
    }}>

      {/* ── Fixed header (title + search + pills) ── */}
      <div style={{ flexShrink: 0, padding: '14px 16px 8px', background: '#f1f5f9' }}>

        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>Products</h1>
            {lowCount > 0 && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#dc2626' }}>
                {lowCount} item{lowCount > 1 ? 's' : ''} low on stock
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/config', { state: { tab: 2 } })}
            className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 3px 10px rgba(29,78,216,0.35)' }}
          >
            <Plus size={15} strokeWidth={2.5} /> Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by name or product code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: '#fff', borderColor: '#e5e7eb', color: '#111827' }}
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {['All', ...mainCategories.map((c) => c.name)].map((cat) => {
            const active = mainCat === cat
            return (
              <button
                key={cat}
                onClick={() => setMainCat(cat)}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors"
                style={active
                  ? { background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8' }
                  : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Scrollable product list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px', scrollbarWidth: 'none' }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {filtered.map((p, i) => {
              const isLow = (p.currentStock ?? 0) < (p.minStock ?? 0)
              const col = categoryColor(p.mainCategoryName, mainCategories)
              const initials = (p.displayName || p.name || '?').slice(0, 2).toUpperCase()
              const breadcrumb = p.source === 'config' && Array.isArray(p.hierarchyLevels)
                ? p.hierarchyLevels.slice().sort((a, b) => a.levelIndex - b.levelIndex).map((l) => l.itemName).filter(Boolean).join(' › ')
                : [p.mainCategoryName, p.subCategoryName, p.productNameStr].filter(Boolean).join(' › ')

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: col.bg, color: col.text }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#111827' }}>
                      {p.displayName || p.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.sku && (
                        <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: col.bg, color: col.text }}>
                          {p.sku}
                        </span>
                      )}
                      {breadcrumb && (
                        <span className="text-xs truncate" style={{ color: '#9ca3af' }}>{breadcrumb}</span>
                      )}
                    </div>
                    <StockBar current={p.currentStock ?? 0} min={p.minStock ?? 0} />
                  </div>
                  <div className="text-right flex-shrink-0 ml-1">
                    <p className="text-base font-black leading-tight"
                      style={{ color: isLow ? '#dc2626' : '#16a34a' }}>
                      {p.currentStock ?? 0}
                    </p>
                    {isLow
                      ? <p className="text-xs font-bold" style={{ color: '#dc2626' }}>Low</p>
                      : <p className="text-xs" style={{ color: '#9ca3af' }}>units</p>}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                  {products.length === 0
                    ? 'No products yet. Tap "Add Product" to begin.'
                    : 'No results found.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
