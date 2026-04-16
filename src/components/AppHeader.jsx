import { useState, useRef, useEffect } from 'react'
import { LogOut } from 'lucide-react'
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

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  // Close popup when clicking outside
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
        className="relative flex items-center justify-center px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)',
        }}
      >
        {/* Left — avatar */}
        <div className="absolute left-4" ref={popupRef}>
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">{initials}</span>
            )}
          </button>

          {/* Profile popup */}
          {showProfile && (
            <div className="absolute top-11 left-0 bg-white rounded-2xl shadow-xl p-4 w-56 z-50">
              {/* Avatar large */}
              <div className="flex flex-col items-center gap-2 pb-3 border-b border-gray-100">
                <div className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="profile" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xl font-bold">{initials}</span>
                  )}
                </div>
                {user?.displayName && (
                  <p className="text-sm font-semibold text-gray-800 text-center">{user.displayName}</p>
                )}
                <p className="text-xs text-gray-400 text-center break-all">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium py-1.5"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Centre — company name */}
        <div className="text-center">
          <p className="text-white font-bold text-base leading-tight">{name}</p>
          <p className="text-blue-100 text-xs">Inventory Management</p>
        </div>

      </div>
    </header>
  )
}
