import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Eye, Heart, ShoppingBag, Smartphone, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    wishlistIds,
    toggleWishlist,
    setQuickViewProduct,
    compareList,
    toggleCompare,
  } = useStore();
  const [imgError, setImgError] = useState(false);

  const isWishlisted = wishlistIds.includes(product.id);
  const isCompared = compareList.some((p) => p.id === product.id);
  const hasDiscount = product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="group bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image Container (4:3 Ratio) */}
      <div className="relative aspect-4/3 bg-[#F2F2EE] dark:bg-[#141615] overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {!imgError && product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-103"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#27272A] to-[#18181B] text-white">
              <Smartphone className="w-10 h-10 text-[#FF8618] mb-2" />
              <span className="text-xs font-medium text-white/80 line-clamp-2">{product.name}</span>
            </div>
          )}
        </Link>

        {/* Action Icon Buttons (Wishlist, Quick View, Compare) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md border transition-colors ${
              isWishlisted
                ? 'bg-[#FF8618] text-white border-[#FF8618]'
                : 'bg-white/90 dark:bg-[#1B1D1C]/90 text-[#111312] dark:text-white border-black/10 dark:border-white/15 hover:border-[#FF8618]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            aria-label="Quick view product"
            className="w-9 h-9 rounded-lg bg-white/90 dark:bg-[#1B1D1C]/90 text-[#111312] dark:text-white border border-black/10 dark:border-white/15 flex items-center justify-center backdrop-blur-md hover:border-[#FF8618] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => toggleCompare(product)}
            aria-label="Compare product"
            className={`w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md border transition-colors ${
              isCompared
                ? 'bg-[#111312] dark:bg-white text-white dark:text-[#111312] border-[#111312]'
                : 'bg-white/90 dark:bg-[#1B1D1C]/90 text-[#111312] dark:text-white border-black/10 dark:border-white/15 hover:border-[#FF8618]'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area — Zero-Pill Unboxed Metadata */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Clean Unboxed Metadata Line */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#686E6B] dark:text-[#9CA3AF] mb-1.5">
            <span className="font-semibold text-[#111312] dark:text-[#E4E6E5]">
              {product.brand}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                product.condition === 'Used'
                  ? 'text-[#FF8618] font-medium'
                  : 'text-emerald-700 dark:text-emerald-400 font-medium'
              }
            >
              {product.condition === 'Used' ? 'Certified Pre-Owned' : 'Brand New'}
            </span>
            {hasDiscount && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#FF8618] font-mono font-semibold">-{discountPercent}%</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${product.slug}`}
            className="font-display text-sm sm:text-base font-semibold text-[#111312] dark:text-[#F5F5F3] hover:text-[#FF8618] transition-colors line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>

          {/* Used Phone Battery Health or Primary Spec Summary */}
          {product.condition === 'Used' && product.specifications?.batteryHealth ? (
            <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-1.5 truncate">
              Battery: {product.specifications.batteryHealth} ·{' '}
              {product.specifications.cosmeticCondition || 'A+ Grade'}
            </p>
          ) : (
            product.specifications?.storage && (
              <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-1.5 truncate">
                {product.specifications.storage}
                {product.specifications.ram ? ` · ${product.specifications.ram} RAM` : ''}
              </p>
            )
          )}
        </div>

        {/* Bottom Price & CTA Row */}
        <div className="pt-3 border-t border-black/6 dark:border-white/8 flex flex-wrap items-end justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <span className="font-mono text-base sm:text-lg font-bold text-[#111312] dark:text-white tabular-nums">
                ৳{product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="font-mono text-xs text-[#8C928F] line-through tabular-nums">
                  ৳{product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#686E6B] dark:text-[#9CA3AF] mt-0.5">
              <Star className="w-3.5 h-3.5 text-[#FF8618] fill-[#FF8618] shrink-0" />
              <span className="font-mono">{product.ratingAvg.toFixed(1)}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} in stock`
                  : 'Out of stock'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            disabled={product.stockQuantity <= 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg bg-[#111312] dark:bg-white text-white dark:text-[#111312] hover:bg-[#FF8618] dark:hover:bg-[#FF8618] dark:hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{product.stockQuantity > 0 ? 'Add to Cart' : 'Sold Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
