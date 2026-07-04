import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

export const createInvite = functions.https.onCall(async (data, context) => {
  // Check auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in')
  }

  const uid = context.auth.uid
  const companyId = context.auth.token.companyId
  const role = context.auth.token.role

  // Only owners can create invites
  if (role !== 'owner') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only company owners can create invites'
    )
  }

  const { email } = data

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid email is required')
  }

  const db = admin.firestore()

  try {
    // Check user limit (Phase 2 — for now, just create the invite)
    // TODO: Implement maxUsers check from PLAN_LIMITS

    // Create invite doc
    const inviteRef = db.collection('companyInvites').doc()
    await inviteRef.set({
      inviteId: inviteRef.id,
      companyId,
      invitedEmail: email.toLowerCase().trim(),
      createdBy: uid,
      status: 'pending',
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      ),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      inviteId: inviteRef.id,
      message: `Invite sent to ${email}`,
    }
  } catch (error) {
    console.error('Error creating invite:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create invite. Please try again.'
    )
  }
})
