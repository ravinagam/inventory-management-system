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

async function fixCompanyName() {
  console.log('Fixing company name mismatches...\n')

  const companiesSnap = await multitenantDb.collection('companies').get()

  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id
    const companyData = companyDoc.data()
    const correctName = companyData.name

    // Update settings/general to match
    await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('settings')
      .doc('general')
      .set({ companyName: correctName }, { merge: true })

    console.log(`✓ ${companyId}: Updated companyName to "${correctName}"`)
  }

  console.log('\n✓ All company names synchronized!')
}

fixCompanyName().catch(console.error)
