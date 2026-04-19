import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ScanLine, X, Trash2, Tag } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  useMainCategories, addMainCategory,
  useSubCategories, addSubCategory,
  useProductNames, addProductName,
} from '../../hooks/useHierarchy'
import { addProduct, updateProduct, deleteProduct, useProducts } from '../../hooks/useProducts'
import CreatableSelect from '../../components/CreatableSelect'
import BarcodeScanner from '../../components/BarcodeScanner'
import { getDisplayName, generateSKU } from '../../lib/sku'

const TAG_SUGGESTIONS = ['Fast Moving', 'Seasonal', 'Fragile', 'Imported', 'Perishable']

export default function SKUForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  // Hierarchy selections
  const [mainCategory, setMainCategory]   = useState(null)  // { id, name }
  const [subCategory,  setSubCategory]    = useState(null)  // { id, name } | null
  const [productName,  setProductName]    = useState(null)  // { id, name }
  const [skipSubCat,   setSkipSubCat]     = useState(false)

  // SKU fields
  const [variant,      setVariant]        = useState('')
  const [size,         setSize]           = useState('')
  const [currentStock, setCurrentStock]   = useState('')
  const [minStock,     setMinStock]       = useState('')
  const [barcode,      setBarcode]        = useState('')
  const [tags,         setTags]           = useState([])
  const [customSKU,    setCustomSKU]      = useState('')
  const [skuEdited,    setSkuEdited]      = useState(false)

  const [showScanner,   setShowScanner]   = useState(false)
  const [lookupStatus,  setLookupStatus]  = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [fetching,      setFetching]      = useState(isEdit)
  const [dupNameError,  setDupNameError]  = useState('')
  const [dupSkuError,   setDupSkuError]   = useState('')

  // All products for duplicate check
  const { products } = useProducts()

  // Hierarchy data
  const { mainCategories } = useMainCategories()
  const { subCategories }  = useSubCategories(mainCategory?.id)
  const { productNames }   = useProductNames(mainCategory?.id, skipSubCat ? null : subCategory?.id)

  // Auto-computed values
  const displayName = useMemo(
    () => productName ? getDisplayName(productName.name, variant, size) : '',
    [productName, variant, size]
  )

  const autoSKU = useMemo(
    () => mainCategory && productName && size
      ? generateSKU(mainCategory.name, productName.name, variant, size)
      : '',
    [mainCategory, productName, variant, size]
  )

  // Use custom SKU if user edited, else auto
  const sku = skuEdited ? customSKU : autoSKU

  // Duplicate checks (against already-loaded products list)
  useEffect(() => {
    if (!displayName) { setDupNameError(''); return }
    const lower = displayName.toLowerCase()
    const dup = products.find(p => p.id !== id && (p.displayName || p.name || '').toLowerCase() === lower)
    setDupNameError(dup ? `"${displayName}" already exists.` : '')
  }, [displayName, products, id])

  useEffect(() => {
    if (!sku) { setDupSkuError(''); return }
    const lower = sku.toLowerCase()
    const dup = products.find(p => p.id !== id && (p.sku || '').toLowerCase() === lower)
    setDupSkuError(dup ? `Product code "${sku}" is already in use.` : '')
  }, [sku, products, id])

  // When main category changes, reset downstream
  function handleMainCategoryChange(val) {
    setMainCategory(val)
    setSubCategory(null)
    setProductName(null)
    setSkipSubCat(false)
  }

  function handleSubCategoryChange(val) {
    setSubCategory(val)
    setProductName(null)
  }

  function handleSkipSubCat() {
    setSkipSubCat(true)
    setSubCategory(null)
    setProductName(null)
  }

  function toggleTag(tag) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  // Load existing SKU when editing
  useEffect(() => {
    if (!isEdit) return
    getDoc(doc(db, 'products', id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data()
        // Config-sourced products have their own edit page
        if (d.source === 'config') {
          navigate(`/config/products/${id}`, { replace: true })
          return
        }
        setMainCategory(d.mainCategoryId ? { id: d.mainCategoryId, name: d.mainCategoryName } : null)
        setSubCategory(d.subCategoryId   ? { id: d.subCategoryId,  name: d.subCategoryName }  : null)
        setProductName(d.productNameId   ? { id: d.productNameId,  name: d.productNameStr }   : null)
        setSkipSubCat(!d.subCategoryId)
        setVariant(d.variant || '')
        setSize(d.size || '')
        setCurrentStock(d.currentStock ?? '')
        setMinStock(d.minStock ?? '')
        setBarcode(d.barcode || '')
        setTags(d.tags || [])
        setCustomSKU(d.sku || '')
        setSkuEdited(true)
      }
      setFetching(false)
    })
  }, [id, isEdit])

  async function lookupBarcode(code) {
    setBarcode(code)
    setLookupStatus('loading')
    try {
      const res  = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`)
      const data = await res.json()
      if (data.code === 'OK' && data.items?.length > 0) {
        const item = data.items[0]
        if (!productName && item.title) {
          // Can't auto-set productName (it's a Firestore ref), just hint
        }
        setLookupStatus('found')
      } else {
        setLookupStatus('not_found')
      }
    } catch {
      setLookupStatus('not_found')
    }
    setTimeout(() => setLookupStatus(null), 3000)
  }

  // Validation
  function validate() {
    if (!mainCategory)    return 'Main Category is required'
    if (!skipSubCat && subCategories.length > 0 && !subCategory)
      return 'Select a Sub Category or choose "Skip"'
    if (!productName)     return 'Product Name is required'
    if (!size.trim())     return 'Size is required'
    if (!sku.trim())      return 'Product code could not be generated — check all fields'
    if (dupNameError)     return dupNameError
    if (dupSkuError)      return dupSkuError
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) return alert(err)

    setLoading(true)
    try {
      const data = {
        // Hierarchy
        mainCategoryId:   mainCategory.id,
        mainCategoryName: mainCategory.name,
        subCategoryId:    subCategory?.id   || null,
        subCategoryName:  subCategory?.name || null,
        productNameId:    productName.id,
        productNameStr:   productName.name,
        variant:          variant.trim() || null,
        size:             size.trim(),
        // Generated
        displayName,
        sku,
        // Stock
        currentStock: Number(currentStock) || 0,
        minStock:     Number(minStock)     || 0,
        // Optional
        barcode: barcode || '',
        tags,
        // Keep legacy fields for backward compat
        name:     displayName,
        category: mainCategory.name,
      }
      if (isEdit) await updateProduct(id, data)
      else        await addProduct(data)
      navigate('/products')
    } catch {
      alert('Failed to save. Please try again.')
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
      {/* Header */}
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Hierarchy ──────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Category Hierarchy</p>

          {/* Main Category */}
          <CreatableSelect
            label="Main Category"
            required
            value={mainCategory}
            onChange={handleMainCategoryChange}
            options={mainCategories}
            onCreateNew={(name) => addMainCategory(name)}
            placeholder="Select main category"
          />

          {/* Sub Category */}
          {mainCategory && (
            <div className="space-y-1.5">
              <CreatableSelect
                label="Sub Category"
                optional
                value={skipSubCat ? null : subCategory}
                onChange={handleSubCategoryChange}
                options={subCategories}
                onCreateNew={(name) => addSubCategory(name, mainCategory.id, mainCategory.name)}
                placeholder="Select sub category"
                disabled={skipSubCat}
              />
              <button
                type="button"
                onClick={() => skipSubCat ? (setSkipSubCat(false)) : handleSkipSubCat()}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  skipSubCat
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-200'
                }`}
              >
                {skipSubCat ? '✓ No sub category' : 'Skip — no sub category'}
              </button>
            </div>
          )}

          {/* Product Name */}
          {mainCategory && (skipSubCat || subCategory) && (
            <CreatableSelect
              label="Product Name"
              required
              value={productName}
              onChange={setProductName}
              options={productNames}
              onCreateNew={(name) =>
                addProductName(
                  name,
                  mainCategory.id, mainCategory.name,
                  skipSubCat ? null : subCategory?.id,
                  skipSubCat ? null : subCategory?.name,
                )
              }
              placeholder="Select product name"
            />
          )}
        </section>

        {/* ── Variant & Size ─────────────────────────────── */}
        {productName && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Variant & Size</p>

            {/* Variant */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Variant <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. Regular, Blue, Vanilla"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Size */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Size <span className="text-red-500">*</span>
              </label>
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 500ml, 1kg, Medium, A4"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>
        )}

        {/* ── Auto-generated Preview ─────────────────────── */}
        {displayName && (
          <section className={`border rounded-2xl p-4 space-y-3 ${dupNameError || dupSkuError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Generated</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-blue-500">Display Name</p>
                <p className="font-semibold text-gray-800">{displayName}</p>
                {dupNameError && (
                  <p className="text-xs font-semibold mt-1" style={{ color: '#dc2626' }}>⚠ {dupNameError}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-blue-500">Product Code</p>
                <div className="flex items-center gap-2">
                  <input
                    value={sku}
                    onChange={(e) => { setCustomSKU(e.target.value); setSkuEdited(true) }}
                    className="flex-1 px-3 py-1.5 rounded-xl border bg-white text-sm font-mono font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: dupSkuError ? '#fca5a5' : '#bfdbfe' }}
                  />
                  {skuEdited && (
                    <button
                      type="button"
                      onClick={() => { setSkuEdited(false); setCustomSKU('') }}
                      className="text-xs text-blue-600 hover:underline shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {dupSkuError
                  ? <p className="text-xs font-semibold mt-0.5" style={{ color: '#dc2626' }}>⚠ {dupSkuError}</p>
                  : <p className="text-xs text-blue-400 mt-0.5">Auto-generated. Tap to customise.</p>
                }
              </div>
            </div>
          </section>
        )}

        {/* ── Stock ─────────────────────────────────────── */}
        {productName && size && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stock</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Current Stock</label>
                <input
                  type="number" min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Min Stock Level</label>
                <input
                  type="number" min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Barcode & Tags ────────────────────────────── */}
        {productName && size && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Barcode & Tags</p>

            {/* Barcode */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Barcode</label>
              <div className="relative">
                <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or enter manually"
                  className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowScanner(true)}
                  className="absolute right-3 top-2.5 text-blue-600">
                  <ScanLine size={20} />
                </button>
              </div>
              {lookupStatus === 'loading' && (
                <p className="text-xs text-blue-500 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
                  Looking up barcode...
                </p>
              )}
              {lookupStatus === 'found'     && <p className="text-xs text-green-600">Barcode found in database.</p>}
              {lookupStatus === 'not_found' && <p className="text-xs text-gray-400">Not found — enter details manually.</p>}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Tag size={13} /> Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_SUGGESTIONS.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      tags.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {t}
                      <X size={10} className="cursor-pointer" onClick={() => toggleTag(t)} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Save */}
        <button
          type="submit"
          disabled={loading || Boolean(dupNameError) || Boolean(dupSkuError)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
        </button>
      </form>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => { setShowScanner(false); lookupBarcode(code) }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
