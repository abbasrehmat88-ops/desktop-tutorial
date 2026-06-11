# Connecting Ajman Rentals to Firebase (real cloud database)

Right now the app runs in **Demo Mode** — sample data saved on one device only.
Follow these steps once to switch it to a **real cloud database** with live sync
across every phone. It takes about 10 minutes and is free.

You only do the clicking in the Firebase website (because it needs your Google
login). At the end you give me 6 values and I finish wiring + deploy.

---

## Step 1 — Create the project
1. Go to **https://console.firebase.google.com**
2. Click **Add project** (or **Create a project**).
3. Name it something like `ajman-rentals`. Click Continue.
4. Google Analytics is **not needed** — turn it off. Click **Create project**.

## Step 2 — Turn on Email/Password login
1. In the left menu click **Build → Authentication → Get started**.
2. Open the **Sign-in method** tab.
3. Click **Email/Password**, switch the first toggle **On**, click **Save**.
   (Leave "Email link / passwordless" off.)

## Step 3 — Create your two accounts
1. Still in Authentication, open the **Users** tab → **Add user**.
2. Add the first account:
   - Email: `abbasrehmat88@gmail.com`
   - Password: choose a strong one you'll remember
3. Click **Add user** again and add your father's account (his real email +
   a password). Tell me his email so I put it in the security rules.

> Only these accounts will ever be able to log in. There is no public sign-up.

## Step 4 — Create the database
1. Left menu → **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (we'll paste secure rules next). Continue.
3. Pick the location closest to UAE — **`eur3` (europe-west)** or
   **`asia-south1` (Mumbai)** are both good. Click Enable.

## Step 5 — Paste the security rules
1. In Firestore Database open the **Rules** tab.
2. Delete what's there and paste the entire contents of the file
   **`firestore.rules`** from this project (replace the father email first).
3. Click **Publish**.

## Step 6 — Get your 6 config values
1. Click the **gear icon** (top-left, next to "Project Overview") →
   **Project settings**.
2. Scroll to **Your apps**. Click the **`</>`** (web) icon to register a web
   app. Nickname: `ajman-rentals-web`. **Do NOT** tick Firebase Hosting.
   Click **Register app**.
3. You'll see a `firebaseConfig` block like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "ajman-rentals.firebaseapp.com",
     projectId: "ajman-rentals",
     storageBucket: "ajman-rentals.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

4. **Send me those 6 values** (or paste them yourself into
   `src/firebase/firebaseCredentials.js`, replacing the `PASTE_...` lines,
   and also put your father's email there + in `firestore.rules`).

That's it. Once the values are in and pushed, the site automatically leaves
Demo Mode and every change syncs live between your phone and your father's.

---

## Is my data safe?
Yes, when the above is done:
- **Only your 2 accounts can sign in** — no public registration.
- **The security rules block everyone else** at the database level, even though
  the web keys are public (that's normal and safe by Google's design).
- Data lives encrypted in Google's cloud, with automatic backups.

## Moving your existing demo data over
Your current sample data is only on your phone. When we go live you'll start
fresh in the cloud and re-enter your real tenants/reminders once. After that,
everything is saved in the cloud permanently and shared across devices.
