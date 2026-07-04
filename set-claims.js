import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import fs from 'fs'

const serviceAccount = JSON.parse(fs.readFileSync('.firebase-service-account.json', 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
})

const auth = getAuth()
const uid = 'eNYLuDvNJza6svAORY6G4SxRQih2'

auth.setCustomUserClaims(uid, { companyId: 'COMPANY_ZERO', role: 'owner' })
  .then(() => {
    console.log('✓ Custom claims set successfully!')
    process.exit(0)
  })
  .catch(err => {
    console.error('✗ Error:', err.message)
    process.exit(1)
  })
