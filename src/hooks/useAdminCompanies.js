import { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'

export default function useAdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const getAllCompaniesFn = httpsCallable(functions, 'getAllCompanies')
        const result = await getAllCompaniesFn()
        setCompanies(result.data.companies || [])
      } catch (err) {
        console.error('Error fetching companies:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  return { companies, loading, error }
}
