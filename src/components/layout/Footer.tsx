import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const { storeSettings } = useStore();
  const [activePolicyModal, setActivePolicyModal] = useState<
    'shipping' | 'return' | 'warranty' | null
  >(null);

  return (
    <footer
      id="contact"
      className="bg-[#111312] text-[#E4E6E5] border-t border-white/10 pt-16 pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Brand & Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={storeSettings.logoURL || '/assets/aistudio/logo_4b9b38e6.jpg'}
                alt={storeSettings.storeName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover border border-white/15"
              />
              <div>
                <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                  <span className="text-[#FF8618]">N</span>oborup
                </h3>
                <p className="text-xs text-[#A0A6A3]">
                  New &amp; Pre-Owned Smartphones · Accessories · Servicing
                </p>
              </div>
            </div>
            <p className="text-sm text-[#B4B9B6] leading-relaxed">
              আপনার প্রয়োজন, আমাদের সমাধান — Genuine smartphones, certified pre-owned
              smartphones, original accessories, and expert hardware servicing in Mujibnagar, Meherpur.
            </p>
            <div className="space-y-2 text-sm text-[#D1D5DB] pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF8618] shrink-0 mt-1" />
                <span>{storeSettings.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FF8618] shrink-0" />
                <a
                  href={`tel:${storeSettings.contactPhone}`}
                  className="font-mono hover:text-[#FF8618] transition-colors"
                >
                  {storeSettings.contactPhone}
                </a>
                {storeSettings.secondaryPhone && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={`tel:${storeSettings.secondaryPhone}`}
                      className="font-mono hover:text-[#FF8618] transition-colors"
                    >
                      {storeSettings.secondaryPhone}
                    </a>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF8618] shrink-0" />
                <a
                  href={`mailto:${storeSettings.contactEmail}`}
                  className="hover:text-[#FF8618] transition-colors"
                >
                  {storeSettings.contactEmail}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#FF8618] shrink-0 mt-1" />
                <span className="text-xs text-[#A0A6A3]">{storeSettings.openingHours}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Shop Categories */}
          <div>
            <h4 className="font-display text-base font-semibold text-white mb-4">
              Shop Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-[#B4B9B6]">
              <li>
                <Link to="/catalog" className="hover:text-[#FF8618] transition-colors">
                  All Smartphones &amp; Gear
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=iphone"
                  className="hover:text-[#FF8618] transition-colors"
                >
                  Apple iPhone (New &amp; Pre-Owned)
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=android"
                  className="hover:text-[#FF8618] transition-colors"
                >
                  Android Smartphones
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?condition=Used"
                  className="hover:text-[#FF8618] transition-colors"
                >
                  Certified Used Phones
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=chargers-cables"
                  className="hover:text-[#FF8618] transition-colors"
                >
                  Original Chargers &amp; Cables
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=earbuds-headphones"
                  className="hover:text-[#FF8618] transition-colors"
                >
                  Earbuds &amp; Gaming Headsets
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=smartwatch"
                  className="hover:text-[#FF8618] transition-colors"
                >
                  AMOLED Smartwatches
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div>
            <h4 className="font-display text-base font-semibold text-white mb-4">
              Quick Links &amp; Policies
            </h4>
            <ul className="space-y-2.5 text-sm text-[#B4B9B6]">
              <li>
                <Link to="/services" className="hover:text-[#FF8618] transition-colors">
                  Mobile Servicing &amp; Repair Lab
                </Link>
              </li>
              <li>
                <Link to="/videos" className="hover:text-[#FF8618] transition-colors">
                  Customer Reels &amp; Videos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#FF8618] transition-colors">
                  Contact &amp; Showroom Directions
                </Link>
              </li>
              <li>
                <Link
                  to="/account?tab=orders"
                  className="hover:text-[#FF8618] transition-colors"
                >
                  Track My Order
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicyModal('shipping')}
                  className="hover:text-[#FF8618] transition-colors text-left"
                >
                  Delivery &amp; Courier Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicyModal('return')}
                  className="hover:text-[#FF8618] transition-colors text-left"
                >
                  7-Day Replacement &amp; Return Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicyModal('warranty')}
                  className="hover:text-[#FF8618] transition-colors text-left"
                >
                  Pre-Owned Inspection &amp; Warranty
                </button>
              </li>
              <li>
                <Link
                  to="/admin-login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#A0A6A3] hover:text-[#FF8618] pt-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authorized Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Direct WhatsApp & Official Social Channels */}
          <div className="space-y-4">
            <h4 className="font-display text-base font-semibold text-white">
              Instant Showroom Support
            </h4>
            <p className="text-sm text-[#B4B9B6]">
              Need live photos or 3uTools battery reports of a pre-owned phone before ordering?
              Message our Kedargonj Bazar desk directly.
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-[#111312] font-semibold text-sm transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: {storeSettings.contactPhone}</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#A0A6A3]">
              <a
                href={storeSettings.facebookURL || 'https://www.facebook.com/noborupstore.bd'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#FF8618] underline underline-offset-4"
              >
                Facebook Page
              </a>
              <a
                href={
                  storeSettings.instagramURL ||
                  'https://www.instagram.com/noborupstore.bd?stkn=Y3RpODRyNGY2dHBi&fbclid=IwY2xjawVOau9leHRuA2FlbQIxMABwZG9mBWJyaWQRMXczVEJLRXRxNFNLbDhIZGlzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe3-QFuPYUCDg7pTBba4lhOZKbSQXgCA1Po9usTKIXJwxYxe2eusFy-DoZ0KI_aem_W1fYqxbLd6JRPi6lm6yzow'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#FF8618] underline underline-offset-4"
              >
                Instagram (@noborupstore.bd)
              </a>
              <Link
                to="/videos"
                className="hover:text-[#FF8618] underline underline-offset-4"
              >
                Watch Reels
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C928F]">
          <p>
            &copy; {new Date().getFullYear()} {storeSettings.storeName} ({storeSettings.address}).
            All rights reserved.
          </p>
          <p className="font-medium text-[#D1D5DB]">
            Developed by <span className="text-[#FF8618] font-semibold">Nahid Hasan</span>
          </p>
        </div>
      </div>

      {/* Store Policy Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1B1D1C] text-[#111312] dark:text-[#F5F5F3] max-w-lg w-full rounded-2xl p-6 border border-black/10 dark:border-white/15 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <h3 className="font-display text-lg font-bold">
                {activePolicyModal === 'shipping' && 'Delivery & Courier Policy'}
                {activePolicyModal === 'return' && '7-Day Replacement & Return Policy'}
                {activePolicyModal === 'warranty' && 'Pre-Owned Inspection & Warranty Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-5 text-sm leading-relaxed text-[#4B504E] dark:text-[#C4C9C6]">
              {activePolicyModal === 'shipping' && storeSettings.shippingPolicy}
              {activePolicyModal === 'return' && storeSettings.returnPolicy}
              {activePolicyModal === 'warranty' && storeSettings.warrantyPolicy}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-5 py-2 rounded-lg bg-[#FF8618] text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
