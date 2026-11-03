import React from 'react';
import { Heart, ShoppingBag, ShieldCheck, Star, Eye } from 'lucide-react';
import { Product, CurrencyType } from '../types.ts';
import { convertSARtoCurrency, formatCurrencyLabel } from '../utils/pricing.ts';

interface ProductCardProps {
  product: Product;
  currency: CurrencyType;
  yerRate: number;
  onOpenDetails: (product: Product) => void;
  onOpenSlideOver?: (product: Product) => void;
  onQuickAddToCart: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  layout?: 'standard' | 'compact';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  yerRate,
  onOpenDetails,
  onOpenSlideOver,
  onQuickAddToCart,
  isWishlisted,
  onToggleWishlist,
  layout = 'standard',
}) => {
  const currentPriceDisplay = convertSARtoCurrency(product.priceSAR, currency, yerRate);
  const originalPriceDisplay = product.originalPriceSAR
    ? convertSARtoCurrency(product.originalPriceSAR, currency, yerRate)
    : undefined;

  const discountPercent = product.originalPriceSAR
    ? Math.round(((product.originalPriceSAR - product.priceSAR) / product.originalPriceSAR) * 100)
    : 0;

  const isCompact = layout === 'compact';

  const handleCardClick = () => {
    if (onOpenSlideOver) {
      onOpenSlideOver(product);
    } else {
      onOpenDetails(product);
    }
  };

  return (
    <article className={`group bg-white rounded-2xl overflow-hidden border border-[#E8E4DD] hover:border-[#C5A880]/60 transition-all duration-300 hover:shadow-lg flex flex-col justify-between ${
      isCompact ? 'text-xs' : ''
    }`}>
      {/* Image Container */}
      <div 
        className="relative aspect-[3/4] bg-[#F7F5F0] overflow-hidden cursor-pointer" 
        onClick={handleCardClick}
      >
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top Badges (Admin custom badge or automatic discount) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10">
          {product.customBadge ? (
            <span className="bg-[#8B6B3F] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs">
              {product.customBadge}
            </span>
          ) : discountPercent > 0 ? (
            <span className="bg-[#A34E36] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide shadow-xs">
              خصم {discountPercent}%
            </span>
          ) : null}

          {product.isNewArrival && (
            <span className="bg-[#111111] text-[#E5D3B3] text-[9px] font-medium px-2 py-0.5 rounded-sm shadow-xs">
              وصل حديثاً
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 left-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10 cursor-pointer ${
            isWishlisted
              ? 'bg-[#A34E36] text-white'
              : 'bg-white/85 text-[#333333] hover:bg-white hover:text-[#111111]'
          }`}
          aria-label={isWishlisted ? `إزالة ${product.title} من قائمة الأمنيات` : `إضافة ${product.title} إلى قائمة الأمنيات`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Side Drawer Peek Button on Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSlideOver) onOpenSlideOver(product);
            else onOpenDetails(product);
          }}
          className="absolute inset-x-3 bottom-12 bg-white/95 text-[#111111] text-xs font-bold py-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10 hover:bg-[#111111] hover:text-white"
        >
          <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>معاينة جانبية سريعة</span>
        </button>

        {/* Admin Inspection Badge (شارة تقييم المشرف المعتمد) */}
        {product.adminRating && (
          <div className="absolute bottom-2 right-2 left-2 z-10">
            <div className="bg-[#111111]/90 backdrop-blur-md text-[#FAF9F6] rounded-lg px-2 py-1 text-[10px] sm:text-[11px] flex items-center justify-between shadow-sm border border-white/10">
              <div className="flex items-center gap-1 min-w-0">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] shrink-0" />
                <span className="font-medium text-[#E5D3B3] truncate">
                  {product.adminRating.badgeLabel}
                </span>
              </div>
              <div className="flex items-center gap-0.5 font-mono font-bold text-white shrink-0">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C5A880] fill-[#C5A880]" />
                <span>{product.adminRating.score.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className={`${isCompact ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4'} flex flex-col flex-1 justify-between`}>
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-[#777777] mb-1">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="font-medium text-[10px] sm:text-xs truncate">{product.subCategory || 'أزياء فاخرة'}</span>
              {product.code && (
                <span className="bg-[#111111] text-[#E5D3B3] font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                  {product.code}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[#222222] shrink-0">
              <Star className="w-3 h-3 text-[#C5A880] fill-[#C5A880]" />
              <span className="font-semibold tabular-nums text-[11px]">{product.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={handleCardClick}
            className={`${
              isCompact ? 'text-xs font-semibold' : 'text-xs sm:text-sm font-semibold'
            } text-[#1A1A1A] hover:text-[#C5A880] transition-colors line-clamp-2 cursor-pointer leading-snug mb-1.5`}
          >
            {product.title}
          </h3>

          {/* Available Sizes tags */}
          {!isCompact && (
            <div className="flex items-center gap-1 text-[10px] text-[#666666] mb-2.5 flex-wrap">
              <span>المقاسات:</span>
              {product.availableSizes.slice(0, 5).map((sz) => (
                <span key={sz} className="font-mono bg-[#F2EFE9] px-1 py-0.2 rounded text-[#333333]">
                  {sz}
                </span>
              ))}
              {product.availableSizes.length > 5 && (
                <span className="text-[9px] text-gray-500 font-mono">+{product.availableSizes.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Price & Action Row (SAR or YER) */}
        <div className="pt-2 border-t border-[#F0ECE5] flex items-center justify-between gap-1.5">
          <div className="flex items-baseline gap-1">
            <span className={`${isCompact ? 'text-sm' : 'text-sm sm:text-base'} font-bold text-[#111111] font-mono tabular-nums`}>
              {formatCurrencyLabel(currentPriceDisplay, currency)}
            </span>
            {originalPriceDisplay && (
              <span className="text-[10px] sm:text-xs text-[#888888] line-through font-mono tabular-nums">
                {formatCurrencyLabel(originalPriceDisplay, currency)}
              </span>
            )}
          </div>

          <button
            onClick={() => onQuickAddToCart(product)}
            className="p-1.5 sm:p-2 rounded-xl bg-[#111111] text-[#FAF9F6] hover:bg-[#8B6B3F] hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="إضافة سريعة إلى السلة"
            aria-label={`إضافة ${product.title} إلى السلة`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#C5A880]" />
            {!isCompact && <span className="hidden sm:inline">أضف</span>}
          </button>
        </div>
      </div>
    </article>
  );
};
