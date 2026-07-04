import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyCmrng77kIALTklXtKf-gpzZCg5c_lXge4',
  projectId: 'inveman-5697c',
  authDomain: 'inveman-5697c.firebaseapp.com',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

try {
  // LOGIN CREDENTIALS - UPDATE THESE
  const email = 'ravi.nagam.kiran@gmail.com'
  const password = 'ravikiran'

  console.log('Logging in as:', email)
  const result = await signInWithEmailAndPassword(auth, email, password)

  console.log('Getting token with force refresh...')
  const token = await result.user.getIdTokenResult(true)

  console.log('\n=== TOKEN CLAIMS ===')
  console.log('All claims:', JSON.stringify(token.claims, null, 2))
  console.log('\nSpecific claims:')
  console.log('  companyId:', token.claims.companyId)
  console.log('  role:', token.claims.role)

  process.exit(0)
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
}
