import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  addWishlistItemToFirestore,
  fetchCategories,
  fetchProducts,
  fetchReviews,
  fetchStoreSettings,
  fetchUserWishlist,
  fetchVideos,
  removeWishlistItemFromFirestore,
} from '../services/firestoreService';
import { CartItem, Category, Product, Review, SocialVideo, StoreSettings } from '../types';
import {
  DEFAULT_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_VIDEOS,
} from '../utils/seedData';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  reviews: Review[];
  videos: SocialVideo[];
  storeSettings: StoreSettings;
  loadingStore: boolean;
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  removeFromCart: (productId: string, variant: string) => void;
  updateCartQuantity: (productId: string, variant: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  recentlyViewedIds: string[];
  recordRecentlyViewed: (productId: string) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  refreshStoreData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'noborup_cart_v1';
const GUEST_WISHLIST_KEY = 'noborup_wishlist_v1';
const RECENTLY_VIEWED_KEY = 'noborup_recent_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [videos, setVideos] = useState<SocialVideo[]>(INITIAL_VIDEOS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loadingStore, setLoadingStore] = useState<boolean>(true);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshStoreData = useCallback(async () => {
    setLoadingStore(true);
    try {
      const [prods, cats, revs, vids, settings] = await Promise.all([
        fetchProducts(isAdmin),
        fetchCategories(isAdmin),
        fetchReviews(isAdmin),
        fetchVideos(isAdmin),
        fetchStoreSettings(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setReviews(revs);
      setVideos(vids);
      setStoreSettings(settings);
    } finally {
      setLoadingStore(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refreshStoreData();
  }, [refreshStoreData]);

  // Persist cart locally and keep product references fresh
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  // Sync cart items with latest product prices/stock when products update
  useEffect(() => {
    if (products.length === 0) return;
    setCart((prev) =>
      prev
        .map((item) => {
          const fresh = products.find((p) => p.id === item.product.id);
          if (!fresh) return item;
          return {
            ...item,
            product: fresh,
            quantity: Math.min(item.quantity, Math.max(1, fresh.stockQuantity)),
          };
        })
        .filter((item) => item.product.stockQuantity > 0)
    );
  }, [products]);

  // Sync and merge guest wishlist with Firestore when customer logs in
  useEffect(() => {
    const syncWishlist = async () => {
      if (user && user.emailVerified) {
        const remoteIds = await fetchUserWishlist(user.uid);
        const localRaw = localStorage.getItem(GUEST_WISHLIST_KEY);
        const localIds: string[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = Array.from(new Set([...remoteIds, ...localIds]));
        setWishlistIds(merged);
        for (const pid of localIds) {
          if (!remoteIds.includes(pid)) {
            try {
              await addWishlistItemToFirestore(user.uid, pid);
            } catch {
              // Ignore individual merge failure
            }
          }
        }
      }
    };
    syncWishlist();
  }, [user]);

  const addToCart = (product: Product, quantity = 1, variant?: string) => {
    if (product.stockQuantity <= 0) {
      showToast('This product is currently out of stock.', 'error');
      return;
    }
    const chosenVariant = variant || product.variants[0] || 'Standard';
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) => ci.product.id === product.id && ci.selectedVariant === chosenVariant
      );
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const nextQty = Math.min(product.stockQuantity, currentQty + quantity);
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], product, quantity: nextQty };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: Math.min(product.stockQuantity, Math.max(1, quantity)),
          selectedVariant: chosenVariant,
        },
      ];
    });
    showToast(`Added "${product.name}" to your cart.`);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variant: string) => {
    setCart((prev) =>
      prev.filter((ci) => !(ci.product.id === productId && ci.selectedVariant === variant))
    );
    showToast('Removed item from cart.', 'info');
  };

  const updateCartQuantity = (productId: string, variant: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.product.id === productId && ci.selectedVariant === variant) {
          const maxQty = Math.min(20, ci.product.stockQuantity);
          return { ...ci, quantity: Math.min(maxQty, quantity) };
        }
        return ci;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleWishlist = async (productId: string) => {
    const exists = wishlistIds.includes(productId);
    const next = exists
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];
    setWishlistIds(next);
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(next));

    if (user && user.emailVerified) {
      try {
        if (exists) {
          await removeWishlistItemFromFirestore(user.uid, productId);
        } else {
          await addWishlistItemToFirestore(user.uid, productId);
        }
      } catch {
        // Fallback already saved locally
      }
    }
    showToast(exists ? 'Removed from wishlist.' : 'Saved to your wishlist.', 'info');
  };

  const toggleCompare = (product: Product) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from comparison.`, 'info');
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        showToast('You can compare up to 3 products at a time.', 'error');
        return prev;
      }
      showToast(`Added "${product.name}" to comparison.`);
      return [...prev, product];
    });
  };

  const clearCompare = () => setCompareList([]);

  const recordRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewedIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 6);
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        reviews,
        videos,
        storeSettings,
        loadingStore,
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartCount,
        wishlistIds,
        toggleWishlist,
        compareList,
        toggleCompare,
        clearCompare,
        quickViewProduct,
        setQuickViewProduct,
        recentlyViewedIds,
        recordRecentlyViewed,
        toasts,
        showToast,
        dismissToast,
        refreshStoreData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
