# Firebase Emulator Setup for Local Testing

This guide helps you test the multi-tenant SaaS system locally WITHOUT affecting production data.

## What is the Firebase Emulator?

The Firebase Emulator Suite runs a **complete local copy** of Firebase services:
- ✅ Firestore (both default and multitenant databases)
- ✅ Authentication
- ✅ Cloud Functions
- ✅ Web UI (to inspect data)

**Zero risk to production data** — all changes are local only.

---

## Prerequisites

Make sure you have:
- Node.js 18+ installed
- `firebase-tools` installed globally: `npm install -g firebase-tools`
- `.env.local` file configured (already created for you)

---

## Step 1: Start the Firebase Emulator

In a **Terminal 1**, run:

```bash
npm run emulator
```

You'll see output like:
```
Firestore Emulator logging to firestore-debug.log
Auth Emulator running on http://localhost:9099
Firestore Emulator running on http://localhost:8080
Functions Emulator running on http://localhost:5001
Emulator UI running on http://localhost:4000
```

✅ **Emulator is now running locally**

---

## Step 2: Start the Dev Server

In a **Terminal 2**, run:

```bash
npm run dev
```

You'll see:
```
VITE v8.0.4 ready in 123 ms
➜ Local: http://localhost:5173/
```

The app will show:
```
🔥 Connecting to Firebase Emulators...
   Firestore: localhost:8080
   Auth: localhost:9099
   Functions: localhost:5001
```

---

## Step 3: Test Multi-Tenant Creation

### Test Company 1: Create a New Account

1. Go to `http://localhost:5173`
2. Click **Register**
3. Fill in:
   - Display Name: `John Doe`
   - Username: `johndoe`
   - Company Name: `**Company A**`
   - Email: (optional)
   - Password: `123456`
4. Click **Register**

✅ User is created with a new isolated company

### Test Company 2: Create Another Account

1. Click **Sign In** (logout first if needed)
2. Go back to **Register**
3. Fill in:
   - Display Name: `Jane Smith`
   - Username: `janesmith`
   - Company Name: `**Company B**`
   - Email: (optional)
   - Password: `123456`
4. Click **Register**

✅ Another isolated company created

---

## Step 4: Test Tenant Isolation

### Add Product to Company A

1. Log in as `johndoe` (Company A)
2. Go to **Products** → **Add Product**
3. Add a product: "Product A"
4. Save it

### Switch to Company B

1. Log out (or open private/incognito window)
2. Log in as `janesmith` (Company B)
3. Go to **Products**

✅ **"Product A" is NOT visible** — data is isolated!

### Add Product to Company B

1. While logged in as `janesmith`, add "Product B"
2. Log out and log back in as `johndoe`
3. Go to **Products**

✅ **"Product B" is NOT visible** to Company A

---

## Inspecting Local Data

While emulator is running, visit:

**http://localhost:4000**

This opens the **Firebase Emulator UI** where you can:
- View all Firestore documents (both databases)
- See Auth users and their custom claims
- Inspect Cloud Function calls
- Clear data for fresh testing

---

## Resetting Local Data

To start fresh:

1. Stop the emulator (Ctrl+C in Terminal 1)
2. Delete the emulator state:
   ```bash
   rm -rf .firebase/
   ```
3. Restart: `npm run emulator`

All data is cleared, emulator starts fresh.

---

## Testing Cloud Functions

The `createCompany` function runs locally when you register a new user.

To verify it worked:
1. Go to Emulator UI → **Functions** tab
2. You'll see the `createCompany` call logged
3. Check Firestore to confirm company document was created

---

## Running in Production Mode

When ready to deploy to production:

1. **Delete or rename `.env.local`** (so it uses production config)
2. Deploy code: `firebase deploy`
3. Push to production

---

## Troubleshooting

### Port Already in Use

If you see "Address already in use":
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
# Try again
npm run emulator
```

### Emulator Not Starting

Make sure `firebase-tools` is installed:
```bash
npm install -g firebase-tools@latest
firebase --version  # Should be 13.0.0+
```

### App Not Connecting to Emulator

Check `.env.local` exists with `VITE_USE_EMULATOR=true`

Check browser console for connection messages (should see 🔥 emoji)

---

## Summary

| Aspect | Production | Local Emulator |
|--------|-----------|------------------|
| **Database** | Cloud Firestore (real) | Local Firestore (emulated) |
| **Auth** | Firebase Auth | Local Auth (emulated) |
| **Data Risk** | ⚠️ Real data | ✅ Safe (local only) |
| **Reset** | Need backup restore | Delete `.firebase/` folder |
| **Speed** | ~500ms | ~10ms |

**Happy testing! 🚀**
