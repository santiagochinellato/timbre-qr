# 🚀 BELLZ DEMO PROTOCOL

## 1. Setup Environment

Ensure your `.env.local` contains the following keys. A template has been created at `env.local.template`.

**Critical for Demo:**

- `AUTH_TRUST_HOST=true` (Required for Ngrok)
- `DATABASE_URL` (Must be valid)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` (Required for Notifications)

To generate new VAPID keys if needed:

```bash
npx web-push generate-vapid-keys
```

## 2. Database Sync & Seed

Reset and populate the database with the demo building and user.

```bash
# Sync Schema
npx drizzle-kit push

# Seed Data (Creates Admin & Building)
# Note: Ensure tsx is installed or run via npx
npx tsx scripts/seed.ts
```

## 3. Launch Sequence

Open two terminal tabs:

**Terminal 1 (App):**

```bash
npm run dev
```

**Terminal 2 (Tunnel):**

```bash
npx ngrok http 3000
```

## 4. Demo Script

### 👤 Owner Role ( Laptop )

1.  Go to `https://[ngrok-url]/login`
2.  Login with:
    - **Email:** `admin@test.com`
    - **Password:** `123456`
3.  **IMPORTANT:** Click "Enable Notifications" on the dashboard banner and Allow permissions.

### 🔔 Visitor Role ( Mobile )

1.  On a smartphone, open: `https://[ngrok-url]/r/demo-center`
    - _(Using the building slug 'demo-center')_
2.  Tap "Touch Bell".
3.  Take a photo (or select file).
4.  Select Unit **4B**.

### ✅ Interaction

1.  **Watch the Laptop:** A Push Notification should appear instantly.
2.  **Dashboard:** The "Activity" page will update with the new event.
