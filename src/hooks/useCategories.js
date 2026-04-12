import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const COL = 'categories'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return { categories, loading }
}

export async function addCategory(name) {
  await addDoc(collection(db, COL), { name, createdAt: serverTimestamp() })
}
