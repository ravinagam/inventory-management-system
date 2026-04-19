import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useMainCategories } from '../../hooks/useHierarchy'

function normalize(p) {
  if (p.source === 'config' && Array.isArray(p.hierarchyLevels)) {
    const byIndex = (i) => p.hierarchyLevels.find((l) => l.levelIndex === i)?.itemName || ''

    // Match level by name keywords so size/variant map correctly regardless of levelIndex
    const findByName = (...keywords) => {
      for (const kw of keywords) {
        const found = p.hierarchyLevels.find((l) =>
          l.levelName?.toLowerCase().includes(kw.toLowerCase())
        )
        if (found?.itemName) return found.itemName
      }
      return ''
    }

    return {
      ...p,
      mainCategoryName: byIndex(0),
      subCategoryName:  byIndex(1),
      productNameStr:   p.displayName || p.name || '',
      variant:          findByName('variant', 'brand', 'type', 'model', 'style') || byIndex(3),
      size:             findByName('size', 'dimension', 'weight', 'volume', 'inch') || byIndex(4),
    }
  }
  return p
}

function exportCSV(products) {
  const headers = [
    'Main Category', 'Sub Category', 'Product Name',
    'Variant', 'Size', 'Display Name', 'Product Code',
    'Current Stock', 'Min Stock', 'Tags',
  ]
  const rows = products.map((p) => [
    p.mainCategoryName   || '',
    p.subCategoryName    || '',
    p.displayName        || p.name || '',
    p.variant            || '',
    p.size               || '',
    p.displayName        || p.name || '',
    p.sku                || '',
    p.currentStock       ?? 0,
    p.minStock           ?? 0,
    (p.tags || []).join(', '),
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
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

export default function Reports() {
  const { products, loading } = useProducts()
  const { mainCategories }    = useMainCategories()
  const [search,   setSearch]   = useState('')
  const [mainCat,  setMainCat]  = useState('All')

  const normalized = products.map(normalize)

  const filtered = normalized
    .slice()
    .sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''))
    .filter((p) => {
      const text = [p.displayName, p.sku, p.productNameStr, p.name].join(' ').toLowerCase()
      return (
        text.includes(search.toLowerCase()) &&
        (mainCat === 'All' || p.mainCategoryName === mainCat)
      )
    })

  const lowCount = filtered.filter((p) => (p.currentStock ?? 0) < (p.minStock ?? 0)).length
  const totalUnits = filtered.reduce((s, p) => s + (p.currentStock ?? 0), 0)

  return (
    <div className="p-4 space-y-4 pb-24" style={{ background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>Reports</h1>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-2xl border"
          style={{ background: '#fff', color: '#374151', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <p className="text-xl font-black" style={{ color: '#1d4ed8' }}>{filtered.length}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>Products</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <p className="text-xl font-black" style={{ color: lowCount > 0 ? '#dc2626' : '#16a34a' }}>{lowCount}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>Low Stock</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <p className="text-xl font-black" style={{ color: '#16a34a' }}>{totalUnits}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>Total Units</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af' }} />
        <input
          type="text"
          placeholder="Search by name or product code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: '#fff', borderColor: '#e5e7eb' }}
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {['All', ...mainCategories.map((c) => c.name)].map((cat) => (
          <button
            key={cat}
            onClick={() => setMainCat(cat)}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors"
            style={mainCat === cat
              ? { background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8' }
              : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm py-10" style={{ color: '#9ca3af' }}>No products found.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filtered.map((p, i) => {
            const isLow = (p.currentStock ?? 0) < (p.minStock ?? 0)
            const col = categoryColor(p.mainCategoryName, mainCategories)
            const breadcrumb = p.source === 'config' && Array.isArray(p.hierarchyLevels)
              ? p.hierarchyLevels.slice().sort((a, b) => a.levelIndex - b.levelIndex).map((l) => l.itemName).filter(Boolean).join(' › ')
              : [p.mainCategoryName, p.subCategoryName, p.productNameStr].filter(Boolean).join(' › ')

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: col.bg, color: col.text }}
                >
                  {(p.displayName || p.name || '?').slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: '#111827' }}>
                      {p.displayName || p.name}
                    </p>
                    {isLow && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        Low
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {breadcrumb && (
                      <span className="text-xs truncate" style={{ color: '#9ca3af' }}>{breadcrumb}</span>
                    )}
                    {p.sku && (
                      <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: col.bg, color: col.text }}>
                        {p.sku}
                      </span>
                    )}
                  </div>
                  {(p.tags || []).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {p.tags.map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: '#f1f5f9', color: '#6b7280' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stock */}
                <div className="text-right flex-shrink-0 ml-1">
                  <p className="text-base font-black leading-tight"
                    style={{ color: isLow ? '#dc2626' : '#16a34a' }}>
                    {p.currentStock ?? 0}
                  </p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>min: {p.minStock ?? 0}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
