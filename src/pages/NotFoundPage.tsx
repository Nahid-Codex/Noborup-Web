import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, ShoppingBag } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] bg-[#F7F7F5] dark:bg-[#111312] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FF8618]/15 border border-[#FF8618]/30 flex items-center justify-center text-[#FF8618] mb-5">
        <Compass className="w-8 h-8" />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-[#FF8618] font-semibold mb-2">
        404 — Page Not Found
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-3">
        We couldn't find that device or page
      </h1>
      <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mb-8">
        The link you followed may have expired or the product may have moved in our catalog.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Noborup Home
        </Link>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-[#FF8618] text-stone-800 dark:text-stone-200 font-semibold text-xs transition"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse All Products
        </Link>
      </div>
    </div>
  );
};
