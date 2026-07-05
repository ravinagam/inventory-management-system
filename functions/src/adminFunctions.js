const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const multitenantDb = getFirestore(admin.app(), 'multitenant');
const defaultDb = getFirestore(admin.app(), '(default)');

// Helper: Check if user is admin
function isAdmin(context) {
  return context.auth && context.auth.token.admin === true;
}

// Get admin dashboard stats
exports.getAdminStats = functions.https.onCall(async (data, context) => {
  if (!isAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    // Count total companies
    const companiesSnap = await multitenantDb.collection('companies').count().get();
    const totalCompanies = companiesSnap.data().count;

    // Count total users
    const usersSnap = await defaultDb.collection('users').count().get();
    const totalUsers = usersSnap.data().count;

    // Get companies by plan
    const plansSnapshot = await multitenantDb.collection('companies').get();
    const planCounts = { free: 0, starter: 0, pro: 0 };

    for (const doc of plansSnapshot.docs) {
      const subSnap = await doc.ref.collection('subscription').doc('current').get();
      if (subSnap.exists) {
        const plan = subSnap.data().plan || 'free';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      } else {
        planCounts.free += 1;
      }
    }

    return {
      totalCompanies,
      totalUsers,
      freePlan: planCounts.free,
      starterPlan: planCounts.starter,
      proPlan: planCounts.pro,
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get stats');
  }
});

// Get all companies with stats
exports.getAllCompanies = functions.https.onCall(async (data, context) => {
  if (!isAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    const companies = [];
    const companiesSnap = await multitenantDb.collection('companies').get();

    for (const companyDoc of companiesSnap.docs) {
      const companyData = companyDoc.data();
      const companyId = companyDoc.id;

      // Count users
      const usersSnap = await companyDoc.ref.collection('users').count().get();
      const userCount = usersSnap.data().count;

      // Count products
      const productsSnap = await companyDoc.ref.collection('products').count().get();
      const productCount = productsSnap.data().count;

      // Get total stock
      let totalStock = 0;
      const productDocsSnap = await companyDoc.ref.collection('products').get();
      productDocsSnap.forEach((doc) => {
        totalStock += doc.data().currentStock || 0;
      });

      // Get subscription plan
      const subSnap = await companyDoc.ref.collection('subscription').doc('current').get();
      const plan = subSnap.exists ? subSnap.data().plan : 'free';
      const subscriptionStatus = subSnap.exists ? subSnap.data().status : 'active';

      // Get owner info
      const ownerUid = companyData.ownerUid;
      const ownerSnap = await defaultDb.collection('users').doc(ownerUid).get();
      const ownerUsername = ownerSnap.exists ? ownerSnap.data().username : 'Unknown';

      companies.push({
        id: companyId,
        name: companyData.name,
        owner: ownerUsername,
        ownerUid,
        users: userCount,
        products: productCount,
        totalStock,
        plan,
        status: companyData.status || 'active',
        subscriptionStatus,
        createdAt: companyData.createdAt,
      });
    }

    // Sort by creation date (newest first)
    companies.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    return { companies };
  } catch (error) {
    console.error('Error getting companies:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get companies');
  }
});

// Get all users
exports.getAllUsers = functions.https.onCall(async (data, context) => {
  if (!isAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    const users = [];
    const usersSnap = await defaultDb.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;

      // Get Auth user info (for lastLogin)
      let email = 'Unknown';
      try {
        const authUser = await admin.getAuth().getUser(uid);
        email = authUser.email;
      } catch (e) {
        // User might have been deleted from Auth
      }

      users.push({
        uid,
        username: userData.username || 'Unknown',
        email,
        displayName: userData.displayName || 'Unknown',
        companyId: userData.companyId || 'No company',
        role: userData.role || 'staff',
        createdAt: userData.createdAt,
      });
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    return { users };
  } catch (error) {
    console.error('Error getting users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get users');
  }
});

// Get single company details
exports.getCompanyDetails = functions.https.onCall(async (data, context) => {
  if (!isAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { companyId } = data;
  if (!companyId) {
    throw new functions.https.HttpsError('invalid-argument', 'companyId is required');
  }

  try {
    const companyRef = multitenantDb.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Company not found');
    }

    const companyData = companySnap.data();

    // Get users
    const usersSnap = await companyRef.collection('users').get();
    const users = usersSnap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    // Get products
    const productsSnap = await companyRef.collection('products').get();
    const products = productsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get subscription
    const subSnap = await companyRef.collection('subscription').doc('current').get();
    const subscription = subSnap.exists ? subSnap.data() : null;

    return {
      company: {
        id: companyId,
        ...companyData,
      },
      users,
      products,
      subscription,
      stats: {
        userCount: users.length,
        productCount: products.length,
        totalStock: products.reduce((sum, p) => sum + (p.currentStock || 0), 0),
      },
    };
  } catch (error) {
    console.error('Error getting company details:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get company details');
  }
});
