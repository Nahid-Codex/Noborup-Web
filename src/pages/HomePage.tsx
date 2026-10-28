import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { createServiceBooking, submitCustomerReview } from '../services/firestoreService';
import { formatBdt } from '../utils/seedData';

export const HomePage: React.FC = () => {
  const { products, categories, reviews, videos, storeSettings, showToast, refreshStoreData } =
    useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeProductTab, setActiveProductTab] = useState<
    'featured' | 'newArrivals' | 'bestSellers' | 'specialOffers'
  >('featured');
  const [heroSearch, setHeroSearch] = useState('');

  // Service Booking Modal State
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: user?.displayName || '',
    customerPhone: '',
    deviceModel: '',
    serviceType: 'Display / Touch Replacement',
    issueDescription: '',
    preferredDate: new Date().toISOString().split('T')[0],
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Review Submission Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    productId: products[0]?.id || '',
    rating: 5,
    comment: '',
    orderId: '',
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const displayedProducts = products.filter((p) => {
    if (!p.isPublished) return false;
    if (activeProductTab === 'featured') return p.isFeatured;
    if (activeProductTab === 'newArrivals') return p.isNewArrival;
    if (activeProductTab === 'bestSellers') return p.isBestSeller;
    if (activeProductTab === 'specialOffers')
      return p.isSpecialOffer || p.compareAtPrice > p.price;
    return true;
  });

  const activeCategories = categories.filter((c) => c.isActive);
  const approvedReviews = reviews.filter((r) => r.status === 'approved');
  const publishedVideos = videos.filter((v) => v.isPublished);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in first to book a servicing appointment.', 'error');
      navigate('/login');
      return;
    }
    setBookingSubmitting(true);
    try {
      await createServiceBooking(bookingForm);
      showToast('Repair appointment request received! Our technician will call you shortly.');
      setBookingOpen(false);
      setBookingForm({
        customerName: user.displayName || '',
        customerPhone: '',
        deviceModel: '',
        serviceType: 'Display / Touch Replacement',
        issueDescription: '',
        preferredDate: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit booking.', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to submit a product review.', 'error');
      navigate('/login');
      return;
    }
    const targetProd = products.find((p) => p.id === reviewForm.productId) || products[0];
    if (!targetProd) return;

    setReviewSubmitting(true);
    try {
      await submitCustomerReview({
        productId: targetProd.id,
        productName: targetProd.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        orderId: reviewForm.orderId,
      });
      showToast('Thank you! Your review has been submitted for admin moderation.');
      setReviewModalOpen(false);
      setReviewForm({ productId: products[0]?.id || '', rating: 5, comment: '', orderId: '' });
      await refreshStoreData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit review.', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const cleanHeroSubtext =
    !storeSettings.heroSubtext || storeSettings.heroSubtext.toLowerCase().includes('25-point')
      ? 'Discover brand-new smartphones, certified pre-owned phones, original accessories, and trusted mobile servicing—all in one place at Noborup.'
      : storeSettings.heroSubtext;

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <div className="space-y-14 sm:space-y-20 pb-16 sm:pb-20">
      {/* =====================================================================
          SECTION A: MINIMAL ARCHITECTURAL HERO SECTION
      ===================================================================== */}
      <section className="relative bg-white dark:bg-[#111312] text-[#111312] dark:text-white border-b border-black/8 dark:border-white/10 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20 text-center">
          {/* Quiet Unboxed Kicker */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm font-medium text-[#686E6B] dark:text-[#9CA3AF] mb-5 sm:mb-6">
            <span className="font-semibold text-[#FF8618]">নবরূপ · Noborup</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF8618] shrink-0" />
              <span>Kedargonj Bazar, Mujibnagar, Meherpur</span>
            </span>
          </div>

          {/* Minimal Display Headline */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-[4rem] font-bold tracking-tight leading-[1.08] text-balance text-[#111312] dark:text-white max-w-3xl mx-auto">
            {storeSettings.heroHeadline || 'Technology. Made Personal.'}
          </h1>

          {/* Clean Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-[#4B504E] dark:text-[#B4B9B6] max-w-2xl mx-auto leading-relaxed">
            {cleanHeroSubtext}
          </p>

          {/* Minimal Search Input */}
          <form
            onSubmit={handleHeroSearchSubmit}
            className="mt-6 sm:mt-8 max-w-xl mx-auto flex items-center gap-2 p-1.5 rounded-2xl bg-[#F7F7F5] dark:bg-[#1B1D1C] border border-black/10 dark:border-white/12 focus-within:border-[#FF8618] transition-colors"
          >
            <div className="flex items-center gap-2 pl-3 flex-1 min-w-0">
              <Search className="w-4 h-4 text-[#686E6B] dark:text-[#9CA3AF] shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search iPhone, Galaxy, Realme, Accessories..."
                className="w-full py-2 bg-transparent text-xs sm:text-sm text-[#111312] dark:text-white placeholder:text-[#8C928F] focus:outline-none min-w-0"
              />
            </div>
            <button
              type="submit"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#111312] hover:bg-[#FF8618] dark:bg-white dark:text-[#111312] dark:hover:bg-[#FF8618] dark:hover:text-white text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Search
            </button>
          </form>

          {/* Primary Minimal Actions */}
          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 max-w-md sm:max-w-none mx-auto">
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white font-semibold text-sm transition-colors whitespace-nowrap"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/catalog?condition=Used"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-transparent hover:bg-[#F7F7F5] dark:hover:bg-[#1B1D1C] text-[#111312] dark:text-white border border-black/12 dark:border-white/15 font-semibold text-sm transition-colors whitespace-nowrap"
            >
              <span>Certified Pre-Owned</span>
            </Link>

            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-[#4B504E] dark:text-[#B4B9B6] hover:text-[#FF8618] dark:hover:text-[#FF8618] transition-colors whitespace-nowrap"
            >
              <Wrench className="w-4 h-4 text-[#FF8618]" />
              <span>Book Servicing</span>
            </Link>
          </div>
        </div>

        {/* Minimal Hairline-Divided Pillars Bar (Responsive 1-col Mobile, 2x2 Tablet, 4-col Desktop) */}
        <div className="border-t border-black/8 dark:border-white/10 bg-black/8 dark:bg-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px">
            <Link
              to="/catalog?condition=New"
              className="bg-white dark:bg-[#111312] py-4 sm:py-5 px-4 sm:px-6 flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-medium text-[#686E6B] dark:text-[#9CA3AF]">01. Authentic Stock</p>
                <p className="font-display text-sm font-bold text-[#111312] dark:text-white mt-0.5 group-hover:text-[#FF8618] transition-colors">
                  Brand-New Smartphones
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#686E6B] group-hover:text-[#FF8618] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/catalog?condition=Used"
              className="bg-white dark:bg-[#111312] py-4 sm:py-5 px-4 sm:px-6 flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-medium text-[#686E6B] dark:text-[#9CA3AF]">02. 7-Day Replacement</p>
                <p className="font-display text-sm font-bold text-[#111312] dark:text-white mt-0.5 group-hover:text-[#FF8618] transition-colors">
                  Certified Pre-Owned Phones
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#686E6B] group-hover:text-[#FF8618] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/catalog?category=accessories"
              className="bg-white dark:bg-[#111312] py-4 sm:py-5 px-4 sm:px-6 flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-medium text-[#686E6B] dark:text-[#9CA3AF]">03. Genuine Gear</p>
                <p className="font-display text-sm font-bold text-[#111312] dark:text-white mt-0.5 group-hover:text-[#FF8618] transition-colors">
                  Original Accessories
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#686E6B] group-hover:text-[#FF8618] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/services"
              className="bg-white dark:bg-[#111312] py-4 sm:py-5 px-4 sm:px-6 flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-medium text-[#686E6B] dark:text-[#9CA3AF]">04. Care Lab</p>
                <p className="font-display text-sm font-bold text-[#111312] dark:text-white mt-0.5 group-hover:text-[#FF8618] transition-colors">
                  Expert Mobile Servicing
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#686E6B] group-hover:text-[#FF8618] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION B: PRODUCT CATEGORIES
      ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Browse by Category
            </h2>
            <p className="text-xs sm:text-sm text-[#686E6B] dark:text-[#9CA3AF] mt-1">
              Select a category to filter live inventory from our showroom database.
            </p>
          </div>
          <Link
            to="/catalog"
            className="text-xs sm:text-sm font-semibold text-[#FF8618] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5">
          <Link
            to="/catalog"
            className="group p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10 hover:border-[#FF8618] transition-colors flex flex-col justify-between"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#FF8618]/10 text-[#FF8618] flex items-center justify-center font-display font-bold text-base sm:text-lg mb-3">
              All
            </div>
            <div>
              <h3 className="font-display text-xs sm:text-sm font-bold group-hover:text-[#FF8618] transition-colors">
                All Products
              </h3>
              <p className="text-[11px] sm:text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-0.5">
                {products.length} items
              </p>
            </div>
          </Link>

          {activeCategories.map((cat) => {
            const targetUrl =
              cat.slug === 'new-phones'
                ? '/catalog?condition=New'
                : cat.slug === 'used-phones'
                ? '/catalog?condition=Used'
                : cat.slug === 'mobile-services'
                ? '/services'
                : `/catalog?category=${encodeURIComponent(cat.slug)}`;

            return (
              <Link
                key={cat.id}
                to={targetUrl}
                className="group p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10 hover:border-[#FF8618] transition-colors flex flex-col justify-between"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-[#F7F7F5] dark:bg-[#111312] mb-3 border border-black/5 dark:border-white/10">
                  <img
                    src={cat.imageURL}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-display text-xs sm:text-sm font-bold group-hover:text-[#FF8618] transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-0.5 line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION C: FEATURED PRODUCTS (WITH SEGMENTED TABS)
      ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Showroom Collection
            </h2>
            <p className="text-xs sm:text-sm text-[#686E6B] dark:text-[#9CA3AF] mt-1">
              Every device and accessory is backed by transparent pricing in Bangladeshi Taka (৳).
            </p>
          </div>

          {/* Interactive Filter Tabs (Scrollable on Mobile, Segmented on Tablet/Desktop) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar self-start">
            {[
              { id: 'featured', label: 'Featured Products' },
              { id: 'newArrivals', label: 'New Arrivals' },
              { id: 'bestSellers', label: 'Best Sellers' },
              { id: 'specialOffers', label: 'Special Offers' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveProductTab(tab.id as typeof activeProductTab)}
                className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeProductTab === tab.id
                    ? 'bg-white dark:bg-[#1B1D1C] text-[#FF8618] shadow-xs'
                    : 'text-[#4B504E] dark:text-[#B4B9B6] hover:text-[#111312] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {(displayedProducts.length > 0 ? displayedProducts : products.slice(0, 8)).map(
            (product) => (
              <ProductCard key={product.id} product={product} />
            )
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION D: SOCIAL MEDIA VIDEOS ("WATCH NOBORUP IN ACTION")
      ===================================================================== */}
      <section id="videos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Watch Noborup in Action
            </h2>
            <p className="text-xs sm:text-sm text-[#686E6B] dark:text-[#9CA3AF] mt-1">
              Official Facebook Reels straight from our showroom at Kedargonj Bazar, Mujibnagar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold">
            <a
              href={storeSettings.facebookURL || 'https://www.facebook.com/noborupstore.bd'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1877F2] dark:text-[#589BFF] hover:underline inline-flex items-center gap-1"
            >
              <span>Facebook</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={
                storeSettings.instagramURL ||
                'https://www.instagram.com/noborupstore.bd?stkn=Y3RpODRyNGY2dHBi&fbclid=IwY2xjawVOau9leHRuA2FlbQIxMABwZG9mBWJyaWQRMXczVEJLRXRxNFNLbDhIZGlzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe3-QFuPYUCDg7pTBba4lhOZKbSQXgCA1Po9usTKIXJwxYxe2eusFy-DoZ0KI_aem_W1fYqxbLd6JRPi6lm6yzow'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E1306C] dark:text-[#FF6B9D] hover:underline inline-flex items-center gap-1"
            >
              <span>Instagram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/videos"
              className="text-[#FF8618] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Reels</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {publishedVideos.map((video, idx) => {
            const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
              video.videoURL
            )}&show_text=false&width=320&height=569`;

            return (
              <div
                key={video.id}
                className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#FF8618] transition-colors max-w-sm sm:max-w-none mx-auto w-full"
              >
                <div className="relative aspect-9/16 bg-[#111312] overflow-hidden w-full flex items-center justify-center">
                  <iframe
                    src={embedUrl}
                    title={`Noborup Facebook Reel ${idx + 1}`}
                    className="w-full h-full border-0"
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                <div className="px-4 py-3 flex items-center justify-between gap-2 text-xs border-t border-black/8 dark:border-white/10">
                  <span className="font-semibold text-[#111312] dark:text-white">
                    Facebook Reel #{idx + 1}
                  </span>
                  <a
                    href={video.videoURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#FF8618] font-semibold shrink-0 hover:underline"
                  >
                    <span>Watch on Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION E: CUSTOMER REVIEWS & HAPPY DELIVERIES
      ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Verified Customer Deliveries &amp; Reviews
            </h2>
            <p className="text-xs sm:text-sm text-[#686E6B] dark:text-[#9CA3AF] mt-1">
              Real families and gamers from Mujibnagar, Meherpur, and across Bangladesh who chose Noborup.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#111312] dark:bg-white text-white dark:text-[#111312] text-xs font-semibold hover:opacity-90 transition-opacity self-start shrink-0"
          >
            Write a Product Review
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {approvedReviews.slice(0, 6).map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-5 sm:p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {rev.imageURL ? (
                      <img
                        src={rev.imageURL}
                        alt={rev.customerName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-black/10 dark:border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#FF8618]/15 text-[#FF8618] font-display font-bold flex items-center justify-center shrink-0">
                        {rev.customerName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-display text-sm font-bold truncate">{rev.customerName}</h4>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-0.5">
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Verified</span>
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-[#FF8618] shrink-0">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-[#4B504E] dark:text-[#C4C9C6] leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {rev.adminReply && (
                  <div className="p-3 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] text-xs text-[#4B504E] dark:text-[#B4B9B6]">
                    <span className="font-semibold text-[#111312] dark:text-white">
                      Noborup Response:{' '}
                    </span>
                    {rev.adminReply}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-black/6 dark:border-white/8 text-xs text-[#686E6B] dark:text-[#9CA3AF] truncate">
                Purchased: <strong className="font-medium">{rev.productName}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION F: BRAND PROMISE & MOBILE SERVICING
      ===================================================================== */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl sm:rounded-3xl border border-black/8 dark:border-white/10 p-5 sm:p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <div>
                <p className="text-xs font-semibold text-[#FF8618] tracking-wide">
                  Noborup Care Lab &amp; Quality Promise
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                  Trusted Mobile Servicing &amp; Certified Pre-Owned Assurance
                </h2>
                <p className="text-xs sm:text-sm text-[#4B504E] dark:text-[#B4B9B6] mt-2 leading-relaxed">
                  Every pre-owned iPhone and Android smartphone sold at Noborup undergoes a complete
                  hardware and battery authenticity check covering motherboard integrity, original
                  display True Tone, battery cycle health, Face ID / fingerprint sensors, and camera
                  stabilization.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/6 dark:border-white/8">
                  <ShieldCheck className="w-6 h-6 text-[#FF8618] mb-2" />
                  <h3 className="font-display text-sm font-bold">Genuine Parts Only</h3>
                  <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-1">
                    Original displays, high-capacity batteries, and charging port assemblies.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/6 dark:border-white/8">
                  <Wrench className="w-6 h-6 text-[#FF8618] mb-2" />
                  <h3 className="font-display text-sm font-bold">Expert IC &amp; Board Repair</h3>
                  <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-1">
                    Fast diagnosis for network, audio IC, dead-boot, and water-damaged phones.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/6 dark:border-white/8">
                  <Truck className="w-6 h-6 text-[#FF8618] mb-2" />
                  <h3 className="font-display text-sm font-bold">Safe Cash on Delivery</h3>
                  <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-1">
                    Inspect your package and official Noborup invoice upon delivery.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="px-5 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white text-xs sm:text-sm font-semibold transition-colors text-center"
                >
                  Book Mobile Repair / Servicing
                </button>

                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-black/15 dark:border-white/15 text-xs sm:text-sm font-semibold hover:border-[#FF8618] transition-colors"
                >
                  <span>Full Repair Menu &amp; Pricing</span>
                  <ArrowRight className="w-4 h-4 text-[#FF8618]" />
                </Link>

                <a
                  href={`https://wa.me/${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-black/15 dark:border-white/15 text-xs sm:text-sm font-semibold hover:border-[#FF8618] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Ask Technician on WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-3.5">
              <img
                src="/assets/aistudio/customar__4__1f1fccaa.jpg"
                alt="Noborup Showroom Customer"
                referrerPolicy="no-referrer"
                className="w-full rounded-2xl aspect-3/4 object-cover border border-black/10 dark:border-white/10"
              />
              <img
                src="/assets/aistudio/customar__9__41adf507.jpg"
                alt="Noborup Showroom Customer"
                referrerPolicy="no-referrer"
                className="w-full rounded-2xl aspect-3/4 object-cover border border-black/10 dark:border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          MODAL: BOOK MOBILE SERVICING APPOINTMENT
      ===================================================================== */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1B1D1C] max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 border border-black/10 dark:border-white/15 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-display text-lg font-bold">Book Mobile Servicing</h3>
                <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF]">
                  Noborup Care Desk · Kedargonj Bazar, Mujibnagar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customerName}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, customerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01912-XXXXXX"
                    value={bookingForm.customerPhone}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, customerPhone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone Brand &amp; Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 13 / Galaxy A54"
                    value={bookingForm.deviceModel}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, deviceModel: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Service Category *</label>
                  <select
                    value={bookingForm.serviceType}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, serviceType: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                  >
                    <option value="Display / Touch Replacement">Display / Touch Replacement</option>
                    <option value="Original Battery Replacement">Original Battery Replacement</option>
                    <option value="Charging Port / Speaker Issue">Charging Port / Speaker Issue</option>
                    <option value="Motherboard / IC Diagnostics">Motherboard / IC Diagnostics</option>
                    <option value="Software / Unlock / Flashing">Software / Flashing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Preferred Visit Date *</label>
                <input
                  type="date"
                  required
                  value={bookingForm.preferredDate}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, preferredDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Describe the Issue *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Briefly describe what happened to the device..."
                  value={bookingForm.issueDescription}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, issueDescription: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingOpen(false)}
                  className="px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#FF8618] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {bookingSubmitting ? 'Submitting...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: WRITE CUSTOMER REVIEW
      ===================================================================== */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1B1D1C] max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 border border-black/10 dark:border-white/15 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <h3 className="font-display text-lg font-bold">Submit Product Review</h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Product *</label>
                <select
                  value={reviewForm.productId}
                  onChange={(e) => setReviewForm({ ...reviewForm, productId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Rating (1 to 5 Stars) *</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, rating: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                >
                  <option value={5}>5 Stars — Excellent</option>
                  <option value={4}>4 Stars — Very Good</option>
                  <option value={3}>3 Stars — Good</option>
                  <option value={2}>2 Stars — Fair</option>
                  <option value={1}>1 Star — Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Order Number (Optional — for Verified Purchase verification)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NBR-2026-XXXXX"
                  value={reviewForm.orderId}
                  onChange={(e) => setReviewForm({ ...reviewForm, orderId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Your Review *</label>
                <textarea
                  rows={4}
                  required
                  minLength={5}
                  placeholder="Share your experience with the device and Noborup service..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#FF8618] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit for Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
