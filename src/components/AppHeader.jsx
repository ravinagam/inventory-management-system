import { useState, useRef, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useSettings } from '../hooks/useSettings'
import useAuthStore from '../store/authStore'

export default function AppHeader() {
  const { settings } = useSettings()
  const user = useAuthStore((s) => s.user)
  const name = settings.companyName || 'Retail Inventory Pro'
  const [showProfile, setShowProfile] = useState(false)
  const popupRef = useRef(null)

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    if (showProfile) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showProfile])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 max-w-lg mx-auto">
      <div
        className="relative flex items-center px-4 py-3 gap-3"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #2563eb 100%)' }}
      >
        {/* Avatar */}
        <div ref={popupRef} className="relative flex-shrink-0">
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white/40 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-9 h-9 object-cover" />
            ) : (
              <span className="text-white text-xs font-bold tracking-wide">{initials}</span>
            )}
          </button>

          {/* Profile popup */}
          {showProfile && (
            <div className="absolute top-12 left-0 bg-white rounded-2xl shadow-2xl w-60 z-50 overflow-hidden">
              <div
                className="flex flex-col items-center gap-2 px-4 py-5"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)' }}
              >
                <div className="w-14 h-14 rounded-full border-2 border-white/50 flex items-center justify-center overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="profile" className="w-14 h-14 object-cover" />
                  ) : (
                    <span className="text-white text-xl font-bold">{initials}</span>
                  )}
                </div>
                {user?.displayName && (
                  <p className="text-sm font-bold text-white text-center">{user.displayName}</p>
                )}
                <p className="text-xs text-blue-200 text-center break-all">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-500 font-semibold py-4 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Company name */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-tight truncate">{name}</p>
          <p className="text-blue-200 text-xs font-medium mt-0.5">Inventory Management</p>
        </div>
      </div>
    </header>
  )
}
