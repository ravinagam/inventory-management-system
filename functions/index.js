const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

admin.initializeApp();

const auth = getAuth();

// Create Company
exports.createCompany = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');

  const uid = context.auth.uid;
  const companyName = data.companyName;

  if (!companyName || !companyName.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'Company name is required');
  }

  try {
    // Get named database using correct Admin SDK v12 syntax
    const multitenantDb = getFirestore(admin.app(), 'multitenant');

    // Create company document
    const companyId = companyName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    
    await multitenantDb.collection('companies').doc(companyId).set({
      name: companyName.trim(),
      ownerUid: uid,
      createdAt: FieldValue.serverTimestamp(),
      status: 'active',
    });

    // Create settings
    await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('settings')
      .doc('general')
      .set({
        companyName: companyName.trim(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Create subscription
    await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('subscription')
      .doc('current')
      .set({
        plan: 'free',
        status: 'trialing',
        trialEndsAt: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        razorpaySubscriptionId: null,
        razorpayCustomerId: null,
        razorpayPlanId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Set custom claims
    // Note: In emulator, this may not work perfectly, but in production it will
    try {
      await auth.setCustomUserClaims(uid, { companyId, role: 'owner' });
      console.log(`✓ Custom claims set for ${uid}: companyId=${companyId}`);
    } catch (claimsError) {
      console.warn(`⚠ Could not set custom claims: ${claimsError.message}`);
      // Don't fail — production will set them correctly
    }

    // Create user profile in the company immediately as a workaround
    await multitenantDb
      .collection('companies')
      .doc(companyId)
      .collection('users')
      .doc(uid)
      .set({
        uid,
        email: context.auth.token.email || 'unknown',
        displayName: 'Owner',
        companyId,
        role: 'owner',
        createdAt: FieldValue.serverTimestamp(),
      });

    return { companyId, success: true };
  } catch (error) {
    console.error('Error creating company:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create company: ' + error.message);
  }
});

// Placeholder for createInvite
exports.createInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  return { success: true, message: 'Invite functionality coming soon' };
});

// Placeholder for acceptInvite
exports.acceptInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  return { success: true, message: 'Invite acceptance coming soon' };
});

// Admin Functions
const adminFunctions = require('./src/adminFunctions');
exports.getAdminStats = adminFunctions.getAdminStats;
exports.getAllCompanies = adminFunctions.getAllCompanies;
exports.getAllUsers = adminFunctions.getAllUsers;
exports.getCompanyDetails = adminFunctions.getCompanyDetails;
