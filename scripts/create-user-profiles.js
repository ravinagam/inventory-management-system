#!/usr/bin/env node

/**
 * Create user profile documents in multitenant database for all Auth users
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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

const multitenantDb = getFirestore('multitenant')
const auth = getAuth()

async function createUserProfiles() {
  console.log('Creating user profile documents in multitenant database...\n')

  const authUsers = await auth.listUsers()
  console.log(`Found ${authUsers.users.length} Auth users\n`)

  let created = 0
  for (const authUser of authUsers.users) {
    const customClaims = authUser.customClaims || {}
    const companyId = customClaims.companyId

    if (!companyId) {
      console.log(`⚠ ${authUser.uid}: no companyId claim, skipping`)
      continue
    }

    // Create user profile in company's users collection
    await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('users')
      .doc(authUser.uid)
      .set({
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
        photoURL: authUser.photoURL || null,
        companyId,
        role: customClaims.role || 'staff',
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true })

    console.log(`✓ Created profile for ${authUser.email} (${authUser.uid})`)
    created++
  }

  console.log(`\n✓ Created ${created} user profiles`)
}

createUserProfiles().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
