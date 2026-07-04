import { useEffect, useState } from 'react'
import { onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { companyDoc } from '../lib/tenant'
import useAuthStore from '../store/authStore'

export function useSettings() {
  const companyId = useAuthStore((s) => s.companyId)
  const [settings, setSettings] = useState({ companyName: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) {
      setSettings({ companyName: '' })
      setLoading(false)
      return
    }

    const settingsRef = companyDoc(companyId, 'settings', 'general')
    return onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data())
      } else {
        setSettings({ companyName: '' })
      }
      setLoading(false)
    })
  }, [companyId])

  return { settings, loading }
}

export async function saveSettings(companyId, data) {
  const settingsRef = companyDoc(companyId, 'settings', 'general')
  await setDoc(settingsRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
