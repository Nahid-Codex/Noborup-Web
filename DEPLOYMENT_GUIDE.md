# Noborup — Full-Stack E-Commerce Deployment & Setup Guide

**Store Name:** Noborup  
**Showroom Location:** Kedargonj Bazar, Mujibnagar, Meherpur, Bangladesh  
**Support / WhatsApp:** `01912-800803`, `01874-902031`  
**Email:** `noborupstore.bd@gmail.com`  

---

## 1. Local Development & Build

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server (Port 3000):**
   ```bash
   npm run dev
   ```

3. **Build production bundle (`dist/`):**
   ```bash
   npm run build
   ```

---

## 2. Firebase Configuration (`firebase-applet-config.json` & `.env`)

This project is pre-configured with a provisioned Firebase project (`ivory-history-xv4kj`) and named Firestore database (`ai-studio-d87cf443-0313-4d50-89b3-f9271f75e576`) inside `/firebase-applet-config.json`.

If you want to point the application to your own custom Firebase project, you can either update `/firebase-applet-config.json` or provide standard Vite environment variables in `.env`:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIRESTORE_DATABASE_ID="(default)"
```

---

## 3. Administrator Setup & Access

- **Bootstrapped Admin Email:** `realnahidhasan1@gmail.com` (verified via Google Sign-In or email verification).
- **Additional Administrators:** Any user whose UID has a document in `/admins/{uid}` in Cloud Firestore is automatically granted full administrator access in both the React UI (`/admin`) and `firestore.rules` / `storage.rules`.
- **Admin Login Portal:** Visit `/admin-login` or click **Admin** in the top navigation bar when signed in as an administrator.
- **1-Click Initial Seed:** Inside `/admin`, click **Sync / Seed Firestore Catalog** in the top bar to populate or reset the categories, products, verified customer delivery reviews, social videos, and store settings in relational order.

---

## 4. Security Rules & Indexes Validation

- **Firestore Security Rules (`/firestore.rules`):**
  - Enforces strict schema validation, field length bounds, price/stock integrity, split PII isolation (`/users/{uid}` vs `/users/{uid}/private/info`), and relational existence checks (`exists()`).
  - Validate locally anytime with:
    ```bash
    npx eslint firestore.rules
    ```
- **Firebase Storage Rules (`/storage.rules`):**
  - Restricts uploads to valid image MIME types (`image/jpeg`, `image/png`, `image/webp`) under 5MB.
  - Only administrators can upload to `/products/**`, `/categories/**`, and `/store/**`.

---

## 5. Deploying to Firebase Hosting, Firestore, Storage & Functions

1. **Authenticate with Firebase CLI:**
   ```bash
   npx firebase-tools login
   ```

2. **Build the production frontend:**
   ```bash
   npm run build
   ```

3. **Deploy Firestore rules, indexes, Storage rules, and Hosting:**
   ```bash
   npx firebase-tools deploy --only firestore,storage,hosting
   ```

4. **(Optional) Deploy Cloud Functions (`functions/`):**
   ```bash
   cd functions && npm install && cd ..
   npx firebase-tools deploy --only functions
   ```
