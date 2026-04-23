import { useState, useEffect } from 'react'
import { ArrowLeft, Save, User, Mail, AtSign, Phone, Smartphone, MapPin, FileText, BadgeCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import useAuthStore from '../../store/authStore'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [username, setUsername]       = useState('')
  const [gstNumber, setGstNumber]     = useState('')
  const [udyam, setUdyam]             = useState('')
  const [phone, setPhone]             = useState('')
  const [mobile, setMobile]           = useState('')
  const [address, setAddress]         = useState('')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    if (!user) return
    // Pre-fill from Firebase Auth
    setDisplayName(user.displayName || '')

    // Load from Firestore profile
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setUsername(d.username || '')
        setEmail(d.email || '')
        setGstNumber(d.gstNumber || '')
        setUdyam(d.udyam || '')
        setPhone(d.phone || '')
        setMobile(d.mobile || '')
        setAddress(d.address || '')
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    if (!displayName.trim()) { setError('Display name is required.'); return }
    setError('')
    setSaving(true)
    try {
      // Update Firebase Auth display name
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })

      // Create or merge Firestore profile (existing users may not have a doc yet)
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        email:     email.trim()     || null,
        gstNumber: gstNumber.trim() || null,
        udyam:     udyam.trim()     || null,
        phone:     phone.trim()     || null,
        mobile:    mobile.trim()    || null,
        address:   address.trim()   || null,
      }, { merge: true })

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '?'

  return (
    <div className="p-4 space-y-4 pb-6" style={{ height: '100%', background: '#f1f5f9', overflowY: 'auto', scrollbarWidth: 'none' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-white">
          <ArrowLeft size={18} color="#374151" />
        </button>
        <h1 className="text-xl font-black tracking-tight" style={{ color: '#111827' }}>My Profile</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black border-4 border-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', color: '#fff' }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            : initials}
        </div>
        {username && (
          <p className="mt-2 text-sm font-semibold" style={{ color: '#6b7280' }}>@{username}</p>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Display Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af' }} />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                autoCapitalize="words"
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
              />
            </div>
          </div>

          {/* Username — always shown, read only */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Username</label>
            <div className="relative">
              <AtSign size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af' }} />
              <input
                type="text"
                value={username}
                readOnly
                placeholder="Not set"
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm"
                style={{ background: '#f1f5f9', borderColor: '#e5e7eb', color: username ? '#374151' : '#9ca3af', cursor: 'not-allowed' }}
              />
            </div>
            <p className="text-xs" style={{ color: '#9ca3af' }}>Username cannot be changed after registration.</p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Email</label>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#f1f5f9', color: '#9ca3af' }}>Optional</span>
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
              />
            </div>
            <p className="text-xs" style={{ color: '#9ca3af' }}>Used for contact only — not required for login.</p>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Business Details <span className="normal-case font-normal">(optional)</span></p>

          {/* GST Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>GST Number</label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af' }} />
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 29ABCDE1234F1Z5"
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
              />
            </div>
          </div>

          {/* Udyam */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Udyam Registration</label>
            <div className="relative">
              <BadgeCheck size={15} className="absolute left-3.5 top-3.5" style={{ color: '#9ca3af' }} />
              <input
                type="text"
                value={udyam}
                onChange={(e) => setUdyam(e.target.value.toUpperCase())}
                placeholder="e.g. UDYAM-XX-00-0000000"
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
              />
            </div>
          </div>

          {/* Phone & Mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-3.5" style={{ color: '#9ca3af' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Landline"
                  className="w-full pl-9 pr-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Mobile</label>
              <div className="relative">
                <Smartphone size={15} className="absolute left-3 top-3.5" style={{ color: '#9ca3af' }} />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Mobile no."
                  className="w-full pl-9 pr-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Address</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-3" style={{ color: '#9ca3af' }} />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop / office address"
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium px-1" style={{ color: '#dc2626' }}>{error}</p>
        )}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black text-sm disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 14px rgba(29,78,216,0.35)' }}>
          <Save size={16} />
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
