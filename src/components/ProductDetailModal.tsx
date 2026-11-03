import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  Ruler, 
  ShoppingBag, 
  CheckCircle2, 
  Heart, 
  Truck, 
  RotateCcw, 
  MessageCircle,
  ThumbsUp
} from 'lucide-react';
import { Product, CustomerReview, CurrencyType } from '../types.ts';
import { calculateRecommendedSize, SizeRecommendation } from '../utils/sizing.ts';
import { convertSARtoCurrency, formatCurrencyLabel } from '../utils/pricing.ts';
import { INITIAL_REVIEWS } from '../data/mockData.ts';

interface ProductDetailModalProps {
  product: Product | null;
  currency: CurrencyType;
  yerRate: number;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onDirectWhatsApp: (product: Product, size: string, color: string, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  reviews?: CustomerReview[];
  onAddReview?: (review: CustomerReview) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  yerRate,
  onClose,
  onAddToCart,
  onDirectWhatsApp,
  isWishlisted,
  onToggleWishlist,
  reviews = INITIAL_REVIEWS,
  onAddReview,
}) => {
  if (!product) return null;

  const [selectedImage, setSelectedImage] = useState<string>(product.images[0]);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.availableSizes[0] || 'M'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.availableColors[0]?.name || 'افتراضي'
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Smart Size Calculator State
  const [showSizeCalculator, setShowSizeCalculator] = useState<boolean>(false);
  const [userHeight, setUserHeight] = useState<number>(168);
  const [userWeight, setUserWeight] = useState<number>(62);
  const [fitPreference, setFitPreference] = useState<'slim' | 'regular' | 'oversized'>('regular');
  const [calculatedSizeResult, setCalculatedSizeResult] = useState<SizeRecommendation | null>(null);

  // Reviews state
  const [localReviews, setLocalReviews] = useState<CustomerReview[]>(reviews);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [newReviewAuthor, setNewReviewAuthor] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  const priceDisplay = convertSARtoCurrency(product.priceSAR, currency, yerRate);
  const originalPriceDisplay = product.originalPriceSAR
    ? convertSARtoCurrency(product.originalPriceSAR, currency, yerRate)
    : undefined;

  const handleCalculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateRecommendedSize(userHeight, userWeight, fitPreference);
    setCalculatedSizeResult(result);
    if (product.availableSizes.includes(result.recommendedSize)) {
      setSelectedSize(result.recommendedSize);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !newReviewAuthor.trim()) return;

    const newRev: CustomerReview = {
      id: 'rev_' + Date.now(),
      productId: product.id,
      productTitle: product.title,
      authorName: newReviewAuthor.trim(),
      rating: newReviewRating,
      date: 'الآن',
      comment: newReviewComment.trim(),
      verifiedPurchase: true,
      sizePurchased: selectedSize,
      heightWeight: `${userHeight} سم / ${userWeight} كجم`,
      helpfulCount: 1,
    };

    setLocalReviews([newRev, ...localReviews]);
    if (onAddReview) {
      onAddReview(newRev);
    }
    setNewReviewComment('');
    setNewReviewAuthor('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E5E0D8] relative text-right flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-[#111111] hover:text-white text-[#333333] shadow-md flex items-center justify-center transition-colors cursor-pointer"
          aria-label="إغلاق النافذة"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8">
          {/* Left Column: Gallery (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="relative aspect-[3/4] bg-[#F7F5F0] rounded-xl overflow-hidden border border-[#E8E4DD] shadow-sm">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => onToggleWishlist(product)}
                className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                  isWishlisted ? 'bg-[#A34E36] text-white' : 'bg-white/80 text-[#333333] hover:bg-white'
                }`}
                aria-label="إضافة للمفضلة"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImage === img ? 'border-[#C5A880] scale-105' : 'border-[#E8E4DD] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="صورة إضافية" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Admin Quality Certificate */}
            {product.adminRating && (
              <div className="bg-[#FAF8F5] border border-[#E8DFC8] rounded-xl p-4 shadow-xs mt-2">
                <div className="flex items-center justify-between border-b border-[#E8DFC8] pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111]">
                    <ShieldCheck className="w-4 h-4 text-[#8B6B3F]" />
                    <span>تقرير الفحص والاعتماد من مشرف I in</span>
                  </div>
                  <span className="font-mono font-bold text-xs bg-[#111111] text-[#E5D3B3] px-2 py-0.5 rounded">
                    {product.adminRating.score} / 10
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#555555]">
                  <div className="flex justify-between">
                    <span>جودة القماش والأصالة:</span>
                    <span className="font-semibold text-[#111111] font-mono tabular-nums">
                      {product.adminRating.fabricQuality}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>دقة المقاسات والمطابقة:</span>
                    <span className="font-semibold text-[#111111] font-mono tabular-nums">
                      {product.adminRating.sizingAccuracy}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>التشطيب والخياطة النهائية:</span>
                    <span className="font-semibold text-[#111111] font-mono tabular-nums">
                      {product.adminRating.finishingScore}/10
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-[#666666] leading-relaxed bg-white/80 p-2 rounded border border-[#EDE8DC]">
                  "{product.adminRating.staffNotes}"
                </p>
                <div className="mt-2 text-[10px] text-[#888888] flex justify-between">
                  <span>المشرف المسؤول: {product.adminRating.reviewerRole}</span>
                  <span>تاريخ الفحص: {product.adminRating.inspectionDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8B6B3F] font-semibold mb-1">
                <span>{product.subCategory || 'الأزياء الراقية'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#666666] font-normal">كود المنتج: {product.code || `IN-${product.id.slice(0, 6).toUpperCase()}`}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[#111111] leading-snug mb-3">
                {product.title}
              </h1>

              {/* Price Row (SAR or YER) */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#111111] font-mono tabular-nums">
                    {formatCurrencyLabel(priceDisplay, currency)}
                  </span>
                  {originalPriceDisplay && (
                    <span className="text-sm text-[#888888] line-through font-mono tabular-nums">
                      {formatCurrencyLabel(originalPriceDisplay, currency)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#222222]">
                  <div className="flex text-[#C5A880]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C5A880]" />
                    ))}
                  </div>
                  <span className="font-bold tabular-nums">{product.rating}</span>
                  <span className="text-[#888888]">({product.reviewsCount} تقييم)</span>
                </div>
              </div>

              {/* Color Selector */}
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-[#222222]">اللون المختار: {selectedColor}</span>
                  <span className="text-[#777777]">{product.availableColors.length} ألوان متوفرة</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {product.availableColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer ${
                        selectedColor === color.name
                          ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                          : 'border-[#D5CFC7] bg-white text-[#444444] hover:border-[#111111]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector + Smart Fit Guide Trigger */}
              <div className="mt-5">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-[#222222]">المقاس: {selectedSize}</span>
                  <button
                    onClick={() => setShowSizeCalculator(!showSizeCalculator)}
                    className="text-[#8B6B3F] hover:text-[#111111] font-semibold flex items-center gap-1 cursor-pointer underline transition-colors"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>حاسبة المقاس الذكية (بالطول والوزن)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 h-10 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                        selectedSize === size
                          ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                          : 'border-[#D5CFC7] bg-white text-[#333333] hover:border-[#111111]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Smart Size Calculator Panel */}
                {showSizeCalculator && (
                  <div className="mt-4 p-4 rounded-xl bg-[#F5EFE6] border border-[#DFCBB5] text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-2 font-bold text-[#111111]">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#8B6B3F]" />
                        <span>حاسبة المقاس التفاعلية المعتمدة</span>
                      </div>
                      <button
                        onClick={() => setShowSizeCalculator(false)}
                        className="text-[#777777] hover:text-black"
                      >
                        إغلاق
                      </button>
                    </div>

                    <form onSubmit={handleCalculateSize} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#555555] mb-1">الطول (سم):</label>
                        <input
                          type="number"
                          value={userHeight}
                          onChange={(e) => setUserHeight(Number(e.target.value))}
                          min="130"
                          max="220"
                          className="w-full bg-white border border-[#D5CFC7] rounded px-2.5 py-1.5 text-xs text-[#111111]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#555555] mb-1">الوزن (كجم):</label>
                        <input
                          type="number"
                          value={userWeight}
                          onChange={(e) => setUserWeight(Number(e.target.value))}
                          min="35"
                          max="160"
                          className="w-full bg-white border border-[#D5CFC7] rounded px-2.5 py-1.5 text-xs text-[#111111]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#555555] mb-1">تفضيل القصة:</label>
                        <select
                          value={fitPreference}
                          onChange={(e) => setFitPreference(e.target.value as any)}
                          className="w-full bg-white border border-[#D5CFC7] rounded px-2 py-1.5 text-xs text-[#111111]"
                        >
                          <option value="regular">معتدل ومريح (Regular)</option>
                          <option value="slim">مجسم وأنيق (Slim)</option>
                          <option value="oversized">فضفاض واسع (Oversized)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          className="w-full bg-[#8B6B3F] hover:bg-[#72562E] text-white py-2 rounded font-semibold text-xs cursor-pointer transition-colors shadow-xs"
                        >
                          حساب المقاس الموصى به
                        </button>
                      </div>
                    </form>

                    {calculatedSizeResult && (
                      <div className="bg-white p-3 rounded-lg border border-[#D8C7B5] space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111111] text-sm">
                            المقاس المقترح لك: <span className="text-[#8B6B3F] font-mono">{calculatedSizeResult.recommendedSize}</span>
                          </span>
                          <span className="text-xs bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded font-bold font-mono">
                            نسبة المطابقة: {calculatedSizeResult.confidenceScore}%
                          </span>
                        </div>
                        <p className="text-[11px] text-[#555555] leading-relaxed">
                          {calculatedSizeResult.matchReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="mt-5 flex items-center gap-4">
                <span className="text-xs font-bold text-[#222222]">الكمية:</span>
                <div className="flex items-center border border-[#D5CFC7] rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 text-sm font-bold text-[#444444] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-xs font-bold font-mono tabular-nums text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="px-3 py-1 text-sm font-bold text-[#444444] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Fabric details */}
              <div className="mt-6 border-t border-[#EFECE6] pt-4 space-y-2 text-xs text-[#555555]">
                <p className="leading-relaxed text-[#333333]">
                  {product.description}
                </p>
                <div className="bg-[#FAF9F6] p-3 rounded-lg space-y-1 border border-[#EFECE6]">
                  <div><strong className="text-[#111111]">تفاصيل القماش:</strong> {product.fabricDetails}</div>
                  <div><strong className="text-[#111111]">إرشادات العناية:</strong> {product.careInstructions}</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-4 border-t border-[#EFECE6]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onAddToCart(product, selectedSize, selectedColor, quantity)}
                  className="bg-[#111111] hover:bg-[#2A2A2A] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
                  <span>إضافة إلى سلة المشتريات</span>
                </button>

                <button
                  onClick={() => onDirectWhatsApp(product, selectedSize, selectedColor, quantity)}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  title="مشاركة والطلب المباشر عبر واتساب الإدارة"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>طلب مباشر عبر واتساب (+967)</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-[#666666] pt-2">
                <div className="flex flex-col items-center gap-1 p-2 bg-[#FAF8F5] rounded-lg border border-[#EDE8DC]">
                  <ShieldCheck className="w-4 h-4 text-[#8B6B3F]" />
                  <span>فحص قبل التغليف</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-[#FAF8F5] rounded-lg border border-[#EDE8DC]">
                  <RotateCcw className="w-4 h-4 text-[#8B6B3F]" />
                  <span>ضمان مطابقة المقاس</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-[#FAF8F5] rounded-lg border border-[#EDE8DC]">
                  <Truck className="w-4 h-4 text-[#8B6B3F]" />
                  <span>إيداع بنكي وشحن مؤمن</span>
                </div>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="mt-8 pt-6 border-t border-[#EFECE6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111111]">
                  تجارب وآراء العملاء الموثقة ({reviews.length})
                </h3>
                <span className="text-xs text-[#8B6B3F] font-semibold">
                  معدل الرضا: 99%
                </span>
              </div>

              <form onSubmit={handleAddReview} className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#EBE7DF] mb-4 space-y-2.5">
                <span className="block text-xs font-bold text-[#222222]">
                  أضف تقييمك وتجربتك بعد الاستلام:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="اسمك الكريم والمدينة..."
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    required
                    className="bg-white border border-[#D5CFC7] rounded px-3 py-1.5 text-xs text-[#111111]"
                  />
                  <div className="flex items-center gap-2 bg-white border border-[#D5CFC7] rounded px-3 py-1.5 text-xs">
                    <span className="text-[#666666]">التقييم:</span>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="bg-transparent font-bold text-[#111111]"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (ممتاز جداً)</option>
                      <option value="4">⭐⭐⭐⭐ (جيد جداً)</option>
                      <option value="3">⭐⭐⭐ (متوسط)</option>
                    </select>
                  </div>
                </div>
                <textarea
                  placeholder="اكتب ملاحظاتك عن جودة القماش، المقاس، سرعة استلام الطلب والتنسيق عبر الواتساب..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={2}
                  required
                  className="w-full bg-white border border-[#D5CFC7] rounded px-3 py-1.5 text-xs text-[#111111]"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#777777]">
                    ✓ مشتريات موثقة ومطابقة للأصل
                  </span>
                  <button
                    type="submit"
                    className="bg-[#111111] hover:bg-[#333333] text-white text-xs font-semibold px-4 py-1.5 rounded cursor-pointer transition-colors"
                  >
                    نشر التقييم
                  </button>
                </div>
                {reviewSubmitted && (
                  <p className="text-xs text-[#2E7D32] font-semibold bg-[#E8F5E9] p-2 rounded">
                    شكراً لك! تم إضافة تقييمك بنجاح ضمن آراء العملاء.
                  </p>
                )}
              </form>

              <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                {localReviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-white rounded-lg border border-[#EFECE6] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111111]">{rev.authorName}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            شراء مؤكد
                          </span>
                        )}
                      </div>
                      <div className="flex text-[#C5A880]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#C5A880]" />
                        ))}
                      </div>
                    </div>

                    {rev.sizePurchased && (
                      <div className="text-[11px] text-[#777777]">
                        المقاس المستلم: <span className="font-mono font-semibold text-[#111111]">{rev.sizePurchased}</span> {rev.heightWeight && `(${rev.heightWeight})`}
                      </div>
                    )}

                    <p className="text-[#444444] leading-relaxed pt-1">
                      {rev.comment}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-[#888888] pt-1">
                      <span>{rev.date}</span>
                      <button className="flex items-center gap-1 hover:text-[#111111] cursor-pointer">
                        <ThumbsUp className="w-3 h-3" />
                        <span>مفيد ({rev.helpfulCount})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
