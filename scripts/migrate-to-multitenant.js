#!/usr/bin/env node

/**
 * Migrate data from (default) database to multitenant database
 * Usage: node scripts/migrate-to-multitenant.js [--dry-run]
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dryRun = process.argv.includes('--dry-run')

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

const defaultDb = getFirestore('(default)')
const multitenantDb = getFirestore('multitenant')
const auth = getAuth()

const COMPANY_ZERO = 'COMPANY_ZERO'

const COLLECTIONS_TO_MIGRATE = [
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
]

async function migrateCollection(collectionName) {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Migrating collection: ${collectionName}...`)
  try {
    const snapshot = await defaultDb.collection(collectionName).get()
    const docs = []

    snapshot.forEach((doc) => {
      docs.push({
        id: doc.id,
        data: doc.data(),
      })
    })

    if (dryRun) {
      console.log(`  → Would write ${docs.length} documents to companies/${COMPANY_ZERO}/${collectionName}`)
      return docs.length
    }

    // Write documents to multitenant database
    for (const { id, data } of docs) {
      await multitenantDb
        .collection('companies')
        .doc(COMPANY_ZERO)
        .collection(collectionName)
        .doc(id)
        .set(data)
    }

    console.log(`  ✓ ${docs.length} documents migrated`)
    return docs.length
  } catch (error) {
    console.error(`  ✗ Error migrating ${collectionName}:`, error.message)
    throw error
  }
}

async function migrateUsers() {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Migrating users...`)
  try {
    const snapshot = await defaultDb.collection('users').get()
    const userIds = []

    snapshot.forEach((doc) => {
      userIds.push(doc.id)
    })

    if (dryRun) {
      console.log(`  → Would migrate ${userIds.length} users to company ${COMPANY_ZERO}`)
      return userIds.length
    }

    // Migrate users and set custom claims
    for (const uid of userIds) {
      const userDoc = await defaultDb.collection('users').doc(uid).get()

      // Write to multitenant database
      await multitenantDb
        .collection('companies')
        .doc(COMPANY_ZERO)
        .collection('users')
        .doc(uid)
        .set({
          uid,
          companyId: COMPANY_ZERO,
          role: 'owner',
          createdAt: Timestamp.now(),
          ...userDoc.data(),
        })

      // Set custom claims on Auth user
      try {
        await auth.setCustomUserClaims(uid, {
          companyId: COMPANY_ZERO,
          role: 'owner',
        })
      } catch (err) {
        console.warn(`  ⚠ Could not set custom claims for user ${uid}: ${err.message}`)
      }
    }

    console.log(`  ✓ ${userIds.length} users migrated and custom claims set`)
    return userIds.length
  } catch (error) {
    console.error(`  ✗ Error migrating users:`, error.message)
    throw error
  }
}

async function createCompanyZero() {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Creating company ${COMPANY_ZERO}...`)

  if (dryRun) {
    console.log(`  → Would create companies/${COMPANY_ZERO}`)
    return
  }

  try {
    // Get the first user to use as owner
    const usersSnapshot = await defaultDb.collection('users').get()
    let ownerUid = null
    usersSnapshot.forEach((doc) => {
      if (!ownerUid) ownerUid = doc.id
    })

    // Get company name from settings
    let companyName = 'My Company'
    try {
      const settingsDoc = await defaultDb.collection('settings').doc('general').get()
      if (settingsDoc.exists() && settingsDoc.data().companyName) {
        companyName = settingsDoc.data().companyName
      }
    } catch (err) {
      console.warn(`  ⚠ Could not read company name from settings`)
    }

    // Create company doc in multitenant database
    await multitenantDb.collection('companies').doc(COMPANY_ZERO).set({
      name: companyName,
      ownerUid: ownerUid || 'unknown',
      createdAt: Timestamp.now(),
      status: 'active',
    })

    // Create settings doc
    await multitenantDb
      .collection('companies')
      .doc(COMPANY_ZERO)
      .collection('settings')
      .doc('general')
      .set({
        companyName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

    // Create subscription doc
    await multitenantDb
      .collection('companies')
      .doc(COMPANY_ZERO)
      .collection('subscription')
      .doc('current')
      .set({
        plan: 'free',
        status: 'trialing',
        trialEndsAt: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        razorpaySubscriptionId: null,
        razorpayCustomerId: null,
        razorpayPlanId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

    console.log(`  ✓ Company ${COMPANY_ZERO} created with name "${companyName}"`)
  } catch (error) {
    console.error(`  ✗ Error creating company:`, error.message)
    throw error
  }
}

async function main() {
  console.log(`\n${dryRun ? '=== DRY RUN ===' : '=== MIGRATION STARTED ==='}`)
  console.log(`Source: (default) database`)
  console.log(`Target: multitenant database`)
  console.log(`Company: ${COMPANY_ZERO}\n`)

  try {
    let totalDocs = 0

    // Create company first
    await createCompanyZero()
    totalDocs++

    // Migrate collections
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      const count = await migrateCollection(collectionName)
      totalDocs += count
    }

    // Migrate users
    const userCount = await migrateUsers()
    totalDocs += userCount

    console.log(`\n${dryRun ? '=== DRY RUN COMPLETE ===' : '=== MIGRATION COMPLETE ==='}`)
    console.log(`Total documents: ${totalDocs}`)
    console.log(`Collections migrated: ${COLLECTIONS_TO_MIGRATE.length + 2} (collections + users + subscription)`)

    if (dryRun) {
      console.log(`\n✓ Dry run successful. Run without --dry-run to perform actual migration.`)
    } else {
      console.log(`\n✓ Migration successful. Verify in Firebase Console before proceeding.`)
    }

    process.exit(0)
  } catch (error) {
    console.error(`\n✗ ${dryRun ? 'Dry run failed' : 'Migration failed'}:`, error.message)
    process.exit(1)
  }
}

main()
