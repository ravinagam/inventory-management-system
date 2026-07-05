import { useEffect, useState } from 'react'
import { getIdTokenResult } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'

export default function ProtectedAdminRoute({ children }) {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (!auth.currentUser) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        const idTokenResult = await auth.currentUser.getIdTokenResult(true)
        const admin = idTokenResult.claims.admin === true

        if (!admin) {
          setIsAdmin(false)
          setTimeout(() => navigate('/'), 1000)
        } else {
          setIsAdmin(true)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [navigate])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '4px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          Verifying access...
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Access Denied</h1>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>You do not have permission to access this page.</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>Redirecting to home...</p>
        </div>
      </div>
    )
  }

  return children
}
