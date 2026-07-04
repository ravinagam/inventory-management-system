#!/usr/bin/env node

/**
 * Backup Firestore database to local JSON files
 * Usage: node scripts/backup-firestore-json.js
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json')
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: .firebase-service-account.json not found in project root')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

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
  'usernames',
]

async function backupCollection(collectionName, backupDir) {
  console.log(`Backing up collection: ${collectionName}...`)
  try {
    const snapshot = await db.collection(collectionName).get()
    const docs = []
    snapshot.forEach((doc) => {
      docs.push({
        id: doc.id,
        data: doc.data(),
      })
    })

    const filePath = path.join(backupDir, `${collectionName}.json`)
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2))

    console.log(`  ✓ ${docs.length} documents backed up`)
    return docs.length
  } catch (error) {
    console.error(`  ✗ Error backing up ${collectionName}:`, error.message)
    return 0
  }
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupDir = path.join(__dirname, '..', 'backups', `pre-migration-${timestamp}`)

  console.log(`\nStarting backup to: ${backupDir}\n`)

  try {
    fs.mkdirSync(backupDir, { recursive: true })

    let totalDocs = 0
    for (const collectionName of COLLECTIONS) {
      const count = await backupCollection(collectionName, backupDir)
      totalDocs += count
    }

    console.log(`\n✓ Backup complete!`)
    console.log(`  Location: ${backupDir}`)
    console.log(`  Total documents: ${totalDocs}`)
    console.log(`  Collections: ${COLLECTIONS.length}`)

    process.exit(0)
  } catch (error) {
    console.error('\n✗ Backup failed:', error.message)
    process.exit(1)
  }
}

main()
