import { useEffect, useState } from 'react'
import { query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore'
import { companyCol } from '../lib/tenant'
import useAuthStore from '../store/authStore'

export function useAuditHistory() {
  const companyId = useAuthStore((s) => s.companyId)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) {
      setSessions([])
      setLoading(false)
      return
    }

    const q = query(companyCol(companyId, 'auditSessions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [companyId])

  return { sessions, loading }
}

export function useTodayAuditItems() {
  const companyId = useAuthStore((s) => s.companyId)
  const [auditItems, setAuditItems] = useState([])

  useEffect(() => {
    if (!companyId) {
      setAuditItems([])
      return
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const q = query(
      companyCol(companyId, 'auditSessions'),
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
  }, [companyId])

  return { auditItems }
}
