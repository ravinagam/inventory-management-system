#!/usr/bin/env node

/**
 * Sync company names from company documents to settings/general
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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

async function syncCompanyNames() {
  console.log('Syncing company names to settings/general...\n')

  const companiesSnap = await multitenantDb.collection('companies').get()
  console.log(`Found ${companiesSnap.size} companies\n`)

  let synced = 0
  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id
    const companyData = companyDoc.data()
    const companyName = companyData.name

    if (!companyName) {
      console.log(`⚠ ${companyId}: no name field`)
      continue
    }

    // Write to settings/general
    await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('settings')
      .doc('general')
      .set({
        companyName,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

    console.log(`✓ ${companyId}: synced company name`)
    synced++
  }

  console.log(`\n✓ Synced ${synced} company names`)
}

syncCompanyNames().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
