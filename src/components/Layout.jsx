import BottomNav from './BottomNav'
import AppHeader from './AppHeader'

// Header: py-3 (24px) + h-9 avatar (36px) = 60px = 3.75rem
// BottomNav: 3.75rem + safe-area-inset-bottom
export default function Layout({ children }) {
  return (
    <div className="max-w-lg mx-auto" style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: '#f1f5f9' }}>
      <AppHeader />
      <main
        style={{
          position: 'absolute',
          top: '3.75rem',
          left: 0,
          right: 0,
          bottom: 'calc(3.75rem + env(safe-area-inset-bottom))',
          overflowX: 'hidden',
          overflowY: 'hidden',
          background: '#f1f5f9',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
