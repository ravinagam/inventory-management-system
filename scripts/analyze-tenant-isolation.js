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

async function analyze() {
  console.log('\n=== Analyzing Tenant Isolation ===\n')

  // 1. Check what's in company_b
  console.log('1. Company B Products:')
  const companyBProductsSnap = await multitenantDb
    .collection('companies')
    .doc('company_b_1783144370315')
    .collection('products')
    .get()
  
  console.log(`   Found ${companyBProductsSnap.size} products`)
  companyBProductsSnap.forEach(doc => {
    const data = doc.data()
    console.log(`   - ${data.displayName || data.name} (${doc.id})`)
  })

  // 2. Check what's in COMPANY_ZERO (Sai Ganesh Traders)
  console.log('\n2. COMPANY_ZERO (Sai Ganesh Traders) Products:')
  const sgtProductsSnap = await multitenantDb
    .collection('companies')
    .doc('COMPANY_ZERO')
    .collection('products')
    .get()

  console.log(`   Found ${sgtProductsSnap.size} products`)
  console.log(`   Sample products:`)
  let count = 0
  sgtProductsSnap.forEach(doc => {
    if (count < 3) {
      const data = doc.data()
      console.log(`   - ${data.displayName || data.name}`)
      count++
    }
  })

  // 3. Check products at ROOT level (should be empty in multitenant)
  console.log('\n3. ROOT Level Products (should be 0):')
  const rootProductsSnap = await multitenantDb
    .collection('products')
    .get()

  console.log(`   Found ${rootProductsSnap.size} products`)
  if (rootProductsSnap.size > 0) {
    console.log(`   ⚠️ PROBLEM: Data found at root level (not company-scoped)!`)
    rootProductsSnap.docs.slice(0, 3).forEach(doc => {
      const data = doc.data()
      console.log(`   - ${data.displayName || data.name}`)
    })
  }

  // 4. Check user's actual company assignment
  console.log('\n4. User btuser1@inveman.app Assignment:')
  const btuser1InCompanyB = await multitenantDb
    .collection('companies')
    .doc('company_b_1783144370315')
    .collection('users')
    .doc('uFDqdKGeIUVPZ5AJFLj162Xwwxq2')
    .get()

  if (btuser1InCompanyB.exists) {
    console.log(`   ✓ btuser1 is in company_b`)
    console.log(`   Role: ${btuser1InCompanyB.data().role}`)
  } else {
    console.log(`   ✗ btuser1 NOT found in company_b!`)
  }
}

analyze().catch(console.error)
