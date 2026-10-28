# AUW Connect — Student & Teacher Portal

A responsive static website built with **HTML, CSS, and vanilla JavaScript**, designed for free hosting on GitHub Pages. Firebase Authentication and Cloud Firestore provide sign-in and shared data.

> **Status:** starter MVP / pilot. The front end is implemented, but it will not connect to accounts or shared data until you configure Firebase and deploy the Firestore rules. This is an independent student-built concept, not an official AUW service.

## Included files

- `index.html` — page structure and all dashboard sections
- `styles.css` — responsive AUW-inspired plum, ivory, and gold theme
- `app.js` — vanilla JavaScript and Firebase integration
- `firebase-config.js` — your Firebase web configuration placeholder
- `firestore.rules` — baseline database access rules
- `firestore.indexes.json` — suggested compound indexes

## Features in this starter

- Email/password registration and sign-in
- Registration restricted to pre-approved emails
- Student, teacher, and administrator roles
- Student schedule filtering for Pathways, Foundation, and Undergraduate
- Teacher appointment sessions with a 20-seat limit
- One active reservation per student at a time, transaction-based booking, and cancellation with a reason before the configured deadline
- Student teacher-support requests
- Teacher feedback and percentage-based progress summaries
- Private/group chats for approved users
- Student listings for notes, food, crafts, jewellery, clothing, beauty kits, and dorm essentials
- Teacher-only Faculty Circle
- Admin allowlist and session management

## Important limitations before real use

1. This is a starter MVP, not a production-ready university system. Review and test all security rules and workflows before using real data.
2. GitHub Pages hosts static files only. Firebase provides the authentication and database services.
3. Firebase browser config is public by design; **Firestore Security Rules are the security boundary**. Never place service-account JSON or private keys in the website.
4. This version uses client-side transactions for seat booking and Firestore rules to limit changes. For production-grade booking, cancellation audits, and strict scheduling, use trusted server-side logic (such as Cloud Functions or another backend) and test concurrency thoroughly.
5. A single reservation document per student intentionally limits each student to one active booking globally. If the policy should be one booking per day or per schedule window, change the data model and rules.
6. Email approval is based on an admin-maintained exact email allowlist. A domain suffix alone is not considered proof of approval.
7. The cancellation reason is collected and logged. The UI prevents late cancellation; server rules and trusted backend validation should also enforce cancellation windows for production.
8. Chat moderation, reporting, blocking, attachment uploads, email verification, password reset UI, rate limiting, audit logs, and a full teacher view of their assigned students are not yet implemented.
9. Grades and feedback are sensitive. Use fake data while testing, get university authorization before collecting real student records, and review access rules with someone experienced in Firebase.
10. Student money-exchange posts should not be used to collect bank credentials or conduct transactions within the website.

## Part A — Create a Firebase project (free tier)

1. Open <https://console.firebase.google.com/> and create a project.
2. Add a **Web App** to that project.
3. Copy the Firebase web configuration into `firebase-config.js`, replacing each placeholder.
4. In **Build → Authentication → Sign-in method**, enable **Email/Password**.
5. In **Build → Firestore Database**, create a database. Start in production mode.
6. Open Firestore **Rules**, paste the contents of `firestore.rules`, and publish.
7. In Firebase Authentication settings, configure a password policy if available, and enable email enumeration protection where supported.
8. Add your GitHub Pages site to **Authentication → Settings → Authorized domains** if it is not automatically present.

Firebase Spark/free-tier quotas and feature availability can change. Check the current Firebase pricing page before inviting users.

## Part B — Seed the first administrator

The dashboard deliberately cannot grant a new admin role. Seed the first admin manually so a regular admin cannot elevate accounts through the UI.

1. In Firebase Authentication, create an account for the admin email (or register after adding the approved-email record).
2. In Firestore, create a document in `approvedEmails` whose **document ID is the exact lowercase admin email**, for example `admin@example.edu`. Use fields:
   - `role`: `"admin"`
   - `program`: `"staff"`
   - `enabled`: `true`
3. Register/sign in using that email in the app. If the account is newly registered, it creates a user profile from the approved record.
4. If the account already exists in Authentication and has no Firestore profile, the app will create the profile from its allowlist entry at sign-in.
5. Verify the `users/{uid}` document has `role: "admin"` and `active: true`.

**Do not seed an admin with an email you do not control.** For any account already created with an incorrect role, correct it directly in Firestore before use.

## Part C — Add approved students and teachers

After signing in as admin:

1. Open **Administration → Approve an account**.
2. Enter the exact email address and select role and programme.
3. The person can now create an account using that email.
4. To disable future access, use the disable control in the approved accounts list. Existing user profiles may also need deactivation in Firestore to immediately revoke access.

For the first test, add two test students and one test teacher using email addresses you control.

## Part D — Create an appointment session

1. Approve and register a teacher first.
2. Sign in as admin and open **Administration → Create a session**.
3. Enter the teacher email, programme, title, date/time, booking deadline, and cancellation deadline.
4. The app publishes the session with a capacity of 20.
5. Sign in as a student with the matching programme to test booking.

The current app lets a student hold one active reservation globally. The same teacher/session can only be booked up to 20 seats because booking updates use a Firestore transaction. Thoroughly test simultaneous bookings before real deployment.

## Part E — Publish on GitHub Pages

1. Create a GitHub repository, for example `auw-connect`.
2. Upload `index.html`, `styles.css`, `app.js`, `firebase-config.js`, `firestore.rules`, `firestore.indexes.json`, and this README to the repository root.
3. Commit the files.
4. Open the repository **Settings → Pages**.
5. Under build and deployment, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to publish. Your URL will look like `https://YOUR-GITHUB-USERNAME.github.io/auw-connect/`.
7. Add the exact Pages hostname (usually `YOUR-GITHUB-USERNAME.github.io`) to Firebase Authentication's authorized domains.
8. Open the deployed page over HTTPS and test registration, booking, cancellation, and roles.

No paid domain is needed. A custom domain is optional.

## Testing checklist

- [ ] Unapproved email cannot register
- [ ] Approved student can register and sign in
- [ ] Student cannot open Administration or Faculty Circle
- [ ] Student cannot write grades or alter another student's booking
- [ ] Teacher cannot grant admin access
- [ ] Session has no more than 20 seats
- [ ] Two students attempting the last seat cannot both book it
- [ ] Student cannot create a second active reservation
- [ ] Late cancellation is rejected by the production enforcement layer
- [ ] Private chat is readable only by its members
- [ ] Feedback is readable only by the relevant student, teacher author, or admin
- [ ] Marketplace users can remove only their own listings
- [ ] Rules are tested in Firebase Emulator Suite before real records are used

## Deploying Firestore rules and indexes with Firebase CLI (optional)

If you have Node.js installed, install Firebase CLI and run `firebase login`, then `firebase init firestore` in this folder. Keep the `firestore.rules` and `firestore.indexes.json` filenames, check the generated `firebase.json`, and deploy with:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

GitHub Pages does not deploy Firestore rules; deploy them to Firebase separately.

## Privacy and safety

- Obtain university approval before presenting this as an official university service.
- Do not use real grades, sensitive student details, or private conversations in a public demo.
- Provide a clear privacy notice, community guidelines, reporting tools, and an account-removal process before launch.
- The app does not handle money transfers. Treat money-exchange listings as requests for users to coordinate safely outside the platform.
