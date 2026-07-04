#!/usr/bin/env node

/**
 * Restore Firestore database from JSON backup
 * Usage: node scripts/restore-firestore-json.js <backup-directory>
 *
 * Example: node scripts/restore-firestore-json.js backups/pre-migration-2026-07-03T13-48-09
 *
 * WARNING: This will OVERWRITE existing data in the (default) database!
 * Use only if you want to restore from a backup.
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

async function restoreCollection(collectionName, docs) {
  console.log(`Restoring collection: ${collectionName}...`)
  try {
    let restored = 0
    for (const { id, data } of docs) {
      await db.collection(collectionName).doc(id).set(data)
      restored++
    }
    console.log(`  ✓ ${restored} documents restored`)
    return restored
  } catch (error) {
    console.error(`  ✗ Error restoring ${collectionName}:`, error.message)
    throw error
  }
}

async function main() {
  const backupDir = process.argv[2]

  if (!backupDir) {
    console.error('Usage: node scripts/restore-firestore-json.js <backup-directory>')
    console.error('Example: node scripts/restore-firestore-json.js backups/pre-migration-2026-07-03T13-48-09')
    process.exit(1)
  }

  const backupPath = path.join(__dirname, '..', backupDir)

  if (!fs.existsSync(backupPath)) {
    console.error(`Error: Backup directory not found: ${backupPath}`)
    process.exit(1)
  }

  console.log(`\n⚠️  WARNING: This will RESTORE and OVERWRITE data in your (default) Firestore database!`)
  console.log(`Backup directory: ${backupPath}\n`)

  // Get user confirmation
  const answer = await prompt('Type "RESTORE" to confirm: ')
  if (answer.trim() !== 'RESTORE') {
    console.log('Restore cancelled.')
    process.exit(0)
  }

  console.log(`\n=== RESTORE STARTED ===`)
  console.log(`Source: ${backupPath}`)
  console.log(`Target: (default) database\n`)

  try {
    let totalDocs = 0

    // Get all JSON files in backup directory
    const files = fs.readdirSync(backupPath).filter((f) => f.endsWith('.json'))

    if (files.length === 0) {
      console.error('No JSON files found in backup directory')
      process.exit(1)
    }

    for (const file of files) {
      const collectionName = file.replace('.json', '')
      const filePath = path.join(backupPath, file)

      try {
        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const count = await restoreCollection(collectionName, backupData)
        totalDocs += count
      } catch (error) {
        console.error(`Error processing file ${file}:`, error.message)
        throw error
      }
    }

    console.log(`\n=== RESTORE COMPLETE ===`)
    console.log(`Total documents restored: ${totalDocs}`)
    console.log(`Collections restored: ${files.length}`)
    console.log(`\n✓ Database restored successfully!`)

    process.exit(0)
  } catch (error) {
    console.error(`\n✗ Restore failed:`, error.message)
    process.exit(1)
  }
}

// Simple prompt function for Node.js
function prompt(question) {
  return new Promise((resolve) => {
    process.stdout.write(question)
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', (data) => {
      resolve(data.toString())
    })
  })
}

main()
