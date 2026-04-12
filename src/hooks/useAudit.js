import { useState } from 'react'
import {
  collection, addDoc, updateDoc, serverTimestamp, doc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

function pickRandom(products, count = 5) {
  const shuffled = [...products].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function useAudit(products) {
  const [auditItems, setAuditItems] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [sessionStatus, setSessionStatus] = useState(null)

  function startNewAudit() {
    if (!products || products.length === 0) return
    const picked = pickRandom(products).map((p) => ({
      productId: p.id,
      productName: p.displayName || p.name,
      sku: p.sku || '',
      expected: p.currentStock ?? 0,
      actual: '',
      reason: '',
    }))
    addDoc(collection(db, 'auditSessions'), {
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
        await updateDoc(doc(db, 'products', item.productId), {
          currentStock: Number(item.actual),
          updatedAt: serverTimestamp(),
        })
      }
    }

    if (sessionId) {
      await updateDoc(doc(db, 'auditSessions', sessionId), {
        items: auditItems,
        status: 'completed',
        completedAt: serverTimestamp(),
      })
    }

    setSessionStatus('completed')
  }

  return { auditItems, sessionStatus, updateItem, submitAudit, startNewAudit }
}
