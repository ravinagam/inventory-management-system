import { useState, useEffect } from 'react'
import {
  doc, setDoc, onSnapshot, addDoc,
  updateDoc, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { companyCol, companyDoc } from '../lib/tenant'
import useAuthStore from '../store/authStore'

// ── Config (level names) ──────────────────────────────────────────────────────

export function useHierarchyConfig() {
  const companyId = useAuthStore((s) => s.companyId)
  const [config, setConfig] = useState(null) // null while loading

  useEffect(() => {
    if (!companyId) {
      setConfig(null)
      return
    }

    const configDoc = companyDoc(companyId, 'hierarchyConfig', 'setup')
    return onSnapshot(configDoc, (snap) => {
      setConfig(snap.exists() ? snap.data() : { levels: [] })
    })
  }, [companyId])

  return { config, loading: config === null }
}

export async function saveHierarchyConfig(companyId, levels, optionalLevels) {
  const configDoc = companyDoc(companyId, 'hierarchyConfig', 'setup')
  await setDoc(configDoc, { levels, optionalLevels }, { merge: true })
}

// ── Level items ───────────────────────────────────────────────────────────────

/**
 * Returns all Firestore docs with the given levelIndex.
 * Accepts negative / null levelIndex → returns [] with no query.
 */
export function useLevelItems(levelIndex) {
  const companyId = useAuthStore((s) => s.companyId)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!companyId || levelIndex === null || levelIndex === undefined || levelIndex < 0) {
      setItems([])
      return
    }
    const q = query(companyCol(companyId, 'hierarchyData'), where('levelIndex', '==', levelIndex))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
    })
  }, [companyId, levelIndex])

  return items
}

export async function addLevelItem(companyId, levelIndex, name, parentId) {
  await addDoc(companyCol(companyId, 'hierarchyData'), {
    levelIndex,
    name: name.trim(),
    parentId: parentId || null,
    createdAt: serverTimestamp(),
  })
}

export async function updateLevelItem(companyId, id, name) {
  await updateDoc(companyDoc(companyId, 'hierarchyData', id), { name: name.trim() })
}

export async function deleteLevelItem(companyId, id) {
  await deleteDoc(companyDoc(companyId, 'hierarchyData', id))
}
