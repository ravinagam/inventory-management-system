#!/usr/bin/env node

/**
 * Verify migration by counting documents in both databases
 * Usage: node scripts/verify-migration.js
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

const COLLECTIONS = [
  'products',
  'categories',
  'mainCategories',
  'subCategories',
  'productNames',
  'inventoryLogs',
  'auditSessions',
  'hierarchyData',
  'hierarchyConfig',
  'settings',
  'users',
]

async function compareCollections() {
  console.log('\n=== MIGRATION VERIFICATION ===\n')
  console.log('Collection'.padEnd(20) + '(default)'.padEnd(15) + 'multitenant'.padEnd(15) + 'Status')
  console.log('-'.repeat(65))

  let defaultTotal = 0
  let multitenantTotal = 0
  let allMatch = true

  for (const col of COLLECTIONS) {
    const defaultSnap = await defaultDb.collection(col).count().get()
    const defaultCount = defaultSnap.data().count

    const multitenantSnap = await multitenantDb
      .collection('companies')
      .doc('COMPANY_ZERO')
      .collection(col)
      .count()
      .get()
    const multitenantCount = multitenantSnap.data().count

    const match = defaultCount === multitenantCount ? '✓ MATCH' : '✗ MISMATCH'
    if (defaultCount !== multitenantCount) allMatch = false

    console.log(
      col.padEnd(20) +
      String(defaultCount).padEnd(15) +
      String(multitenantCount).padEnd(15) +
      match
    )

    defaultTotal += defaultCount
    multitenantTotal += multitenantCount
  }

  console.log('-'.repeat(65))
  console.log('TOTAL'.padEnd(20) + String(defaultTotal).padEnd(15) + String(multitenantTotal).padEnd(15))

  console.log(`\n${allMatch ? '✓ ALL COLLECTIONS MATCH!' : '✗ SOME COLLECTIONS MISMATCH'}`)
  console.log(`(default) total: ${defaultTotal}`)
  console.log(`multitenant total: ${multitenantTotal}`)
  console.log(`Plus 1 company doc + 1 subscription doc = ${multitenantTotal + 2} expected\n`)

  process.exit(0)
}

compareCollections().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
