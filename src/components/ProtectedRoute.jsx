import { useState, useEffect } from 'react'
import { getIdTokenResult } from 'firebase/auth'
import { auth } from '../lib/firebase'
import useAuthStore from '../store/authStore'
import Login from '../pages/Login'

export default function ProtectedRoute({ children }) {
  const { user, loading, companyId } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true)
          setIsAdmin(idTokenResult.claims.admin === true)
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        }
      }
      setCheckingAdmin(false)
    }

    checkAdmin()
  }, [user])

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Login />

  // Allow access if: user has companyId (regular user) OR user is admin
  if (!companyId && !isAdmin) {
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
