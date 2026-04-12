import BottomNav from './BottomNav'
import AppHeader from './AppHeader'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      <AppHeader />
      <main
        className="min-h-screen"
        style={{
          paddingTop: '4.25rem',
          paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
