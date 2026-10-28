/**
 * Firestore Security Rules Test Suite (Dirty Dozen Verification)
 * Run with Firebase Emulator Suite: npx vitest run firestore.rules.test.ts
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Profile',
    collectionPath: '/users/user_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      displayName: 'Attacker',
      photoURL: '',
      isAdmin: true,
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof',
    collectionPath: '/products/prod_1',
    operation: 'delete',
    auth: { uid: 'spoof_admin', email: 'realnahidhasan1@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Cross-User PII Read on Split Private Collection',
    collectionPath: '/users/user_1/private/info',
    operation: 'get',
    auth: { uid: 'user_2', email: 'u2@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Self-Approved Review Creation',
    collectionPath: '/reviews/rev_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      customerName: 'User One',
      productId: 'prod_1',
      productName: 'iPhone 15 Pro',
      orderId: '',
      rating: 5,
      comment: 'Bypassing moderation!',
      imageURL: '',
      verifiedPurchase: true,
      status: 'approved',
      adminReply: '',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Order Payment Status Tampering on Create',
    collectionPath: '/orders/ord_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      orderNumber: 'NBR-1001',
      userId: 'user_1',
      customerName: 'User One',
      customerPhone: '01912800803',
      customerEmail: 'u1@example.com',
      deliveryAddress: 'Kedargonj Bazar',
      district: 'Meherpur',
      city: 'Mujibnagar',
      orderNotes: '',
      deliveryMethod: 'Inside Meherpur',
      itemCount: 1,
      itemsSummary: '1x iPhone',
      subtotal: 100000,
      discount: 0,
      couponCode: '',
      deliveryFee: 60,
      total: 100060,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      cancellationReason: '',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Terminal State Mutation on Delivered Order',
    collectionPath: '/orders/ord_delivered',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      orderStatus: 'Cancelled',
      cancellationReason: 'Trying to cancel after delivery'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Orphaned Order Item Write to Another Users Order',
    collectionPath: '/orders/ord_user_1/items/item_1',
    operation: 'create',
    auth: { uid: 'user_2', email: 'u2@example.com', email_verified: true },
    payload: {
      orderId: 'ord_user_1',
      userId: 'user_2',
      productId: 'prod_1',
      productName: 'iPhone',
      productImage: '',
      sku: 'SKU-1',
      selectedVariant: '128GB',
      unitPrice: 10,
      quantity: 1,
      lineTotal: 10,
      createdAt: 'REQUEST_TIME'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Denial-of-Wallet ID Poisoning',
    collectionPath: '/products/invalid$id!with*bad^chars',
    operation: 'get',
    auth: null,
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Unpublished Draft Product Read by Visitor',
    collectionPath: '/products/unpublished_prod_1',
    operation: 'get',
    auth: null,
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Client Timestamp Forgery on Wishlist',
    collectionPath: '/wishlists/user_1_prod_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      productId: 'prod_1',
      createdAt: '2020-01-01T00:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Update-Gap Value Poisoning on User Profile',
    collectionPath: '/users/user_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      displayName: 'A'.repeat(500),
      updatedAt: 'REQUEST_TIME'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Cross-User Wishlist Read',
    collectionPath: '/wishlists/user_1_prod_1',
    operation: 'get',
    auth: { uid: 'user_2', email: 'u2@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED'
  }
];
