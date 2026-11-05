import React, { useRef, useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  ShoppingBag, 
  Eye, 
  Heart, 
  Star, 
  ShieldCheck, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Product, CurrencyType, ProductCategory } from '../types.ts';
import { formatCurrencyLabel, convertSARtoCurrency } from '../utils/pricing.ts';

interface HorizontalProductSliderProps {
  products: Product[];
  title?: string;
  currency: CurrencyType;
  yerRate: number;
  onAddToCart: (product: Product, size?: string, color?: string, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onOpenSlideOver?: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  onToggleWishlist: (product: Product) => void;
}

export const HorizontalProductSlider: React.FC<HorizontalProductSliderProps> = ({
  products,
  title = 'مختارات حصرية تُسحب جانبياً ✨',
  currency,
  yerRate,
  onAddToCart,
  onSelectProduct,
  onOpenSlideOver,
  isWishlisted,
  onToggleWishlist,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const filterTabs = [
    { id: 'all', label: 'كافة المختارات' },
    { id: 'dresses', label: 'فساتين وهووت كوتور' },
    { id: 'perfumes', label: 'عطور ومكياج' },
    { id: 'apparel', label: 'ملابس وأحذية' },
    { id: 'flash_deals', label: 'عروض محدودة' },
  ];

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'dresses') return p.category === 'dresses' || p.category === 'suits' || p.category === 'women';
    if (activeFilter === 'perfumes') return p.category === 'perfumes' || p.category === 'makeup';
    if (activeFilter === 'apparel') return p.category === 'apparel' || p.category === 'shoes_bags';
    if (activeFilter === 'flash_deals') return p.isFlashDeal || Boolean(p.customBadge);
    return true;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      // In RTL: scrolling right moves forward (or left depending on browser RTL handling)
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1800);
  };

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 my-2" dir="rtl">
      <div className="bg-gradient-to-b from-[#FAF8F5] to-white p-5 sm:p-7 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-5">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EFEBE4]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#111111] text-[#C5A880]">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-[#111111] tracking-tight">
                {title}
              </h2>
            </div>
            <p className="text-xs text-[#777777] pr-7">
              اسحب جانباً لتصفح القطع المميزة المختارة بعناية، مع إمكانية المعاينة والإضافة السريعة للسلة
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-bold">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === tab.id
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-white text-[#666666] hover:bg-[#F0ECE4] border border-[#E0D9CE]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full bg-white border border-[#D5CFC7] hover:border-[#111111] text-[#111111] flex items-center justify-center transition-all shadow-xs cursor-pointer hover:bg-[#111111] hover:text-white"
                title="السابق"
                aria-label="السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full bg-white border border-[#D5CFC7] hover:border-[#111111] text-[#111111] flex items-center justify-center transition-all shadow-xs cursor-pointer hover:bg-[#111111] hover:text-white"
                title="التالي"
                aria-label="التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Swipeable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 pt-1 px-1 -mx-1 scrollbar-none select-none cursor-grab active:cursor-grabbing"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filteredProducts.map((product) => {
            const priceDisplay = convertSARtoCurrency(product.priceSAR, currency, yerRate);
            const originalPriceDisplay = product.originalPriceSAR 
              ? convertSARtoCurrency(product.originalPriceSAR, currency, yerRate)
              : null;
            const wish = isWishlisted(product.id);
            const isAdded = addedProductId === product.id;

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="w-[230px] sm:w-[260px] shrink-0 snap-start bg-white rounded-2xl border border-[#E5DFD7] hover:border-[#C5A880] transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden group cursor-pointer"
              >
                {/* Image and Badges */}
                <div className="relative aspect-[3/4] bg-[#FAF8F5] overflow-hidden">
                  <img
                    src={product.images[0] || '/src/assets/images/product_silk_dress_1793594469558.jpg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Badges Top Left & Right */}
                  <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-start z-10">
                    {product.customBadge ? (
                      <span className="bg-[#8B6B3F] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        {product.customBadge}
                      </span>
                    ) : product.originalPriceSAR ? (
                      <span className="bg-[#111111] text-[#E5D3B3] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        خصم {Math.round(((product.originalPriceSAR - product.priceSAR) / product.originalPriceSAR) * 100)}%
                      </span>
                    ) : null}

                    {product.code && (
                      <span className="bg-black/70 backdrop-blur-xs text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        {product.code}
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product);
                    }}
                    className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer ${
                      wish
                        ? 'bg-[#A34E36] text-white shadow-md'
                        : 'bg-white/90 text-gray-700 hover:text-[#A34E36] hover:bg-white shadow-xs'
                    }`}
                    title={wish ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    aria-label="المفضلة"
                  >
                    <Heart className={`w-3.5 h-3.5 ${wish ? 'fill-current' : ''}`} />
                  </button>

                  {/* Quick Side Drawer Peek Button */}
                  {onOpenSlideOver && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSlideOver(product);
                      }}
                      className="absolute inset-x-3 bottom-10 bg-white/95 text-[#111111] text-[11px] font-bold py-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10 hover:bg-[#111111] hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>معاينة سريعة</span>
                    </button>
                  )}

                  {/* Admin Inspection Badge */}
                  {product.adminRating && (
                    <div className="absolute bottom-2 inset-x-2 z-10">
                      <div className="bg-[#111111]/90 backdrop-blur-xs text-white rounded-lg px-2 py-1 text-[10px] flex items-center justify-between border border-white/10 shadow-xs">
                        <div className="flex items-center gap-1 truncate">
                          <ShieldCheck className="w-3 h-3 text-[#C5A880] shrink-0" />
                          <span className="truncate text-[#E5D3B3]">{product.adminRating.badgeLabel}</span>
                        </div>
                        <div className="flex items-center gap-0.5 font-mono text-[#C5A880] font-bold shrink-0">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{product.adminRating.score.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#777777] mb-1">
                      <span>{product.subCategory || 'أزياء فاخرة'}</span>
                      <div className="flex items-center gap-0.5 text-gray-900 font-mono">
                        <Star className="w-2.5 h-2.5 text-[#C5A880] fill-current" />
                        <span>{product.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-[#111111] group-hover:text-[#8B6B3F] transition-colors line-clamp-2 leading-tight">
                      {product.title}
                    </h3>
                  </div>

                  {/* Available Sizes preview */}
                  <div className="flex items-center gap-1 text-[9px] text-[#666666] flex-wrap">
                    <span className="text-[10px] font-semibold text-[#888888]">المقاس:</span>
                    {product.availableSizes.slice(0, 4).map((s) => (
                      <span key={s} className="bg-[#F2ECE3] px-1.5 py-0.5 rounded font-mono text-gray-800">
                        {s}
                      </span>
                    ))}
                    {product.availableSizes.length > 4 && (
                      <span className="text-gray-400 font-mono">+{product.availableSizes.length - 4}</span>
                    )}
                  </div>

                  {/* Price and Add Button */}
                  <div className="pt-2 border-t border-[#F2ECE3] flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-bold font-mono text-[#111111] tabular-nums">
                        {formatCurrencyLabel(priceDisplay, currency)}
                      </div>
                      {originalPriceDisplay && (
                        <div className="text-[10px] text-gray-400 line-through font-mono tabular-nums">
                          {formatCurrencyLabel(originalPriceDisplay, currency)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleQuickAdd(product, e)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                        isAdded
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-[#111111] text-[#FAF9F6] hover:bg-[#8B6B3F] hover:text-white'
                      }`}
                      title="إضافة سريعة للسلة"
                      aria-label={`إضافة ${product.title} للسلة`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>{isAdded ? 'تمت الإضافة ✓' : 'أضف'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
