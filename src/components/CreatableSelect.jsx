import { useState } from 'react'
import { Plus, Check, Loader2 } from 'lucide-react'

export default function CreatableSelect({
  label,
  required = false,
  optional = false,
  value,
  onChange,
  options = [],
  onCreateNew,
  placeholder = 'Select...',
  disabled = false,
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setError('')
    setSaving(true)
    try {
      const created = await onCreateNew(trimmed)
      onChange(created)
      setNewName('')
      setCreating(false)
    } catch (err) {
      console.error('CreatableSelect error:', err)
      setError('Failed to save. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={() => { setCreating(!creating); setError('') }}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            <Plus size={12} /> New
          </button>
        )}
      </div>

      {/* Dropdown */}
      <select
        value={value?.id || ''}
        onChange={(e) => {
          const found = options.find((o) => o.id === e.target.value)
          onChange(found || null)
        }}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
          disabled ? 'border-gray-100 text-gray-400 bg-gray-50' : 'border-gray-200 text-gray-800'
        }`}
      >
        <option value="">{disabled ? '—' : placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>

      {/* Inline create input */}
      {creating && !disabled && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text')
                setNewName(pasted)
                e.preventDefault()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreate() }
                if (e.key === 'Escape') { setCreating(false); setError('') }
              }}
              placeholder={`Type or paste ${label.toLowerCase()}...`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              className="flex-1 px-3 py-2 rounded-xl border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 min-w-[40px] justify-center"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  )
}
