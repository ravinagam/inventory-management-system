#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
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

async function check() {
  console.log('\n=== Checking Company Settings ===\n')

  const companies = ['COMPANY_ZERO', 'company_a_1783143734877', 'company_b_1783144370315']

  for (const companyId of companies) {
    const settingsSnap = await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('settings')
      .doc('general')
      .get()

    const companySnap = await multitenantDb
      .collection('companies')
      .doc(companyId)
      .get()

    const companyData = companySnap.data()
    const settingsData = settingsSnap.exists ? settingsSnap.data() : null

    console.log(`${companyId}:`)
    console.log(`  Company doc name: "${companyData.name}"`)
    console.log(`  Settings/general: "${settingsData?.companyName || 'NOT FOUND'}"`)
    console.log(`  Match: ${companyData.name === settingsData?.companyName ? '✓' : '✗ MISMATCH'}`)
    console.log()
  }
}

check().catch(console.error)
