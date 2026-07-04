import { useEffect, useState } from 'react'
import {
  onSnapshot, addDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { companyCol, companyDoc } from '../lib/tenant'
import useAuthStore from '../store/authStore'

export function useProducts() {
  const companyId = useAuthStore((s) => s.companyId)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) {
      setProducts([])
      setLoading(false)
      return
    }

    // No orderBy — Firestore silently excludes docs missing the ordered field.
    // Sort client-side to guarantee all products are always returned.
    const unsub = onSnapshot(companyCol(companyId, 'products'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0
        const tb = b.createdAt?.toMillis?.() ?? 0
        return tb - ta
      })
      setProducts(all)
      setLoading(false)
    })
    return unsub
  }, [companyId])

  return { products, loading }
}

export async function addProduct(companyId, data) {
  console.log('🔍 addProduct called with companyId:', companyId, 'data:', data)
  const path = companyCol(companyId, 'products')
  console.log('🔍 Writing to path:', path)
  await addDoc(path, { ...data, createdAt: serverTimestamp() })
  console.log('✅ Product added successfully!')
}

export async function updateProduct(companyId, id, data) {
  await updateDoc(companyDoc(companyId, 'products', id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteProduct(companyId, id) {
  await deleteDoc(companyDoc(companyId, 'products', id))
}
