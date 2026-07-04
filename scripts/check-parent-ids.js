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

async function check() {
  console.log('=== Checking parent relationships in source hierarchyData ===\n')

  // Get all hierarchyData docs
  const allSnap = await defaultDb.collection('hierarchyData').get()
  const allDocs = {}
  allSnap.forEach(doc => {
    allDocs[doc.id] = { id: doc.id, ...doc.data() }
  })

  // Check Level 1 parent references
  console.log('Level 1 (Sub Category) items and their parentId:')
  const level1 = Object.values(allDocs).filter(d => d.levelIndex === 1).slice(0, 5)
  level1.forEach(doc => {
    const parent = allDocs[doc.parentId]
    console.log(`  ${doc.id}: "${doc.name}"`)
    console.log(`    parentId: ${doc.parentId}`)
    console.log(`    parent exists: ${parent ? 'YES' : 'NO'}`)
    if (parent) {
      console.log(`    parent name: "${parent.name}"`)
      console.log(`    parent level: ${parent.levelIndex}`)
    }
  })

  // Count Level 1 items with parentId
  const level1All = Object.values(allDocs).filter(d => d.levelIndex === 1)
  const withParent = level1All.filter(d => d.parentId)
  console.log(`\nLevel 1 items: ${level1All.length}`)
  console.log(`Level 1 items with parentId: ${withParent.length}`)
  console.log(`Level 1 items with null/undefined parentId: ${level1All.length - withParent.length}`)
}

check().catch(console.error)
