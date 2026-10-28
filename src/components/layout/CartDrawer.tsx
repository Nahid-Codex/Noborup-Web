import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    storeSettings,
  } = useStore();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const estimatedDelivery =
    cartSubtotal === 0
      ? 0
      : cartSubtotal >= storeSettings.freeDeliveryThreshold
      ? 0
      : storeSettings.insideMeherpurFee;

  const finalEstimate = cartSubtotal + estimatedDelivery;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-[#1B1D1C] h-full flex flex-col shadow-2xl border-l border-black/10 dark:border-white/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#FF8618]" />
            <h2 className="font-display text-lg font-bold">Shopping Cart</h2>
            <span className="text-xs text-[#686E6B] dark:text-[#9CA3AF] font-mono">
              ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart drawer"
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress Banner */}
        {cartSubtotal > 0 && (
          <div className="px-6 py-2.5 bg-[#F7F7F5] dark:bg-[#111312] border-b border-black/5 dark:border-white/10 text-xs">
            {cartSubtotal >= storeSettings.freeDeliveryThreshold ? (
              <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                Your order qualifies for complimentary delivery!
              </p>
            ) : (
              <p className="text-[#4B504E] dark:text-[#B4B9B6]">
                Add{' '}
                <span className="font-mono font-semibold text-[#FF8618]">
                  ৳{(storeSettings.freeDeliveryThreshold - cartSubtotal).toLocaleString()}
                </span>{' '}
                more for free delivery across Bangladesh.
              </p>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-12 h-12 text-[#9CA3AF] mb-3 stroke-[1.5]" />
              <p className="font-display text-base font-semibold mb-1">Your cart is empty</p>
              <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] max-w-xs mb-6">
                Explore new smartphones, certified pre-owned devices, and original accessories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/catalog');
                }}
                className="px-5 py-2.5 rounded-lg bg-[#FF8618] text-white text-sm font-semibold hover:bg-[#e8750c]"
              >
                Explore Products
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.product.id}_${item.selectedVariant}`}
                className="flex gap-4 p-3 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/8 dark:border-white/10"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-lg object-cover bg-white dark:bg-[#1B1D1C] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">{item.product.name}</h4>
                  <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mt-0.5 truncate">
                    {item.selectedVariant} · {item.product.condition}
                  </p>
                  <p className="text-sm font-mono font-bold text-[#FF8618] mt-1">
                    ৳{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-[#1B1D1C]">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.selectedVariant,
                            item.quantity - 1
                          )
                        }
                        aria-label="Decrease quantity"
                        className="p-1.5 hover:text-[#FF8618]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-mono font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.selectedVariant,
                            item.quantity + 1
                          )
                        }
                        disabled={item.quantity >= item.product.stockQuantity}
                        aria-label="Increase quantity"
                        className="p-1.5 hover:text-[#FF8618] disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id, item.selectedVariant)}
                      aria-label="Remove item"
                      className="p-1.5 text-[#686E6B] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-black/10 dark:border-white/10 bg-[#F7F7F5] dark:bg-[#111312] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#4B504E] dark:text-[#B4B9B6]">
                <span>Subtotal</span>
                <span className="font-mono font-medium">৳{cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#4B504E] dark:text-[#B4B9B6]">
                <span>Delivery (Inside Meherpur Est.)</span>
                <span className="font-mono font-medium">
                  {estimatedDelivery === 0 ? 'Free' : `৳${estimatedDelivery}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-black/10 dark:border-white/10">
                <span>Estimated Total</span>
                <span className="font-mono text-[#FF8618]">
                  ৳{finalEstimate.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white font-semibold text-sm transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
