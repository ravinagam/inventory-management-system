import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAuditHistory() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'auditSessions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return { sessions, loading }
}

export function useTodayAuditItems() {
  const [auditItems, setAuditItems] = useState([])

  useEffect(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const q = query(
      collection(db, 'auditSessions'),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      // Collect all items from today's sessions (may be multiple)
      const allItems = []
      snap.docs.forEach((d) => {
        const data = d.data()
        ;(data.items || []).forEach((item) => {
          // Avoid duplicates — keep latest entry per product
          if (!allItems.find((i) => i.productId === item.productId)) {
            allItems.push({ ...item, status: data.status })
          }
        })
      })
      setAuditItems(allItems)
    })

    return unsub
  }, [])

  return { auditItems }
}
