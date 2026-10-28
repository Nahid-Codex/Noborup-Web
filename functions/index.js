/**
 * Noborup — Firebase Cloud Functions (Node 20)
 * Provides server-side order verification callable and automatic rating aggregation.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Callable Function: createVerifiedOrderServer
 * Validates product existence, live price, stock availability, coupon discount,
 * and delivery fee on the server, then atomically decrements stock and creates the order.
 */
exports.createVerifiedOrderServer = onCall(async (request) => {
  if (!request.auth || !request.auth.token.email_verified) {
    throw new HttpsError('unauthenticated', 'A verified customer account is required.');
  }

  const userId = request.auth.uid;
  const {
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    district,
    city,
    orderNotes,
    deliveryMethod,
    paymentMethod,
    couponCode,
    items,
  } = request.data || {};

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Cart items cannot be empty.');
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const orderNumber = `NBR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  await db.runTransaction(async (t) => {
    const settingsSnap = await t.get(db.doc('storeSettings/main'));
    const settings = settingsSnap.exists ? settingsSnap.data() : {
      insideMeherpurFee: 60,
      outsideMeherpurFee: 130,
      freeDeliveryThreshold: 25000,
    };

    let subtotal = 0;
    let totalCount = 0;
    const summaryParts = [];
    const verifiedItems = [];

    for (const item of items) {
      const prodRef = db.doc(`products/${item.productId}`);
      const prodSnap = await t.get(prodRef);
      if (!prodSnap.exists) {
        throw new HttpsError('not-found', `Product ${item.productId} does not exist.`);
      }
      const p = prodSnap.data();
      const qty = Math.max(1, Math.min(20, Number(item.quantity || 1)));
      if (!p.isPublished || Number(p.stockQuantity) < qty) {
        throw new HttpsError('failed-precondition', `Insufficient stock for ${p.name}.`);
      }

      const unitPrice = Number(p.price);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      totalCount += qty;
      summaryParts.push(`${qty}x ${p.name}`);

      t.update(prodRef, {
        stockQuantity: Number(p.stockQuantity) - qty,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      verifiedItems.push({
        productId: prodSnap.id,
        productName: p.name,
        productImage: p.images?.[0] || '',
        sku: p.sku || 'NBR-SKU',
        selectedVariant: item.selectedVariant || 'Standard',
        unitPrice,
        quantity: qty,
        lineTotal,
      });
    }

    const code = String(couponCode || '').trim().toUpperCase();
    let discount = 0;
    if (code === 'NOBORUP500' && subtotal >= 10000) discount = 500;
    else if (code === 'WELCOME200' && subtotal >= 5000) discount = 200;
    else if (code === 'MEHERPUR100' && subtotal >= 1500) discount = 100;

    const netAfterDiscount = Math.max(0, subtotal - discount);
    let deliveryFee = 0;
    if (deliveryMethod !== 'Store Pickup (Kedargonj Bazar)' && netAfterDiscount < settings.freeDeliveryThreshold) {
      deliveryFee = deliveryMethod === 'Inside Meherpur' ? settings.insideMeherpurFee : settings.outsideMeherpurFee;
    }

    const total = netAfterDiscount + deliveryFee;
    const orderRef = db.doc(`orders/${orderId}`);

    t.set(orderRef, {
      orderNumber,
      userId,
      customerName: String(customerName || '').slice(0, 120),
      customerPhone: String(customerPhone || '').slice(0, 30),
      customerEmail: String(customerEmail || request.auth.token.email || '').slice(0, 160),
      deliveryAddress: String(deliveryAddress || '').slice(0, 400),
      district: String(district || 'Meherpur').slice(0, 80),
      city: String(city || 'Mujibnagar').slice(0, 80),
      orderNotes: String(orderNotes || '').slice(0, 500),
      deliveryMethod,
      itemCount: totalCount,
      itemsSummary: summaryParts.join(' · ').slice(0, 1000),
      subtotal,
      discount,
      couponCode: code,
      deliveryFee,
      total,
      paymentMethod,
      paymentStatus: 'Unpaid',
      orderStatus: 'Pending',
      cancellationReason: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { orderId, orderNumber };
});

/**
 * Firestore Trigger: Recalculate product ratingAvg and ratingCount when a review is approved.
 */
exports.onReviewModerated = onDocumentWritten('reviews/{reviewId}', async (event) => {
  const afterData = event.data?.after?.data();
  const beforeData = event.data?.before?.data();
  const productId = afterData?.productId || beforeData?.productId;
  if (!productId) return;

  const approvedSnap = await db
    .collection('reviews')
    .where('productId', '==', productId)
    .where('status', '==', 'approved')
    .get();

  const count = approvedSnap.size;
  let sum = 0;
  approvedSnap.forEach((d) => {
    sum += Number(d.data().rating || 5);
  });

  const avg = count > 0 ? Number((sum / count).toFixed(1)) : 5;
  await db.doc(`products/${productId}`).update({
    ratingAvg: avg,
    ratingCount: count,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});
