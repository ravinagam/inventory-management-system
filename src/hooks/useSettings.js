import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

const SETTINGS_REF = doc(db, 'settings', 'general')

export function useSettings() {
  const [settings, setSettings] = useState({ companyName: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(SETTINGS_REF, (snap) => {
      if (snap.exists()) setSettings(snap.data())
      setLoading(false)
    })
  }, [])

  return { settings, loading }
}

export async function saveSettings(data) {
  await setDoc(SETTINGS_REF, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
