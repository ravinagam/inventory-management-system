import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  useLevelItems, addLevelItem, updateLevelItem, deleteLevelItem,
} from '../../hooks/useHierarchyConfig'

export default function LevelManager({ levels }) {
  const [activeLevel, setActiveLevel] = useState(0)

  return (
    <div className="space-y-4">
      {/* Level pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {levels.map((name, i) => (
          <button
            key={i}
            onClick={() => setActiveLevel(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeLevel === i
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <LevelPane
        key={activeLevel}
        levelIndex={activeLevel}
        levelName={levels[activeLevel]}
      />
    </div>
  )
}

function LevelPane({ levelIndex, levelName }) {
  const rawItems = useLevelItems(levelIndex)
  const items = rawItems.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

  const [addName, setAddName] = useState('')
  const [adding, setAdding] = useState(false)
  const [savingAdd, setSavingAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  function isDuplicate(name, excludeId = null) {
    const lower = name.trim().toLowerCase()
    return items.some(item => item.id !== excludeId && item.name.toLowerCase() === lower)
  }

  async function handleAdd() {
    if (!addName.trim()) return
    if (isDuplicate(addName)) {
      setError(`"${addName.trim()}" already exists in ${levelName}.`)
      return
    }
    setError('')
    setSavingAdd(true)
    try {
      await addLevelItem(levelIndex, addName.trim(), null)
      setAddName('')
      setAdding(false)
    } catch {
      setError('Failed to add. Check your connection.')
    } finally {
      setSavingAdd(false)
    }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    if (isDuplicate(editName, id)) {
      setError(`"${editName.trim()}" already exists in ${levelName}.`)
      return
    }
    setError('')
    try {
      await updateLevelItem(id, editName.trim())
      setEditId(null)
    } catch {
      setError('Failed to update.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this item?')) return
    setError('')
    try {
      await deleteLevelItem(id)
    } catch {
      setError('Failed to delete.')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold text-gray-700">{levelName}</p>
        <button
          onClick={() => { setAdding(true); setError('') }}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Inline add row */}
      {adding && (
        <div className="px-4 py-3 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={addName}
            onChange={(e) => { setAddName(e.target.value); setError('') }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setAddName(''); setError('') }
            }}
            placeholder={`New ${levelName}…`}
            autoCapitalize="words"
            className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: addName.trim() && isDuplicate(addName) ? '#fca5a5' : '#e5e7eb' }}
          />
          <button
            onClick={handleAdd}
            disabled={savingAdd}
            className="text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            {savingAdd ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={18} />
            )}
          </button>
          <button
            onClick={() => { setAdding(false); setAddName('') }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && <p className="px-4 py-1 text-xs text-red-500">{error}</p>}

      {/* Items */}
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-400">
          No {levelName} added yet.
        </p>
      ) : (
        items.map((item) =>
          editId === item.id ? (
            <div key={item.id} className="flex items-center gap-2 px-4 py-3">
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdate(item.id)
                  if (e.key === 'Escape') setEditId(null)
                }}
                autoCapitalize="words"
                className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => handleUpdate(item.id)} className="text-green-600 hover:text-green-700">
                <Check size={16} />
              </button>
              <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div key={item.id} className="flex items-center gap-2 px-4 py-3">
              <span className="flex-1 text-sm text-gray-800">{item.name}</span>
              <button
                onClick={() => { setEditId(item.id); setEditName(item.name) }}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        )
      )}
    </div>
  )
}
