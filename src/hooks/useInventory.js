import { useEffect, useState } from 'react'
import {
  onSnapshot, addDoc, query, orderBy,
  serverTimestamp, limit, getDoc, updateDoc,
} from 'firebase/firestore'
import { companyCol, companyDoc } from '../lib/tenant'
import useAuthStore from '../store/authStore'

export function useInventoryLogs(limitCount = 20) {
  const companyId = useAuthStore((s) => s.companyId)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) {
      setLogs([])
      setLoading(false)
      return
    }

    const q = query(companyCol(companyId, 'inventoryLogs'), orderBy('createdAt', 'desc'), limit(limitCount))
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [companyId, limitCount])

  return { logs, loading }
}

export async function submitInventoryUpdate({ companyId, productId, productName, action, quantity, notes }) {
  const qty = Number(quantity)
  const productRef = companyDoc(companyId, 'products', productId)

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
  await addDoc(companyCol(companyId, 'inventoryLogs'), {
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
