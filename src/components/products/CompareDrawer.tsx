import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CompareDrawer: React.FC = () => {
  const { compareList, toggleCompare, clearCompare, addToCart } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Comparison Bar */}
      <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#111312] text-white px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl border border-white/15 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 max-w-xl w-[94%]">
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <ArrowLeftRight className="w-4 h-4 text-[#FF8618]" />
          <span>Compare ({compareList.length}/3)</span>
        </div>
        <div className="hidden sm:flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
          {compareList.map((p) => (
            <span
              key={p.id}
              className="text-xs bg-white/10 px-2.5 py-1 rounded-md truncate max-w-[130px]"
            >
              {p.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#FF8618] text-white text-xs font-semibold whitespace-nowrap"
          >
            Compare Specs
          </button>
          <button
            type="button"
            onClick={clearCompare}
            aria-label="Clear comparison"
            className="p-1.5 text-white/70 hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Comparison Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#1B1D1C] max-w-5xl w-full rounded-2xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-display text-base sm:text-lg font-bold">
                Side-by-Side Device Comparison
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[540px]">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="py-3 pr-4 w-32 sm:w-40 text-xs text-[#686E6B] dark:text-[#9CA3AF]">
                      Specification
                    </th>
                    {compareList.map((p) => (
                      <th key={p.id} className="py-3 px-3 sm:px-4 min-w-[180px] sm:min-w-[220px]">
                        <div className="flex flex-col gap-2">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-24 h-24 rounded-lg object-cover bg-[#F7F7F5] dark:bg-[#111312]"
                          />
                          <Link
                            to={`/product/${p.slug}`}
                            onClick={() => setModalOpen(false)}
                            className="font-display font-bold hover:text-[#FF8618]"
                          >
                            {p.name}
                          </Link>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-base font-bold text-[#FF8618]">
                              ৳{p.price.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCompare(p)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6 dark:divide-white/8">
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Condition</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.condition}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Brand</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.brand}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Storage / RAM</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.specifications.storage || '—'} / {p.specifications.ram || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Display</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.specifications.display || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Processor</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.specifications.processor || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Camera</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.specifications.camera || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Battery / Health</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.specifications.battery || '—'}{' '}
                        {p.specifications.batteryHealth
                          ? `(${p.specifications.batteryHealth})`
                          : ''}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Warranty</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.warrantyInfo || 'Showroom Warranty'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Action</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(p, 1);
                            setModalOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF8618] text-white text-xs font-semibold"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
