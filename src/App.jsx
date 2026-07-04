import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import useAuthStore from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ProductList from './pages/Products'
import ProductForm from './pages/Products/SKUForm'
import InventoryUpdate from './pages/Inventory'
import DailyAudit from './pages/Audit'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import CompanyNamePage from './pages/Settings/CompanyName'
import ProfilePage from './pages/Settings/Profile'
import ConfigPage from './pages/Config'
import EditProduct from './pages/Config/EditProduct'

export default function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setCompanyId = useAuthStore((s) => s.setCompanyId)
  const setRole = useAuthStore((s) => s.setRole)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get ID token result to extract custom claims (companyId, role)
          // Force refresh (true) to get latest custom claims from Firebase
          const idTokenResult = await user.getIdTokenResult(true)
          let companyId = idTokenResult.claims.companyId || null
          let role = idTokenResult.claims.role || null

          console.log('🔍 DEBUG: companyId from token:', companyId, 'role:', role)

          // Retry mechanism: if no claims found, wait and try again
          // (Firebase takes ~1 second to propagate custom claims after they're set)
          if (!companyId) {
            console.log('⚠️ No companyId in token, retrying in 2 seconds...')
            await new Promise(resolve => setTimeout(resolve, 2000))

            const retryTokenResult = await user.getIdTokenResult(true)
            companyId = retryTokenResult.claims.companyId || null
            role = retryTokenResult.claims.role || null
            console.log('🔄 Retry result: companyId:', companyId, 'role:', role)
          }

          setUser(user, companyId, role)
          setCompanyId(companyId)
          setRole(role)
        } catch (error) {
          console.error('Error getting ID token result:', error)
          setUser(user, null, null)
        }
      } else {
        setUser(null, null, null)
        setCompanyId(null)
        setRole(null)
      }
      setLoading(false)
    })
    return unsub
  }, [setUser, setCompanyId, setRole, setLoading])

  return (
    <BrowserRouter>
      <ProtectedRoute>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/add" element={<ProductForm />} />
            <Route path="/products/:id" element={<ProductForm />} />
            <Route path="/inventory" element={<InventoryUpdate />} />
            <Route path="/audit" element={<DailyAudit />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/company" element={<CompanyNamePage />} />
            <Route path="/settings/profile" element={<ProfilePage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/config/products/:id" element={<EditProduct />} />
          </Routes>
        </Layout>
      </ProtectedRoute>
    </BrowserRouter>
  )
}
