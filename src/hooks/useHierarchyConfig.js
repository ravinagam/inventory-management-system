import { useState, useEffect } from 'react'
import {
  doc, setDoc, onSnapshot, collection, addDoc,
  updateDoc, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const CONFIG_DOC = doc(db, 'hierarchyConfig', 'setup')
const DATA_COL = 'hierarchyData'

// ── Config (level names) ──────────────────────────────────────────────────────

export function useHierarchyConfig() {
  const [config, setConfig] = useState(null) // null while loading

  useEffect(() => {
    return onSnapshot(CONFIG_DOC, (snap) => {
      setConfig(snap.exists() ? snap.data() : { levels: [] })
    })
  }, [])

  return { config, loading: config === null }
}

export async function saveHierarchyConfig(levels, optionalLevels) {
  await setDoc(CONFIG_DOC, { levels, optionalLevels }, { merge: true })
}

// ── Level items ───────────────────────────────────────────────────────────────

/**
 * Returns all Firestore docs with the given levelIndex.
 * Accepts negative / null levelIndex → returns [] with no query.
 */
export function useLevelItems(levelIndex) {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (levelIndex === null || levelIndex === undefined || levelIndex < 0) {
      setItems([])
      return
    }
    const q = query(collection(db, DATA_COL), where('levelIndex', '==', levelIndex))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
    })
  }, [levelIndex])

  return items
}

export async function addLevelItem(levelIndex, name, parentId) {
  await addDoc(collection(db, DATA_COL), {
    levelIndex,
    name: name.trim(),
    parentId: parentId || null,
    createdAt: serverTimestamp(),
  })
}

export async function updateLevelItem(id, name) {
  await updateDoc(doc(db, DATA_COL, id), { name: name.trim() })
}

export async function deleteLevelItem(id) {
  await deleteDoc(doc(db, DATA_COL, id))
}
