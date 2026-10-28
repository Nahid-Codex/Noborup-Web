import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  if (!quickViewProduct) return null;

  const activeVariant = selectedVariant || quickViewProduct.variants[0] || 'Standard';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1B1D1C] max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/15 shadow-2xl grid grid-cols-1 md:grid-cols-2">
        {/* Image Side */}
        <div className="bg-[#F2F2EE] dark:bg-[#141615] p-5 sm:p-6 flex items-center justify-center">
          <img
            src={quickViewProduct.images[0]}
            alt={quickViewProduct.name}
            referrerPolicy="no-referrer"
            className="w-full max-h-56 sm:max-h-80 object-contain rounded-xl"
          />
        </div>

        {/* Details Side */}
        <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-[#686E6B] dark:text-[#9CA3AF]">
              <span>
                {quickViewProduct.brand} · {quickViewProduct.condition} · SKU: {quickViewProduct.sku}
              </span>
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                aria-label="Close quick view"
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-display text-xl font-bold mt-2">{quickViewProduct.name}</h3>

            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="font-mono text-2xl font-bold text-[#FF8618] tabular-nums">
                ৳{quickViewProduct.price.toLocaleString()}
              </span>
              {quickViewProduct.compareAtPrice > quickViewProduct.price && (
                <span className="font-mono text-sm text-[#8C928F] line-through tabular-nums">
                  ৳{quickViewProduct.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-sm text-[#4B504E] dark:text-[#B4B9B6] mt-3 line-clamp-3 leading-relaxed">
              {quickViewProduct.description}
            </p>

            {/* Used Phone Diagnostics Callout */}
            {quickViewProduct.condition === 'Used' && (
              <div className="mt-4 p-3 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/8 dark:border-white/10 text-xs space-y-1">
                {quickViewProduct.specifications.batteryHealth && (
                  <p>
                    <strong className="font-semibold">Battery Health:</strong>{' '}
                    {quickViewProduct.specifications.batteryHealth}
                  </p>
                )}
                {quickViewProduct.specifications.cosmeticCondition && (
                  <p>
                    <strong className="font-semibold">Cosmetic Condition:</strong>{' '}
                    {quickViewProduct.specifications.cosmeticCondition}
                  </p>
                )}
                {quickViewProduct.specifications.repairHistory && (
                  <p>
                    <strong className="font-semibold">Repair History:</strong>{' '}
                    {quickViewProduct.specifications.repairHistory}
                  </p>
                )}
              </div>
            )}

            {/* Variants */}
            {quickViewProduct.variants.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-semibold mb-1.5">Select Variant</label>
                <div className="flex flex-wrap gap-2">
                  {quickViewProduct.variants.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        activeVariant === v
                          ? 'border-[#FF8618] bg-[#FF8618]/10 text-[#FF8618]'
                          : 'border-black/15 dark:border-white/15 hover:border-[#FF8618]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-black/15 dark:border-white/15 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-sm font-bold"
                >
                  -
                </button>
                <span className="px-3 text-sm font-mono font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(quickViewProduct.stockQuantity, q + 1))
                  }
                  className="px-3 py-2 text-sm font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  addToCart(quickViewProduct, quantity, activeVariant);
                  setQuickViewProduct(null);
                }}
                disabled={quickViewProduct.stockQuantity <= 0}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[#686E6B] dark:text-[#9CA3AF]">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {quickViewProduct.warrantyInfo || 'Showroom Tested'}
              </span>
              <Link
                to={`/product/${quickViewProduct.slug}`}
                onClick={() => setQuickViewProduct(null)}
                className="text-[#FF8618] font-semibold hover:underline"
              >
                View Full Specs &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
