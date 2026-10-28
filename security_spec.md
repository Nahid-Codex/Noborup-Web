# Noborup E-Commerce Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: All paths not explicitly matched are denied (`allow read, write: if false;`).
2. **Admin Privilege Integrity**:
   - No user can self-assign admin status via `/users/{userId}`.
   - `isAdmin()` requires `isSignedIn() && request.auth.token.email_verified == true` and either matches the bootstrapped owner email (`realnahidhasan1@gmail.com`) or exists in `/admins/$(request.auth.uid)`.
3. **PII Split-Collection Isolation**:
   - Customer PII (`email`, `phone`, `address`, `district`, `city`) is isolated inside `/users/{userId}/private/{docId}` and strictly readable/writable only by `isOwner(userId) || isAdmin()`, with parent existence check `exists(/databases/$(database)/documents/users/$(userId))`.
4. **Catalog & Storefront Integrity**:
   - Public visitors may only read `/products/{productId}` where `resource.data.isPublished == true` and `/categories/{categoryId}` where `resource.data.isActive == true`.
   - Only `isAdmin()` may create, update, or delete products, categories, social videos, and store settings.
5. **Order & Subcollection Relational Gate**:
   - Customers can only create orders where `incoming().userId == request.auth.uid`, `incoming().orderStatus == 'Pending'`, and `incoming().paymentStatus == 'Unpaid'`.
   - Subcollection `/orders/{orderId}/items/{itemId}` enforces the Master Gate by fetching `/databases/$(database)/documents/orders/$(orderId)` via `get()` and verifying ownership (`parent.userId == request.auth.uid || isAdmin()`).
   - Terminal order states (`Delivered`, `Cancelled`, `Refunded`) are locked for non-admin updates; customers can only cancel their own `Pending` orders via an explicit `affectedKeys().hasOnly(['orderStatus', 'cancellationReason', 'updatedAt'])` action.
6. **Review Moderation Gate**:
   - Authenticated verified users can only submit reviews with `status == 'pending'`, `verifiedPurchase == false` (or verified by admin), and `userId == request.auth.uid`.
   - Public read/list queries on `/reviews` only return documents where `resource.data.status == 'approved'` (or owned by the requester / admin).
7. **Temporal & Volumetric Boundaries**:
   - Every string field enforces strict `.size()` limits matching `firebase-blueprint.json`.
   - Every create/update enforces server timestamp equality (`incoming().createdAt == request.time`, `incoming().updatedAt == request.time`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Shadow Field Injection on User Profile)**:
   `{ "uid": "u1", "displayName": "Hacker", "photoURL": "", "isAdmin": true, "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }` -> Rejected by `hasOnly`.
2. **Payload 2 (Unverified Admin Email Spoof)**:
   Auth token `{ uid: "spoof1", email: "realnahidhasan1@gmail.com", email_verified: false }` attempting to create a product -> Rejected by `request.auth.token.email_verified == true`.
3. **Payload 3 (Cross-User PII Read)**:
   User `u2` attempting `get(/users/u1/private/info)` -> Rejected by `isOwner(userId)`.
4. **Payload 4 (Self-Approved Review Creation)**:
   User `u1` creating `/reviews/r1` with `status: "approved"` -> Rejected because customer create requires `incoming().status == 'pending'`.
5. **Payload 5 (Order Price/Status Tampering on Create)**:
   User `u1` creating `/orders/o1` with `paymentStatus: "Paid"` or `orderStatus: "Delivered"` -> Rejected because customer create mandates `orderStatus == 'Pending'` and `paymentStatus == 'Unpaid'`.
6. **Payload 6 (Terminal State Mutation on Delivered Order)**:
   User `u1` attempting to cancel `/orders/o1` after `existing().orderStatus == 'Delivered'` -> Rejected by Terminal State Lock (`existing().orderStatus == 'Pending'`).
7. **Payload 7 (Orphaned Order Item Subcollection Write)**:
   User `u2` attempting to write `/orders/o1/items/i1` where `/orders/o1` belongs to `u1` -> Rejected by Master Gate `get(/orders/$(orderId)).data.userId == request.auth.uid`.
8. **Payload 8 (Denial-of-Wallet 10KB ID Poisoning)**:
   Path variable `productId` of 2000 characters or invalid regex chars -> Rejected by `isValidId(productId)`.
9. **Payload 9 (Unpublished Product Scraping)**:
   Anonymous user attempting `get(/products/draftProd)` where `isPublished == false` -> Rejected by `resource.data.isPublished == true`.
10. **Payload 10 (Client Timestamp Forgery)**:
    User `u1` creating a wishlist item with a forged past `createdAt` timestamp instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
11. **Payload 11 (Update-Gap Type Poisoning)**:
    User `u1` updating `/users/u1` `displayName` to a 5000-character string or boolean -> Rejected because `isValidUserPublicProfile(incoming())` wraps the entire `allow update` block.
12. **Payload 12 (Unauthorized Wishlist Scraping via Blanket List)**:
    User `u2` executing an unconstrained `list` on `/wishlists` -> Rejected by `resource.data.userId == request.auth.uid`.
