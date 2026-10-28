import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Heart,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, publicProfile, logout } = useAuth();
  const { cartCount, wishlistIds, setIsCartOpen, storeSettings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const userPhotoURL = !avatarLoadError ? publicProfile?.photoURL || user?.photoURL || '' : '';
  const userDisplayName =
    publicProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Account';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const primaryLinks = [
    { label: 'Home', to: '/' },
    { label: 'All Products', to: '/catalog' },
    { label: 'iPhone', to: '/catalog?category=iphone' },
    { label: 'Android', to: '/catalog?category=android' },
    { label: 'Used Phones', to: '/catalog?condition=Used' },
    { label: 'Accessories', to: '/catalog?category=accessories' },
    { label: 'Smartwatch', to: '/catalog?category=smartwatch' },
    { label: 'Services', to: '/services' },
    { label: 'Videos', to: '/videos' },
    { label: 'Contact', to: '/contact' },
  ];

  const desktopNavLinks = [
    { label: 'All Products', to: '/catalog' },
    { label: 'iPhone', to: '/catalog?category=iphone' },
    { label: 'Android', to: '/catalog?category=android' },
    { label: 'Used Phones', to: '/catalog?condition=Used' },
    { label: 'Services', to: '/services' },
    { label: 'Videos', to: '/videos' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#1B1D1C]/95 backdrop-blur-md border-b border-black/8 dark:border-white/10 transition-colors">
      {/* Slim Announcement Bar */}
      <div className="bg-[#111312] dark:bg-[#0B0C0C] text-[#F5F5F3] text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <p className="truncate font-medium tracking-wide text-center max-w-full">
            {storeSettings.announcementText}
          </p>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-[#111312] dark:text-white whitespace-nowrap shrink-0"
        >
          <img
            src={storeSettings.logoURL || '/assets/aistudio/logo_4b9b38e6.jpg'}
            alt={storeSettings.storeName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-black/10 dark:border-white/15 shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">
            <span className="text-[#FF8618]">N</span>oborup
          </span>
        </Link>

        {/* Zone 2: Desktop & Landscape Tablet Navigation Links */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs xl:text-sm font-medium text-[#4B504E] dark:text-[#B4B9B6] overflow-x-auto no-scrollbar">
          {desktopNavLinks.map((item) => {
            const isActive =
              location.pathname + location.search === item.to ||
              (item.to === '/' && location.pathname === '/' && !location.search);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#FF8618] ${
                  isActive
                    ? 'text-[#FF8618] font-semibold border-b-2 border-[#FF8618]'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Interactive Actions */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search catalog"
            className="p-2 rounded-lg text-[#111312] dark:text-[#F5F5F3] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg text-[#111312] dark:text-[#F5F5F3] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF8618]" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Wishlist Link */}
          <Link
            to="/account?tab=wishlist"
            aria-label="Saved Wishlist"
            className="relative p-2 rounded-lg text-[#111312] dark:text-[#F5F5F3] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-[#FF8618] text-white text-[10px] sm:text-[11px] font-mono font-semibold flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          {/* Shopping Cart Trigger */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open shopping cart"
            className="relative p-2 rounded-lg text-[#111312] dark:text-[#F5F5F3] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-[#FF8618] text-white text-[10px] sm:text-[11px] font-mono font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Admin Quick Button (Authorized Admins Only) */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111312] dark:bg-white text-white dark:text-[#111312] text-xs font-semibold whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
            >
              <ShieldCheck className="w-4 h-4 text-[#FF8618]" />
              <span>Admin</span>
            </Link>
          )}

          {/* Account Menu / Sign In */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full border border-black/12 dark:border-white/15 text-xs font-semibold hover:border-[#FF8618] transition-colors whitespace-nowrap shrink-0 bg-[#F7F7F5] dark:bg-white/5"
              >
                {userPhotoURL ? (
                  <img
                    src={userPhotoURL}
                    alt={userDisplayName}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarLoadError(true)}
                    className="w-6 h-6 rounded-full object-cover border border-[#FF8618]/40 shrink-0"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#FF8618] text-white font-display font-bold text-[11px] flex items-center justify-center shrink-0">
                    {userInitial}
                  </span>
                )}
                <span className="hidden md:inline max-w-[90px] xl:max-w-[110px] truncate text-[#111312] dark:text-white">
                  {userDisplayName}
                </span>
              </button>

              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div
                    onMouseLeave={() => setAccountMenuOpen(false)}
                    className="absolute right-0 mt-2 w-60 rounded-xl bg-white dark:bg-[#1B1D1C] shadow-lg border border-black/10 dark:border-white/15 py-2 z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-black/5 dark:border-white/10 flex items-center gap-3">
                      {userPhotoURL ? (
                        <img
                          src={userPhotoURL}
                          alt={userDisplayName}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarLoadError(true)}
                          className="w-9 h-9 rounded-full object-cover border border-[#FF8618]/40 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#FF8618]/15 text-[#FF8618] font-display font-bold text-sm flex items-center justify-center shrink-0">
                          {userInitial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-[#111312] dark:text-white">
                          {userDisplayName}
                        </p>
                        <p className="text-[11px] text-[#686E6B] dark:text-[#9CA3AF] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/account?tab=profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/account?tab=orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <Package className="w-4 h-4" />
                      <span>My Orders</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#FF8618] font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        setAccountMenuOpen(false);
                        await logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#FF8618] hover:bg-[#e8750c] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Mobile & Tablet Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-lg text-[#111312] dark:text-[#F5F5F3] hover:bg-black/5 dark:hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-black/10 dark:border-white/10 bg-[#F7F7F5] dark:bg-[#111312] py-3 px-4">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#686E6B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search model, brand (iPhone, Samsung, Realme), or SKU..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#1B1D1C] border border-black/15 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
              />
            </div>
            <button
              type="submit"
              className="px-4 sm:px-5 py-2.5 rounded-lg bg-[#FF8618] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 hover:bg-[#e8750c]"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#1B1D1C] px-4 py-4 space-y-3 shadow-xl max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#686E6B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phones or accessories..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-xs sm:text-sm focus:outline-none focus:border-[#FF8618]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#FF8618] text-white text-xs font-semibold shrink-0"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {primaryLinks.map((item) => {
              const isActive =
                location.pathname + location.search === item.to ||
                (item.to === '/' && location.pathname === '/' && !location.search);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#FF8618]/12 text-[#FF8618] font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/catalog?condition=New"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
            >
              New Phones
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-[#FF8618] bg-[#FF8618]/10 hover:bg-[#FF8618]/15"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
