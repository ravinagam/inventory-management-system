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
  console.log('=== Checking hierarchyConfig/setup ===')
  const configDoc = await defaultDb.collection('hierarchyConfig').doc('setup').get()
  if (configDoc.exists) {
    const config = configDoc.data()
    console.log('Levels:', config.levels)
    console.log('Optional Levels:', config.optionalLevels)
    
    // Show sample hierarchy data for each level
    for (let i = 0; i < config.levels.length; i++) {
      const snap = await defaultDb.collection('hierarchyData').where('levelIndex', '==', i).limit(3).get()
      console.log(`\nLevel ${i} (${config.levels[i] || 'unnamed'}) - sample docs:`)
      snap.forEach(doc => {
        const data = doc.data()
        console.log(`  - ${data.name} (parentId: ${data.parentId || 'none'})`)
      })
    }
  } else {
    console.log('No hierarchyConfig found!')
  }
}

check().catch(console.error)
