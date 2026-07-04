#!/usr/bin/env node

/**
 * Find user by email in both (default) and multitenant databases
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: .firebase-service-account.json not found')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })

const defaultDb = getFirestore('(default)')
const multitenantDb = getFirestore('multitenant')
const auth = getAuth()

const EMAIL = 'ravi.nagam.kiran@gmail.com'

async function findUser() {
  console.log(`\n=== Searching for user: ${EMAIL} ===\n`)

  // 1. Check Firebase Auth
  console.log('1. Firebase Auth (project-level):')
  try {
    const authUser = await auth.getUserByEmail(EMAIL)
    console.log(`   ✓ Found Auth user`)
    console.log(`   UID: ${authUser.uid}`)
    console.log(`   Custom Claims: ${JSON.stringify(authUser.customClaims)}`)
  } catch (err) {
    console.log(`   ✗ Not found in Auth`)
  }

  // 2. Check (default) database
  console.log('\n2. (default) Database:')
  const defaultUsersSnap = await defaultDb.collection('users').get()
  let found = false
  defaultUsersSnap.forEach(doc => {
    const data = doc.data()
    if (data.email === EMAIL) {
      console.log(`   ✓ Found in users collection`)
      console.log(`   Document ID: ${doc.id}`)
      console.log(`   Data:`, JSON.stringify(data, null, 2))
      found = true
    }
  })
  if (!found) {
    console.log(`   ✗ Not found in users collection`)
  }

  // 3. Check multitenant database
  console.log('\n3. multitenant Database:')
  const companiesSnap = await multitenantDb.collection('companies').get()
  found = false
  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id
    const usersSnap = await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('users')
      .get()

    usersSnap.forEach(userDoc => {
      const data = userDoc.data()
      if (data.email === EMAIL || userDoc.id === EMAIL.split('@')[0]) {
        console.log(`   ✓ Found in companies/${companyId}/users`)
        console.log(`   Document ID: ${userDoc.id}`)
        console.log(`   Data:`, JSON.stringify(data, null, 2))
        found = true
      }
    })
  }
  if (!found) {
    console.log(`   ✗ Not found in any company's users collection`)
  }
}

findUser().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
