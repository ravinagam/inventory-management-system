import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const byName = (a, b) => a.name.localeCompare(b.name)

// ─── Main Categories ──────────────────────────────────────────────────────────

export function useMainCategories() {
  const [mainCategories, setMainCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Single-field orderBy — no composite index needed
    const q = query(collection(db, 'mainCategories'), orderBy('name'))
    return onSnapshot(q, (snap) => {
      setMainCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  return { mainCategories, loading }
}

export async function addMainCategory(name) {
  const ref = await addDoc(collection(db, 'mainCategories'), { name, createdAt: serverTimestamp() })
  return { id: ref.id, name }
}

// ─── Sub Categories ───────────────────────────────────────────────────────────

export function useSubCategories(mainCategoryId) {
  const [subCategories, setSubCategories] = useState([])

  useEffect(() => {
    if (!mainCategoryId) { setSubCategories([]); return }

    // Only where — no composite index needed, sort client-side
    const q = query(
      collection(db, 'subCategories'),
      where('mainCategoryId', '==', mainCategoryId)
    )
    return onSnapshot(q, (snap) => {
      setSubCategories(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byName)
      )
    })
  }, [mainCategoryId])

  return { subCategories }
}

export async function addSubCategory(name, mainCategoryId, mainCategoryName) {
  const ref = await addDoc(collection(db, 'subCategories'), {
    name, mainCategoryId, mainCategoryName, createdAt: serverTimestamp(),
  })
  return { id: ref.id, name }
}

// ─── Product Names ────────────────────────────────────────────────────────────

export function useProductNames(mainCategoryId, subCategoryId) {
  const [productNames, setProductNames] = useState([])

  useEffect(() => {
    if (!mainCategoryId) { setProductNames([]); return }

    // Filter by mainCategoryId only, then filter subCategoryId client-side
    // Avoids composite index requirement
    const q = query(
      collection(db, 'productNames'),
      where('mainCategoryId', '==', mainCategoryId)
    )

    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const filtered = subCategoryId
        ? all.filter((p) => p.subCategoryId === subCategoryId)
        : all.filter((p) => !p.subCategoryId)
      setProductNames(filtered.sort(byName))
    })
  }, [mainCategoryId, subCategoryId])

  return { productNames }
}

export async function addProductName(name, mainCategoryId, mainCategoryName, subCategoryId, subCategoryName) {
  const ref = await addDoc(collection(db, 'productNames'), {
    name,
    mainCategoryId,
    mainCategoryName,
    subCategoryId: subCategoryId || null,
    subCategoryName: subCategoryName || null,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, name }
}
