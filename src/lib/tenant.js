import { collection, doc } from 'firebase/firestore'
import { db } from './firebase'

// Helper to get a company-scoped collection reference
export const companyCol = (companyId, name) => collection(db, 'companies', companyId, name)

// Helper to get a company-scoped document reference
export const companyDoc = (companyId, name, id) => doc(db, 'companies', companyId, name, id)
