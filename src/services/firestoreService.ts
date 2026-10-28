import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, db, handleFirestoreError, storage } from '../firebase/config';
import {
  CartItem,
  Category,
  DeliveryMethodType,
  OperationType,
  Order,
  OrderItem,
  OrderStatusType,
  PaymentMethodType,
  PaymentStatusType,
  Product,
  Review,
  ServiceBooking,
  SocialVideo,
  StoreSettings,
  UserPrivateInfo,
  UserPublicProfile,
  WishlistItem,
} from '../types';
import {
  DEFAULT_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_VIDEOS,
} from '../utils/seedData';

function formatTimestamp(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return new Date().toISOString();
}

export function sanitizeId(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 120);
}

export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'item';
}

function getActiveUser(): {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
} | null {
  if (auth.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      emailVerified: true,
    };
  }
  try {
    const raw = localStorage.getItem('noborup_local_auth_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        uid: parsed.uid || 'local-admin-nahid',
        email: parsed.email || 'realnahidhasan1@gmail.com',
        displayName: parsed.displayName || 'Nahid Hasan',
        emailVerified: true,
      };
    }
  } catch {
    // Ignore
  }
  return null;
}

const LOCAL_ORDERS_KEY = 'noborup_local_orders_v1';
const LOCAL_PRODUCTS_KEY = 'noborup_local_products_v1';
const LOCAL_CATEGORIES_KEY = 'noborup_local_categories_v1';
const LOCAL_SETTINGS_KEY = 'noborup_local_settings_v1';
const LOCAL_REVIEWS_KEY = 'noborup_local_reviews_v1';
const LOCAL_VIDEOS_KEY = 'noborup_local_videos_v1';
const LOCAL_BOOKINGS_KEY = 'noborup_local_bookings_v1';

function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

function getLocalOrders(): Order[] {
  return getLocalItem<Order[]>(LOCAL_ORDERS_KEY, []);
}

function saveLocalOrders(orders: Order[]): void {
  setLocalItem(LOCAL_ORDERS_KEY, orders);
}

// ============================================================================
// Database Seeding Service (respects relational dependency order)
// ============================================================================

let isSeedingInProgress = false;

export async function seedDatabaseIfNeeded(forceByAdmin = false): Promise<boolean> {
  if (isSeedingInProgress) return false;
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    if (forceByAdmin) {
      setLocalItem(LOCAL_CATEGORIES_KEY, INITIAL_CATEGORIES);
      setLocalItem(LOCAL_PRODUCTS_KEY, INITIAL_PRODUCTS);
      setLocalItem(LOCAL_REVIEWS_KEY, INITIAL_REVIEWS);
      setLocalItem(LOCAL_VIDEOS_KEY, INITIAL_VIDEOS);
      setLocalItem(LOCAL_SETTINGS_KEY, DEFAULT_STORE_SETTINGS);
      return true;
    }
    return false;
  }

  try {
    isSeedingInProgress = true;
    const settingsRef = doc(db, 'storeSettings', 'main');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists() && !forceByAdmin) {
      isSeedingInProgress = false;
      return false;
    }

    // 1. Seed Categories first (Products require categories to exist)
    for (const cat of INITIAL_CATEGORIES) {
      await setDoc(doc(db, 'categories', cat.id), {
        name: cat.name.slice(0, 80),
        slug: sanitizeSlug(cat.slug).slice(0, 80),
        description: cat.description.slice(0, 400),
        imageURL: cat.imageURL.slice(0, 600),
        parentId: cat.parentId.slice(0, 128),
        sortOrder: Number(cat.sortOrder),
        isActive: Boolean(cat.isActive),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Seed Products second (Reviews require products to exist)
    for (const prod of INITIAL_PRODUCTS) {
      await setDoc(doc(db, 'products', prod.id), {
        name: prod.name.slice(0, 160),
        slug: sanitizeSlug(prod.slug).slice(0, 160),
        brand: prod.brand.slice(0, 80),
        categoryId: prod.categoryId.slice(0, 128),
        categorySlug: prod.categorySlug.slice(0, 80),
        description: prod.description.slice(0, 4000),
        price: Number(prod.price),
        compareAtPrice: Number(prod.compareAtPrice),
        condition: prod.condition === 'Used' ? 'Used' : 'New',
        sku: prod.sku.slice(0, 64),
        stockQuantity: Number(prod.stockQuantity),
        images: prod.images.slice(0, 8).map((u) => u.slice(0, 600)),
        variants: prod.variants.slice(0, 10).map((v) => v.slice(0, 80)),
        specifications: prod.specifications || {},
        warrantyInfo: (prod.warrantyInfo || '').slice(0, 300),
        isFeatured: Boolean(prod.isFeatured),
        isNewArrival: Boolean(prod.isNewArrival),
        isBestSeller: Boolean(prod.isBestSeller),
        isSpecialOffer: Boolean(prod.isSpecialOffer),
        isPublished: Boolean(prod.isPublished),
        ratingAvg: Number(prod.ratingAvg || 5),
        ratingCount: Number(prod.ratingCount || 1),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Seed Approved Showroom Reviews
    for (const rev of INITIAL_REVIEWS) {
      await setDoc(doc(db, 'reviews', rev.id), {
        userId: rev.userId.slice(0, 128),
        customerName: rev.customerName.slice(0, 100),
        productId: rev.productId.slice(0, 128),
        productName: rev.productName.slice(0, 160),
        orderId: rev.orderId.slice(0, 128),
        rating: Number(rev.rating),
        comment: rev.comment.slice(0, 1200),
        imageURL: rev.imageURL.slice(0, 600),
        verifiedPurchase: Boolean(rev.verifiedPurchase),
        status: rev.status,
        adminReply: rev.adminReply.slice(0, 600),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Seed Social Media Videos
    for (const vid of INITIAL_VIDEOS) {
      await setDoc(doc(db, 'videos', vid.id), {
        title: vid.title.slice(0, 160),
        platform: vid.platform,
        videoURL: vid.videoURL.slice(0, 600),
        thumbnailURL: vid.thumbnailURL.slice(0, 600),
        productId: vid.productId.slice(0, 128),
        sortOrder: Number(vid.sortOrder),
        isPublished: Boolean(vid.isPublished),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Seed Store Settings last (locks initial bootstrap gate)
    await setDoc(settingsRef, {
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    isSeedingInProgress = false;
    return true;
  } catch (error) {
    isSeedingInProgress = false;
    console.warn('Initial seed skipped or already completed:', error);
    return false;
  }
}

// ============================================================================
// Store Settings
// ============================================================================

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const normalizeSettings = (s: StoreSettings): StoreSettings => ({
    ...DEFAULT_STORE_SETTINGS,
    ...s,
    heroSubtext:
      !s.heroSubtext || s.heroSubtext.toLowerCase().includes('25-point')
        ? DEFAULT_STORE_SETTINGS.heroSubtext
        : s.heroSubtext,
    warrantyPolicy:
      !s.warrantyPolicy || s.warrantyPolicy.toLowerCase().includes('25-point')
        ? DEFAULT_STORE_SETTINGS.warrantyPolicy
        : s.warrantyPolicy,
    facebookURL:
      !s.facebookURL || s.facebookURL === 'https://facebook.com/noborup'
        ? DEFAULT_STORE_SETTINGS.facebookURL
        : s.facebookURL,
    instagramURL: s.instagramURL || DEFAULT_STORE_SETTINGS.instagramURL,
  });

  const localOverride = getLocalItem<StoreSettings | null>(LOCAL_SETTINGS_KEY, null);
  if (localOverride && !auth.currentUser) {
    return normalizeSettings(localOverride);
  }
  try {
    const snap = await getDoc(doc(db, 'storeSettings', 'main'));
    if (snap.exists()) {
      const data = snap.data();
      return normalizeSettings({
        ...DEFAULT_STORE_SETTINGS,
        ...data,
        updatedAt: formatTimestamp(data.updatedAt),
      } as StoreSettings);
    }
    return normalizeSettings(localOverride || DEFAULT_STORE_SETTINGS);
  } catch {
    return normalizeSettings(localOverride || DEFAULT_STORE_SETTINGS);
  }
}

export async function updateStoreSettings(settings: Omit<StoreSettings, 'updatedAt'>): Promise<void> {
  const localPayload: StoreSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  setLocalItem(LOCAL_SETTINGS_KEY, localPayload);
  if (!auth.currentUser) return;

  const path = 'storeSettings/main';
  try {
    const payload = {
      storeName: settings.storeName.trim().slice(0, 80),
      logoURL: settings.logoURL.trim().slice(0, 600),
      announcementText: settings.announcementText.trim().slice(0, 240),
      heroHeadline: settings.heroHeadline.trim().slice(0, 160),
      heroSubtext: settings.heroSubtext.trim().slice(0, 400),
      contactPhone: settings.contactPhone.trim().slice(0, 40),
      secondaryPhone: settings.secondaryPhone.trim().slice(0, 40),
      whatsappNumber: settings.whatsappNumber.trim().slice(0, 40),
      contactEmail: settings.contactEmail.trim().slice(0, 160),
      address: settings.address.trim().slice(0, 300),
      openingHours: settings.openingHours.trim().slice(0, 160),
      facebookURL: settings.facebookURL.trim().slice(0, 400),
      youtubeURL: settings.youtubeURL.trim().slice(0, 400),
      tiktokURL: settings.tiktokURL.trim().slice(0, 400),
      insideMeherpurFee: Number(settings.insideMeherpurFee),
      outsideMeherpurFee: Number(settings.outsideMeherpurFee),
      freeDeliveryThreshold: Number(settings.freeDeliveryThreshold),
      shippingPolicy: settings.shippingPolicy.trim().slice(0, 2000),
      returnPolicy: settings.returnPolicy.trim().slice(0, 2000),
      warrantyPolicy: settings.warrantyPolicy.trim().slice(0, 2000),
      updatedAt: serverTimestamp(),
    };
    const refDoc = doc(db, 'storeSettings', 'main');
    const existingSnap = await getDoc(refDoc);
    if (existingSnap.exists()) {
      await updateDoc(refDoc, payload);
    } else {
      await setDoc(refDoc, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// Categories CRUD
// ============================================================================

export async function fetchCategories(includeInactiveForAdmin = false): Promise<Category[]> {
  const localCategories = getLocalItem<Category[] | null>(LOCAL_CATEGORIES_KEY, null);
  if (localCategories && !auth.currentUser) {
    return includeInactiveForAdmin ? localCategories : localCategories.filter((c) => c.isActive);
  }
  try {
    const colRef = collection(db, 'categories');
    const q = includeInactiveForAdmin
      ? query(colRef)
      : query(colRef, where('isActive', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      const base = localCategories || INITIAL_CATEGORIES;
      return includeInactiveForAdmin ? base : base.filter((c) => c.isActive);
    }
    const list: Category[] = snap.docs.map((d) => {
      const data = d.data();
      const seedCat = INITIAL_CATEGORIES.find((c) => c.id === d.id || c.slug === data.slug);
      const rawImage = String(data.imageURL || '');
      const cleanImage =
        !rawImage || rawImage.includes('/assets/aistudio/customar__')
          ? seedCat?.imageURL || '/assets/products/iphone-15-pro.svg'
          : rawImage;
      return {
        id: d.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        imageURL: cleanImage,
        parentId: data.parentId || '',
        sortOrder: Number(data.sortOrder ?? 0),
        isActive: Boolean(data.isActive),
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    const base = localCategories || INITIAL_CATEGORIES;
    return includeInactiveForAdmin ? base : base.filter((c) => c.isActive);
  }
}

export async function saveCategory(
  category: Omit<Category, 'createdAt' | 'updatedAt'>,
  isEdit: boolean
): Promise<void> {
  const id = sanitizeId(category.id || `cat-${Date.now()}`);
  const nowIso = new Date().toISOString();
  const currentList = getLocalItem<Category[]>(LOCAL_CATEGORIES_KEY, INITIAL_CATEGORIES);
  const newCat: Category = {
    id,
    name: category.name.trim().slice(0, 80),
    slug: sanitizeSlug(category.slug || category.name).slice(0, 80),
    description: (category.description || '').trim().slice(0, 400),
    imageURL: (category.imageURL || '/assets/products/iphone-15-pro.svg').trim().slice(0, 600),
    parentId: (category.parentId || '').trim().slice(0, 128),
    sortOrder: Number(category.sortOrder || 1),
    isActive: Boolean(category.isActive),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const existsIdx = currentList.findIndex((c) => c.id === id);
  if (existsIdx >= 0) {
    currentList[existsIdx] = { ...currentList[existsIdx], ...newCat, createdAt: currentList[existsIdx].createdAt };
  } else {
    currentList.push(newCat);
  }
  setLocalItem(LOCAL_CATEGORIES_KEY, currentList);
  if (!auth.currentUser) return;

  const path = `categories/${id}`;
  try {
    const refDoc = doc(db, 'categories', id);
    const baseData = {
      name: newCat.name,
      slug: newCat.slug,
      description: newCat.description,
      imageURL: newCat.imageURL,
      parentId: newCat.parentId,
      sortOrder: newCat.sortOrder,
      isActive: newCat.isActive,
      updatedAt: serverTimestamp(),
    };
    if (isEdit) {
      const existingSnap = await getDoc(refDoc);
      if (existingSnap.exists()) {
        await updateDoc(refDoc, baseData);
        return;
      }
    }
    await setDoc(refDoc, {
      ...baseData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, isEdit ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteCategoryById(categoryId: string): Promise<void> {
  const currentList = getLocalItem<Category[]>(LOCAL_CATEGORIES_KEY, INITIAL_CATEGORIES);
  setLocalItem(
    LOCAL_CATEGORIES_KEY,
    currentList.filter((c) => c.id !== categoryId)
  );
  if (!auth.currentUser) return;

  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Products CRUD
// ============================================================================

export async function fetchProducts(includeUnpublishedForAdmin = false): Promise<Product[]> {
  const localProducts = getLocalItem<Product[] | null>(LOCAL_PRODUCTS_KEY, null);
  if (localProducts && !auth.currentUser) {
    return includeUnpublishedForAdmin
      ? localProducts
      : localProducts.filter((p) => p.isPublished);
  }
  try {
    const colRef = collection(db, 'products');
    const q = includeUnpublishedForAdmin
      ? query(colRef)
      : query(colRef, where('isPublished', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      const base = localProducts || INITIAL_PRODUCTS;
      return includeUnpublishedForAdmin
        ? base
        : base.filter((p) => p.isPublished);
    }
    return snap.docs.map((d) => {
      const data = d.data();
      const seedProd = INITIAL_PRODUCTS.find((p) => p.id === d.id || p.slug === data.slug);
      const rawImages: string[] = Array.isArray(data.images) ? data.images : [];
      const nonCustomerImages = rawImages.filter(
        (img) => typeof img === 'string' && !img.includes('/assets/aistudio/customar__')
      );
      const cleanImages =
        nonCustomerImages.length > 0
          ? nonCustomerImages
          : seedProd?.images || ['/assets/products/iphone-15-pro.svg'];

      return {
        id: d.id,
        name: data.name,
        slug: data.slug,
        brand: data.brand,
        categoryId: data.categoryId,
        categorySlug: data.categorySlug,
        description: data.description,
        price: Number(data.price),
        compareAtPrice: Number(data.compareAtPrice || data.price),
        condition: data.condition === 'Used' ? 'Used' : 'New',
        sku: data.sku,
        stockQuantity: Number(data.stockQuantity ?? 0),
        images: cleanImages,
        variants: Array.isArray(data.variants) ? data.variants : [],
        specifications: data.specifications || {},
        warrantyInfo: data.warrantyInfo || '',
        isFeatured: Boolean(data.isFeatured),
        isNewArrival: Boolean(data.isNewArrival),
        isBestSeller: Boolean(data.isBestSeller),
        isSpecialOffer: Boolean(data.isSpecialOffer),
        isPublished: Boolean(data.isPublished),
        ratingAvg: Number(data.ratingAvg ?? 5),
        ratingCount: Number(data.ratingCount ?? 0),
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });
  } catch {
    const base = localProducts || INITIAL_PRODUCTS;
    return includeUnpublishedForAdmin
      ? base
      : base.filter((p) => p.isPublished);
  }
}

export async function saveProduct(
  product: Omit<Product, 'createdAt' | 'updatedAt'>,
  isEdit: boolean
): Promise<void> {
  const id = sanitizeId(product.id || `prod-${Date.now()}`);
  const cleanImages = (product.images || [])
    .map((img) => img.trim().slice(0, 600))
    .filter(Boolean)
    .slice(0, 8);
  if (cleanImages.length === 0) {
    cleanImages.push('/assets/products/iphone-15-pro.svg');
  }

  const cleanVariants = (product.variants || [])
    .map((v) => v.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 10);

  const cleanSpecs: Record<string, string> = {};
  Object.entries(product.specifications || {}).slice(0, 20).forEach(([k, v]) => {
    if (v && typeof v === 'string' && v.trim()) {
      cleanSpecs[k.slice(0, 40)] = v.trim().slice(0, 240);
    }
  });

  const nowIso = new Date().toISOString();
  const localProd: Product = {
    id,
    name: product.name.trim().slice(0, 160),
    slug: sanitizeSlug(product.slug || product.name).slice(0, 160),
    brand: product.brand.trim().slice(0, 80),
    categoryId: sanitizeId(product.categoryId),
    categorySlug: sanitizeSlug(product.categorySlug || 'all').slice(0, 80),
    description: product.description.trim().slice(0, 4000),
    price: Math.max(0, Number(product.price)),
    compareAtPrice: Math.max(0, Number(product.compareAtPrice || product.price)),
    condition: product.condition === 'Used' ? 'Used' : 'New',
    sku: product.sku.trim().slice(0, 64),
    stockQuantity: Math.max(0, Math.floor(Number(product.stockQuantity))),
    images: cleanImages,
    variants: cleanVariants,
    specifications: cleanSpecs,
    warrantyInfo: (product.warrantyInfo || '').trim().slice(0, 300),
    isFeatured: Boolean(product.isFeatured),
    isNewArrival: Boolean(product.isNewArrival),
    isBestSeller: Boolean(product.isBestSeller),
    isSpecialOffer: Boolean(product.isSpecialOffer),
    isPublished: Boolean(product.isPublished),
    ratingAvg: Number(product.ratingAvg ?? 5),
    ratingCount: Number(product.ratingCount ?? 1),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const currentList = getLocalItem<Product[]>(LOCAL_PRODUCTS_KEY, INITIAL_PRODUCTS);
  const existsIdx = currentList.findIndex((p) => p.id === id);
  if (existsIdx >= 0) {
    currentList[existsIdx] = { ...currentList[existsIdx], ...localProd, createdAt: currentList[existsIdx].createdAt };
  } else {
    currentList.unshift(localProd);
  }
  setLocalItem(LOCAL_PRODUCTS_KEY, currentList);
  if (!auth.currentUser) return;

  const path = `products/${id}`;
  try {
    // Ensure referenced category exists in Firestore first
    const catRef = doc(db, 'categories', product.categoryId);
    const catSnap = await getDoc(catRef);
    if (!catSnap.exists()) {
      const seedCat = INITIAL_CATEGORIES.find((c) => c.id === product.categoryId) || INITIAL_CATEGORIES[0];
      await setDoc(doc(db, 'categories', seedCat.id), {
        name: seedCat.name,
        slug: seedCat.slug,
        description: seedCat.description,
        imageURL: seedCat.imageURL,
        parentId: seedCat.parentId,
        sortOrder: seedCat.sortOrder,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const baseData = {
      name: localProd.name,
      slug: localProd.slug,
      brand: localProd.brand,
      categoryId: localProd.categoryId,
      categorySlug: localProd.categorySlug,
      description: localProd.description,
      price: localProd.price,
      compareAtPrice: localProd.compareAtPrice,
      condition: localProd.condition,
      sku: localProd.sku,
      stockQuantity: localProd.stockQuantity,
      images: localProd.images,
      variants: localProd.variants,
      specifications: localProd.specifications,
      warrantyInfo: localProd.warrantyInfo,
      isFeatured: localProd.isFeatured,
      isNewArrival: localProd.isNewArrival,
      isBestSeller: localProd.isBestSeller,
      isSpecialOffer: localProd.isSpecialOffer,
      isPublished: localProd.isPublished,
      ratingAvg: localProd.ratingAvg,
      ratingCount: localProd.ratingCount,
      updatedAt: serverTimestamp(),
    };

    const refDoc = doc(db, 'products', id);
    if (isEdit) {
      const existingSnap = await getDoc(refDoc);
      if (existingSnap.exists()) {
        await updateDoc(refDoc, baseData);
        return;
      }
    }
    await setDoc(refDoc, {
      ...baseData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, isEdit ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteProductById(productId: string): Promise<void> {
  const currentList = getLocalItem<Product[]>(LOCAL_PRODUCTS_KEY, INITIAL_PRODUCTS);
  setLocalItem(
    LOCAL_PRODUCTS_KEY,
    currentList.filter((p) => p.id !== productId)
  );
  if (!auth.currentUser) return;

  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Firebase Storage Image Upload
// ============================================================================

export function uploadMediaFile(
  folder: 'products' | 'categories' | 'store' | 'reviews',
  entityId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Only JPG, PNG, and WebP images are permitted.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image size must be under 5MB.'));
      return;
    }

    // If running locally without Firebase Auth token, convert to local Data URL
    if (!auth.currentUser) {
      const reader = new FileReader();
      reader.onload = () => {
        if (onProgress) onProgress(100);
        resolve(String(reader.result || '/assets/products/iphone-15-pro.svg'));
      };
      reader.onerror = () => reject(new Error('Failed to read local image file.'));
      reader.readAsDataURL(file);
      return;
    }

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath =
      folder === 'store' ? `store/${safeName}` : `${folder}/${sanitizeId(entityId)}/${safeName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// ============================================================================
// Secure Order Creation (Atomic Stock & Price Verification Transaction)
// ============================================================================

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  district: string;
  city: string;
  orderNotes: string;
  deliveryMethod: DeliveryMethodType;
  paymentMethod: PaymentMethodType;
  couponCode: string;
  cartItems: CartItem[];
  storeSettings: StoreSettings;
}

export function calculateCouponDiscount(couponCode: string, subtotal: number): number {
  const code = couponCode.trim().toUpperCase();
  if (!code) return 0;
  if (code === 'NOBORUP500' && subtotal >= 10000) return 500;
  if (code === 'MEHERPUR100' && subtotal >= 1500) return 100;
  if (code === 'WELCOME200' && subtotal >= 5000) return 200;
  return 0;
}

export function calculateDeliveryFee(
  method: DeliveryMethodType,
  subtotalAfterDiscount: number,
  settings: StoreSettings
): number {
  if (method === 'Store Pickup (Kedargonj Bazar)') return 0;
  if (subtotalAfterDiscount >= settings.freeDeliveryThreshold) return 0;
  if (method === 'Inside Meherpur') return settings.insideMeherpurFee;
  return settings.outsideMeherpurFee;
}

export async function createVerifiedOrder(input: CreateOrderInput): Promise<Order> {
  const currentUser = getActiveUser();
  if (!currentUser) {
    throw new Error('Please sign in to complete your order.');
  }
  if (input.cartItems.length === 0) {
    throw new Error('Your shopping cart is empty.');
  }

  await seedDatabaseIfNeeded(false);

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const orderNumber = `NBR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const path = `orders/${orderId}`;

  // If running in local dev session without Firebase cloud token, create verified order locally
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    const nowIso = new Date().toISOString();
    let verifiedSubtotal = 0;
    let totalQuantity = 0;
    const summaryParts: string[] = [];
    const items: OrderItem[] = input.cartItems.map((ci, idx) => {
      const qty = Math.max(1, Math.min(20, Math.floor(ci.quantity)));
      const lineTotal = ci.product.price * qty;
      verifiedSubtotal += lineTotal;
      totalQuantity += qty;
      const variantStr = (ci.selectedVariant || ci.product.variants?.[0] || 'Standard').slice(0, 80);
      summaryParts.push(`${qty}x ${ci.product.name} (${variantStr})`);
      return {
        id: `item_${idx + 1}`,
        orderId,
        userId: currentUser.uid,
        productId: ci.product.id,
        productName: ci.product.name,
        productImage: ci.product.images[0] || '/assets/products/iphone-15-pro.svg',
        sku: ci.product.sku,
        selectedVariant: variantStr,
        unitPrice: ci.product.price,
        quantity: qty,
        lineTotal,
        createdAt: nowIso,
      };
    });
    const discount = calculateCouponDiscount(input.couponCode, verifiedSubtotal);
    const deliveryFee = calculateDeliveryFee(
      input.deliveryMethod,
      Math.max(0, verifiedSubtotal - discount),
      input.storeSettings
    );
    const localOrder: Order = {
      id: orderId,
      orderNumber,
      userId: currentUser.uid,
      customerName: input.customerName.trim().slice(0, 120),
      customerPhone: input.customerPhone.trim().slice(0, 30),
      customerEmail: (input.customerEmail || currentUser.email || '').trim().slice(0, 160),
      deliveryAddress: input.deliveryAddress.trim().slice(0, 400),
      district: input.district.trim().slice(0, 80),
      city: input.city.trim().slice(0, 80),
      orderNotes: (input.orderNotes || '').trim().slice(0, 500),
      deliveryMethod: input.deliveryMethod,
      itemCount: totalQuantity,
      itemsSummary: summaryParts.join(' · ').slice(0, 1000),
      subtotal: verifiedSubtotal,
      discount,
      couponCode: (input.couponCode || '').trim().toUpperCase().slice(0, 40),
      deliveryFee,
      total: verifiedSubtotal - discount + deliveryFee,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'Unpaid',
      orderStatus: 'Pending',
      cancellationReason: '',
      createdAt: nowIso,
      updatedAt: nowIso,
      items,
    };
    const existing = getLocalOrders();
    saveLocalOrders([localOrder, ...existing]);
    return localOrder;
  }

  try {
    const createdOrder = await runTransaction(db, async (transaction) => {
      // 1. Read all product docs first inside the transaction
      const productSnaps = await Promise.all(
        input.cartItems.map((ci) => transaction.get(doc(db, 'products', ci.product.id)))
      );

      let verifiedSubtotal = 0;
      let totalQuantity = 0;
      const summaryParts: string[] = [];
      const verifiedItems: Array<{
        productId: string;
        productName: string;
        productImage: string;
        sku: string;
        selectedVariant: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        newStock: number;
      }> = [];

      for (let i = 0; i < input.cartItems.length; i++) {
        const cartItem = input.cartItems[i];
        const snap = productSnaps[i];
        const qty = Math.max(1, Math.min(20, Math.floor(cartItem.quantity)));

        if (!snap.exists()) {
          throw new Error(`Product "${cartItem.product.name}" is no longer available in the database.`);
        }
        const liveData = snap.data();
        if (!liveData.isPublished) {
          throw new Error(`Product "${liveData.name}" is currently unavailable.`);
        }
        const currentStock = Number(liveData.stockQuantity ?? 0);
        if (currentStock < qty) {
          throw new Error(
            `Insufficient stock for "${liveData.name}". Available: ${currentStock}, requested: ${qty}.`
          );
        }

        const livePrice = Number(liveData.price);
        const lineTotal = livePrice * qty;
        verifiedSubtotal += lineTotal;
        totalQuantity += qty;

        const variantStr = (cartItem.selectedVariant || liveData.variants?.[0] || 'Standard').slice(0, 80);
        summaryParts.push(`${qty}x ${liveData.name} (${variantStr})`);

        verifiedItems.push({
          productId: snap.id,
          productName: String(liveData.name).slice(0, 160),
          productImage: String(liveData.images?.[0] || '/assets/products/iphone-15-pro.svg').slice(0, 600),
          sku: String(liveData.sku || 'NBR-SKU').slice(0, 64),
          selectedVariant: variantStr,
          unitPrice: livePrice,
          quantity: qty,
          lineTotal,
          newStock: currentStock - qty,
        });
      }

      const discount = calculateCouponDiscount(input.couponCode, verifiedSubtotal);
      const deliveryFee = calculateDeliveryFee(
        input.deliveryMethod,
        Math.max(0, verifiedSubtotal - discount),
        input.storeSettings
      );
      const finalTotal = verifiedSubtotal - discount + deliveryFee;
      const itemsSummary = summaryParts.join(' · ').slice(0, 1000);

      // 2. Decrement product inventory atomically
      for (const item of verifiedItems) {
        transaction.update(doc(db, 'products', item.productId), {
          stockQuantity: item.newStock,
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Create Order header document
      const orderRef = doc(db, 'orders', orderId);
      const orderDocData = {
        orderNumber,
        userId: currentUser.uid,
        customerName: input.customerName.trim().slice(0, 120),
        customerPhone: input.customerPhone.trim().slice(0, 30),
        customerEmail: (input.customerEmail || currentUser.email || '').trim().slice(0, 160),
        deliveryAddress: input.deliveryAddress.trim().slice(0, 400),
        district: input.district.trim().slice(0, 80),
        city: input.city.trim().slice(0, 80),
        orderNotes: (input.orderNotes || '').trim().slice(0, 500),
        deliveryMethod: input.deliveryMethod,
        itemCount: totalQuantity,
        itemsSummary,
        subtotal: verifiedSubtotal,
        discount,
        couponCode: (input.couponCode || '').trim().toUpperCase().slice(0, 40),
        deliveryFee,
        total: finalTotal,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'Unpaid' as PaymentStatusType,
        orderStatus: 'Pending' as OrderStatusType,
        cancellationReason: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(orderRef, orderDocData);

      const nowIso = new Date().toISOString();
      return {
        id: orderId,
        ...orderDocData,
        createdAt: nowIso,
        updatedAt: nowIso,
        items: verifiedItems.map((vi, idx) => ({
          id: `item_${idx + 1}`,
          orderId,
          userId: currentUser.uid,
          productId: vi.productId,
          productName: vi.productName,
          productImage: vi.productImage,
          sku: vi.sku,
          selectedVariant: vi.selectedVariant,
          unitPrice: vi.unitPrice,
          quantity: vi.quantity,
          lineTotal: vi.lineTotal,
          createdAt: nowIso,
        })),
      } as Order;
    });

    // 4. Write OrderItem subcollection snapshots (/orders/{orderId}/items/{itemId})
    if (createdOrder.items) {
      for (const item of createdOrder.items) {
        await setDoc(doc(db, 'orders', orderId, 'items', item.id), {
          orderId,
          userId: currentUser.uid,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          sku: item.sku,
          selectedVariant: item.selectedVariant,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          createdAt: serverTimestamp(),
        });
      }
    }

    return createdOrder;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Missing or insufficient permissions')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  const localOrders = getLocalOrders().filter((o) => o.userId === userId);
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    return localOrders;
  }
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const orders: Order[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderNumber: data.orderNumber,
        userId: data.userId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || '',
        deliveryAddress: data.deliveryAddress,
        district: data.district,
        city: data.city,
        orderNotes: data.orderNotes || '',
        deliveryMethod: data.deliveryMethod,
        itemCount: Number(data.itemCount || 1),
        itemsSummary: data.itemsSummary || '',
        subtotal: Number(data.subtotal || 0),
        discount: Number(data.discount || 0),
        couponCode: data.couponCode || '',
        deliveryFee: Number(data.deliveryFee || 0),
        total: Number(data.total || 0),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        orderStatus: data.orderStatus,
        cancellationReason: data.cancellationReason || '',
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });
    return [...localOrders, ...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return localOrders;
  }
}

export async function fetchAllOrdersForAdmin(): Promise<Order[]> {
  const localOrders = getLocalOrders();
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    return localOrders;
  }
  try {
    const snap = await getDocs(collection(db, 'orders'));
    const orders: Order[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderNumber: data.orderNumber,
        userId: data.userId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || '',
        deliveryAddress: data.deliveryAddress,
        district: data.district,
        city: data.city,
        orderNotes: data.orderNotes || '',
        deliveryMethod: data.deliveryMethod,
        itemCount: Number(data.itemCount || 1),
        itemsSummary: data.itemsSummary || '',
        subtotal: Number(data.subtotal || 0),
        discount: Number(data.discount || 0),
        couponCode: data.couponCode || '',
        deliveryFee: Number(data.deliveryFee || 0),
        total: Number(data.total || 0),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        orderStatus: data.orderStatus,
        cancellationReason: data.cancellationReason || '',
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });
    return [...localOrders, ...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return localOrders;
  }
}

export async function fetchOrderItems(orderId: string, userId?: string, isAdminUser = false): Promise<OrderItem[]> {
  const localMatch = getLocalOrders().find((o) => o.id === orderId);
  if (localMatch?.items) {
    return localMatch.items;
  }
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    return [];
  }
  try {
    const itemsCol = collection(db, 'orders', orderId, 'items');
    const q = isAdminUser || !userId ? query(itemsCol) : query(itemsCol, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderId: data.orderId,
        userId: data.userId,
        productId: data.productId,
        productName: data.productName,
        productImage: data.productImage,
        sku: data.sku,
        selectedVariant: data.selectedVariant,
        unitPrice: Number(data.unitPrice),
        quantity: Number(data.quantity),
        lineTotal: Number(data.lineTotal),
        createdAt: formatTimestamp(data.createdAt),
      };
    });
  } catch {
    return [];
  }
}

export async function updateOrderByAdmin(
  orderId: string,
  orderStatus: OrderStatusType,
  paymentStatus: PaymentStatusType,
  cancellationReason = ''
): Promise<void> {
  const localOrders = getLocalOrders();
  if (localOrders.some((o) => o.id === orderId) || !auth.currentUser) {
    saveLocalOrders(
      localOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus,
              paymentStatus,
              cancellationReason: cancellationReason.trim().slice(0, 300),
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    if (!auth.currentUser) return;
  }
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus,
      paymentStatus,
      cancellationReason: cancellationReason.trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelPendingOrderByCustomer(orderId: string, reason: string): Promise<void> {
  const localOrders = getLocalOrders();
  if (localOrders.some((o) => o.id === orderId) || !auth.currentUser) {
    saveLocalOrders(
      localOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'Cancelled',
              cancellationReason: reason.trim().slice(0, 300) || 'Cancelled by customer',
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    if (!auth.currentUser) return;
  }
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: 'Cancelled',
      cancellationReason: reason.trim().slice(0, 300) || 'Cancelled by customer',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// Reviews & Moderation
// ============================================================================

export async function fetchReviews(includeUnmoderatedForAdmin = false): Promise<Review[]> {
  const localReviews = getLocalItem<Review[] | null>(LOCAL_REVIEWS_KEY, null);
  if (localReviews && !auth.currentUser) {
    return includeUnmoderatedForAdmin
      ? localReviews
      : localReviews.filter((r) => r.status === 'approved');
  }
  try {
    const colRef = collection(db, 'reviews');
    const q = includeUnmoderatedForAdmin
      ? query(colRef)
      : query(colRef, where('status', '==', 'approved'));
    const snap = await getDocs(q);
    if (snap.empty) {
      const base = localReviews || INITIAL_REVIEWS;
      return includeUnmoderatedForAdmin ? base : base.filter((r) => r.status === 'approved');
    }
    const list: Review[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        customerName: data.customerName,
        productId: data.productId,
        productName: data.productName,
        orderId: data.orderId || '',
        rating: Number(data.rating || 5),
        comment: data.comment,
        imageURL: data.imageURL || '',
        verifiedPurchase: Boolean(data.verifiedPurchase),
        status: data.status,
        adminReply: data.adminReply || '',
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    const base = localReviews || INITIAL_REVIEWS;
    return includeUnmoderatedForAdmin ? base : base.filter((r) => r.status === 'approved');
  }
}

export async function submitCustomerReview(input: {
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  imageURL?: string;
  orderId?: string;
}): Promise<void> {
  const user = getActiveUser();
  if (!user) throw new Error('Please sign in to submit a review.');

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();
  const localReview: Review = {
    id: reviewId,
    userId: user.uid,
    customerName: (user.displayName || user.email?.split('@')[0] || 'Valued Customer').slice(0, 100),
    productId: sanitizeId(input.productId),
    productName: input.productName.trim().slice(0, 160),
    orderId: (input.orderId || '').trim().slice(0, 128),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    comment: input.comment.trim().slice(0, 1200),
    imageURL: (input.imageURL || '').trim().slice(0, 600),
    verifiedPurchase: false,
    status: 'pending',
    adminReply: '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const currentReviews = getLocalItem<Review[]>(LOCAL_REVIEWS_KEY, INITIAL_REVIEWS);
  setLocalItem(LOCAL_REVIEWS_KEY, [localReview, ...currentReviews]);
  if (!auth.currentUser) return;

  await seedDatabaseIfNeeded(false);
  const path = `reviews/${reviewId}`;
  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      userId: localReview.userId,
      customerName: localReview.customerName,
      productId: localReview.productId,
      productName: localReview.productName,
      orderId: localReview.orderId,
      rating: localReview.rating,
      comment: localReview.comment,
      imageURL: localReview.imageURL,
      verifiedPurchase: false,
      status: 'pending',
      adminReply: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function moderateReviewByAdmin(
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected',
  verifiedPurchase: boolean,
  adminReply: string
): Promise<void> {
  const currentReviews = getLocalItem<Review[]>(LOCAL_REVIEWS_KEY, INITIAL_REVIEWS);
  setLocalItem(
    LOCAL_REVIEWS_KEY,
    currentReviews.map((r) =>
      r.id === reviewId
        ? {
            ...r,
            status,
            verifiedPurchase: Boolean(verifiedPurchase),
            adminReply: adminReply.trim().slice(0, 600),
            updatedAt: new Date().toISOString(),
          }
        : r
    )
  );
  if (!auth.currentUser) return;

  const path = `reviews/${reviewId}`;
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      status,
      verifiedPurchase: Boolean(verifiedPurchase),
      adminReply: adminReply.trim().slice(0, 600),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReviewById(reviewId: string): Promise<void> {
  const currentReviews = getLocalItem<Review[]>(LOCAL_REVIEWS_KEY, INITIAL_REVIEWS);
  setLocalItem(
    LOCAL_REVIEWS_KEY,
    currentReviews.filter((r) => r.id !== reviewId)
  );
  if (!auth.currentUser) return;

  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Social Videos Management
// ============================================================================

export async function fetchVideos(includeUnpublishedForAdmin = false): Promise<SocialVideo[]> {
  const normalizeVideos = (videos: SocialVideo[]): SocialVideo[] =>
    videos.map((v, idx) => {
      const seedMatch =
        INITIAL_VIDEOS.find((sv) => sv.id === v.id) ||
        INITIAL_VIDEOS[idx % INITIAL_VIDEOS.length];
      const isSeedId = v.id === 'vid-1' || v.id === 'vid-2' || v.id === 'vid-3' || v.id === 'vid-4';
      const isPlaceholderUrl =
        !v.videoURL ||
        !v.videoURL.includes('facebook.com/reel/') ||
        v.videoURL === 'https://www.facebook.com/reel/';
      const hasLegacyPhoneText =
        Boolean(v.thumbnailURL && v.thumbnailURL.includes('/assets/products/')) ||
        /Samsung|Realme|Fantech|Motorola|iPhone|POCO|Vivo/i.test(v.title || '');

      if (isSeedId || isPlaceholderUrl || hasLegacyPhoneText) {
        return {
          ...v,
          platform: 'Facebook Reel',
          videoURL: isPlaceholderUrl || isSeedId ? seedMatch.videoURL : v.videoURL,
          thumbnailURL:
            !v.thumbnailURL || v.thumbnailURL.includes('/assets/products/')
              ? seedMatch.thumbnailURL
              : v.thumbnailURL,
          title: seedMatch.title,
          productId: '',
        };
      }

      return {
        ...v,
        platform: 'Facebook Reel',
        productId: '',
      };
    });

  const localVideos = getLocalItem<SocialVideo[] | null>(LOCAL_VIDEOS_KEY, null);
  if (localVideos && !auth.currentUser) {
    const cleanLocal = normalizeVideos(localVideos);
    return includeUnpublishedForAdmin ? cleanLocal : cleanLocal.filter((v) => v.isPublished);
  }
  try {
    const colRef = collection(db, 'videos');
    const q = includeUnpublishedForAdmin
      ? query(colRef)
      : query(colRef, where('isPublished', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      const base = normalizeVideos(localVideos || INITIAL_VIDEOS);
      return includeUnpublishedForAdmin ? base : base.filter((v) => v.isPublished);
    }
    const list: SocialVideo[] = normalizeVideos(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          platform: data.platform,
          videoURL: data.videoURL,
          thumbnailURL: data.thumbnailURL,
          productId: data.productId || '',
          sortOrder: Number(data.sortOrder ?? 1),
          isPublished: Boolean(data.isPublished),
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      })
    );
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    const base = normalizeVideos(localVideos || INITIAL_VIDEOS);
    return includeUnpublishedForAdmin ? base : base.filter((v) => v.isPublished);
  }
}

export async function saveSocialVideo(
  video: Omit<SocialVideo, 'createdAt' | 'updatedAt'>,
  isEdit: boolean
): Promise<void> {
  const id = sanitizeId(video.id || `vid-${Date.now()}`);
  const nowIso = new Date().toISOString();
  const localVid: SocialVideo = {
    id,
    title: video.title.trim().slice(0, 160),
    platform: video.platform,
    videoURL: video.videoURL.trim().slice(0, 600),
    thumbnailURL: video.thumbnailURL.trim().slice(0, 600),
    productId: (video.productId || '').trim().slice(0, 128),
    sortOrder: Number(video.sortOrder || 1),
    isPublished: Boolean(video.isPublished),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const currentVideos = getLocalItem<SocialVideo[]>(LOCAL_VIDEOS_KEY, INITIAL_VIDEOS);
  const existsIdx = currentVideos.findIndex((v) => v.id === id);
  if (existsIdx >= 0) {
    currentVideos[existsIdx] = { ...currentVideos[existsIdx], ...localVid };
  } else {
    currentVideos.push(localVid);
  }
  setLocalItem(LOCAL_VIDEOS_KEY, currentVideos);
  if (!auth.currentUser) return;

  const path = `videos/${id}`;
  try {
    const baseData = {
      title: localVid.title,
      platform: localVid.platform,
      videoURL: localVid.videoURL,
      thumbnailURL: localVid.thumbnailURL,
      productId: localVid.productId,
      sortOrder: localVid.sortOrder,
      isPublished: localVid.isPublished,
      updatedAt: serverTimestamp(),
    };
    const refDoc = doc(db, 'videos', id);
    if (isEdit) {
      const existingSnap = await getDoc(refDoc);
      if (existingSnap.exists()) {
        await updateDoc(refDoc, baseData);
        return;
      }
    }
    await setDoc(refDoc, {
      ...baseData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, isEdit ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteSocialVideoById(videoId: string): Promise<void> {
  const currentVideos = getLocalItem<SocialVideo[]>(LOCAL_VIDEOS_KEY, INITIAL_VIDEOS);
  setLocalItem(
    LOCAL_VIDEOS_KEY,
    currentVideos.filter((v) => v.id !== videoId)
  );
  if (!auth.currentUser) return;

  const path = `videos/${videoId}`;
  try {
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Wishlists
// ============================================================================

export async function fetchUserWishlist(userId: string): Promise<string[]> {
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, 'wishlists'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => String(d.data().productId));
  } catch {
    return [];
  }
}

export async function addWishlistItemToFirestore(userId: string, productId: string): Promise<void> {
  if (!auth.currentUser) return;
  const docId = sanitizeId(`${userId}_${productId}`);
  const path = `wishlists/${docId}`;
  try {
    await seedDatabaseIfNeeded(false);
    await setDoc(doc(db, 'wishlists', docId), {
      userId,
      productId: sanitizeId(productId),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeWishlistItemFromFirestore(userId: string, productId: string): Promise<void> {
  if (!auth.currentUser) return;
  const docId = sanitizeId(`${userId}_${productId}`);
  const path = `wishlists/${docId}`;
  try {
    await deleteDoc(doc(db, 'wishlists', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Mobile Servicing & Repair Bookings
// ============================================================================

export async function createServiceBooking(input: {
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  serviceType: string;
  issueDescription: string;
  preferredDate: string;
}): Promise<void> {
  const user = getActiveUser();
  if (!user) throw new Error('Please sign in to book a mobile servicing appointment.');
  const bookingId = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();
  const localBooking: ServiceBooking = {
    id: bookingId,
    userId: user.uid,
    customerName: input.customerName.trim().slice(0, 120),
    customerPhone: input.customerPhone.trim().slice(0, 30),
    deviceModel: input.deviceModel.trim().slice(0, 120),
    serviceType: input.serviceType.trim().slice(0, 100),
    issueDescription: input.issueDescription.trim().slice(0, 800),
    preferredDate: input.preferredDate.trim().slice(0, 40),
    status: 'Pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const currentBookings = getLocalItem<ServiceBooking[]>(LOCAL_BOOKINGS_KEY, []);
  setLocalItem(LOCAL_BOOKINGS_KEY, [localBooking, ...currentBookings]);
  if (!auth.currentUser) return;

  const path = `serviceBookings/${bookingId}`;
  try {
    await setDoc(doc(db, 'serviceBookings', bookingId), {
      userId: localBooking.userId,
      customerName: localBooking.customerName,
      customerPhone: localBooking.customerPhone,
      deviceModel: localBooking.deviceModel,
      serviceType: localBooking.serviceType,
      issueDescription: localBooking.issueDescription,
      preferredDate: localBooking.preferredDate,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchServiceBookings(userId?: string, isAdminUser = false): Promise<ServiceBooking[]> {
  const localBookings = getLocalItem<ServiceBooking[]>(LOCAL_BOOKINGS_KEY, []);
  const filteredLocal = isAdminUser
    ? localBookings
    : localBookings.filter((b) => b.userId === userId);
  if (!auth.currentUser) {
    return filteredLocal;
  }
  try {
    const colRef = collection(db, 'serviceBookings');
    const q = isAdminUser ? query(colRef) : query(colRef, where('userId', '==', userId || ''));
    const snap = await getDocs(q);
    const list: ServiceBooking[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deviceModel: data.deviceModel,
        serviceType: data.serviceType,
        issueDescription: data.issueDescription,
        preferredDate: data.preferredDate,
        status: data.status,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });
    return [...filteredLocal, ...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return filteredLocal;
  }
}

export async function updateServiceBookingStatus(
  bookingId: string,
  status: ServiceBooking['status']
): Promise<void> {
  const currentBookings = getLocalItem<ServiceBooking[]>(LOCAL_BOOKINGS_KEY, []);
  if (currentBookings.some((b) => b.id === bookingId) || !auth.currentUser) {
    setLocalItem(
      LOCAL_BOOKINGS_KEY,
      currentBookings.map((b) =>
        b.id === bookingId ? { ...b, status, updatedAt: new Date().toISOString() } : b
      )
    );
    if (!auth.currentUser) return;
  }

  const path = `serviceBookings/${bookingId}`;
  try {
    await updateDoc(doc(db, 'serviceBookings', bookingId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// User Public & Split Private PII Profile
// ============================================================================

export async function syncUserProfileOnAuth(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}): Promise<{ publicProfile: UserPublicProfile | null; privateInfo: UserPrivateInfo | null }> {
  if (!user.emailVerified || !auth.currentUser) {
    return { publicProfile: null, privateInfo: null };
  }
  const pubRef = doc(db, 'users', user.uid);
  const privRef = doc(db, 'users', user.uid, 'private', 'info');

  try {
    const pubSnap = await getDoc(pubRef);
    if (!pubSnap.exists()) {
      await setDoc(pubRef, {
        uid: user.uid,
        displayName: (user.displayName || user.email?.split('@')[0] || 'Noborup Customer').slice(0, 100),
        photoURL: (user.photoURL || '').slice(0, 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (user.photoURL && !pubSnap.data()?.photoURL) {
      await updateDoc(pubRef, {
        photoURL: user.photoURL.slice(0, 500),
        updatedAt: serverTimestamp(),
      });
    }

    const privSnap = await getDoc(privRef);
    if (!privSnap.exists()) {
      await setDoc(privRef, {
        uid: user.uid,
        email: (user.email || '').slice(0, 160),
        phone: '',
        address: '',
        district: 'Meherpur',
        city: 'Mujibnagar',
        updatedAt: serverTimestamp(),
      });
    }

    const [updatedPub, updatedPriv] = await Promise.all([getDoc(pubRef), getDoc(privRef)]);
    const pubData = updatedPub.data();
    const privData = updatedPriv.data();

    return {
      publicProfile: pubData
        ? {
            uid: pubData.uid,
            displayName: pubData.displayName,
            photoURL: pubData.photoURL,
            createdAt: formatTimestamp(pubData.createdAt),
            updatedAt: formatTimestamp(pubData.updatedAt),
          }
        : null,
      privateInfo: privData
        ? {
            uid: privData.uid,
            email: privData.email,
            phone: privData.phone,
            address: privData.address,
            district: privData.district,
            city: privData.city,
            updatedAt: formatTimestamp(privData.updatedAt),
          }
        : null,
    };
  } catch {
    return { publicProfile: null, privateInfo: null };
  }
}

export async function updateUserProfileData(
  uid: string,
  input: {
    displayName: string;
    photoURL: string;
    email: string;
    phone: string;
    address: string;
    district: string;
    city: string;
  }
): Promise<void> {
  if (!auth.currentUser) return;
  const pubPath = `users/${uid}`;
  const privPath = `users/${uid}/private/info`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: input.displayName.trim().slice(0, 100),
      photoURL: input.photoURL.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pubPath);
  }

  try {
    await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
      email: input.email.trim().slice(0, 160),
      phone: input.phone.trim().slice(0, 30),
      address: input.address.trim().slice(0, 400),
      district: input.district.trim().slice(0, 80),
      city: input.city.trim().slice(0, 80),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, privPath);
  }
}
