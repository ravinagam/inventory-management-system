import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK with multitenant database
admin.initializeApp({
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebasedatabase.googleapis.com`,
})

export { createCompany } from './createCompany'
export { createInvite } from './createInvite'
export { acceptInvite } from './acceptInvite'

// Phase 2 functions (commented for now, implemented later):
// export { createSubscription } from './createSubscription'
// export { razorpayWebhook } from './razorpayWebhook'
