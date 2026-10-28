import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  Edit3,
  Eye,
  FolderKanban,
  Layers,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
  Video,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  deleteCategoryById,
  deleteProductById,
  deleteReviewById,
  deleteSocialVideoById,
  fetchAllOrdersForAdmin,
  fetchOrderItems,
  fetchServiceBookings,
  moderateReviewByAdmin,
  saveCategory,
  saveProduct,
  saveSocialVideo,
  seedDatabaseIfNeeded,
  updateOrderByAdmin,
  updateServiceBookingStatus,
  updateStoreSettings,
  uploadMediaFile,
} from '../services/firestoreService';
import {
  Category,
  Order,
  OrderItem,
  OrderStatusType,
  PaymentStatusType,
  Product,
  Review,
  ServiceBooking,
  SocialVideo,
  StoreSettings,
} from '../types';
import { formatBdt } from '../utils/seedData';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'reviews'
  | 'videos'
  | 'services'
  | 'settings';

const EMPTY_PRODUCT: Omit<Product, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  slug: '',
  brand: 'Apple',
  categoryId: 'cat-iphone',
  categorySlug: 'iphone',
  description: '',
  price: 0,
  compareAtPrice: 0,
  condition: 'New',
  sku: 'NBR-',
  stockQuantity: 5,
  images: ['/assets/products/iphone-15-pro.svg'],
  variants: ['Standard'],
  specifications: {
    storage: '128GB',
    ram: '8GB',
    display: '6.1" OLED',
    processor: '',
    camera: '',
    battery: '',
    batteryHealth: '',
    cosmeticCondition: '',
    repairHistory: '',
    includedAccessories: '',
    warrantyStatus: '',
  },
  warrantyInfo: '1 Year Official / Noborup Service Warranty',
  isFeatured: true,
  isNewArrival: true,
  isBestSeller: false,
  isSpecialOffer: false,
  isPublished: true,
  ratingAvg: 5,
  ratingCount: 1,
};

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, publicProfile } = useAuth();
  const {
    products,
    categories,
    reviews,
    videos,
    storeSettings,
    refreshStoreData,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Product Form Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Omit<Product, 'createdAt' | 'updatedAt'>>(
    EMPTY_PRODUCT
  );
  const [isProductEditMode, setIsProductEditMode] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [uploadingPct, setUploadingPct] = useState<number | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);

  // Category Form State
  const [editingCategory, setEditingCategory] = useState<Omit<Category, 'createdAt' | 'updatedAt'>>({
    id: '',
    name: '',
    slug: '',
    description: '',
    imageURL: '/assets/products/iphone-15-pro.svg',
    parentId: '',
    sortOrder: 1,
    isActive: true,
  });
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);

  // Orders Filter & Expanded Item Map
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);

  // Video Form State
  const [editingVideo, setEditingVideo] = useState<Omit<SocialVideo, 'createdAt' | 'updatedAt'>>({
    id: '',
    title: '',
    platform: 'Facebook Reel',
    videoURL: 'https://www.facebook.com',
    thumbnailURL: '/assets/aistudio/customar__3__3344412c.jpg',
    productId: '',
    sortOrder: 1,
    isPublished: true,
  });
  const [isVideoEditMode, setIsVideoEditMode] = useState(false);

  // Store Settings Form State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setSettingsForm(storeSettings);
  }, [storeSettings]);

  const loadAdminRecords = async () => {
    if (!isAdmin) return;
    setLoadingAdminData(true);
    try {
      const [allOrders, allBookings] = await Promise.all([
        fetchAllOrdersForAdmin(),
        fetchServiceBookings(undefined, true),
      ]);
      setOrders(allOrders);
      setServiceBookings(allBookings);
    } catch {
      // Handled gracefully
    } finally {
      setLoadingAdminData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminRecords();
    }
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF8618] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
        <AlertTriangle className="w-12 h-12 text-[#FF8618] mb-3" />
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Restricted Administrator Area
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mb-6">
          Please sign in with an authorized Noborup administrator account to access inventory, order
          fulfillment, and store settings.
        </p>
        <Link
          to="/admin-login"
          className="px-6 py-3 rounded-xl bg-[#FF8618] text-white font-semibold text-xs"
        >
          Go to Admin Login Portal
        </Link>
      </div>
    );
  }

  // Overview Metrics Calculation (Excludes Cancelled & Refunded from revenue)
  const validRevenueOrders = orders.filter(
    (o) => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Refunded'
  );
  const totalSalesRevenue = validRevenueOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Pending').length;
  const completedOrdersCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= 3);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      await seedDatabaseIfNeeded(true);
      await refreshStoreData();
      await loadAdminRecords();
      showToast('Firestore catalog, categories, reviews, videos, and settings synced!');
    } catch {
      showToast('Failed to seed database.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleExportOrdersCsv = () => {
    const headers = [
      'OrderNumber',
      'Date',
      'CustomerName',
      'Phone',
      'District',
      'City',
      'TotalBDT',
      'PaymentMethod',
      'PaymentStatus',
      'OrderStatus',
      'Items',
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.createdAt,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerPhone,
      o.district,
      o.city,
      o.total,
      `"${o.paymentMethod}"`,
      o.paymentStatus,
      o.orderStatus,
      `"${o.itemsSummary.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `noborup-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Orders exported to CSV!');
  };

  // Product Handlers
  const handleOpenCreateProduct = () => {
    setEditingProduct({
      ...EMPTY_PRODUCT,
      id: `prod-${Date.now()}`,
      sku: `NBR-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsProductEditMode(false);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsProductEditMode(true);
    setProductModalOpen(true);
  };

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPct(1);
    try {
      const downloadUrl = await uploadMediaFile(
        'products',
        editingProduct.id || `prod-${Date.now()}`,
        file,
        (pct) => setUploadingPct(pct)
      );
      setEditingProduct((prev) => ({
        ...prev,
        images: [downloadUrl, ...prev.images.filter(Boolean)].slice(0, 8),
      }));
      showToast('Product image uploaded to Firebase Storage!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload failed.', 'error');
    } finally {
      setUploadingPct(null);
    }
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const matchedCat = categories.find((c) => c.id === editingProduct.categoryId);
      await saveProduct(
        {
          ...editingProduct,
          categorySlug: matchedCat?.slug || editingProduct.categorySlug || 'all',
        },
        isProductEditMode
      );
      setProductModalOpen(false);
      await refreshStoreData();
      showToast(isProductEditMode ? 'Product updated in Firestore!' : 'New product published!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save product.', 'error');
    }
  };

  const handleConfirmDeleteProduct = async (id: string) => {
    try {
      await deleteProductById(id);
      setConfirmDeleteProductId(null);
      await refreshStoreData();
      showToast('Product deleted from catalog.', 'info');
    } catch {
      showToast('Could not delete product.', 'error');
    }
  };

  // Category Handlers
  const handleSaveCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCategory(editingCategory, isCategoryEditMode);
      setEditingCategory({
        id: '',
        name: '',
        slug: '',
        description: '',
        imageURL: '/assets/products/iphone-15-pro.svg',
        parentId: '',
        sortOrder: categories.length + 1,
        isActive: true,
      });
      setIsCategoryEditMode(false);
      await refreshStoreData();
      showToast('Category saved to Firestore!');
    } catch {
      showToast('Could not save category.', 'error');
    }
  };

  // Order Handlers
  const handleSelectOrder = async (ord: Order) => {
    setSelectedOrder(ord);
    try {
      const items = await fetchOrderItems(ord.id, ord.userId, true);
      setSelectedOrderItems(items);
    } catch {
      setSelectedOrderItems([]);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newOrderStatus: OrderStatusType,
    newPaymentStatus: PaymentStatusType,
    reason: string
  ) => {
    try {
      await updateOrderByAdmin(orderId, newOrderStatus, newPaymentStatus, reason);
      showToast(`Order updated to ${newOrderStatus} (${newPaymentStatus})`);
      await loadAdminRecords();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: newOrderStatus,
          paymentStatus: newPaymentStatus,
          cancellationReason: reason,
        });
      }
    } catch {
      showToast('Failed to update order status.', 'error');
    }
  };

  // Video Handlers
  const handleSaveVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSocialVideo(editingVideo, isVideoEditMode);
      setEditingVideo({
        id: '',
        title: '',
        platform: 'Facebook Reel',
        videoURL: 'https://www.facebook.com',
        thumbnailURL: '/assets/aistudio/customar__3__3344412c.jpg',
        productId: '',
        sortOrder: videos.length + 1,
        isPublished: true,
      });
      setIsVideoEditMode(false);
      await refreshStoreData();
      showToast('Social video saved!');
    } catch {
      showToast('Failed to save social video.', 'error');
    }
  };

  // Store Settings Handlers
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateStoreSettings(settingsForm);
      await refreshStoreData();
      showToast('Store settings updated in Firestore!');
    } catch {
      showToast('Failed to update store settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.orderStatus === orderStatusFilter;
    const matchesQuery =
      !orderSearch.trim() ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Admin Bar */}
        <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {publicProfile?.photoURL || user.photoURL ? (
              <img
                src={publicProfile?.photoURL || user.photoURL || ''}
                alt={publicProfile?.displayName || user.displayName || 'Admin'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border border-[#FF8618]/40 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#FF8618]/15 text-[#FF8618] font-display font-bold text-lg flex items-center justify-center shrink-0">
                {(publicProfile?.displayName || user.displayName || user.email || 'A')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#FF8618]/15 text-[#FF8618] font-mono text-xs font-semibold">
                  NOBORUP ADMIN
                </span>
                <span className="text-xs text-stone-500 font-mono">{user.email}</span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                Store Management &amp; Operations Console
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[#FF8618] text-xs font-semibold text-stone-800 dark:text-stone-200 transition"
            >
              <Database className="w-3.5 h-3.5 text-[#FF8618]" />
              {seeding ? 'Syncing Firestore...' : 'Sync / Seed Firestore Catalog'}
            </button>
            <button
              onClick={handleExportOrdersCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[#FF8618] text-xs font-semibold text-stone-800 dark:text-stone-200 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              Export Orders CSV
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {(
            [
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: `Products (${products.length})`, icon: Package },
              { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
              { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
              { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
              { id: 'videos', label: `Reels & Videos (${videos.length})`, icon: Video },
              {
                id: 'services',
                label: `Repairs (${serviceBookings.length})`,
                icon: Wrench,
              },
              { id: 'settings', label: 'Store Settings', icon: Settings },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-[#FF8618] text-white shadow-xs'
                    : 'bg-white dark:bg-[#1B1D1C] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:border-[#FF8618]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-[#1B1D1C] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">Net Sales Revenue</p>
                <p className="font-mono text-2xl font-bold text-[#FF8618] mt-1">
                  {formatBdt(totalSalesRevenue)}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Excludes cancelled & refunded
                </p>
              </div>
              <div className="bg-white dark:bg-[#1B1D1C] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">Total Orders</p>
                <p className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {orders.length}
                </p>
                <p className="text-[11px] text-amber-500 mt-1">
                  {pendingOrdersCount} awaiting confirmation
                </p>
              </div>
              <div className="bg-white dark:bg-[#1B1D1C] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">Completed Orders</p>
                <p className="font-mono text-2xl font-bold text-emerald-500 mt-1">
                  {completedOrdersCount}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Delivered to customers</p>
              </div>
              <div className="bg-white dark:bg-[#1B1D1C] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">Catalog Products</p>
                <p className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {products.length}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {products.filter((p) => p.condition === 'Used').length} Pre-owned devices
                </p>
              </div>
              <div className="bg-white dark:bg-[#1B1D1C] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 sm:col-span-2 md:col-span-1">
                <p className="text-xs text-stone-500 dark:text-stone-400">Low-Stock Alerts</p>
                <p className="font-mono text-2xl font-bold text-amber-500 mt-1">
                  {lowStockProducts.length}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Items with ≤ 3 units left</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recent Orders */}
              <div className="lg:col-span-8 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    Recent Customer Orders
                  </h2>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#FF8618] hover:underline"
                  >
                    Manage All Orders →
                  </button>
                </div>
                {orders.length === 0 ? (
                  <p className="text-xs text-stone-500 py-8 text-center">
                    No customer orders recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500">
                          <th className="py-2.5 pr-3">Order #</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Total</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 pl-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800">
                        {orders.slice(0, 6).map((ord) => (
                          <tr key={ord.id}>
                            <td className="py-3 pr-3 font-mono font-bold text-[#FF8618]">
                              {ord.orderNumber}
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-medium text-stone-900 dark:text-stone-100">
                                {ord.customerName}
                              </p>
                              <p className="text-[11px] font-mono text-stone-500">
                                {ord.customerPhone}
                              </p>
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-stone-900 dark:text-stone-100">
                              {formatBdt(ord.total)}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 font-semibold">
                                {ord.orderStatus}
                              </span>
                            </td>
                            <td className="py-3 pl-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveTab('orders');
                                  handleSelectOrder(ord);
                                }}
                                className="text-[#FF8618] font-semibold hover:underline"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Low Stock Watchlist */}
              <div className="lg:col-span-4 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
                <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                  Low Stock Watchlist
                </h2>
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center">
                    All products are well stocked.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-mono text-stone-500">SKU: {p.sku}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 font-mono text-xs font-bold">
                            {p.stockQuantity} left
                          </span>
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-[#FF8618]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by product name, brand, or SKU..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100"
                />
              </div>
              <button
                onClick={handleOpenCreateProduct}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500">
                    <th className="py-3 pr-3">Product</th>
                    <th className="py-3 px-3">Condition</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3">Visibility</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800">
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover bg-stone-100 dark:bg-stone-800"
                          />
                          <div>
                            <p className="font-semibold text-stone-900 dark:text-stone-100">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-stone-500 font-mono">
                              {p.brand} · SKU: {p.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold ${
                            p.condition === 'Used'
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-emerald-500/15 text-emerald-500'
                          }`}
                        >
                          {p.condition}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                        {formatBdt(p.price)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={
                            p.stockQuantity <= 3
                              ? 'text-amber-500 font-bold'
                              : 'text-stone-700 dark:text-stone-300'
                          }
                        >
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            p.isPublished
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                          }`}
                        >
                          {p.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-[#FF8618] text-stone-700 dark:text-stone-200"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {confirmDeleteProductId === p.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleConfirmDeleteProduct(p.id)}
                                className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteProductId(null)}
                                className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteProductId(p.id)}
                              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-red-500 text-stone-500 hover:text-red-500"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                {isCategoryEditMode ? 'Edit Category' : 'Create Product Category'}
              </h2>
              <form onSubmit={handleSaveCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                    placeholder="e.g., Fast Chargers & Cables"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCategory.slug}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, slug: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editingCategory.sortOrder}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          sortOrder: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingCategory.description}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={editingCategory.isActive}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, isActive: e.target.checked })
                    }
                  />
                  Active on Storefront
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#FF8618] text-white text-xs font-semibold"
                  >
                    {isCategoryEditMode ? 'Update Category' : 'Add Category'}
                  </button>
                  {isCategoryEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryEditMode(false);
                        setEditingCategory({
                          id: '',
                          name: '',
                          slug: '',
                          description: '',
                          imageURL: '/assets/products/iphone-15-pro.svg',
                          parentId: '',
                          sortOrder: categories.length + 1,
                          isActive: true,
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                Active Store Categories
              </h2>
              <div className="space-y-2.5">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-stone-400">#{cat.sortOrder}</span>
                        <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                          {cat.name}
                        </span>
                        <span className="font-mono text-xs text-[#FF8618]">/{cat.slug}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{cat.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryEditMode(true);
                        }}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-[#FF8618]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          await deleteCategoryById(cat.id);
                          await refreshStoreData();
                          showToast('Category deleted.', 'info');
                        }}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-red-500 text-stone-500 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order #, customer name, or phone..."
                  className="px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs flex-1"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => handleSelectOrder(ord)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedOrder?.id === ord.id
                        ? 'border-[#FF8618] bg-[#FF8618]/5'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#FF8618]">
                        {ord.orderNumber}
                      </span>
                      <span className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                        {formatBdt(ord.total)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      {ord.customerName} · <span className="font-mono">{ord.customerPhone}</span>
                    </p>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {ord.itemsSummary}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-semibold">
                        {ord.orderStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono">
                        {ord.paymentStatus}
                      </span>
                      <span className="text-stone-400 ml-auto">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                    <div>
                      <p className="font-mono font-bold text-base text-[#FF8618]">
                        {selectedOrder.orderNumber}
                      </p>
                      <p className="text-xs text-stone-500">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-lg">
                      {formatBdt(selectedOrder.total)}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-stone-600 dark:text-stone-300">
                    <p>
                      <strong>Customer:</strong> {selectedOrder.customerName}
                    </p>
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a
                        href={`tel:${selectedOrder.customerPhone}`}
                        className="font-mono text-[#FF8618] underline"
                      >
                        {selectedOrder.customerPhone}
                      </a>
                    </p>
                    <p>
                      <strong>Address:</strong> {selectedOrder.deliveryAddress},{' '}
                      {selectedOrder.city}, {selectedOrder.district}
                    </p>
                    <p>
                      <strong>Delivery Method:</strong> {selectedOrder.deliveryMethod}
                    </p>
                    <p>
                      <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                    </p>
                    {selectedOrder.orderNotes && (
                      <p>
                        <strong>Notes:</strong> {selectedOrder.orderNotes}
                      </p>
                    )}
                  </div>

                  {selectedOrderItems.length > 0 && (
                    <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
                      <p className="text-xs font-semibold mb-2">Ordered Items</p>
                      <div className="space-y-2">
                        {selectedOrderItems.map((it) => (
                          <div key={it.id} className="flex justify-between text-xs">
                            <span>
                              {it.quantity}x {it.productName} ({it.selectedVariant})
                            </span>
                            <span className="font-mono font-semibold">
                              {formatBdt(it.lineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-stone-200 dark:border-stone-800 pt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Order Fulfillment Status</label>
                      <select
                        value={selectedOrder.orderStatus}
                        onChange={(e) =>
                          handleUpdateOrderStatus(
                            selectedOrder.id,
                            e.target.value as OrderStatusType,
                            selectedOrder.paymentStatus,
                            selectedOrder.cancellationReason
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold"
                      >
                        {(
                          [
                            'Pending',
                            'Confirmed',
                            'Processing',
                            'Shipped',
                            'Delivered',
                            'Cancelled',
                            'Refunded',
                          ] as const
                        ).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Payment Status</label>
                      <select
                        value={selectedOrder.paymentStatus}
                        onChange={(e) =>
                          handleUpdateOrderStatus(
                            selectedOrder.id,
                            selectedOrder.orderStatus,
                            e.target.value as PaymentStatusType,
                            selectedOrder.cancellationReason
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold"
                      >
                        {(['Unpaid', 'Paid', 'Refunded'] as const).map((ps) => (
                          <option key={ps} value={ps}>
                            {ps}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 py-12 text-center">
                  Select an order on the left to inspect items and update status.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 5. REVIEWS MODERATION TAB */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
              Customer Review Moderation
            </h2>
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {rev.imageURL && (
                      <img
                        src={rev.imageURL}
                        alt={rev.customerName}
                        className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {rev.customerName}
                        </span>
                        <span className="text-xs font-mono text-[#FF8618]">
                          ★ {rev.rating}/5
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            rev.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : rev.status === 'rejected'
                              ? 'bg-red-500/15 text-red-500'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}
                        >
                          {rev.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">
                        Product: {rev.productName}
                      </p>
                      <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
                        "{rev.comment}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await moderateReviewByAdmin(
                          rev.id,
                          'approved',
                          true,
                          rev.adminReply || 'Thank you for shopping with Noborup!'
                        );
                        await refreshStoreData();
                        showToast('Review approved and verified!');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      Approve & Verify
                    </button>
                    <button
                      onClick={async () => {
                        await moderateReviewByAdmin(rev.id, 'rejected', rev.verifiedPurchase, '');
                        await refreshStoreData();
                        showToast('Review hidden from public.', 'info');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs"
                    >
                      Reject
                    </button>
                    <button
                      onClick={async () => {
                        await deleteReviewById(rev.id);
                        await refreshStoreData();
                        showToast('Review deleted.', 'info');
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                {isVideoEditMode ? 'Edit Social Video' : 'Add Social Media Video'}
              </h2>
              <form onSubmit={handleSaveVideoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Video Title *</label>
                  <input
                    type="text"
                    required
                    value={editingVideo.title}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    placeholder="e.g., Customer Unboxing at Kedargonj Bazar"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Platform</label>
                    <select
                      value={editingVideo.platform}
                      onChange={(e) =>
                        setEditingVideo({
                          ...editingVideo,
                          platform: e.target.value as SocialVideo['platform'],
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                    >
                      <option value="Facebook Reel">Facebook Reel</option>
                      <option value="YouTube Short">YouTube Short</option>
                      <option value="TikTok">TikTok</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editingVideo.sortOrder}
                      onChange={(e) =>
                        setEditingVideo({ ...editingVideo, sortOrder: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Video Link / URL *</label>
                  <input
                    type="url"
                    required
                    value={editingVideo.videoURL}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, videoURL: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Thumbnail Image URL *</label>
                  <input
                    type="text"
                    required
                    value={editingVideo.thumbnailURL}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, thumbnailURL: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#FF8618] text-white text-xs font-semibold"
                >
                  {isVideoEditMode ? 'Update Video' : 'Add Video'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                Watch Noborup in Action — Video Feed
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-3"
                  >
                    <img
                      src={v.thumbnailURL}
                      alt={v.title}
                      className="w-14 h-20 rounded-lg object-cover bg-stone-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase text-[#FF8618]">
                        {v.platform}
                      </span>
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-2">
                        {v.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            setEditingVideo(v);
                            setIsVideoEditMode(true);
                          }}
                          className="text-xs text-[#FF8618] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            await deleteSocialVideoById(v.id);
                            await refreshStoreData();
                            showToast('Video removed.', 'info');
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. SERVICE BOOKINGS TAB */}
        {activeTab === 'services' && (
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
              Mobile Servicing & Repair Bookings
            </h2>
            {serviceBookings.length === 0 ? (
              <p className="text-xs text-stone-500 py-8 text-center">
                No service appointments booked yet.
              </p>
            ) : (
              <div className="space-y-3">
                {serviceBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {b.deviceModel} — {b.serviceType}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        Customer: {b.customerName} ({b.customerPhone}) · Preferred:{' '}
                        {b.preferredDate}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">Issue: {b.issueDescription}</p>
                    </div>
                    <select
                      value={b.status}
                      onChange={async (e) => {
                        await updateServiceBookingStatus(
                          b.id,
                          e.target.value as ServiceBooking['status']
                        );
                        await loadAdminRecords();
                        showToast('Repair status updated!');
                      }}
                      className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold"
                    >
                      {(['Pending', 'Confirmed', 'In Repair', 'Completed', 'Cancelled'] as const).map(
                        (st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. STORE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              Storefront Branding, Contact & Delivery Configuration
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Changes saved here immediately update the announcement bar, hero banner, contact
              numbers, and delivery fee rules across Noborup.
            </p>

            <form onSubmit={handleSaveSettingsSubmit} className="space-y-5 max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, storeName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Primary Phone</label>
                  <input
                    type="text"
                    value={settingsForm.contactPhone}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactPhone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Secondary Phone</label>
                  <input
                    type="text"
                    value={settingsForm.secondaryPhone}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, secondaryPhone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Announcement Bar Text</label>
                  <input
                    type="text"
                    value={settingsForm.announcementText}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">Showroom Address</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Inside Meherpur Delivery Fee (৳)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.insideMeherpurFee}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        insideMeherpurFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Outside Meherpur Courier Fee (৳)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.outsideMeherpurFee}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        outsideMeherpurFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Official Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.facebookURL}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        facebookURL: e.target.value,
                      })
                    }
                    placeholder="https://www.facebook.com/noborupstore.bd"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Official Instagram URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.instagramURL || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        instagramURL: e.target.value,
                      })
                    }
                    placeholder="https://www.instagram.com/noborupstore.bd"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold text-xs transition"
              >
                {savingSettings ? 'Saving Settings...' : 'Save Store Settings'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* PRODUCT CREATE / EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200 dark:border-stone-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 mb-5">
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                {isProductEditMode ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
              </h2>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, brand: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Category *</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                        categorySlug: cat?.slug || 'all',
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Condition *</label>
                  <select
                    value={editingProduct.condition}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        condition: e.target.value as 'New' | 'Used',
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                  >
                    <option value="New">New (Brand New)</option>
                    <option value="Used">Used (Pre-Owned Certified)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Selling Price (৳ BDT) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Original / Compare Price (৳ BDT)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.compareAtPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        compareAtPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.stockQuantity}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono"
                  />
                </div>
              </div>

              {/* Image Upload + URL */}
              <div>
                <label className="block font-medium mb-1">
                  Product Image URL or Upload to Firebase Storage
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editingProduct.images[0] || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        images: [e.target.value, ...editingProduct.images.slice(1)],
                      })
                    }
                    placeholder="/assets/products/iphone-15-pro.svg or https://..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-800 text-white font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingPct !== null ? `Uploading ${uploadingPct}%` : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadProductImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Variants (comma separated)</label>
                <input
                  type="text"
                  value={editingProduct.variants.join(', ')}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      variants: e.target.value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="256GB Natural Titanium, 128GB Blue Titanium"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                />
              </div>

              {/* Used Phone Specific Fields */}
              {editingProduct.condition === 'Used' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-amber-600 dark:text-amber-400 mb-1">
                      Battery Health
                    </label>
                    <input
                      type="text"
                      value={editingProduct.specifications.batteryHealth || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          specifications: {
                            ...editingProduct.specifications,
                            batteryHealth: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., 91% Original"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-600 dark:text-amber-400 mb-1">
                      Cosmetic Condition
                    </label>
                    <input
                      type="text"
                      value={editingProduct.specifications.cosmeticCondition || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          specifications: {
                            ...editingProduct.specifications,
                            cosmeticCondition: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., Grade A+ Mint"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-600 dark:text-amber-400 mb-1">
                      Repair History
                    </label>
                    <input
                      type="text"
                      value={editingProduct.specifications.repairHistory || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          specifications: {
                            ...editingProduct.specifications,
                            repairHistory: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., Never Opened / 100% Original"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Product Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {(
                  [
                    { key: 'isPublished', label: 'Published' },
                    { key: 'isFeatured', label: 'Featured' },
                    { key: 'isNewArrival', label: 'New Arrival' },
                    { key: 'isBestSeller', label: 'Best Seller' },
                    { key: 'isSpecialOffer', label: 'Special Offer' },
                  ] as const
                ).map((flag) => (
                  <label key={flag.key} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct[flag.key])}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          [flag.key]: e.target.checked,
                        })
                      }
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold"
                >
                  {isProductEditMode ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
