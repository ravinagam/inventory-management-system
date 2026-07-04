#!/usr/bin/env node

/**
 * Delete incorrectly created root-level collections (products, settings)
 * from the multitenant database. They should only exist under companies/{companyId}/
 */

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

async function deleteCollection(collectionName) {
  console.log(`Deleting root-level ${collectionName} collection...`)

  const docs = await multitenantDb.collection(collectionName).listDocuments()
  console.log(`  Found ${docs.length} documents`)

  let deleted = 0
  for (const doc of docs) {
    await doc.delete()
    deleted++
  }

  console.log(`  ✓ Deleted ${deleted} documents`)
}

async function cleanup() {
  console.log('=== Cleaning up root-level collections ===\n')

  try {
    await deleteCollection('products')
    await deleteCollection('settings')

    console.log('\n✓ Cleanup complete! Root-level collections removed.')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

cleanup()
