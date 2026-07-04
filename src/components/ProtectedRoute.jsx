import useAuthStore from '../store/authStore'
import Login from '../pages/Login'

export default function ProtectedRoute({ children }) {
  const { user, loading, companyId } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Login />

  // User exists but companyId not yet set (mid-signup, custom claims not yet available)
  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Setting up your account…</p>
        </div>
      </div>
    )
  }

  return children
}
