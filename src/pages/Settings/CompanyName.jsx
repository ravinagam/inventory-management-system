import { useState, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettings, saveSettings } from '../../hooks/useSettings'

export default function CompanyNamePage() {
  const navigate = useNavigate()
  const { settings, loading } = useSettings()
  const [companyName, setCompanyName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading) setCompanyName(settings.companyName || '')
  }, [settings, loading])

  async function handleSave(e) {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Please enter a company or shop name.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await saveSettings({ companyName: companyName.trim() })
      setSaved(true)
      setTimeout(() => navigate('/settings'), 1000)
    } catch {
      setError('Failed to save. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4 pb-6" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Company / Shop Name</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Shop Info</p>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onPaste={(e) => {
                  setCompanyName(e.clipboardData.getData('text'))
                  e.preventDefault()
                }}
                placeholder="e.g. Sri Murugan Stores"
                autoComplete="organization"
                autoCapitalize="words"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400">Displayed at the top of the app.</p>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 px-1">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
        </form>
      )}
    </div>
  )
}
