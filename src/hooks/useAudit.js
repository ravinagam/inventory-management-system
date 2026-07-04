import { useState } from 'react'
import {
  addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { companyCol, companyDoc } from '../lib/tenant'

export function useAudit(companyId, products) {
  const [auditItems, setAuditItems] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [sessionStatus, setSessionStatus] = useState(null)

  function startNewAudit() {
    if (!products || products.length === 0) return
    const picked = [...products]
      .sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''))
      .map((p) => ({
      productId: p.id,
      productName: p.displayName || p.name,
      sku: p.sku || '',
      expected: p.currentStock ?? 0,
      actual: String(p.currentStock ?? 0),
      reason: '',
    }))
    addDoc(companyCol(companyId, 'auditSessions'), {
      items: picked,
      status: 'pending',
      createdAt: serverTimestamp(),
    }).then((ref) => setSessionId(ref.id))
    setAuditItems(picked)
    setSessionStatus('pending')
  }

  function updateItem(productId, field, value) {
    setAuditItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, [field]: value } : item))
    )
  }

  async function submitAudit() {
    // Adjust stock directly — no runTransaction (conflicts with persistentLocalCache)
    for (const item of auditItems) {
      if (item.actual !== '' && Number(item.actual) !== item.expected) {
        await updateDoc(companyDoc(companyId, 'products', item.productId), {
          currentStock: Number(item.actual),
          updatedAt: serverTimestamp(),
        })
      }
    }

    if (sessionId) {
      await updateDoc(companyDoc(companyId, 'auditSessions', sessionId), {
        items: auditItems,
        status: 'completed',
        completedAt: serverTimestamp(),
      })
    }

    setSessionStatus('completed')
  }

  return { auditItems, sessionStatus, updateItem, submitAudit, startNewAudit }
}
