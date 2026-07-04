#!/usr/bin/env node

/**
 * Migrate hierarchyData (flexible 4-level system) to separate collections
 * (mainCategories, subCategories, productNames) for the new SKU form.
 *
 * Maps:
 *   Level 0 → mainCategories
 *   Level 1 → subCategories (with mainCategoryId)
 *   Level 2 → productNames (with mainCategoryId, subCategoryId)
 *   Level 3 → ignored (Size is entered manually in the form)
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dryRun = process.argv.includes('--dry-run')

const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json')
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: .firebase-service-account.json not found')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })

const defaultDb = getFirestore('(default)')
const multitenantDb = getFirestore('multitenant')

const COMPANY_ZERO = 'COMPANY_ZERO'

async function migrateHierarchy() {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Migrating hierarchyData to separate collections...`)

  // Fetch all hierarchyData docs from the (default) database
  const hierarchySnap = await defaultDb.collection('hierarchyData').get()
  const allDocs = {}

  hierarchySnap.forEach(doc => {
    allDocs[doc.id] = {
      id: doc.id,
      ...doc.data(),
    }
  })

  console.log(`Found ${Object.keys(allDocs).length} total hierarchyData documents`)

  // Separate by level
  const byLevel = { 0: [], 1: [], 2: [], 3: [] }
  Object.values(allDocs).forEach(doc => {
    const level = doc.levelIndex ?? -1
    if (level >= 0 && level <= 3) {
      byLevel[level].push(doc)
    }
  })

  console.log(`  Level 0 (Main Category): ${byLevel[0].length}`)
  console.log(`  Level 1 (Sub Category): ${byLevel[1].length}`)
  console.log(`  Level 2 (Product Name): ${byLevel[2].length}`)
  console.log(`  Level 3 (Size, ignored): ${byLevel[3].length}`)

  if (dryRun) {
    console.log('\n[DRY RUN] Would create:')
    console.log(`  ${byLevel[0].length} mainCategories`)
    console.log(`  ${byLevel[1].length} subCategories`)
    console.log(`  ${byLevel[2].length} productNames`)
    return
  }

  // Migrate Level 0 → mainCategories
  console.log('\nMigrating Level 0 → mainCategories...')
  for (const doc of byLevel[0]) {
    await multitenantDb
      .collection('companies')
      .doc(COMPANY_ZERO)
      .collection('mainCategories')
      .doc(doc.id)
      .set({
        name: doc.name,
        createdAt: doc.createdAt || FieldValue.serverTimestamp(),
      })
  }
  console.log(`  ✓ ${byLevel[0].length} mainCategories created`)

  // Migrate Level 1 → subCategories (with mainCategoryId)
  console.log('Migrating Level 1 → subCategories...')
  for (const doc of byLevel[1]) {
    const parentDoc = allDocs[doc.parentId]
    await multitenantDb
      .collection('companies')
      .doc(COMPANY_ZERO)
      .collection('subCategories')
      .doc(doc.id)
      .set({
        name: doc.name,
        mainCategoryId: doc.parentId || null,
        mainCategoryName: parentDoc ? parentDoc.name : null,
        createdAt: doc.createdAt || serverTimestamp(),
      })
  }
  console.log(`  ✓ ${byLevel[1].length} subCategories created`)

  // Migrate Level 2 → productNames (with mainCategoryId and subCategoryId)
  console.log('Migrating Level 2 → productNames...')
  for (const doc of byLevel[2]) {
    const subCatDoc = allDocs[doc.parentId]
    const mainCatDoc = subCatDoc ? allDocs[subCatDoc.parentId] : null

    await multitenantDb
      .collection('companies')
      .doc(COMPANY_ZERO)
      .collection('productNames')
      .doc(doc.id)
      .set({
        name: doc.name,
        mainCategoryId: subCatDoc?.parentId || null,
        mainCategoryName: mainCatDoc ? mainCatDoc.name : null,
        subCategoryId: doc.parentId || null,
        subCategoryName: subCatDoc ? subCatDoc.name : null,
        createdAt: doc.createdAt || serverTimestamp(),
      })
  }
  console.log(`  ✓ ${byLevel[2].length} productNames created`)

  console.log('\n✓ Hierarchy migration complete!')
}

migrateHierarchy().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
