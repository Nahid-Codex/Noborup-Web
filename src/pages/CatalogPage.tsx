import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { useStore } from '../context/StoreContext';

const ITEMS_PER_PAGE = 9;

export const CatalogPage: React.FC = () => {
  const { products, categories, loadingStore } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || 'all';
  const initialCondition = searchParams.get('condition') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [searchText, setSearchText] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState(initialCondition);
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync URL params when navigated from Navbar
  React.useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedCondition(searchParams.get('condition') || 'all');
    setSearchText(searchParams.get('q') || '');
    setCurrentPage(1);
  }, [searchParams]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products
      .filter((p) => p.isPublished)
      .forEach((p) => {
        if (p.brand) set.add(p.brand);
      });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.isPublished)
      .filter((p) => {
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'accessories') {
            const accSlugs = ['accessories', 'phone-covers', 'chargers-cables', 'earbuds-headphones'];
            if (!accSlugs.includes(p.categorySlug)) return false;
          } else if (p.categorySlug !== selectedCategory) {
            return false;
          }
        }
        if (selectedBrand !== 'all' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
        if (selectedCondition !== 'all' && p.condition !== selectedCondition) {
          return false;
        }
        if (p.price > maxPrice) {
          return false;
        }
        if (inStockOnly && p.stockQuantity <= 0) {
          return false;
        }
        if (searchText.trim()) {
          const q = searchText.trim().toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchSku && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.ratingAvg - a.ratingAvg;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [
    products,
    selectedCategory,
    selectedBrand,
    selectedCondition,
    maxPrice,
    inStockOnly,
    searchText,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedCondition('all');
    setMaxPrice(150000);
    setInStockOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedBrand !== 'all' ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0) +
    (maxPrice < 150000 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 sm:pb-8 border-b border-black/10 dark:border-white/10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Smartphones &amp; Accessories Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#686E6B] dark:text-[#9CA3AF] mt-1">
            Showing <span className="font-mono font-semibold">{filteredProducts.length}</span>{' '}
            verified products from Noborup database.
          </p>
        </div>

        {/* Search, Mobile Filter Toggle & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64 md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#686E6B]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search model, brand, SKU..."
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-[#1B1D1C] border border-black/12 dark:border-white/15 text-xs sm:text-sm focus:outline-none focus:border-[#FF8618]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-[#1B1D1C] border border-black/12 dark:border-white/15 text-xs sm:text-sm font-semibold shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#FF8618]" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FF8618] text-white text-[10px] font-mono">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort products"
              className="flex-1 sm:flex-none px-3.5 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-[#1B1D1C] border border-black/12 dark:border-white/15 text-xs sm:text-sm font-medium"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price-asc">Price: Low to High (৳)</option>
              <option value="price-desc">Price: High to Low (৳)</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Scrollable Category Bar for Mobile & Tablet */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar py-4 border-b border-black/6 dark:border-white/8">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#FF8618] text-white'
              : 'bg-white dark:bg-[#1B1D1C] border border-black/10 dark:border-white/10 text-[#4B504E] dark:text-[#B4B9B6]'
          }`}
        >
          All Categories
        </button>
        {categories
          .filter((c) => c.isActive && c.slug !== 'mobile-services')
          .map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCategory(c.slug);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === c.slug
                  ? 'bg-[#FF8618] text-white'
                  : 'bg-white dark:bg-[#1B1D1C] border border-black/10 dark:border-white/10 text-[#4B504E] dark:text-[#B4B9B6]'
              }`}
            >
              {c.name}
            </button>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-6 sm:pt-8">
        {/* Sidebar Filters (Collapsible on Mobile/Tablet, Permanent on Desktop) */}
        <aside
          className={`lg:col-span-3 space-y-6 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-bold text-base">
                <SlidersHorizontal className="w-4 h-4 text-[#FF8618]" />
                <span>Filters</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#FF8618] font-semibold hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-xs font-semibold mb-2">Device Condition</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F7F7F5] dark:bg-[#111312]">
                {['all', 'New', 'Used'].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => {
                      setSelectedCondition(cond);
                      setCurrentPage(1);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedCondition === cond
                        ? 'bg-[#FF8618] text-white'
                        : 'text-[#4B504E] dark:text-[#B4B9B6]'
                    }`}
                  >
                    {cond === 'all' ? 'All' : cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold mb-2">Category</label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[#FF8618]/15 text-[#FF8618] font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  All Categories
                </button>
                {categories
                  .filter((c) => c.isActive && c.slug !== 'mobile-services')
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c.slug);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedCategory === c.slug
                          ? 'bg-[#FF8618]/15 text-[#FF8618] font-semibold'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-semibold mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/10 dark:border-white/15 text-xs font-medium"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Price Range */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span>Max Price</span>
                <span className="font-mono text-[#FF8618]">৳{maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={500}
                max={150000}
                step={500}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-[#FF8618]"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#686E6B] mt-1">
                <span>৳500</span>
                <span>৳150,000</span>
              </div>
            </div>

            {/* Availability Checkbox */}
            <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer pt-2 border-t border-black/8 dark:border-white/10">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded accent-[#FF8618] w-4 h-4"
              />
              <span>In-Stock Items Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {loadingStore ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-80 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#1B1D1C] border border-black/8 dark:border-white/10 text-center space-y-4">
              <p className="font-display text-lg font-bold">No matching products found</p>
              <p className="text-xs sm:text-sm text-[#686E6B] dark:text-[#9CA3AF] max-w-md mx-auto">
                Try clearing your search query or adjusting the price and condition filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-[#FF8618] text-white text-sm font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-8 sm:pt-10">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3.5 sm:px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-xs font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-mono font-semibold ${
                        currentPage === i + 1
                          ? 'bg-[#FF8618] text-white'
                          : 'border border-black/15 dark:border-white/15'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3.5 sm:px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-xs font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
