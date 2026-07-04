#!/usr/bin/env node

/**
 * Show which users have access to which companies
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

const multitenantDb = getFirestore('multitenant')
const auth = getAuth()

async function listAccess() {
  console.log('=== Company Access Report ===\n')

  // Get all companies
  const companiesSnap = await multitenantDb.collection('companies').get()
  console.log(`Found ${companiesSnap.size} companies\n`)

  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id
    const companyData = companyDoc.data()
    const companyName = companyData.name || '(unnamed)'

    console.log(`📦 ${companyName} (${companyId})`)
    console.log(`   Created: ${companyData.createdAt?.toDate?.() || 'N/A'}`)
    console.log(`   Status: ${companyData.status || 'N/A'}`)

    // Get users in this company
    const usersSnap = await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('users')
      .get()

    if (usersSnap.size === 0) {
      console.log(`   Users: 0\n`)
      continue
    }

    console.log(`   Users: ${usersSnap.size}`)
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data()
      console.log(`     • ${userData.email} (${userData.role})`)

      // Verify custom claims match
      try {
        const authUser = await auth.getUser(userDoc.id)
        const claims = authUser.customClaims || {}
        const claimsMatch = claims.companyId === companyId && claims.role === userData.role
        console.log(`       UID: ${userDoc.id}`)
        console.log(`       Claims: ${JSON.stringify(claims)} ${claimsMatch ? '✓' : '⚠ MISMATCH'}`)
      } catch (err) {
        console.log(`       ⚠ User not found in Auth`)
      }
    }
    console.log()
  }
}

listAccess().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
