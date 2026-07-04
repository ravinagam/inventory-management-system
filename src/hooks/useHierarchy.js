import { useEffect, useState } from 'react'
import {
  onSnapshot, addDoc, query, orderBy, serverTimestamp, where,
} from 'firebase/firestore'
import { companyCol } from '../lib/tenant'
import useAuthStore from '../store/authStore'

const byName = (a, b) => a.name.localeCompare(b.name)

// ─── Main Categories ──────────────────────────────────────────────────────────

export function useMainCategories() {
  const companyId = useAuthStore((s) => s.companyId)
  const [mainCategories, setMainCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) {
      setMainCategories([])
      setLoading(false)
      return
    }

    const q = query(companyCol(companyId, 'mainCategories'), orderBy('name'))
    return onSnapshot(q, (snap) => {
      setMainCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [companyId])

  return { mainCategories, loading }
}

export async function addMainCategory(companyId, name) {
  const ref = await addDoc(companyCol(companyId, 'mainCategories'), { name, createdAt: serverTimestamp() })
  return { id: ref.id, name }
}

// ─── Sub Categories ───────────────────────────────────────────────────────────

export function useSubCategories(mainCategoryId) {
  const companyId = useAuthStore((s) => s.companyId)
  const [subCategories, setSubCategories] = useState([])

  useEffect(() => {
    if (!companyId) {
      setSubCategories([])
      return
    }

    // Load all sub categories (independent of main category selection)
    const q = query(companyCol(companyId, 'subCategories'), orderBy('name'))
    return onSnapshot(q, (snap) => {
      setSubCategories(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byName)
      )
    })
  }, [companyId])

  return { subCategories }
}

export async function addSubCategory(companyId, name, mainCategoryId, mainCategoryName) {
  const ref = await addDoc(companyCol(companyId, 'subCategories'), {
    name, mainCategoryId, mainCategoryName, createdAt: serverTimestamp(),
  })
  return { id: ref.id, name }
}

// ─── Product Names ────────────────────────────────────────────────────────────

export function useProductNames(mainCategoryId, subCategoryId) {
  const companyId = useAuthStore((s) => s.companyId)
  const [productNames, setProductNames] = useState([])

  useEffect(() => {
    if (!companyId || !mainCategoryId) {
      setProductNames([])
      return
    }

    // Load all product names (independent of main/sub category selection)
    const q = query(companyCol(companyId, 'productNames'), orderBy('name'))
    return onSnapshot(q, (snap) => {
      setProductNames(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byName))
    })
  }, [companyId, mainCategoryId])

  return { productNames }
}

export async function addProductName(companyId, name, mainCategoryId, mainCategoryName, subCategoryId, subCategoryName) {
  const ref = await addDoc(companyCol(companyId, 'productNames'), {
    name,
    mainCategoryId,
    mainCategoryName,
    subCategoryId: subCategoryId || null,
    subCategoryName: subCategoryName || null,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, name }
}
