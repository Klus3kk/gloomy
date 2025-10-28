# Gloomy Rewrite Plan

## 0. Guiding Objectives
- Deliver a polished, modern downloader site with a p5.js-enhanced UI delivered via Next.js.
- Manage a curated catalog of files whose metadata lives in Firestore and binaries in Firebase Storage.
- Allow admins to create password-protected or public downloads via an authenticated console.
- Provide a “QuickDrop” one-off share that accepts files up to 25 MB, produces a short link, and expires after the first download or 60 seconds—whichever comes first.
- Serve all public assets and downloads through CloudFront while keeping private content behind signed URLs.

## 1. Operational Foundations
1. **Requirements & Governance**
   - Draft a functional spec covering roles (admin, viewer, quickdropper), password policy (length, hashing), and retention requirements.
   - Record architectural decisions (ADR) for using Firebase + CloudFront, including security assumptions and fallback plans.
2. **Environment Setup**
   - Create a Firebase project with Authentication, Firestore, Storage, and Cloud Functions enabled.
   - Generate service accounts for Next.js server runtime and Cloud Functions; grant least-privilege IAM roles.
   - Store config values in `.env.local` / `.env.production` (Firebase client config, admin credentials, CloudFront IDs).
3. **Tooling & Quality Gates**
   - Add lint/test scripts if missing; configure Prettier/ESLint consistent with repo conventions.
   - Introduce a lightweight e2e framework plan (Playwright/Cypress) for download workflows.
   - Set up Git hooks or CI to block deploys without passing tests and type checks.

## 2. Frontend Rebuild (Next.js + p5.js)
1. **Design System**
   - Wire Tailwind tokens for colors, typography, glassmorphism surfaces, and spacing scale.
   - Define reusable UI primitives (panels, modals, buttons, status tags) backed by accessibility expectations.
2. **p5.js Integration**
   - Implement a `<P5Canvas>` component that encapsulates sketch lifecycle, responsive sizing, and hydration safeguards.
   - Replace the hero animation in `app/page.tsx` with the new component and ensure it can be reused on other pages.
3. **Layout & Navigation**
   - Build a global layout with header, authenticated nav controls, and responsive sidebar for admin-only views.
   - Integrate breadcrumb and search affordances for catalog browsing.
4. **Catalog Views**
   - Implement category grid/list with Firestore-driven data hooks (useSWR/React Query).
   - Add file detail modal containing description, visibility badge, password prompt, and download CTA.
5. **QuickDrop UI**
   - ✅ Create an upload form enforcing a 25 MB limit with progress feedback.
   - ✅ Display generated short link, countdown timer, and state transitions (active, consumed, expired).
6. **Admin Console**
   - Provide upload management table (sortable, filterable) showing status, visibility, last access, and controls.
   - Build forms for new uploads, metadata edits (title, category, password toggle), and revoke operations.
   - Surface rule-driven warnings when attempts violate password requirements or exceed quotas.
7. **UX Polish**
   - Add skeleton loaders, optimistic states, and toast notifications for important actions.
   - Ensure full keyboard navigation and screen-reader labels for all interactive components.

## 3. Authentication & Authorization
1. **Client Auth**
   - Integrate Firebase Auth with OAuth providers (Google, GitHub) and persistent sessions.
   - Handle multi-provider linking to avoid duplicated user records.
2. **Server Side Sessions**
   - Use Firebase Admin SDK in Next.js middleware/API routes to verify ID tokens and attach user context.
   - Store server-generated session cookies (HTTP-only, Secure, SameSite) with refresh handling.
3. **Role & Permission Model**
   - Define Firestore `users` collection with roles (`admin`, `viewer`, `quickdrop-only`).
   - Enforce role checks in admin routes/components; hide admin navigation for non-admins.
4. **Security Rules**
   - Author Firestore security rules covering catalog metadata, QuickDrop docs, and audit logs.
  - ✅ Storage rules restrict catalog writes to admins, allow anonymous-authenticated QuickDrop uploads, and block direct public reads of private content.
5. **Audit & Logging**
   - Capture key events (upload, download, revoke, QuickDrop consume) in a `logs` collection for future reporting.

## 4. Catalog File Pipeline
1. **Metadata Schema**
   - Design Firestore `files` document schema: `title`, `slug`, `category`, `description`, `visibility`, `passwordHash`, `ownerUid`, `createdAt`, `updatedAt`, `downloadCount`, `cloudfrontKey`, etc.
   - Decide on deterministic slug generation to back stable download URLs.
2. **Upload Flow**
   - Build client upload using Firebase Storage resumable uploads, capturing pause/resume, progress, and error handling.
   - Hash passwords client-side (e.g., Argon2id via WebAssembly) before sending to Firestore; never store plain text.
   - On success, call a Cloud Function or Next.js API to write metadata and trigger background tasks.
3. **Cloud Functions**
   - `storage.onFinalize` function to enrich metadata (file size, MIME type), validate password presence, and sync `files` doc.
   - Function to regenerate signed CloudFront URLs or invalidate cache when metadata changes.
4. **Download API**
   - Implement `/api/download/[slug]` that verifies user access, checks password (hashed comparison), and logs the attempt.
   - Generate signed URLs: CloudFront for public files (longer TTL), Firebase Storage single-use for private files (short TTL).
   - Ensure password-protected downloads require a valid session with a recent password verification challenge.
5. **Migration**
   - Script migration of current `public/files/media` assets into Storage, producing Firestore docs with inherited categories/passwords.
   - Validate migrated data through spot checks and checksum comparisons.

## 5. QuickDrop One-Off Share
1. **Upload Handler**
   - ✅ UI validates size ≤ 25 MB and requests a token via `/api/quickdrop` before uploading.
   - ✅ Binaries land under `quickdrop/{token}` with Firestore docs tracking `pending → active → consumed` state.
2. **Download Enforcement**
   - ✅ `/api/quickdrop/[token]` enforces 60-second expiry and single-use consumption using Firestore transactions.
   - 🚧 Automatic deletion/cleanup left for future Cloud Functions work.
3. **Client Feedback**
   - ✅ Countdown, copyable link, and status messaging implemented on share + recipient pages.
4. **Concurrency Safeguards**
   - ✅ Transactions prevent double consumption. Additional integration tests still to be added.

## 6. Infrastructure & Deployment
1. **Hosting Topology**
   - Split Next.js build: SSG pages to S3, dynamic routes (download APIs) deployed as AWS Lambda via Serverless/Next.js adapter.
   - Configure CloudFront with behaviors for static assets (S3), `/api/*` (Lambda/API Gateway), and `/quickdrop/*` if needed.
2. **Integration with Firebase**
   - Securely pass Firebase Admin credentials to Lambdas using AWS Secrets Manager or environment variables.
   - Ensure CloudFront signed URL/private key storage complies with security policies.
3. **CI/CD Pipeline**
   - Automate lint/test/build, Firebase emulators tests, and deployment to staging/prod.
   - Add manual approval gate between staging verification and production release.
4. **Monitoring & Alerts**
   - Hook Cloud Logging / AWS CloudWatch dashboards for download errors, auth failures, and function latency.
   - Configure alerting thresholds (e.g., QuickDrop download failures >5% over 10 minutes).
5. **Caching & Invalidation**
   - Define cache-control headers for public assets vs private responses.
   - Implement automated CloudFront invalidation when catalog files update.

## 7. Security & Compliance
1. **Password Handling**
   - Use strong hashing (Argon2id, scrypt) with per-file salt; store salts in Firestore metadata.
   - Provide admin UI to rotate or remove passwords with force-invalidation of outstanding links.
2. **Data Protection**
   - Enforce HTTPS, HSTS, and secure cookies across the stack.
   - Validate all user input (file names, descriptions) server-side to prevent injection or path traversal.
3. **Rate Limiting**
   - Add throttling middleware to API routes (`/api/download`, `/api/quickdrop`) to mitigate abuse.
   - Consider reCAPTCHA or bot checks for QuickDrop uploads if abuse risk is high.
4. **Logging & Privacy**
   - Ensure logs exclude plaintext passwords and minimize PII.
   - Document retention policy for logs and quickdrop artifacts.

## 8. Testing & Verification
1. **Unit Tests**
   - ✅ Cover utility functions (password hashing, slug generation) using Node's test runner.
   - Mock Firebase SDKs to validate data layer logic.
2. **Integration Tests**
   - Use Firebase Emulator Suite and Next.js test runner to cover upload → download flows, password checks, QuickDrop lifecycle.
   - Simulate concurrent downloads to confirm single-use enforcement.
3. **Performance Tests**
   - Conduct load tests on `/api/download` and QuickDrop endpoints under expected traffic spikes.
   - Benchmark p5.js animations on mid-range mobile devices; optimize if frame rate drops.
4. **Accessibility & UX QA**
   - Run Lighthouse/axe audits, keyboard-only navigation checks, and responsive layout tests across breakpoints.
5. **Staging Sign-off**
   - Maintain a staging environment mirroring production configuration, seeded with sample catalog data.
   - Require checklist verification (uploads, downloads, quickdrop, password gating, admin console) before production deploy.

## 9. Launch & Post-Launch
1. **Migration Cutover**
   - Freeze legacy uploads, execute data migration, validate counts, and update DNS to point CloudFront at the new stack.
2. **User Enablement**
   - Prepare admin playbook (how to upload, set passwords, monitor quickdrop usage).
   - Provide end-user FAQ covering download steps, password expectations, and QuickDrop limitations.
3. **Post-Launch Monitoring**
   - Watch dashboards closely for the first 48 hours; set up pager alerts for elevated error rates.
4. **Iteration Backlog**
   - Gather feedback for future enhancements (analytics, link sharing history, mobile app).
