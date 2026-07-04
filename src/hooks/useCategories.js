import { useEffect, useState } from 'react'
import {
  onSnapshot, addDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { companyCol } from '../lib/tenant'
import useAuthStore from '../store/authStore'

export function useCategories() {
  const companyId = useAuthStore((s) => s.companyId)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) {
      setCategories([])
      setLoading(false)
      return
    }

    const q = query(companyCol(companyId, 'categories'), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [companyId])

  return { categories, loading }
}

export async function addCategory(companyId, name) {
  await addDoc(companyCol(companyId, 'categories'), { name, createdAt: serverTimestamp() })
}
