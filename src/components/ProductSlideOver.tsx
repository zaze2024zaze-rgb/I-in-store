import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Star, 
  ShoppingBag, 
  MessageCircle, 
  Heart, 
  Check, 
  Sparkles,
  Truck,
  RotateCcw
} from 'lucide-react';
import { Product, CurrencyType, CustomerReview } from '../types.ts';
import { convertSARtoCurrency, formatCurrencyLabel } from '../utils/pricing.ts';
import { OFFICIAL_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';

interface ProductSlideOverProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyType;
  yerRate: number;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onDirectWhatsApp: (product: Product, size: string, color: string, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  reviews?: CustomerReview[];
}

export const ProductSlideOver: React.FC<ProductSlideOverProps> = ({
  product,
  isOpen,
  onClose,
  currency,
  yerRate,
  onAddToCart,
  onDirectWhatsApp,
  isWishlisted,
  onToggleWishlist,
  reviews = [],
}) => {
  if (!isOpen || !product) return null;

  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || '');
  const [selectedSize, setSelectedSize] = useState<string>(product.availableSizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>(product.availableColors[0]?.name || 'افتراضي');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  const priceDisplay = convertSARtoCurrency(product.priceSAR, currency, yerRate);
  const originalPriceDisplay = product.originalPriceSAR
    ? convertSARtoCurrency(product.originalPriceSAR, currency, yerRate)
    : undefined;

  const discountPercent = product.originalPriceSAR
    ? Math.round(((product.originalPriceSAR - product.priceSAR) / product.originalPriceSAR) * 100)
    : 0;

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleWhatsAppBuy = () => {
    onDirectWhatsApp(product, selectedSize, selectedColor, quantity);
    const text = `مرحباً، أود طلب المنتج التالي من متجر I in:
- اسم المنتج: ${product.title}
- كود المنتج: ${product.code || product.id}
- المقاس: ${selectedSize}
- اللون: ${selectedColor}
- الكمية: ${quantity}
- السعر: ${formatCurrencyLabel(priceDisplay * quantity, currency)}
يرجى تأكيد الحجز وتزويدي ببيانات الإيداع البنكي.`;

    const url = `https://api.whatsapp.com/send?phone=${OFFICIAL_WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-start animate-fade-in" dir="rtl">
      {/* Slide Drawer (slides from the side in RTL) */}
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E5DFD7] text-right animate-slide-in-right overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#EFECE6] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#111111] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8B6B3F]" />
              <span>معاينة وتفاصيل سريعة</span>
            </span>
            {product.code && (
              <span className="bg-[#111111] text-[#E5D3B3] font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                {product.code}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWishlist(product)}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isWishlisted
                  ? 'bg-[#A34E36] text-white border-[#A34E36]'
                  : 'bg-white text-[#555555] border-[#DDD6CE] hover:text-[#111111]'
              }`}
              title="إضافة للأمنيات"
              aria-label="قائمة الأمنيات"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#666666] hover:text-[#111111] hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="إغلاق الدرج الجانبي"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Image & Thumbnails */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] bg-[#F7F5F0] rounded-2xl overflow-hidden border border-[#E8E4DD] shadow-sm">
              <img
                src={selectedImage || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />

              {discountPercent > 0 && (
                <span className="absolute top-3 right-3 bg-[#A34E36] text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  خصم {discountPercent}%
                </span>
              )}

              {product.adminRating && (
                <div className="absolute bottom-3 inset-x-3 bg-[#111111]/90 backdrop-blur-md text-[#FAF9F6] rounded-xl px-3 py-1.5 text-xs flex items-center justify-between border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    <span className="font-semibold text-[#E5D3B3]">{product.adminRating.badgeLabel}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-white">
                    <Star className="w-3.5 h-3.5 text-[#C5A880] fill-[#C5A880]" />
                    <span>{product.adminRating.score.toFixed(1)}/10</span>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-14 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      (selectedImage || product.images[0]) === img
                        ? 'border-[#8B6B3F] scale-105 shadow-sm'
                        : 'border-[#DDD6CE] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="معاينة" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Title and Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#777777]">
              <span>{product.subCategory || 'أزياء فاخرة'}</span>
              <div className="flex items-center gap-1 text-[#222222]">
                <Star className="w-3.5 h-3.5 text-[#C5A880] fill-[#C5A880]" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-[#888888]">({product.reviewsCount} تقييم)</span>
              </div>
            </div>

            <h2 className="text-lg font-bold text-[#111111] leading-snug">
              {product.title}
            </h2>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-xl font-extrabold text-[#111111] font-mono">
                {formatCurrencyLabel(priceDisplay, currency)}
              </span>
              {originalPriceDisplay && (
                <span className="text-sm text-[#888888] line-through font-mono">
                  {formatCurrencyLabel(originalPriceDisplay, currency)}
                </span>
              )}
            </div>
          </div>

          {/* Sizing Selection (S to 4XL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111111]">اختر المقاس:</label>
              <span className="text-[11px] text-[#8B6B3F] font-semibold">المقاس المحدد: {selectedSize}</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {product.availableSizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                    selectedSize === sz
                      ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                      : 'bg-[#FAF8F5] text-[#333333] border-[#DDD6CE] hover:border-[#111111]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          {product.availableColors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#111111]">اختر اللون:</label>
              <div className="flex flex-wrap gap-2">
                {product.availableColors.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => setSelectedColor(col.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                      selectedColor === col.name
                        ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                        : 'border-[#DDD6CE] bg-[#FAF8F5] text-[#444444] hover:bg-white'
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: col.hex }} 
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Counter */}
          <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D9]">
            <span className="text-xs font-bold text-[#111111]">الكمية المطلوبة:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-lg bg-white border border-[#DDD6CE] text-[#333333] font-bold flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                -
              </button>
              <span className="font-mono font-bold text-sm w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-lg bg-white border border-[#DDD6CE] text-[#333333] font-bold flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Description & Fabric Details */}
          <div className="space-y-2 text-xs text-[#555555] bg-[#FAF9F6] p-4 rounded-xl border border-[#EDE8DE]">
            <strong className="block font-bold text-[#111111]">مواصفات القطعة:</strong>
            <p className="leading-relaxed">{product.description}</p>
            {product.fabricDetails && (
              <p className="text-[11px] text-[#777777] border-t border-[#E8E2D8] pt-2 mt-2">
                <strong>الخامة:</strong> {product.fabricDetails}
              </p>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#666666] pt-1">
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#EFECE6]">
              <Truck className="w-4 h-4 text-[#8B6B3F] shrink-0" />
              <span>شحن آمن وتوصيل مباشر</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#EFECE6]">
              <RotateCcw className="w-4 h-4 text-[#8B6B3F] shrink-0" />
              <span>مطابقة كاملة للمواصفات</span>
            </div>
          </div>
        </div>

        {/* Sticky Drawer Footer with Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#EFECE6] bg-white space-y-2 shadow-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                addedAnimation
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-[#111111] hover:bg-[#2A2A2A] text-white'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تمت الإضافة للسلة!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
                  <span>أضف للسلة ({formatCurrencyLabel(priceDisplay * quantity, currency)})</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppBuy}
              className="py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              title="شراء فوري ومراسلة المشرف بالواتساب"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">طلب واتساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
