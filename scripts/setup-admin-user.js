#!/usr/bin/env node

// Setup admin user with custom claims
// Usage: node scripts/setup-admin-user.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-key.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ firebase-key.json not found!');
    console.error('\nTo fix this:');
    console.error('1. Go to Firebase Console: https://console.firebase.google.com/project/inveman-5697c/settings/serviceaccounts/adminsdk');
    console.error('2. Click "Generate New Private Key"');
    console.error('3. Save the downloaded file as: firebase-key.json');
    console.error('4. Place it in the root directory: C:\\work\\InventoryManagementSystem\\');
    console.error('5. Run this script again');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  initializeApp({
    credential: cert(serviceAccount),
    projectId: 'inveman-5697c',
  });

  const auth = getAuth();

  async function setupAdminUser() {
    try {
      const adminEmail = 'ravi.nagam.kiran@gmail.com';
      const adminPassword = 'admin';

      console.log('🔧 Setting up admin user...');

      // Check if user exists
      let user;
      try {
        user = await auth.getUserByEmail(adminEmail);
        console.log(`✓ Admin user already exists: ${adminEmail}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create user
          console.log(`Creating admin user: ${adminEmail}`);
          user = await auth.createUser({
            email: adminEmail,
            password: adminPassword,
            displayName: 'Admin',
            emailVerified: true,
          });
          console.log(`✓ Admin user created with UID: ${user.uid}`);
        } else {
          throw error;
        }
      }

      // Set custom claims
      console.log(`Setting custom claims: { admin: true }`);
      await auth.setCustomUserClaims(user.uid, { admin: true });
      console.log(`✓ Custom claims set successfully`);

      console.log('\n✅ Admin user setup complete!');
      console.log(`\nLogin with:`);
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      console.log(`\nAccess admin dashboard at: /admin`);

      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  setupAdminUser();
} catch (error) {
  console.error('❌ Setup Error:', error.message);
  process.exit(1);
}
