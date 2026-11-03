import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { BannerItem, ProductCategory } from '../types.ts';

interface SquareHeroBannersProps {
  banners: BannerItem[];
  onSelectCategory: (category: ProductCategory) => void;
  onExploreProduct?: (productId: string) => void;
  displaySize?: 'large' | 'medium' | 'compact';
}

export const SquareHeroBanners: React.FC<SquareHeroBannersProps> = ({
  banners,
  onSelectCategory,
  onExploreProduct,
  displaySize = 'medium',
}) => {
  const activeBanners = banners.filter((b) => b.isActive);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return null;
  }

  const safeIndex = Math.min(activeIndex, activeBanners.length - 1);
  const currentSlide = activeBanners[safeIndex] || activeBanners[0];
  const sideBanners = activeBanners.filter((_, idx) => idx !== safeIndex).slice(0, 2);

  // Height configurations based on admin displaySize setting
  const spotlightHeightClass = 
    displaySize === 'large'
      ? 'min-h-[440px] sm:min-h-[500px]'
      : displaySize === 'compact'
      ? 'min-h-[290px] sm:min-h-[340px]'
      : 'min-h-[360px] sm:min-h-[420px]';

  const spotlightPaddingClass =
    displaySize === 'compact'
      ? 'p-4 sm:p-7'
      : 'p-5 sm:p-10';

  return (
    <section className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Main Interactive Featured Square Spotlight */}
        <div className={`lg:col-span-7 bg-[#1A1A1A] text-white rounded-2xl overflow-hidden relative shadow-lg ${spotlightHeightClass} flex flex-col justify-end ${spotlightPaddingClass} group`}>
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-3 text-xs mb-3 text-[#E5D3B3]">
              <span className="font-semibold uppercase tracking-wider">{currentSlide.tag}</span>
              <span aria-hidden="true">·</span>
              <span className="bg-[#C5A880]/20 text-[#E5D3B3] px-2.5 py-0.5 rounded-full border border-[#C5A880]/40">
                {currentSlide.badgeText}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-snug">
              {currentSlide.title}
            </h2>

            <p className="text-sm text-gray-300 mb-5 line-clamp-2 leading-relaxed font-light">
              {currentSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (currentSlide.targetProductId && onExploreProduct) {
                    onExploreProduct(currentSlide.targetProductId);
                  } else {
                    onSelectCategory(currentSlide.category);
                  }
                }}
                className="bg-[#C5A880] text-[#111111] hover:bg-[#D4BC96] px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>تسوق هذا المظهر</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectCategory(currentSlide.category)}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm px-4 py-2.5 rounded-full text-xs font-medium border border-white/20 transition-all cursor-pointer"
              >
                تصفح المجموعة كاملة
              </button>
            </div>
          </div>

          {activeBanners.length > 1 && (
            <>
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <button
                  onClick={() => setActiveIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="الشريحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveIndex((prev) => (prev + 1) % activeBanners.length)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="الشريحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5">
                {activeBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === safeIndex ? 'w-6 bg-[#C5A880]' : 'w-2 bg-white/40'
                    }`}
                    aria-label={`الانتقال إلى الشريحة ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Side Banners (Render dynamically from banners list) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
          {sideBanners.map((sb) => (
            <div
              key={sb.id}
              onClick={() => {
                if (sb.targetProductId && onExploreProduct) {
                  onExploreProduct(sb.targetProductId);
                } else {
                  onSelectCategory(sb.category);
                }
              }}
              className={`group relative bg-[#F7F5F0] border border-[#E5DFD7] rounded-2xl ${
                displaySize === 'compact' ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
              } overflow-hidden flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:border-[#C5A880]/50`}
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4 z-10">
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#8B6B3F] tracking-wider uppercase flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880]" />
                    {sb.tag}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#111111] group-hover:text-[#8B6B3F] transition-colors truncate">
                    {sb.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#666666] mt-0.5 sm:mt-1 line-clamp-2">{sb.subtitle}</p>
                </div>
                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 border border-[#DDD6CE]">
                  <img
                    src={sb.image}
                    alt={sb.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs text-[#111111] font-semibold">
                <span className="text-[#8B6B3F] text-[11px] sm:text-xs">{sb.badgeText}</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#8B6B3F]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
