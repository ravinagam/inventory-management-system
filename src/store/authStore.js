import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  companyId: null,
  role: null,
  setUser: (user, companyId = null, role = null) => set({ user, companyId, role, loading: false }),
  setLoading: (loading) => set({ loading }),
  setCompanyId: (companyId) => set({ companyId }),
  setRole: (role) => set({ role }),
}))

export default useAuthStore
