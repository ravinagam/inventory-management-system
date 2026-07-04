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

async function debug() {
  console.log('=== Checking hierarchy relationships in multitenant db ===\n')

  // Get main categories
  const mainCatsSnap = await multitenantDb
    .collection('companies')
    .doc('COMPANY_ZERO')
    .collection('mainCategories')
    .limit(3)
    .get()

  const mainCatIds = new Set()
  console.log('Sample mainCategories:')
  mainCatsSnap.forEach(doc => {
    console.log(`  ${doc.id}: ${doc.data().name}`)
    mainCatIds.add(doc.id)
  })

  // Get all main category IDs
  const allMainCatsSnap = await multitenantDb
    .collection('companies')
    .doc('COMPANY_ZERO')
    .collection('mainCategories')
    .get()
  
  console.log(`\nTotal mainCategories: ${allMainCatsSnap.size}`)

  // Get sample sub categories and check their mainCategoryId
  const subCatsSnap = await multitenantDb
    .collection('companies')
    .doc('COMPANY_ZERO')
    .collection('subCategories')
    .limit(5)
    .get()

  console.log('\nSample subCategories (first 5):')
  subCatsSnap.forEach(doc => {
    const data = doc.data()
    console.log(`  ${doc.id}: ${data.name}`)
    console.log(`    mainCategoryId: ${data.mainCategoryId}`)
    console.log(`    mainCategoryName: ${data.mainCategoryName}`)
  })

  // Check if mainCategoryId values exist
  console.log('\n=== Checking if mainCategoryId references exist ===')
  const uniqueMainCatIds = new Set()
  subCatsSnap.forEach(doc => {
    if (doc.data().mainCategoryId) {
      uniqueMainCatIds.add(doc.data().mainCategoryId)
    }
  })

  console.log(`Found ${uniqueMainCatIds.size} unique mainCategoryId references in sample`)
  
  // Check if they exist
  for (const id of Array.from(uniqueMainCatIds).slice(0, 3)) {
    const docSnap = await multitenantDb
      .collection('companies')
      .doc('COMPANY_ZERO')
      .collection('mainCategories')
      .doc(id)
      .get()
    
    console.log(`  ${id}: ${docSnap.exists ? '✓ EXISTS' : '✗ MISSING'} ${docSnap.exists ? `(${docSnap.data().name})` : ''}`)
  }
}

debug().catch(console.error)
