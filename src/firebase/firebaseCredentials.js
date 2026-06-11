// =============================================================================
//  FIREBASE CREDENTIALS  —  paste your 6 values here
// =============================================================================
//
//  WHERE TO GET THESE:
//    1. Go to  https://console.firebase.google.com
//    2. Open your project  ->  click the gear icon  ->  "Project settings"
//    3. Scroll down to "Your apps"  ->  the web app  ->  "SDK setup and
//       configuration"  ->  choose "Config".
//    4. You will see a block that looks exactly like the one below.
//       Copy each value between the quotes into the matching line here.
//
//  IS IT SAFE TO PUT THESE IN THE CODE?
//    Yes. Firebase web keys are designed to be public — they only identify
//    your project, they do NOT grant access to your data. Your data is
//    protected by the Firestore Security Rules (see firestore.rules) and by
//    the fact that only the two family email accounts can sign in.
//
//  Until you replace the PASTE_... placeholders, the app stays in Demo Mode
//  (sample data on one device). Once real values are in, it switches to the
//  live cloud database with real-time sync across every phone automatically.
// =============================================================================

export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY_HERE',
  authDomain: 'PASTE_AUTH_DOMAIN_HERE',
  projectId: 'PASTE_PROJECT_ID_HERE',
  storageBucket: 'PASTE_STORAGE_BUCKET_HERE',
  messagingSenderId: 'PASTE_SENDER_ID_HERE',
  appId: 'PASTE_APP_ID_HERE',
}

// =============================================================================
//  WHO IS ALLOWED TO LOG IN
// =============================================================================
//  Only these email addresses can sign in. Add your father's real email on
//  the second line (replace the placeholder). These must match the accounts
//  you create in Firebase Console -> Authentication -> Users.
// =============================================================================

export const allowedEmails = [
  'abbasrehmat88@gmail.com',
  'PASTE_FATHER_EMAIL_HERE@gmail.com',
]
