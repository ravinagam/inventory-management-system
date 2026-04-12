import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, query, orderBy,
  serverTimestamp, doc, limit, getDoc, updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const LOGS_COL = 'inventoryLogs'

export function useInventoryLogs(limitCount = 20) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, LOGS_COL), orderBy('createdAt', 'desc'), limit(limitCount))
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [limitCount])

  return { logs, loading }
}

export async function submitInventoryUpdate({ productId, productName, action, quantity, notes }) {
  const qty = Number(quantity)
  const productRef = doc(db, 'products', productId)

  // Fetch current stock from server
  const snap = await getDoc(productRef)
  if (!snap.exists()) throw new Error('Product not found')

  const current = snap.data().currentStock ?? 0
  let newStock
  if (action === 'Stock In')       newStock = current + qty
  else if (action === 'Stock Out') newStock = Math.max(0, current - qty)
  else                             newStock = qty  // Adjust = set directly

  // Update stock
  await updateDoc(productRef, { currentStock: newStock, updatedAt: serverTimestamp() })

  // Log the entry
  await addDoc(collection(db, LOGS_COL), {
    productId,
    productName,
    action,
    quantity: qty,
    previousStock: current,
    newStock,
    notes: notes || '',
    createdAt: serverTimestamp(),
  })
}
