#!/usr/bin/env node

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

async function checkUser() {
  const email = 'ravi.nagam.kiran@gmail.com'
  console.log(`\n=== Checking User: ${email} ===\n`)

  // 1. Check Auth user and claims
  const authUser = await auth.getUserByEmail(email)
  console.log('1. Firebase Auth:')
  console.log(`   UID: ${authUser.uid}`)
  console.log(`   Email: ${authUser.email}`)
  console.log(`   Custom Claims: ${JSON.stringify(authUser.customClaims)}\n`)

  const companyId = authUser.customClaims?.companyId

  if (companyId) {
    // 2. Check company document
    const companySnap = await multitenantDb.collection('companies').doc(companyId).get()
    if (companySnap.exists) {
      const companyData = companySnap.data()
      console.log(`2. Company Document (${companyId}):`)
      console.log(`   name: "${companyData.name}"`)
      console.log(`   ownerUid: "${companyData.ownerUid}"`)
      console.log(`   status: "${companyData.status}"\n`)

      // 3. Check settings/general
      const settingsSnap = await multitenantDb
        .collection('companies')
        .doc(companyId)
        .collection('settings')
        .doc('general')
        .get()

      if (settingsSnap.exists) {
        const settingsData = settingsSnap.data()
        console.log(`3. Settings/General:`)
        console.log(`   companyName: "${settingsData.companyName}"\n`)

        // Summary
        console.log('SUMMARY:')
        console.log(`✓ User is assigned to: ${companyId}`)
        console.log(`✓ Company name in document: "${companyData.name}"`)
        console.log(`✓ Company name in settings: "${settingsData.companyName}"`)

        if (companyData.name !== settingsData.companyName) {
          console.log(`\n⚠️ MISMATCH! Company document and settings have different names!`)
        }
      }
    }
  }
}

checkUser().catch(console.error)
