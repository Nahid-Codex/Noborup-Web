import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  calculateCouponDiscount,
  calculateDeliveryFee,
  createVerifiedOrder,
} from '../services/firestoreService';
import { DeliveryMethodType, Order, PaymentMethodType } from '../types';
import { formatBdt } from '../utils/seedData';

const BANGLADESH_DISTRICTS = [
  'Meherpur',
  'Chuadanga',
  'Kushtia',
  'Jhenaidah',
  'Magura',
  'Jashore',
  'Khulna',
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Sylhet',
  'Rangpur',
  'Barishal',
  'Mymensingh',
  'Cumilla',
  'Bogura',
  'Gazipur',
  'Narayanganj',
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, publicProfile, privateInfo } = useAuth();
  const {
    cart,
    cartSubtotal,
    clearCart,
    storeSettings,
    showToast,
    refreshStoreData,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [district, setDistrict] = useState('Meherpur');
  const [city, setCity] = useState('Mujibnagar');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodType>('Inside Meherpur');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash on Delivery');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (publicProfile?.displayName && !customerName) {
      setCustomerName(publicProfile.displayName);
    } else if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
    if (privateInfo) {
      if (privateInfo.phone && !customerPhone) setCustomerPhone(privateInfo.phone);
      if (privateInfo.email && !customerEmail) setCustomerEmail(privateInfo.email);
      if (privateInfo.address && !deliveryAddress) setDeliveryAddress(privateInfo.address);
      if (privateInfo.district) setDistrict(privateInfo.district);
      if (privateInfo.city) setCity(privateInfo.city);
    } else if (user?.email && !customerEmail) {
      setCustomerEmail(user.email);
    }
  }, [user, publicProfile, privateInfo]);

  useEffect(() => {
    if (district === 'Meherpur' && deliveryMethod === 'Outside Meherpur (Courier)') {
      setDeliveryMethod('Inside Meherpur');
    } else if (district !== 'Meherpur' && deliveryMethod === 'Inside Meherpur') {
      setDeliveryMethod('Outside Meherpur (Courier)');
    }
  }, [district]);

  const discount = calculateCouponDiscount(appliedCoupon, cartSubtotal);
  const deliveryFee = calculateDeliveryFee(
    deliveryMethod,
    Math.max(0, cartSubtotal - discount),
    storeSettings
  );
  const estimatedTotal = Math.max(0, cartSubtotal - discount) + deliveryFee;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon('');
      return;
    }
    const calc = calculateCouponDiscount(code, cartSubtotal);
    if (calc > 0) {
      setAppliedCoupon(code);
      showToast(`Coupon ${code} applied! Saved ${formatBdt(calc)}`);
    } else {
      setAppliedCoupon('');
      showToast(
        'Invalid coupon or minimum order requirement not met (Try MEHERPUR100, WELCOME200, or NOBORUP500).',
        'error'
      );
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg('Please sign in or create a customer account before placing your order.');
      showToast('Please sign in to place an order.', 'error');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please fill in your full name, active mobile number, and delivery address.');
      return;
    }
    if (customerPhone.trim().length < 10) {
      setErrorMsg('Please enter a valid 11-digit Bangladesh mobile phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createVerifiedOrder({
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        district,
        city,
        orderNotes,
        deliveryMethod,
        paymentMethod,
        couponCode: appliedCoupon,
        cartItems: cart,
        storeSettings,
      });
      setCompletedOrder(order);
      clearCart();
      await refreshStoreData();
      showToast(`Order ${order.orderNumber} placed successfully!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not complete order. Please try again.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Post-Order Confirmation Screen
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <span className="text-xs font-mono uppercase tracking-widest font-semibold">
              Verified Order Confirmed
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Thank you for your order, {completedOrder.customerName}!
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
            Your order has been securely recorded in our database and stock has been reserved for you.
            Our team at Kedargonj Bazar, Mujibnagar will call{' '}
            <span className="font-mono font-semibold text-stone-900 dark:text-stone-200">
              {completedOrder.customerPhone}
            </span>{' '}
            shortly to confirm dispatch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 mb-6">
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Order Reference</p>
              <p className="font-mono font-bold text-base text-[#FF8618] mt-0.5">
                {completedOrder.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Payment Method</p>
              <p className="font-medium text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                {completedOrder.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Order Status</p>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {completedOrder.orderStatus}
              </p>
            </div>
          </div>

          {/* Itemized Receipt */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-6 mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-4">
              Order Summary ({completedOrder.itemCount} items)
            </h2>
            <div className="space-y-3">
              {completedOrder.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-2 border-b border-stone-100 dark:border-stone-800/60"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 rounded-lg object-cover bg-stone-100 dark:bg-stone-800"
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {item.productName}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                        Variant: {item.selectedVariant} · Qty: {item.quantity} ×{' '}
                        {formatBdt(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono font-semibold text-sm text-stone-900 dark:text-stone-100">
                    {formatBdt(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Subtotal</span>
                <span className="font-mono">{formatBdt(completedOrder.subtotal)}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon Discount ({completedOrder.couponCode})</span>
                  <span className="font-mono">-{formatBdt(completedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Delivery ({completedOrder.deliveryMethod})</span>
                <span className="font-mono">
                  {completedOrder.deliveryFee === 0
                    ? 'FREE'
                    : formatBdt(completedOrder.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
                <span>Total Amount Payable</span>
                <span className="font-mono text-[#FF8618]">{formatBdt(completedOrder.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 space-y-1 mb-6">
            <p className="font-semibold text-stone-900 dark:text-stone-200">
              Delivery Destination:
            </p>
            <p>
              {completedOrder.deliveryAddress}, {completedOrder.city}, {completedOrder.district}
            </p>
            {completedOrder.orderNotes && <p>Notes: {completedOrder.orderNotes}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <Link
                to="/account?tab=orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold text-sm transition"
              >
                <Package className="w-4 h-4" />
                Track Order in My Account
              </Link>
              <a
                href={`https://wa.me/${storeSettings.whatsappNumber}?text=${encodeURIComponent(
                  `Assalamu Alaikum Noborup! I just placed order ${completedOrder.orderNumber} (${completedOrder.itemsSummary}) for ${formatBdt(completedOrder.total)}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-[#FF8618] text-stone-800 dark:text-stone-200 font-medium text-sm transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                Send Order on WhatsApp
              </a>
            </div>
            <Link
              to="/catalog"
              className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-[#FF8618]"
            >
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty Cart Guard
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <Package className="w-14 h-14 text-stone-400 mb-4" />
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Your shopping cart is empty
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mb-6">
          Explore our latest smartphones, pre-owned iPhones, fast chargers, and accessories before
          proceeding to checkout.
        </p>
        <Link
          to="/catalog"
          className="px-6 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold text-sm transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-[#FF8618] transition mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
          <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100">
            Secure Checkout
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            All prices and stock quantities are verified directly with the Noborup database.
          </p>
        </div>

        {!user && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#FF8618] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Sign in required to place a verified order
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                  To protect stock reservation and enable real-time order tracking in your account,
                  please sign in with Google or your verified email.
                </p>
              </div>
            </div>
            <Link
              to="/login?redirect=/checkout"
              className="px-5 py-2.5 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white text-xs font-semibold whitespace-nowrap transition self-start sm:self-center"
            >
              Sign In / Create Account
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer & Shipping Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <MapPin className="w-5 h-5 text-[#FF8618]" />
                <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  1. Customer & Delivery Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., Tanvir Ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Mobile Number (Bangladesh) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    District *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Upazila / City / Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Mujibnagar / Kedargonj"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Full Delivery Address (House, Road, Bazar / Landmark) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Village / Road / Market landmark for smooth delivery"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Order Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Preferred delivery time or instructions"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <Truck className="w-5 h-5 text-[#FF8618]" />
                <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  2. Delivery Method
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: 'Inside Meherpur',
                      title: 'Inside Meherpur',
                      sub: 'Same / Next-Day Rider',
                      fee: storeSettings.insideMeherpurFee,
                    },
                    {
                      id: 'Outside Meherpur (Courier)',
                      title: 'Nationwide Courier',
                      sub: 'Steadfast / Pathao (2-3 Days)',
                      fee: storeSettings.outsideMeherpurFee,
                    },
                    {
                      id: 'Store Pickup (Kedargonj Bazar)',
                      title: 'Showroom Pickup',
                      sub: 'Kedargonj Bazar, Mujibnagar',
                      fee: 0,
                    },
                  ] as const
                ).map((opt) => {
                  const active = deliveryMethod === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setDeliveryMethod(opt.id)}
                      className={`text-left p-4 rounded-xl border transition ${
                        active
                          ? 'border-[#FF8618] bg-[#FF8618]/5'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {opt.title}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#FF8618]">
                          {opt.fee === 0 ? 'FREE' : formatBdt(opt.fee)}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-3">
                Orders above{' '}
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                  {formatBdt(storeSettings.freeDeliveryThreshold)}
                </span>{' '}
                automatically qualify for free delivery across Bangladesh.
              </p>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <CreditCard className="w-5 h-5 text-[#FF8618]" />
                <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  3. Payment Option
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    {
                      id: 'Cash on Delivery',
                      title: 'Cash on Delivery (COD)',
                      desc: 'Inspect your device or accessory upon arrival and pay in cash.',
                    },
                    {
                      id: 'bKash / Nagad Verification at Delivery',
                      title: 'bKash / Nagad at Delivery',
                      desc: `Pay via bKash/Nagad to ${storeSettings.contactPhone} when receiving your parcel.`,
                    },
                  ] as const
                ).map((pm) => {
                  const active = paymentMethod === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`text-left p-4 rounded-xl border transition ${
                        active
                          ? 'border-[#FF8618] bg-[#FF8618]/5'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
                        {pm.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{pm.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6 sticky top-24">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">
                Order Summary
              </h2>

              <div className="divide-y divide-stone-200/70 dark:divide-stone-800 max-h-80 overflow-y-auto pr-1 mb-4">
                {cart.map((item) => (
                  <div
                    key={`${item.product.id}_${item.selectedVariant}`}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                          {item.selectedVariant} · Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100 shrink-0">
                      {formatBdt(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="mb-5 pt-3 border-t border-stone-200/70 dark:border-stone-800">
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                  Promo / Coupon Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="MEHERPUR100 or NOBORUP500"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono uppercase text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-800 text-white text-xs font-semibold hover:bg-[#FF8618] transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-2.5 text-sm border-t border-stone-200/70 dark:border-stone-800 pt-4 mb-6">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatBdt(cartSubtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({appliedCoupon})</span>
                    <span className="font-mono">-{formatBdt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Delivery Charge</span>
                  <span className="font-mono">
                    {deliveryFee === 0 ? 'FREE' : formatBdt(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 dark:text-stone-100 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <span>Total Payable</span>
                  <span className="font-mono text-xl text-[#FF8618]">
                    {formatBdt(estimatedTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {submitting
                  ? 'Verifying Stock & Placing Order...'
                  : `Confirm Order · ${formatBdt(estimatedTotal)}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <Phone className="w-3.5 h-3.5 text-[#FF8618]" />
                <span>Need help? Call Noborup Support: {storeSettings.contactPhone}</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
