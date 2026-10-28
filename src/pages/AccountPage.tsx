import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  LogOut,
  MapPin,
  Package,
  Shield,
  ShoppingBag,
  Trash2,
  User as UserIcon,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  cancelPendingOrderByCustomer,
  fetchOrderItems,
  fetchServiceBookings,
  fetchUserOrders,
  uploadMediaFile,
} from '../services/firestoreService';
import { Order, OrderItem, ServiceBooking } from '../types';
import { formatBdt } from '../utils/seedData';

type AccountTab = 'orders' | 'profile' | 'wishlist' | 'bookings';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AccountTab) || 'orders';

  const {
    user,
    loading: authLoading,
    isAdmin,
    publicProfile,
    privateInfo,
    logout,
    saveProfileChanges,
  } = useAuth();
  const {
    products,
    wishlistIds,
    toggleWishlist,
    addToCart,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [avatarLoadErr, setAvatarLoadErr] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Meherpur');
  const [city, setCity] = useState('Mujibnagar');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab') as AccountTab;
    if (t && ['orders', 'profile', 'wishlist', 'bookings'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/account');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (publicProfile) {
      setDisplayName(publicProfile.displayName || user?.displayName || '');
      setPhotoURL(publicProfile.photoURL || user?.photoURL || '');
    } else if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
    if (privateInfo) {
      setEmail(privateInfo.email || user?.email || '');
      setPhone(privateInfo.phone || '');
      setAddress(privateInfo.address || '');
      setDistrict(privateInfo.district || 'Meherpur');
      setCity(privateInfo.city || 'Mujibnagar');
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [user, publicProfile, privateInfo]);

  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const list = await fetchUserOrders(user.uid);
      setOrders(list);
    } catch {
      // Handled gracefully
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const list = await fetchServiceBookings(user.uid, false);
      setBookings(list);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
      loadBookings();
    }
  }, [user]);

  const handleToggleOrderDetails = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderItemsMap[orderId] && user) {
      try {
        const items = await fetchOrderItems(orderId, user.uid, isAdmin);
        setOrderItemsMap((prev) => ({ ...prev, [orderId]: items }));
      } catch {
        // Ignore
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await cancelPendingOrderByCustomer(orderId, 'Cancelled by customer from account portal');
      showToast('Order cancelled successfully.', 'info');
      await loadOrders();
    } catch {
      showToast('Could not cancel order.', 'error');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    setAvatarLoadErr(false);
    try {
      const uploadedUrl = await uploadMediaFile('store', user.uid, file);
      setPhotoURL(uploadedUrl);
      await saveProfileChanges({
        displayName: displayName || user.displayName || 'Noborup Customer',
        photoURL: uploadedUrl,
        email: email || user.email || '',
        phone,
        address,
        district,
        city,
      });
      showToast('Profile picture updated!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload profile photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setAvatarLoadErr(false);
    try {
      await saveProfileChanges({
        displayName,
        photoURL,
        email,
        phone,
        address,
        district,
        city,
      });
      showToast('Profile and delivery details updated!');
    } catch {
      showToast('Failed to save profile changes.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));
  const activeAvatarURL = !avatarLoadErr
    ? photoURL || publicProfile?.photoURL || user?.photoURL || ''
    : '';

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF8618] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Account Header */}
        <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              {activeAvatarURL ? (
                <img
                  src={activeAvatarURL}
                  alt={displayName || 'Profile picture'}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarLoadErr(true)}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF8618]/40 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#FF8618]/15 border border-[#FF8618]/30 flex items-center justify-center text-[#FF8618] font-display font-bold text-2xl">
                  {(displayName || user.email || 'N').charAt(0).toUpperCase()}
                </div>
              )}
              <label
                title="Change profile photo"
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#FF8618] hover:bg-[#e8750c] text-white flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {displayName || 'Noborup Customer'}
                </h1>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FF8618]/15 text-[#FF8618] text-xs font-mono font-semibold">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">{user.email}</p>
              {uploadingPhoto && (
                <p className="text-[11px] text-[#FF8618] font-medium mt-0.5">
                  Uploading profile picture...
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white text-xs font-semibold transition"
              >
                <Shield className="w-4 h-4" />
                Open Admin Dashboard
              </Link>
            )}
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-red-500/50 text-stone-700 dark:text-stone-300 hover:text-red-500 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5">
              {(
                [
                  { id: 'orders', label: 'My Orders', icon: Package, count: orders.length },
                  { id: 'profile', label: 'Profile & Address', icon: UserIcon },
                  {
                    id: 'wishlist',
                    label: 'Saved Wishlist',
                    icon: Heart,
                    count: wishlistProducts.length,
                  },
                  {
                    id: 'bookings',
                    label: 'Repair Bookings',
                    icon: Wrench,
                    count: bookings.length,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchParams({ tab: tab.id });
                    }}
                    className={`w-full flex items-center justify-between gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition ${
                      active
                        ? 'bg-[#FF8618] text-white font-semibold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </span>
                    {'count' in tab && tab.count !== undefined && (
                      <span
                        className={`text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Tab Content */}
          <div className="lg:col-span-9">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                      Order History & Tracking
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      View real-time dispatch updates and itemized receipts for your purchases.
                    </p>
                  </div>
                  <button
                    onClick={loadOrders}
                    className="text-xs font-semibold text-[#FF8618] hover:underline"
                  >
                    Refresh Status
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-sm text-stone-500">
                    Loading your orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                    <p className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
                      No orders placed yet
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-5">
                      When you buy a smartphone or accessory, your order status will appear here.
                    </p>
                    <Link
                      to="/catalog"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF8618] text-white text-xs font-semibold"
                    >
                      Explore Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      const loadedItems = orderItemsMap[order.id] || [];
                      return (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden"
                        >
                          <div className="p-4 sm:p-5 bg-stone-50/70 dark:bg-stone-900/50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-bold text-sm text-[#FF8618]">
                                  {order.orderNumber}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                                  {order.orderStatus}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400">
                                  Payment: {order.paymentStatus}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                Placed on {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                                {order.itemsSummary}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xs text-stone-500 dark:text-stone-400">Total</p>
                                <p className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                                  {formatBdt(order.total)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleToggleOrderDetails(order.id)}
                                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[#FF8618] text-stone-700 dark:text-stone-300 transition"
                                aria-label="Toggle order details"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600 dark:text-stone-400">
                                <div>
                                  <p className="font-semibold text-stone-900 dark:text-stone-200 mb-1">
                                    Shipping Address
                                  </p>
                                  <p>{order.customerName}</p>
                                  <p className="font-mono">{order.customerPhone}</p>
                                  <p>
                                    {order.deliveryAddress}, {order.city}, {order.district}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-semibold text-stone-900 dark:text-stone-200 mb-1">
                                    Delivery & Payment
                                  </p>
                                  <p>Method: {order.deliveryMethod}</p>
                                  <p>Payment: {order.paymentMethod}</p>
                                  {order.cancellationReason && (
                                    <p className="text-red-500 mt-1">
                                      Note: {order.cancellationReason}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {loadedItems.length > 0 && (
                                <div className="border-t border-stone-200/70 dark:border-stone-800 pt-3">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                                    Order Line Items
                                  </p>
                                  <div className="space-y-2">
                                    {loadedItems.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between text-xs py-1.5"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <img
                                            src={item.productImage}
                                            alt={item.productName}
                                            className="w-9 h-9 rounded-lg object-cover bg-stone-100 dark:bg-stone-800"
                                          />
                                          <div>
                                            <p className="font-medium text-stone-900 dark:text-stone-100">
                                              {item.productName}
                                            </p>
                                            <p className="text-stone-500 font-mono">
                                              {item.selectedVariant} × {item.quantity}
                                            </p>
                                          </div>
                                        </div>
                                        <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                                          {formatBdt(item.lineTotal)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {order.orderStatus === 'Pending' && (
                                <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 flex justify-end">
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={cancellingOrderId === order.id}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-semibold transition"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    {cancellingOrderId === order.id
                                      ? 'Cancelling...'
                                      : 'Cancel Pending Order'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6">
                <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                  Account Profile & Saved Delivery Details
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                  Your private phone number and address are stored in an isolated, owner-only
                  security subcollection for faster checkout.
                </p>

                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
                  {/* Profile Picture Upload & Preview Box */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {activeAvatarURL ? (
                      <img
                        src={activeAvatarURL}
                        alt={displayName || 'Profile picture'}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarLoadErr(true)}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#FF8618]/40 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#FF8618]/15 text-[#FF8618] font-display font-bold text-2xl flex items-center justify-center shrink-0">
                        {(displayName || user.email || 'N').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white text-xs font-semibold cursor-pointer transition">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhotoFileChange}
                            className="hidden"
                          />
                        </label>
                        {photoURL && (
                          <button
                            type="button"
                            onClick={() => setPhotoURL('')}
                            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-red-500"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={photoURL}
                        onChange={(e) => {
                          setAvatarLoadErr(false);
                          setPhotoURL(e.target.value);
                        }}
                        placeholder="Or paste direct Profile Picture URL (https://...)"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B1D1C] border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm font-mono text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Upazila / City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Default Delivery Address
                      </label>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House, Road, Village or Bazar landmark"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold text-sm transition"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile & Address'}
                  </button>
                </form>
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6">
                <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                  Saved Wishlist ({wishlistProducts.length})
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                  Devices and accessories saved to your account across devices.
                </p>

                {wishlistProducts.length === 0 ? (
                  <div className="py-12 text-center">
                    <Heart className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                      Your wishlist is currently empty.
                    </p>
                    <Link
                      to="/catalog"
                      className="inline-flex px-5 py-2.5 rounded-xl bg-[#FF8618] text-white text-xs font-semibold"
                    >
                      Browse Smartphones
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistProducts.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/product/${item.slug}`}
                              className="text-sm font-bold text-stone-900 dark:text-stone-100 hover:text-[#FF8618] truncate block"
                            >
                              {item.name}
                            </Link>
                            <p className="font-mono text-sm font-semibold text-[#FF8618] mt-0.5">
                              {formatBdt(item.price)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => addToCart(item, 1)}
                                className="px-3 py-1 rounded-lg bg-[#FF8618] text-white text-xs font-semibold"
                              >
                                Add to Cart
                              </button>
                              <button
                                onClick={() => toggleWishlist(item.id)}
                                className="p-1 text-stone-400 hover:text-red-500"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REPAIR BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6">
                <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                  Mobile Servicing & Repair Requests
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                  Track hardware diagnostics, battery replacements, and display repair appointments
                  at Noborup Kedargonj Bazar.
                </p>

                {loadingBookings ? (
                  <p className="text-sm text-stone-500 py-8 text-center">Loading bookings...</p>
                ) : bookings.length === 0 ? (
                  <div className="py-10 text-center">
                    <Wrench className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      You have no active mobile repair bookings.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              {b.deviceModel} — {b.serviceType}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FF8618]/15 text-[#FF8618]">
                              {b.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                            Issue: {b.issueDescription}
                          </p>
                          <p className="text-xs font-mono text-stone-400 mt-1">
                            Preferred Date: {b.preferredDate} · Phone: {b.customerPhone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
