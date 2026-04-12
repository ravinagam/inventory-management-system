import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, RefreshCw, ClipboardList, BarChart2 } from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'Products'  },
  { to: '/inventory', icon: RefreshCw,       label: 'Inventory' },
  { to: '/audit',     icon: ClipboardList,   label: 'Audit'     },
  { to: '/reports',   icon: BarChart2,       label: 'Reports'   },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center max-w-lg mx-auto"
      style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-2 text-xs font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
