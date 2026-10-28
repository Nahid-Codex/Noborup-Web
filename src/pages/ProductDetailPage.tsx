import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  BatteryCharging,
  CheckCircle2,
  Heart,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { submitCustomerReview } from '../services/firestoreService';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    products,
    reviews,
    storeSettings,
    addToCart,
    wishlistIds,
    toggleWishlist,
    toggleCompare,
    recordRecentlyViewed,
    showToast,
    refreshStoreData,
  } = useStore();
  const { user } = useAuth();

  const product = products.find((p) => p.slug === slug || p.id === slug);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedVariant(product.variants[0] || 'Standard');
      setQuantity(1);
      recordRecentlyViewed(product.id);
      document.title = `${product.name} — ৳${product.price.toLocaleString()} | Noborup`;
    }
  }, [product, recordRecentlyViewed]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Product Not Found</h1>
        <p className="text-sm text-[#686E6B] dark:text-[#9CA3AF]">
          The device or accessory you are looking for may have been sold out or moved.
        </p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF8618] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Products</span>
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(product.id);
  const hasDiscount = product.compareAtPrice > product.price;
  const productReviews = reviews.filter(
    (r) => r.productId === product.id && r.status === 'approved'
  );
  const relatedProducts = products
    .filter(
      (p) =>
        p.isPublished &&
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug || p.brand === product.brand)
    )
    .slice(0, 4);

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to submit a review.', 'error');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitCustomerReview({
        productId: product.id,
        productName: product.name,
        rating,
        comment,
        orderId,
      });
      showToast('Review submitted! It will appear once approved by a moderator.');
      setComment('');
      setOrderId('');
      await refreshStoreData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Structured JSON-LD Product Schema
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    description: product.description,
    image: product.images,
    itemCondition:
      product.condition === 'Used'
        ? 'https://schema.org/UsedCondition'
        : 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: product.price,
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-[#686E6B] dark:text-[#9CA3AF]">
        <Link to="/" className="hover:text-[#FF8618]">
          Home
        </Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-[#FF8618]">
          Catalog
        </Link>
        <span>/</span>
        <Link
          to={`/catalog?category=${encodeURIComponent(product.categorySlug)}`}
          className="hover:text-[#FF8618] capitalize"
        >
          {product.categorySlug.replace('-', ' ')}
        </Link>
        <span>/</span>
        <span className="text-[#111312] dark:text-white font-medium truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3 sm:space-y-4">
          <div className="aspect-4/3 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10 overflow-hidden flex items-center justify-center p-4">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${
                    activeImageIndex === idx
                      ? 'border-[#FF8618]'
                      : 'border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1B1D1C] rounded-2xl sm:rounded-3xl border border-black/8 dark:border-white/10 p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Unboxed Metadata Line */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-[#686E6B] dark:text-[#9CA3AF]">
            <span className="font-semibold text-[#111312] dark:text-white">{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                product.condition === 'Used'
                  ? 'text-[#FF8618] font-semibold'
                  : 'text-emerald-700 dark:text-emerald-400 font-semibold'
              }
            >
              {product.condition === 'Used' ? 'Certified Pre-Owned' : 'Brand New'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">SKU: {product.sku}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#FF8618] fill-[#FF8618]" />
              <span className="font-mono">{product.ratingAvg.toFixed(1)}</span>
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            {product.name}
          </h1>

          {/* Price Block */}
          <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#FF8618] tabular-nums">
              ৳{product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="font-mono text-sm sm:text-base text-[#8C928F] line-through tabular-nums">
                  ৳{product.compareAtPrice.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  Save ৳{(product.compareAtPrice - product.price).toLocaleString()}
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-[#4B504E] dark:text-[#C4C9C6] leading-relaxed">
            {product.description}
          </p>

          {/* Used Phone Specific Diagnostic Report */}
          {product.condition === 'Used' && (
            <div className="p-4 rounded-2xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/8 dark:border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF8618]">
                <BatteryCharging className="w-4 h-4" />
                <span>Noborup Pre-Owned Diagnostic Report</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {product.specifications.batteryHealth && (
                  <p>
                    <span className="text-[#686E6B] dark:text-[#9CA3AF]">Battery Health: </span>
                    <strong className="font-semibold">{product.specifications.batteryHealth}</strong>
                  </p>
                )}
                {product.specifications.cosmeticCondition && (
                  <p>
                    <span className="text-[#686E6B] dark:text-[#9CA3AF]">Cosmetic Grade: </span>
                    <strong className="font-semibold">
                      {product.specifications.cosmeticCondition}
                    </strong>
                  </p>
                )}
                {product.specifications.repairHistory && (
                  <p className="sm:col-span-2">
                    <span className="text-[#686E6B] dark:text-[#9CA3AF]">Repair History: </span>
                    <strong className="font-semibold">{product.specifications.repairHistory}</strong>
                  </p>
                )}
                {product.specifications.includedAccessories && (
                  <p className="sm:col-span-2">
                    <span className="text-[#686E6B] dark:text-[#9CA3AF]">Included in Box: </span>
                    <strong className="font-semibold">
                      {product.specifications.includedAccessories}
                    </strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Variants Selector */}
          {product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-semibold mb-2">
                Available Color / Storage Variant
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      selectedVariant === variant
                        ? 'border-[#FF8618] bg-[#FF8618]/10 text-[#FF8618]'
                        : 'border-black/15 dark:border-white/15 hover:border-[#FF8618]'
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Primary Purchase CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">
                Availability:{' '}
                <span
                  className={
                    product.stockQuantity > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-500'
                  }
                >
                  {product.stockQuantity > 0
                    ? `In Stock (${product.stockQuantity} units available)`
                    : 'Out of Stock'}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Quantity Stepper */}
              <div className="inline-flex items-center rounded-xl border border-black/15 dark:border-white/15 bg-[#F7F7F5] dark:bg-[#111312]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-3 text-sm font-bold"
                >
                  -
                </button>
                <span className="px-4 text-sm font-mono font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  className="px-3.5 py-3 text-sm font-bold"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                disabled={product.stockQuantity <= 0}
                onClick={() => addToCart(product, quantity, selectedVariant)}
                className="flex-1 min-w-[140px] py-3.5 px-5 rounded-xl bg-[#111312] dark:bg-white text-white dark:text-[#111312] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Buy Now */}
              <button
                type="button"
                disabled={product.stockQuantity <= 0}
                onClick={handleBuyNow}
                className="flex-1 min-w-[140px] py-3.5 px-5 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white font-semibold text-sm transition-colors disabled:opacity-40"
              >
                Buy Now
              </button>
            </div>

            {/* Secondary Actions: Wishlist, Compare, WhatsApp Direct */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-black/12 dark:border-white/15 text-xs font-semibold hover:border-[#FF8618]"
              >
                <Heart
                  className={`w-4 h-4 ${isWishlisted ? 'text-[#FF8618] fill-[#FF8618]' : ''}`}
                />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCompare(product)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-black/12 dark:border-white/15 text-xs font-semibold hover:border-[#FF8618]"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Compare Specs</span>
              </button>

              <a
                href={`https://wa.me/${storeSettings.whatsappNumber.replace(
                  /[^0-9]/g,
                  ''
                )}?text=${encodeURIComponent(
                  `Assalamu Alaikum Noborup, I want to inquire about ${product.name} (SKU: ${product.sku}, Price: ৳${product.price}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366]/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Inquire on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Warranty, Delivery & Return Summary */}
          <div className="pt-4 border-t border-black/8 dark:border-white/10 space-y-2.5 text-xs text-[#4B504E] dark:text-[#B4B9B6]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#FF8618] shrink-0" />
              <span>
                <strong>Warranty:</strong> {product.warrantyInfo || 'Showroom Tested Warranty'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#FF8618] shrink-0" />
              <span>
                <strong>Delivery:</strong> Inside Meherpur ৳{storeSettings.insideMeherpurFee} ·
                Outside Meherpur ৳{storeSettings.outsideMeherpurFee} (Free above ৳
                {storeSettings.freeDeliveryThreshold.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FF8618] shrink-0" />
              <span>
                <strong>Showroom Pickup:</strong> Kedargonj Bazar, Mujibnagar, Meherpur
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications Table */}
      <section className="bg-white dark:bg-[#1B1D1C] rounded-3xl border border-black/8 dark:border-white/10 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold mb-6">Full Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-sm">
          {Object.entries(product.specifications).map(([key, val]) => {
            if (!val) return null;
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (s) => s.toUpperCase());
            return (
              <div
                key={key}
                className="flex justify-between py-2.5 border-b border-black/6 dark:border-white/8 gap-4"
              >
                <span className="text-[#686E6B] dark:text-[#9CA3AF] font-medium">
                  {formattedKey}
                </span>
                <span className="font-semibold text-right">{val}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer Ratings & Reviews Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-xl font-bold">
            Customer Reviews ({productReviews.length})
          </h2>
          {productReviews.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10 text-sm text-[#686E6B] dark:text-[#9CA3AF]">
              No approved reviews yet for this item. Be the first customer to review it!
            </div>
          ) : (
            productReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-sm">{rev.customerName}</span>
                    {rev.verifiedPurchase && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Verified Purchase
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 text-[#FF8618]">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#4B504E] dark:text-[#C4C9C6]">{rev.comment}</p>
                {rev.adminReply && (
                  <p className="text-xs bg-[#F7F7F5] dark:bg-[#111312] p-2.5 rounded-lg">
                    <strong>Noborup:</strong> {rev.adminReply}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Submit Review Form */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10">
            <h3 className="font-display text-lg font-bold mb-1">Write a Review</h3>
            <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mb-4">
              Reviews are moderated before public display to ensure authentic feedback.
            </p>
            <form onSubmit={handleReviewSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Star Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
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
                  Order Number (Optional — for Verified Purchase badge)
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="NBR-2026-XXXXX"
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Your Feedback *</label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How is the battery life, camera, or build quality?"
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/15 dark:border-white/15 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white text-sm font-semibold disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold">Related Devices &amp; Gear</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
