export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface UserPublicProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageURL: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSpecifications {
  storage?: string;
  ram?: string;
  display?: string;
  processor?: string;
  camera?: string;
  battery?: string;
  // Used phone specific fields
  batteryHealth?: string;
  cosmeticCondition?: string;
  repairHistory?: string;
  includedAccessories?: string;
  warrantyStatus?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categorySlug: string;
  description: string;
  price: number;
  compareAtPrice: number;
  condition: 'New' | 'Used';
  sku: string;
  stockQuantity: number;
  images: string[];
  variants: string[];
  specifications: ProductSpecifications;
  warrantyInfo: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isSpecialOffer: boolean;
  isPublished: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant: string;
}

export type DeliveryMethodType =
  | 'Inside Meherpur'
  | 'Outside Meherpur (Courier)'
  | 'Store Pickup (Kedargonj Bazar)';

export type PaymentMethodType =
  | 'Cash on Delivery'
  | 'bKash / Nagad Verification at Delivery';

export type OrderStatusType =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export type PaymentStatusType = 'Unpaid' | 'Paid' | 'Refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  selectedVariant: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  district: string;
  city: string;
  orderNotes: string;
  deliveryMethod: DeliveryMethodType;
  itemCount: number;
  itemsSummary: string;
  subtotal: number;
  discount: number;
  couponCode: string;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  orderStatus: OrderStatusType;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface Review {
  id: string;
  userId: string;
  customerName: string;
  productId: string;
  productName: string;
  orderId: string;
  rating: number;
  comment: string;
  imageURL: string;
  verifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminReply: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialVideo {
  id: string;
  title: string;
  platform: 'Facebook Reel' | 'YouTube Short' | 'TikTok';
  videoURL: string;
  thumbnailURL: string;
  productId: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface ServiceBooking {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  serviceType: string;
  issueDescription: string;
  preferredDate: string;
  status: 'Pending' | 'Confirmed' | 'In Repair' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  logoURL: string;
  announcementText: string;
  heroHeadline: string;
  heroSubtext: string;
  contactPhone: string;
  secondaryPhone: string;
  whatsappNumber: string;
  contactEmail: string;
  address: string;
  openingHours: string;
  facebookURL: string;
  instagramURL?: string;
  youtubeURL: string;
  tiktokURL: string;
  insideMeherpurFee: number;
  outsideMeherpurFee: number;
  freeDeliveryThreshold: number;
  shippingPolicy: string;
  returnPolicy: string;
  warrantyPolicy: string;
  updatedAt?: string;
}
