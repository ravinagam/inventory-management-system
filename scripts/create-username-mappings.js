#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
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
const auth = getAuth()

async function createMappings() {
  console.log('\n=== Creating Username Mappings ===\n')

  // Get all users from Auth
  const authUsers = await auth.listUsers()

  for (const authUser of authUsers.users) {
    const email = authUser.email

    // For each email, try to infer the username
    // Users registered with email typically don't have a username
    // Users registered with username get email like: username@inveman.app
    
    if (email.endsWith('@inveman.app')) {
      // Extract username from email
      const username = email.split('@')[0]

      // Check if mapping already exists
      const existingSnap = await defaultDb.collection('usernames').doc(username).get()
      
      if (!existingSnap.exists) {
        // Create the mapping
        await defaultDb.collection('usernames').doc(username).set({ authEmail: email })
        console.log(`✓ Created mapping: ${username} → ${email}`)
      } else {
        console.log(`✓ Already exists: ${username} → ${email}`)
      }
    }
  }

  console.log('\n✓ Username mappings created!')
}

createMappings().catch(console.error)
