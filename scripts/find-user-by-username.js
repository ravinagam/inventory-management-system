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

const defaultDb = getFirestore('(default)')
const multitenantDb = getFirestore('multitenant')
const auth = getAuth()

async function findUser() {
  console.log('\n=== Searching for all users ===\n')

  // 1. Check usernames collection (global)
  console.log('1. Global Usernames Mapping:')
  const usernamesSnap = await defaultDb.collection('usernames').get()
  usernamesSnap.forEach(doc => {
    const data = doc.data()
    console.log(`   ${doc.id} → ${data.authEmail}`)
  })

  // 2. Check Auth users
  console.log('\n2. Firebase Auth Users:')
  const authUsers = await auth.listUsers()
  authUsers.users.forEach(user => {
    console.log(`   ${user.email} (UID: ${user.uid})`)
    console.log(`      Claims: ${JSON.stringify(user.customClaims)}`)
  })

  // 3. Search in multitenant database
  console.log('\n3. Multitenant Database Companies:')
  const companiesSnap = await multitenantDb.collection('companies').get()
  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id
    const usersSnap = await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('users')
      .get()

    if (usersSnap.size > 0) {
      console.log(`\n   ${companyId}:`)
      usersSnap.forEach(userDoc => {
        const userData = userDoc.data()
        console.log(`      ${userData.email} (${userData.role})`)
      })
    }
  }
}

findUser().catch(console.error)
