import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, RefreshCw, ClipboardList, BarChart2, Settings } from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'Products'  },
  { to: '/inventory', icon: RefreshCw,       label: 'Inventory' },
  { to: '/audit',     icon: ClipboardList,   label: 'Audit'     },
  { to: '/reports',   icon: BarChart2,       label: 'Reports'   },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex justify-around items-center max-w-lg mx-auto"
      style={{
        height: 'calc(3.75rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex-1"
        >
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-0.5 py-1.5">
              <div
                className="flex items-center justify-center w-10 h-7 rounded-2xl transition-all duration-200"
                style={isActive ? { background: '#dbeafe' } : {}}
              >
                <Icon size={19} color={isActive ? '#1d4ed8' : '#9ca3af'} strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span
                className="text-[10px] font-semibold leading-none transition-colors"
                style={{ color: isActive ? '#1d4ed8' : '#9ca3af' }}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
