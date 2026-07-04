#!/usr/bin/env node

/**
 * Setup Sai Ganesh Traders company
 * 1. Update COMPANY_ZERO name to "Sai Ganesh Traders"
 * 2. Check if sales@sgtraders.in exists
 * 3. Associate user with company
 * 4. Set custom claims
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

async function setup() {
  console.log('=== Setting up Sai Ganesh Traders Company ===\n')

  // Step 1: Update COMPANY_ZERO to Sai Ganesh Traders
  console.log('1. Updating COMPANY_ZERO company name...')
  await multitenantDb.collection('companies').doc('COMPANY_ZERO').update({
    name: 'Sai Ganesh Traders',
  })
  console.log('   ✓ Updated\n')

  // Step 2: Check if sales@sgtraders.in exists
  console.log('2. Checking for sales@sgtraders.in in Firebase Auth...')
  let sgUser = null
  try {
    sgUser = await auth.getUserByEmail('sales@sgtraders.in')
    console.log(`   ✓ Found: ${sgUser.uid}`)
  } catch (err) {
    console.log(`   ✗ Not found`)
    console.log(`   Please create this user manually in Firebase Console or provide UID\n`)
    return
  }

  // Step 3: Create/update user profile in company
  console.log('\n3. Creating user profile in COMPANY_ZERO...')
  await multitenantDb
    .collection('companies')
    .doc('COMPANY_ZERO')
    .collection('users')
    .doc(sgUser.uid)
    .set({
      uid: sgUser.uid,
      email: sgUser.email,
      displayName: sgUser.displayName || 'Sales Team',
      photoURL: sgUser.photoURL || null,
      companyId: 'COMPANY_ZERO',
      role: 'owner',
      createdAt: new Date(),
    }, { merge: true })
  console.log('   ✓ Created\n')

  // Step 4: Set custom claims
  console.log('4. Setting custom claims on user...')
  await auth.setCustomUserClaims(sgUser.uid, {
    companyId: 'COMPANY_ZERO',
    role: 'owner',
  })
  console.log('   ✓ Custom claims set\n')

  console.log('=== Setup Complete ===')
  console.log('\nSai Ganesh Traders Company:')
  console.log(`  Company ID: COMPANY_ZERO`)
  console.log(`  Owner: sales@sgtraders.in (${sgUser.uid})`)
  console.log(`  All existing products/inventory/audit data ready`)
}

setup().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
