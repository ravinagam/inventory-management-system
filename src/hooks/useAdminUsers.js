import { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'

export default function useAdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const getAllUsersFn = httpsCallable(functions, 'getAllUsers')
        const result = await getAllUsersFn()
        setUsers(result.data.users || [])
      } catch (err) {
        console.error('Error fetching users:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return { users, loading, error }
}
