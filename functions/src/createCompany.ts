import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

export const createCompany = functions.https.onCall(async (data, context) => {
  // Check auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in')
  }

  const uid = context.auth.uid
  const { companyName } = data

  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'Company name is required')
  }

  const db = admin.firestore()
  const auth = admin.auth()

  try {
    // Create company doc in multitenant database
    const companiesRef = db.collection('companies')
    const companyRef = companiesRef.doc() // auto-generate ID
    const companyId = companyRef.id

    // Atomic transaction: create company + settings + user doc + set custom claims
    await db.runTransaction(async (transaction) => {
      // Create company root doc
      transaction.set(companyRef, {
        name: companyName.trim(),
        ownerUid: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
      })

      // Create settings doc
      transaction.set(companyRef.collection('settings').doc('general'), {
        companyName: companyName.trim(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Create subscription doc (for Phase 2)
      transaction.set(companyRef.collection('subscription').doc('current'), {
        plan: 'free',
        status: 'trialing',
        trialEndsAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        ),
        razorpaySubscriptionId: null,
        razorpayCustomerId: null,
        razorpayPlanId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Create user doc
      transaction.set(companyRef.collection('users').doc(uid), {
        uid,
        companyId,
        role: 'owner',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    // Set custom claims on Auth user (outside transaction, since it's not Firestore)
    await auth.setCustomUserClaims(uid, {
      companyId,
      role: 'owner',
    })

    return {
      success: true,
      companyId,
      message: 'Company created successfully',
    }
  } catch (error) {
    console.error('Error creating company:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create company. Please try again.'
    )
  }
})
