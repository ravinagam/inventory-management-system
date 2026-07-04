#!/usr/bin/env node

/**
 * Find which documents are missing between (default) and multitenant
 * Usage: node scripts/find-mismatched-docs.js
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
})

const defaultDb = getFirestore('(default)')
const multitenantDb = getFirestore('multitenant')

async function findMissingDocs(collectionName) {
  console.log(`\n--- Checking ${collectionName} ---`)

  // Get all docs from (default)
  const defaultSnap = await defaultDb.collection(collectionName).get()
  const defaultIds = new Set()
  defaultSnap.forEach((doc) => {
    defaultIds.add(doc.id)
  })

  // Get all docs from multitenant
  const multitenantSnap = await multitenantDb
    .collection('companies')
    .doc('COMPANY_ZERO')
    .collection(collectionName)
    .get()
  const multitenantIds = new Set()
  multitenantSnap.forEach((doc) => {
    multitenantIds.add(doc.id)
  })

  // Find missing docs
  const missing = []
  for (const id of defaultIds) {
    if (!multitenantIds.has(id)) {
      missing.push(id)
    }
  }

  if (missing.length === 0) {
    console.log(`✓ All ${defaultIds.size} docs present`)
    return
  }

  console.log(`✗ Found ${missing.length} missing documents:`)
  for (const id of missing) {
    const doc = await defaultDb.collection(collectionName).doc(id).get()
    console.log(`\n  ID: ${id}`)
    console.log(`  Data: ${JSON.stringify(doc.data(), null, 2)}`)
  }
}

async function main() {
  const COLLECTIONS_TO_CHECK = [
    'products',
    'hierarchyData',
  ]

  console.log('=== FINDING MISMATCHED DOCUMENTS ===')

  for (const col of COLLECTIONS_TO_CHECK) {
    await findMissingDocs(col)
  }

  console.log('\n=== DONE ===\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
