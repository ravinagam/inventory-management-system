import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useMainCategories } from '../../hooks/useHierarchy'

export default function ProductList() {
  const [search,   setSearch]   = useState('')
  const [mainCat,  setMainCat]  = useState('All')
  const navigate = useNavigate()
  const { products, loading }     = useProducts()
  const { mainCategories }        = useMainCategories()

  const filtered = products.slice().sort((a, b) =>
    (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '')
  ).filter((p) => {
    const name    = (p.displayName || p.name || '').toLowerCase()
    const sku     = (p.sku || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase())
    const matchCat    = mainCat === 'All' || p.mainCategoryName === mainCat
    return matchSearch && matchCat
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => navigate('/config', { state: { tab: 2 } })}
          className="flex items-center gap-1 bg-blue-600 text-white text-sm px-3 py-2 rounded-xl font-medium"
        >
          Add Product
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

      {/* Main category filter pills */}
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

      {/* Product list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y">
          {filtered.map((p) => {
            const isLow = (p.currentStock ?? 0) < (p.minStock ?? 0)
            // Build breadcrumb: Main > Sub > Product
            const breadcrumb = [
              p.mainCategoryName,
              p.subCategoryName,
              p.productNameStr,
            ].filter(Boolean).join(' › ')

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {p.displayName || p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.sku && (
                      <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {p.sku}
                      </span>
                    )}
                    {breadcrumb && (
                      <span className="text-xs text-gray-400 truncate">{breadcrumb}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-2 shrink-0">
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${isLow ? 'text-red-500' : 'text-gray-700'}`}>
                      {p.currentStock ?? 0}
                    </span>
                    {isLow && <p className="text-xs text-red-400">Low</p>}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">
              {products.length === 0 ? 'No products yet. Tap "Add Product" to begin.' : 'No results found.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
