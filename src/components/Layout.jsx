import BottomNav from './BottomNav'
import AppHeader from './AppHeader'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen max-w-lg mx-auto relative" style={{ background: '#f1f5f9' }}>
      <AppHeader />
      <main
        className="min-h-screen"
        style={{
          paddingTop: '4.5rem',
          paddingBottom: 'calc(3.75rem + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
