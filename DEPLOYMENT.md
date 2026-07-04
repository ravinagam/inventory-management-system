# Phase 1: Multi-Tenant SaaS Deployment Guide

## ⚠️ Critical: Deployment Sequence

**This sequence must be followed exactly. Each step is safe to rehearse/repeat before moving to the next.**

---

## Step 1: Create the `multitenant` Firestore Database

**Firebase Console → Project Settings**

1. Go to **Firestore Database** section
2. Click **Create Database**
3. **Database ID**: `multitenant`
4. **Location**: Same region as your existing `(default)` database
5. **Rules**: Start with `Allow all` (we'll deploy proper rules in step 5)
6. **Click Create**

⏱️ Wait for the database to be ready (usually 1-2 minutes).

---

## Step 2: Download Service Account Key

**Needed for: backup & migration scripts**

1. Firebase Console → **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save as `.firebase-service-account.json` in the project root
   - **⚠️ Add to .gitignore** (already done)
   - Never commit this file

---

## Step 3: Verify `.firebase-service-account.json` Exists

```bash
ls .firebase-service-account.json
# Should exist in the root directory
```

---

## Step 4: Backup Existing Data (Safety Net)

**Read-only from (default) database. Creates local JSON files.**

```bash
node scripts/backup-firestore-json.js
```

**Output:** `backups/pre-migration-<YYYY-MM-DD-HHMM>/`

✅ **Verify the backup:**
- Open `backups/pre-migration-<timestamp>/products.json`
- Should contain all your existing products with real data

---

## Step 5: Dry-Run Migration (No Writes)

**Reads from (default), prints what WOULD happen. Zero writes anywhere.**

```bash
node scripts/migrate-to-multitenant.js --dry-run
```

**Expected output:**
```
=== DRY RUN ===
Source: (default) database
Target: multitenant database
Company: COMPANY_ZERO

Migrating collection: products...
  → Would write XX documents to companies/COMPANY_ZERO/products
...
✓ Dry run successful. Run without --dry-run to perform actual migration.
```

✅ **Check:** Document counts match your expectations (compare against backup JSON files)

---

## Step 6: Run Actual Migration

**Reads from (default), writes to multitenant. (default) is never modified.**

```bash
node scripts/migrate-to-multitenant.js
```

**Expected output:**
```
=== MIGRATION STARTED ===
Source: (default) database
Target: multitenant database
Company: COMPANY_ZERO

Creating company COMPANY_ZERO...
  ✓ Company COMPANY_ZERO created with name "Your Shop Name"

Migrating collection: products...
  ✓ XX documents migrated
...
=== MIGRATION COMPLETE ===
Total documents: XXXX
Collections migrated: 13
✓ Migration successful. Verify in Firebase Console before deploying new rules.
```

---

## Step 7: Verify Migration in Firebase Console

1. Go to **Firestore Database** → **multitenant**
2. Expand `companies` → `COMPANY_ZERO`
3. **Check these collections exist with data:**
   - `products` (should have all your products)
   - `categories`
   - `inventoryLogs`
   - `auditSessions`
   - `hierarchyConfig`
   - `hierarchyData`
   - `settings`
   - `users`

4. **Spot-check a product:**
   - Open a product doc → verify fields match the (default) database

5. **Verify (default) is untouched:**
   - Switch to **(default)** database
   - `products` collection should still have all original data
   - Doc counts should be identical to before migration

---

## Step 8: Deploy Firestore Rules

**Now that data is verified, lock down the multitenant database with security rules.**

```bash
firebase deploy --only firestore
```

This deploys rules to BOTH databases:
- `(default)`: keeps existing rules (unchanged)
- `multitenant`: gets new tenant-isolation rules

⏱️ Usually takes 5-10 seconds.

---

## Step 9: Deploy Cloud Functions

**Needed for: Company creation, team invites, and webhooks (Phase 2).**

```bash
firebase deploy --only functions
```

⏱️ Usually takes 30-60 seconds per function.

**Expected functions deployed:**
- `createCompany` ← used during signup
- `createInvite` ← (prepared for Phase 1.1)
- `acceptInvite` ← (prepared for Phase 1.1)

---

## Step 10: Build & Deploy the App

**This is the user-facing cutover. App now points to `multitenant` database.**

```bash
npm run build
firebase deploy --only hosting
```

⏱️ Build: ~30 seconds, Deploy: ~10 seconds

---

## Step 11: Smoke Test (Critical!)

**Do this in a browser while logged in as your admin/test user:**

### Test 1: Existing User Login
1. Log in with an existing username
2. Dashboard loads → ✓ Products, inventory, audit all visible
3. All data intact from the (default) database migration

### Test 2: Add a Product
1. Go to **Products** → **Add Product**
2. Create a new product
3. ✓ Product appears in the list
4. ✓ (Uses multitenant database)

### Test 3: New User Registration (Optional)
1. **Sign out** or open in **private/incognito**
2. Go to **Register**
3. Fill: Display Name, Username, Company Name, Password
4. ✓ Account created
5. ✓ Dashboard loads for new company (empty products)
6. ✓ Cannot see previous company's products

### Test 4: Cross-Tenant Isolation Check (Optional)
1. While logged in as new company user, open browser console:
   ```javascript
   const { collection, getDoc, query, getDocs } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js');
   const firstTenant = await getDocs(query(collection(db, 'companies', 'COMPANY_ZERO', 'products')));
   console.log('Found products from COMPANY_ZERO:', firstTenant.size); // Should be 0 or error
   ```
2. ✓ Should be denied or return 0 (no cross-tenant leaks)

---

## 🎯 Rollback Procedure (if anything goes wrong)

**At any point before step 10:** Simply delete the `multitenant` database in Firebase Console and re-run steps 1-9.

**After step 10 (app deployed):** Redeploy the previous app build:
```bash
git log --oneline | head -5  # Find the last known-good commit
git checkout <commit-hash>
npm run build
firebase deploy --only hosting
```

The app will point back to `(default)` database, which has been untouched the entire time.

---

## 📋 Checklist Before Going Live

- [ ] Step 1: `multitenant` database created in Firebase
- [ ] Step 2: `.firebase-service-account.json` downloaded and in `.gitignore`
- [ ] Step 4: Backup created in `backups/` directory
- [ ] Step 5: Dry-run shows expected document counts
- [ ] Step 6: Migration completes successfully
- [ ] Step 7: Data verified in Firebase Console (multitenant & default both have correct doc counts)
- [ ] Step 8: Firestore rules deployed
- [ ] Step 9: Cloud Functions deployed (check Firebase Console → Functions)
- [ ] Step 10: App built and deployed
- [ ] Step 11: Smoke tests pass (login, add product, new user registration all work)

---

## 📞 Troubleshooting

### "Firestore database not found" during migration
**Fix:** Refresh Firebase Console → wait for the `multitenant` database status to show "Ready"

### "Permission denied" during migration
**Fix:** Check service account has Firestore access:
- Firebase Console → Project Settings → Service Accounts
- Verify the account has "Editor" role

### "Collection not found" when loading products after deploying app
**Fix:** Check that `src/lib/firebase.js` points to `'multitenant'` database (should be):
```javascript
export const db = initializeFirestore(app, { localCache: persistentLocalCache() }, 'multitenant')
```

### New user registration fails with "Failed to create company"
**Fix:** Check Cloud Functions deployed successfully:
- Firebase Console → Functions
- `createCompany` should be listed and green (active)
- Check function logs for errors

---

## 🎉 Success Indicators

1. ✅ Existing users can log in and see all their data
2. ✅ New products can be added and appear in the list
3. ✅ New users can register with a company name
4. ✅ Each company's data is isolated (no cross-tenant leaks)
5. ✅ Firestore rules enforcement is active (deny rules respected)

**You're now running Phase 1: Multi-Tenant SaaS!**

---

## Next: Phase 2 (Razorpay Billing)

Once Phase 1 has soaked for a week and you're confident in the multi-tenant architecture:
- Implement `createSubscription` callable
- Add Razorpay webhook receiver
- Create billing UI in Settings
- Add plan-limit enforcement

See the plan in the repo for full Phase 2 spec.
