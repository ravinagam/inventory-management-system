import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useMainCategories } from '../../hooks/useHierarchy'

// Normalize both old-style and config-sourced products to the same flat shape
function normalize(p) {
  if (p.source === 'config' && Array.isArray(p.hierarchyLevels)) {
    const lvl = (i) => p.hierarchyLevels.find((l) => l.levelIndex === i)?.itemName || ''
    return {
      ...p,
      mainCategoryName: lvl(0),
      subCategoryName:  lvl(1),
      productNameStr:   lvl(2),
      variant:          lvl(3),
      size:             lvl(4),
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
    p.productNameStr     || p.name || '',
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

const COLS = [
  { key: 'mainCategoryName', label: 'Main Category' },
  { key: 'subCategoryName',  label: 'Sub Category' },
  { key: 'productNameStr',   label: 'Product Name' },
  { key: 'variant',          label: 'Variant' },
  { key: 'size',             label: 'Size' },
  { key: 'displayName',      label: 'Display Name' },
  { key: 'sku',              label: 'Product Code' },
  { key: 'currentStock',     label: 'Stock' },
  { key: 'minStock',         label: 'Min Stock' },
  { key: 'tags',             label: 'Tags' },
]

export default function Reports() {
  const { products, loading } = useProducts()
  const { mainCategories }    = useMainCategories()
  const [search,   setSearch]   = useState('')
  const [mainCat,  setMainCat]  = useState('All')

  const normalized = products.map(normalize)

  const filtered = normalized.filter((p) => {
    const text = [p.displayName, p.sku, p.productNameStr, p.name].join(' ').toLowerCase()
    return (
      text.includes(search.toLowerCase()) &&
      (mainCat === 'All' || p.mainCategoryName === mainCat)
    )
  })

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Reports</h1>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or product code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...mainCategories.map((c) => c.name)].map((cat) => (
          <button
            key={cat}
            onClick={() => setMainCat(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              mainCat === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <div className="bg-white rounded-xl shadow-sm p-3 flex-1 text-center">
          <p className="text-xl font-bold text-gray-800">{filtered.length}</p>
          <p className="text-xs text-gray-500">Total Products</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 flex-1 text-center">
          <p className="text-xl font-bold text-red-500">
            {filtered.filter((p) => (p.currentStock ?? 0) < (p.minStock ?? 0)).length}
          </p>
          <p className="text-xs text-gray-500">Low Stock</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 flex-1 text-center">
          <p className="text-xl font-bold text-blue-600">
            {filtered.reduce((sum, p) => sum + (p.currentStock ?? 0), 0)}
          </p>
          <p className="text-xs text-gray-500">Total Units</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-10">No products found.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Horizontal scroll on mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {COLS.map((col) => (
                    <th key={col.key} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => {
                  const isLow = (p.currentStock ?? 0) < (p.minStock ?? 0)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{p.mainCategoryName || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{p.subCategoryName  || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{p.productNameStr   || p.name || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{p.variant          || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{p.size             || '—'}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{p.displayName || p.name}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {p.sku
                          ? <span className="font-mono text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{p.sku}</span>
                          : '—'}
                      </td>
                      <td className={`px-3 py-2.5 font-semibold whitespace-nowrap ${isLow ? 'text-red-500' : 'text-gray-800'}`}>
                        {p.currentStock ?? 0}
                        {isLow && <span className="ml-1 text-xs font-normal text-red-400">Low</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{p.minStock ?? 0}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {(p.tags || []).length > 0
                            ? p.tags.map((t) => (
                                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t}</span>
                              ))
                            : <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
