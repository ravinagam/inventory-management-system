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

const defaultDb = getFirestore('(default)')
const multitenantDb = getFirestore('multitenant')

const COMPANY_ZERO = 'COMPANY_ZERO'

async function inferRelationships() {
  console.log('Inferring parent-child relationships from products...\n')

  // Get all hierarchyData to know which IDs exist
  const hierarchySnap = await defaultDb.collection('hierarchyData').get()
  const existingIds = new Set()
  hierarchySnap.forEach(doc => {
    existingIds.add(doc.id)
  })
  console.log(`Found ${existingIds.size} existing hierarchyData IDs`)

  // Get all products
  const productsSnap = await defaultDb.collection('products').get()
  console.log(`Found ${productsSnap.size} products\n`)

  // Map: mainCategoryId → Set<subCategoryId>
  const relationships = {}
  let skipped = 0

  productsSnap.forEach(doc => {
    const product = doc.data()
    const mainCatId = product.hierarchyLevels?.[0]?.itemId
    const subCatId = product.hierarchyLevels?.[1]?.itemId

    if (mainCatId && existingIds.has(mainCatId)) {
      if (!relationships[mainCatId]) {
        relationships[mainCatId] = new Set()
      }
      if (subCatId && existingIds.has(subCatId)) {
        relationships[mainCatId].add(subCatId)
      }
    } else if (mainCatId && !existingIds.has(mainCatId)) {
      skipped++
    }
  })

  console.log(`Found relationships for ${Object.keys(relationships).length} main categories`)
  console.log(`Skipped ${skipped} products with non-existent mainCategoryId\n`)

  // Update the multitenant database
  console.log('Updating subCategories with mainCategoryId...')
  let updated = 0

  for (const [mainCatId, subCatSet] of Object.entries(relationships)) {
    for (const subCatId of subCatSet) {
      try {
        await multitenantDb
          .collection('companies')
          .doc(COMPANY_ZERO)
          .collection('subCategories')
          .doc(subCatId)
          .update({
            mainCategoryId: mainCatId,
          })
        updated++
      } catch (err) {
        if (err.code !== 5) { // NOT_FOUND
          throw err
        }
        // Silently skip missing documents
      }
    }
  }

  console.log(`✓ Updated ${updated} subCategory documents`)
}

inferRelationships().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
