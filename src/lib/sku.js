// Generate display name from hierarchy
export function getDisplayName(productName, variant, size) {
  return [productName, variant || null, size].filter(Boolean).join(' ')
}

// Auto-generate SKU code from hierarchy fields
export function generateSKU(mainCategoryName, productName, variant, size) {
  const clean = (s) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const mc   = clean(mainCategoryName).slice(0, 3)
  const prod = clean(productName).slice(0, 4)
  const vari = variant ? clean(variant).slice(0, 3) : null
  const sz   = clean(size).slice(0, 6)
  return [mc, prod, vari, sz].filter(Boolean).join('-')
}
