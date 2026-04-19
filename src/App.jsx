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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return unsub
  }, [setUser])

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
