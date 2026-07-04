import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

export const acceptInvite = functions.https.onCall(async (data, context) => {
  // Check auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in')
  }

  const uid = context.auth.uid
  const userEmail = context.auth.token.email || ''
  const { inviteId } = data

  if (!inviteId || typeof inviteId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Invite ID is required')
  }

  const db = admin.firestore()
  const auth = admin.auth()

  try {
    // Get the invite
    const inviteRef = db.collection('companyInvites').doc(inviteId)
    const inviteSnap = await inviteRef.get()

    if (!inviteSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Invite not found')
    }

    const inviteData = inviteSnap.data()!

    // Validate invite
    if (inviteData.status !== 'pending') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Invite has already been ${inviteData.status}`
      )
    }

    if (inviteData.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError('failed-precondition', 'Invite has expired')
    }

    // Validate email matches
    if (userEmail.toLowerCase() !== inviteData.invitedEmail.toLowerCase()) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'This invite was sent to a different email address'
      )
    }

    const companyId = inviteData.companyId

    // Atomic: create user doc in company + set custom claims + mark invite accepted
    await db.runTransaction(async (transaction) => {
      // Create/update user doc in the company
      const companyUserRef = db.collection('companies').doc(companyId).collection('users').doc(uid)
      transaction.set(
        companyUserRef,
        {
          uid,
          companyId,
          role: 'staff',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      // Mark invite as accepted
      transaction.update(inviteRef, {
        status: 'accepted',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    // Set custom claims on Auth user
    await auth.setCustomUserClaims(uid, {
      companyId,
      role: 'staff',
    })

    return {
      success: true,
      companyId,
      message: 'You have joined the company successfully',
    }
  } catch (error) {
    console.error('Error accepting invite:', error)
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to accept invite. Please try again.'
    )
  }
})
