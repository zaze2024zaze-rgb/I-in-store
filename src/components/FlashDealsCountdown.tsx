import React, { useState, useEffect } from 'react';
import { Timer, Zap, ShieldCheck } from 'lucide-react';

interface FlashDealsCountdownProps {
  onViewFlashDeals: () => void;
  activeFilter: string;
  onFilterChange: (filter: 'all' | 'flash' | 'bestsellers' | 'new_arrivals') => void;
}

export const FlashDealsCountdown: React.FC<FlashDealsCountdownProps> = ({
  onViewFlashDeals,
  activeFilter,
  onFilterChange,
}) => {
  // Countdown to next flash drop (e.g. 14h 28m 42s)
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 28,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2 = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="bg-[#18181B] text-white rounded-xl px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm border border-[#2B2B2F]">
        {/* Flash Deals countdown unit */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#A34E36] flex items-center justify-center text-white shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-[#FAF9F6]">
                عروض الخصم الخاطف
              </span>
              <span className="text-[11px] text-[#C5A880] font-medium hidden sm:inline-block">
                (كميات محدودة)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 mt-0.5">
              <span>ينتهي خلال:</span>
              <div className="flex items-center gap-1 font-mono font-bold text-white text-xs tabular-nums">
                <span className="bg-[#2B2B2F] px-1.5 py-0.5 rounded border border-[#3E3E44]">
                  {format2(timeLeft.hours)}
                </span>
                <span>:</span>
                <span className="bg-[#2B2B2F] px-1.5 py-0.5 rounded border border-[#3E3E44]">
                  {format2(timeLeft.minutes)}
                </span>
                <span>:</span>
                <span className="bg-[#2B2B2F] px-1.5 py-0.5 rounded border border-[#3E3E44] text-[#C5A880]">
                  {format2(timeLeft.seconds)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tabs: التصنيفات، الأكثر مبيعاً، وصلنا حديثاً، عروض اليوم */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-[#111111] font-bold shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            كل المنتجات
          </button>
          <button
            onClick={() => onFilterChange('flash')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              activeFilter === 'flash'
                ? 'bg-[#A34E36] text-white font-bold shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>عروض اليوم</span>
          </button>
          <button
            onClick={() => onFilterChange('bestsellers')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'bestsellers'
                ? 'bg-white text-[#111111] font-bold shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            الأكثر مبيعاً
          </button>
          <button
            onClick={() => onFilterChange('new_arrivals')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'new_arrivals'
                ? 'bg-white text-[#111111] font-bold shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            وصلنا حديثاً
          </button>
        </div>
      </div>
    </div>
  );
};
