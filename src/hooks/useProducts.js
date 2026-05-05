import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const COL = 'products'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // No orderBy — Firestore silently excludes docs missing the ordered field.
    // Sort client-side to guarantee all products are always returned.
    const unsub = onSnapshot(collection(db, COL), (snap) => {
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
  }, [])

  return { products, loading }
}

export async function addProduct(data) {
  await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() })
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, COL, id))
}
