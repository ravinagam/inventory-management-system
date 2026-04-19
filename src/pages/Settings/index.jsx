import { ChevronRight, Store, Layers, LogOut, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useSettings } from '../../hooks/useSettings'
import useAuthStore from '../../store/authStore'

function NavRow({ icon: Icon, iconBg, iconColor, label, subtitle, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}>
        <Icon size={17} color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: danger ? '#dc2626' : '#111827' }}>{label}</p>
        {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: '#9ca3af' }}>{subtitle}</p>}
      </div>
      <ChevronRight size={16} color="#d1d5db" />
    </button>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const user = useAuthStore((s) => s.user)

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '?'

  return (
    <div className="p-4 space-y-4 pb-6" style={{ height: '100%', background: '#f1f5f9', overflowY: 'auto', scrollbarWidth: 'none' }}>

      <h1 className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>Settings</h1>

      {/* Profile card */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-5"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #2563eb 100%)' }}>
          <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="profile" className="w-14 h-14 object-cover" />
              : <span className="text-white text-xl font-black">{initials}</span>}
          </div>
          <div className="min-w-0">
            {user?.displayName && (
              <p className="text-base font-bold text-white truncate">{user.displayName}</p>
            )}
            <p className="text-xs break-all" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {user?.email?.endsWith('@inveman.app') ? 'No email set' : user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Account */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider px-1 mb-2" style={{ color: '#9ca3af' }}>Account</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <NavRow
            icon={UserCircle}
            iconBg="#eff6ff"
            iconColor="#1d4ed8"
            label="My Profile"
            subtitle="Display name, username, email"
            onClick={() => navigate('/settings/profile')}
          />
        </div>
      </div>

      {/* Store settings */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider px-1 mb-2" style={{ color: '#9ca3af' }}>Store</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y" style={{ divideColor: '#f1f5f9' }}>
          <NavRow
            icon={Store}
            iconBg="#f0fdf4"
            iconColor="#16a34a"
            label="Company / Shop Name"
            subtitle={settings.companyName || 'Not set — tap to configure'}
            onClick={() => navigate('/settings/company')}
          />
          <NavRow
            icon={Layers}
            iconBg="#fff7ed"
            iconColor="#ea580c"
            label="Product Hierarchy"
            subtitle="Configure levels, manage data, add products"
            onClick={() => navigate('/config')}
          />
        </div>
      </div>

      {/* Sign out */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider px-1 mb-2" style={{ color: '#9ca3af' }}>Session</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <NavRow
            icon={LogOut}
            iconBg="#fef2f2"
            iconColor="#dc2626"
            label="Sign Out"
            onClick={() => signOut(auth)}
            danger
          />
        </div>
      </div>

      <p className="text-center text-xs pt-2" style={{ color: '#d1d5db' }}>
        Inventory Management v1.0
      </p>
    </div>
  )
}
