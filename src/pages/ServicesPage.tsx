import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BatteryCharging,
  CheckCircle2,
  Clock,
  Cpu,
  Droplets,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { createServiceBooking } from '../services/firestoreService';

const REPAIR_SERVICES = [
  {
    id: 'srv-display',
    title: 'Display, OLED & Touch Glass Replacement',
    turnaround: '45 – 90 Minutes',
    warranty: '3 – 6 Months Display Guarantee',
    priceRange: '৳1,200 – ৳18,500',
    icon: Smartphone,
    description:
      'Original pulled displays, True Tone programming for iPhones, and high-brightness AMOLED/IPS panels for Samsung, Realme, Xiaomi, Motorola, and Vivo.',
  },
  {
    id: 'srv-battery',
    title: 'Original Capacity Battery Replacement',
    turnaround: '30 – 45 Minutes',
    warranty: '6 Months Cycle & Health Warranty',
    priceRange: '৳950 – ৳4,800',
    icon: BatteryCharging,
    description:
      'Zero-cycle genuine and BMS-programmed batteries for iPhone 11–15 series and Android smartphones with full thermal and charging current diagnostics.',
  },
  {
    id: 'srv-motherboard',
    title: 'Motherboard IC, Network & Dead-Boot Micro-Soldering',
    turnaround: '1 – 2 Days',
    warranty: '30 Days Service Warranty',
    priceRange: '৳1,500 – ৳6,500',
    icon: Cpu,
    description:
      'Precision microscope-level repair for Baseband/No-Service issues, Audio IC, PMIC power short circuits, green-line flex bonding, and CPU reballing.',
  },
  {
    id: 'srv-charging',
    title: 'Charging Port, Mic & Stereo Speaker Repair',
    turnaround: '30 – 60 Minutes',
    warranty: '90 Days Replacement Warranty',
    priceRange: '৳450 – ৳2,200',
    icon: Wrench,
    description:
      'Original Type-C and Lightning sub-board replacement, fast-charging IC restoration, and ultrasonic speaker mesh cleaning.',
  },
  {
    id: 'srv-water',
    title: 'Liquid & Water Damage Ultrasonic Recovery',
    turnaround: '2 – 24 Hours',
    warranty: 'Diagnostic Inspection Report',
    priceRange: '৳800 – ৳3,500',
    icon: Droplets,
    description:
      'Immediate motherboard corrosion cleaning, short-circuit elimination, and data recovery for water-damaged iPhones and Android devices.',
  },
  {
    id: 'srv-software',
    title: 'Official Firmware Flashing, iOS Restore & FRP/Setup',
    turnaround: '20 – 45 Minutes',
    warranty: '100% Data Safety Assurance',
    priceRange: '৳300 – ৳1,500',
    icon: Sparkles,
    description:
      'Bootloop recovery, iTunes error fixing, official stock ROM flashing, data transfer, and 3uTools hardware authenticity verification.',
  },
];

const DIAGNOSTIC_CHECKPOINTS = [
  '3uTools & GSX Serial / Component Match',
  'Original Display True Tone & Touch Matrix Grid',
  'Battery Cycle Count & Peak Performance Capability',
  'Face ID / Touch ID Biometric Sensor Integrity',
  'Main, Ultra-Wide & Telephoto OIS Camera Test',
  'Dual SIM 4G/5G Baseband & Wi-Fi 6 Signal Strength',
  'Charging IC Current & USB-PD Fast Charge Speed',
  'Internal Liquid Contact Indicator (LCI) Inspection',
  'Stereo Earpiece, Loudspeaker & Dual Mic Clarity',
  'Gyroscope, Proximity, Compass & Barometer Check',
];

export const ServicesPage: React.FC = () => {
  const { storeSettings, showToast } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookingForm, setBookingForm] = useState({
    customerName: user?.displayName || '',
    customerPhone: '',
    deviceModel: '',
    serviceType: 'Display / Touch Replacement',
    issueDescription: '',
    preferredDate: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user?.displayName && !bookingForm.customerName) {
      setBookingForm((prev) => ({ ...prev, customerName: user.displayName || '' }));
    }
  }, [user]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in first to book a mobile servicing appointment.', 'error');
      navigate('/login?redirect=/services');
      return;
    }
    setSubmitting(true);
    try {
      await createServiceBooking(bookingForm);
      setSubmittedSuccess(true);
      showToast('Repair appointment booked! Our technician will call you shortly.');
      setBookingForm({
        customerName: user.displayName || '',
        customerPhone: '',
        deviceModel: '',
        serviceType: 'Display / Touch Replacement',
        issueDescription: '',
        preferredDate: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] text-[#111312] dark:text-white pb-20 transition-colors duration-200">
      {/* Page Header */}
      <section className="bg-white dark:bg-[#1B1D1C] border-b border-black/8 dark:border-white/10 py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs sm:text-sm font-semibold text-[#FF8618] tracking-wide">
              Noborup Care Lab · Kedargonj Bazar, Mujibnagar, Meherpur
            </p>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Expert Mobile Servicing &amp; Complete Hardware Diagnostics
            </h1>
            <p className="text-sm sm:text-base text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
              From genuine iPhone and Samsung OLED replacements to precision motherboard IC repair,
              our Kedargonj Bazar technical desk repairs your smartphone with transparent pricing
              and backed warranty.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <a
                href="#book-repair"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white font-semibold text-sm transition-colors"
              >
                <Wrench className="w-4 h-4" />
                <span>Book a Repair Appointment</span>
              </a>
              <a
                href={`https://wa.me/${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  'Assalamu Alaikum Noborup! I need a mobile repair / servicing quote.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-[#111312] font-semibold text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Technician: {storeSettings.contactPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Service Categories Grid */}
        <section>
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Hardware &amp; Software Repair Menu
            </h2>
            <p className="text-sm text-[#686E6B] dark:text-[#9CA3AF] mt-1">
              Free initial bench diagnostics before any repair work begins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPAIR_SERVICES.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.id}
                  className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 flex flex-col justify-between gap-5 hover:border-[#FF8618] transition-colors"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-[#FF8618]/12 text-[#FF8618] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold">{srv.title}</h3>
                    <p className="text-sm text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-black/8 dark:border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#686E6B] dark:text-[#9CA3AF]">Estimated Cost</span>
                      <span className="font-mono font-bold text-[#FF8618]">{srv.priceRange}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#686E6B] dark:text-[#9CA3AF]">Turnaround Time</span>
                      <span className="font-medium">{srv.turnaround}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#686E6B] dark:text-[#9CA3AF]">Service Assurance</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {srv.warranty}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 25-Point Pre-Owned Inspection & Booking Split Section */}
        <section id="book-repair" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24">
          {/* Left: 25-Point Certification */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FF8618]">
                <ShieldCheck className="w-4 h-4" />
                <span>NOBORUP CERTIFICATION LAB</span>
              </div>
              <h2 className="font-display text-2xl font-bold">
                Complete Pre-Owned Smartphone Verification
              </h2>
              <p className="text-sm text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
                Buying or trading in a pre-owned smartphone? Bring any device to our Kedargonj Bazar
                desk for a complete hardware authenticity check.
              </p>

              <ul className="space-y-2.5 pt-2">
                {DIAGNOSTIC_CHECKPOINTS.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/8 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-[#FF8618]" />
                <span>Showroom Repair Desk Hours</span>
              </div>
              <p className="text-[#4B504E] dark:text-[#B4B9B6]">{storeSettings.openingHours}</p>
              <div className="flex items-center gap-2 pt-1 font-mono text-[#FF8618]">
                <Phone className="w-3.5 h-3.5" />
                <a href={`tel:${storeSettings.contactPhone}`} className="hover:underline">
                  {storeSettings.contactPhone}
                </a>
                <span>·</span>
                <a href={`tel:${storeSettings.secondaryPhone}`} className="hover:underline">
                  {storeSettings.secondaryPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Right: Online Repair Booking Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold mb-1">
              Book a Mobile Repair Appointment
            </h2>
            <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF] mb-6">
              Reserve a priority slot at our Kedargonj Bazar showroom or request courier pickup for
              your repair.
            </p>

            {submittedSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Repair Appointment Confirmed!</p>
                    <p className="mt-0.5">
                      You can track your repair status anytime in{' '}
                      <Link to="/account?tab=bookings" className="underline font-semibold">
                        My Account → Repair Bookings
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={bookingForm.customerName}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, customerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Active Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01912-XXXXXX"
                    value={bookingForm.customerPhone}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, customerPhone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Smartphone Brand &amp; Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 14 Pro Max / Samsung A57"
                    value={bookingForm.deviceModel}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, deviceModel: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Service Type *</label>
                  <select
                    value={bookingForm.serviceType}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, serviceType: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                  >
                    <option value="Display / Touch Replacement">Display / Touch Replacement</option>
                    <option value="Original Battery Replacement">Original Battery Replacement</option>
                    <option value="Charging Port / Speaker Issue">Charging Port / Speaker Issue</option>
                    <option value="Motherboard / IC Diagnostics">Motherboard / IC Diagnostics</option>
                    <option value="Water Damage Recovery">Water Damage Recovery</option>
                    <option value="Software / Flashing / 3uTools Check">
                      Software / Flashing / 3uTools Check
                    </option>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Describe the Issue or Symptoms *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us what happened to the phone (e.g. dropped screen, battery draining fast, not charging)..."
                  value={bookingForm.issueDescription}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, issueDescription: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#111312] border border-black/12 dark:border-white/15 text-sm focus:outline-none focus:border-[#FF8618]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-xs text-[#686E6B] dark:text-[#9CA3AF]">
                  No advance payment required — pay after inspection at our showroom.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e8750c] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Booking Slot...' : 'Confirm Repair Appointment'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
