import { useState, useEffect } from 'react'
import { Save, ChevronRight } from 'lucide-react'
import { saveHierarchyConfig } from '../../hooks/useHierarchyConfig'

export default function HierarchySetup({ config, onSaved }) {
  const [count, setCount] = useState('')
  const [step, setStep] = useState(1)
  const [levelNames, setLevelNames] = useState([])
  const [optionalFlags, setOptionalFlags] = useState([]) // true = optional
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-populate if config already exists
  useEffect(() => {
    if (config?.levels?.length > 0) {
      setCount(String(config.levels.length))
      setLevelNames(config.levels)
      setOptionalFlags(config.optionalLevels || config.levels.map(() => false))
      setStep(2)
    }
  }, [config])

  function handleSetCount(e) {
    e.preventDefault()
    const n = parseInt(count, 10)
    if (!n || n < 2 || n > 10) {
      setError('Enter a number between 2 and 10.')
      return
    }
    setError('')
    setLevelNames((prev) => Array.from({ length: n }, (_, i) => prev[i] || ''))
    setOptionalFlags((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? false))
    setStep(2)
  }

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = levelNames.map((n) => n.trim())
    if (trimmed.some((n) => !n)) {
      setError('All level names are required.')
      return
    }
    if (new Set(trimmed).size !== trimmed.length) {
      setError('Level names must be unique.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await saveHierarchyConfig(trimmed, optionalFlags)
      onSaved?.()
    } catch {
      setError('Failed to save. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Step 1 ── */}
      {step === 1 && (
        <form onSubmit={handleSetCount} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Step 1 — Number of Levels
          </p>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">How many hierarchy levels?</label>
            <input
              type="number"
              min={2}
              max={10}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="e.g. 4"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">Min 2 · Max 10</p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit"
            className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl font-medium">
            Next <ChevronRight size={14} />
          </button>
        </form>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Step 2 — Level Names
              </p>
              <button type="button" onClick={() => { setStep(1); setError('') }}
                className="text-xs text-blue-600 font-medium">
                Change count
              </button>
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
              <span className="w-16 shrink-0" />
              <span className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Level Name</span>
              <span className="w-20 shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Optional</span>
            </div>

            {levelNames.map((name, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <span className="w-16 shrink-0 text-xs text-gray-400 font-medium">Level {i + 1}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const arr = [...levelNames]
                    arr[i] = e.target.value
                    setLevelNames(arr)
                  }}
                  placeholder={`Level ${i + 1} name`}
                  autoCapitalize="words"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="w-20 shrink-0 flex justify-center">
                  <input
                    type="checkbox"
                    checked={optionalFlags[i] ?? false}
                    onChange={(e) => {
                      const arr = [...optionalFlags]
                      arr[i] = e.target.checked
                      setOptionalFlags(arr)
                    }}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-500 px-1">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60">
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>
        </form>
      )}
    </div>
  )
}
