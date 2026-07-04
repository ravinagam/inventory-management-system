import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// Modern Firebase v12 offline persistence (replaces deprecated enableIndexedDbPersistence)
// Point to the 'multitenant' database (Phase 1 — multi-tenant SaaS)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
}, 'multitenant')

// Access the (default) database for global collections (usernames, etc)
export const defaultDb = initializeFirestore(app, {
  localCache: persistentLocalCache(),
}, '(default)')

export const auth = getAuth(app)
export const functions = getFunctions(app)

// Connect to emulators if running locally
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  const firestoreHost = import.meta.env.VITE_FIRESTORE_HOST || 'localhost'
  const firestorePort = parseInt(import.meta.env.VITE_FIRESTORE_PORT || '8080')
  const authHost = import.meta.env.VITE_AUTH_HOST || 'localhost'
  const authPort = parseInt(import.meta.env.VITE_AUTH_PORT || '9099')
  const functionsHost = import.meta.env.VITE_FUNCTIONS_HOST || 'localhost'
  const functionsPort = parseInt(import.meta.env.VITE_FUNCTIONS_PORT || '5001')

  console.log('🔥 Connecting to Firebase Emulators...')
  console.log(`   Firestore: ${firestoreHost}:${firestorePort}`)
  console.log(`   Auth: ${authHost}:${authPort}`)
  console.log(`   Functions: ${functionsHost}:${functionsPort}`)

  connectFirestoreEmulator(db, firestoreHost, firestorePort)
  connectAuthEmulator(auth, `http://${authHost}:${authPort}`)
  connectFunctionsEmulator(functions, functionsHost, functionsPort)
}
