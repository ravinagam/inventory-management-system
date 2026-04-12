import { useState, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettings, saveSettings } from '../../hooks/useSettings'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { settings, loading } = useSettings()
  const [companyName, setCompanyName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading) setCompanyName(settings.companyName || '')
  }, [settings, loading])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSettings({ companyName: companyName.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Shop Info</p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Company / Shop Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text')
                setCompanyName(pasted)
                e.preventDefault()
              }}
              placeholder="e.g. Sri Murugan Stores"
              autoComplete="organization"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">Displayed at the top of the app.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
