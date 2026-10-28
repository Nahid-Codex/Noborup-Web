import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ContactPage: React.FC = () => {
  const { storeSettings, showToast } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Pre-Owned Phone Availability & Battery Report');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const facebookPageUrl =
    storeSettings.facebookURL || 'https://www.facebook.com/noborupstore.bd';
  const instagramUrl =
    storeSettings.instagramURL ||
    'https://www.instagram.com/noborupstore.bd?stkn=Y3RpODRyNGY2dHBi&fbclid=IwY2xjawVOau9leHRuA2FlbQIxMABwZG9mBWJyaWQRMXczVEJLRXRxNFNLbDhIZGlzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe3-QFuPYUCDg7pTBba4lhOZKbSQXgCA1Po9usTKIXJwxYxe2eusFy-DoZ0KI_aem_W1fYqxbLd6JRPi6lm6yzow';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      showToast('Please fill in your name, phone number, and message.', 'error');
      return;
    }
    setSubmitted(true);
    showToast('Your message has been received! Our Kedargonj Bazar team will contact you shortly.');
  };

  const whatsappDirectUrl = `https://wa.me/${storeSettings.whatsappNumber.replace(
    /[^0-9]/g,
    ''
  )}?text=${encodeURIComponent(
    `Assalamu Alaikum Noborup!\nName: ${name || 'Customer'}\nPhone: ${phone || ''}\nTopic: ${subject}\nMessage: ${message || 'I have an inquiry about a smartphone.'}`
  )}`;

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] text-[#111312] dark:text-white pb-20 transition-colors duration-200">
      {/* Header */}
      <section className="bg-white dark:bg-[#1B1D1C] border-b border-black/8 dark:border-white/10 py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#FF8618] tracking-wide">
              Visit Our Showroom or Message Us Directly
            </p>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Contact Noborup Showroom
            </h1>
            <p className="text-sm sm:text-base text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
              Need live photos, a 3uTools battery report, trade-in valuation, or courier delivery
              assistance? Reach out to our Kedargonj Bazar desk in Mujibnagar, Meherpur.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-10 sm:space-y-12">
        {/* Top Contact & Social Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Showroom Location */}
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF8618]/12 text-[#FF8618] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold">Showroom Address</h2>
            <p className="text-sm text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
              {storeSettings.address}
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Kedargonj+Bazar+Mujibnagar+Meherpur"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF8618] hover:underline pt-1"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Direct Phone & WhatsApp */}
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF8618]/12 text-[#FF8618] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold">Call or WhatsApp</h2>
            <div className="space-y-1 text-sm font-mono">
              <a
                href={`tel:${storeSettings.contactPhone}`}
                className="block hover:text-[#FF8618] font-semibold"
              >
                {storeSettings.contactPhone} (Primary)
              </a>
              {storeSettings.secondaryPhone && (
                <a
                  href={`tel:${storeSettings.secondaryPhone}`}
                  className="block hover:text-[#FF8618] text-[#4B504E] dark:text-[#B4B9B6]"
                >
                  {storeSettings.secondaryPhone} (Showroom)
                </a>
              )}
            </div>
            <a
              href={`https://wa.me/${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:underline pt-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp Now</span>
            </a>
          </div>

          {/* Opening Hours & Email */}
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF8618]/12 text-[#FF8618] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold">Showroom Hours</h2>
            <p className="text-xs text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
              {storeSettings.openingHours}
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-xs text-[#686E6B] dark:text-[#9CA3AF]">
              <Mail className="w-3.5 h-3.5 text-[#FF8618] shrink-0" />
              <a href={`mailto:${storeSettings.contactEmail}`} className="hover:text-[#FF8618] truncate">
                {storeSettings.contactEmail}
              </a>
            </div>
          </div>

          {/* Official Social Profiles */}
          <div className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF8618]/12 text-[#FF8618] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold">Official Social Links</h2>
            <p className="text-xs text-[#4B504E] dark:text-[#B4B9B6]">
              Follow @noborupstore.bd for daily stock updates, price drops, and customer reels:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <a
                href={facebookPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#589BFF] text-xs font-semibold transition-colors"
              >
                <span>Facebook: /noborupstore.bd</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#E1306C]/10 hover:bg-[#E1306C]/20 text-[#E1306C] dark:text-[#FF6B9D] text-xs font-semibold transition-colors"
              >
                <span>Instagram: @noborupstore.bd</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Split Contact Form & Showroom Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Inquiry Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold mb-1">Send Us a Direct Inquiry</h2>
            <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mb-6">
              Ask about smartphone availability, EMI/exchange options, or order tracking.
            </p>

            {submitted && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Inquiry Logged!</p>
                  <p className="mt-0.5">
                    Our team will call you on <span className="font-mono">{phone}</span>. For an
                    instant reply with photos, click the WhatsApp button below.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01912-XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Inquiry Topic</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                >
                  <option value="Pre-Owned Phone Availability & Battery Report">
                    Pre-Owned Phone Availability &amp; Battery Report
                  </option>
                  <option value="Brand New Smartphone Price Inquiry">
                    Brand New Smartphone Price Inquiry
                  </option>
                  <option value="Phone Exchange / Trade-In Valuation">
                    Phone Exchange / Trade-In Valuation
                  </option>
                  <option value="Mobile Servicing & Hardware Repair">
                    Mobile Servicing &amp; Hardware Repair
                  </option>
                  <option value="Order Delivery & Courier Support">
                    Order Delivery &amp; Courier Support
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write which phone model or service you are looking for..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                />
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white text-sm font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Callback Request</span>
                </button>

                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-[#111312] text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Directly on WhatsApp</span>
                </a>
              </div>
            </form>
          </div>

          {/* Right: Showroom Map & Visit Guide */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Visit Our Kedargonj Bazar Showroom</h2>
              <p className="text-sm text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
                Experience every device hands-on at our showroom in Kedargonj Bazar, Mujibnagar,
                Meherpur. We provide live 3uTools verification, instant screen protector
                installation, and official warranty invoices with every purchase.
              </p>

              <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 aspect-16/10 bg-[#F7F7F5] dark:bg-[#111312]">
                <iframe
                  title="Noborup Kedargonj Bazar Mujibnagar Map"
                  src="https://www.google.com/maps?q=Kedargonj+Bazar,+Mujibnagar,+Meherpur,+Bangladesh&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/8 dark:border-white/10 space-y-1.5 text-xs">
              <p className="font-semibold text-[#111312] dark:text-white">
                Nationwide Delivery &amp; Showroom Pickup
              </p>
              <p className="text-[#4B504E] dark:text-[#B4B9B6]">
                Inside Meherpur delivery in 24 hours (৳{storeSettings.insideMeherpurFee}) · Outside
                Meherpur courier in 24–72 hours (৳{storeSettings.outsideMeherpurFee}).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
