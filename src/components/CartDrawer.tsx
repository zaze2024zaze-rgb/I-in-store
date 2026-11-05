import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  MessageCircle, 
  Building2, 
  Copy, 
  Check, 
  UploadCloud, 
  Tag, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck,
  AlertCircle,
  Camera,
  FileCheck,
  Plus,
  RefreshCw
} from 'lucide-react';
import { CartItem, Coupon, Order, CurrencyType, StoreSettings, BankAccount } from '../types.ts';
import { calculateCartTotals, formatCurrencyLabel, convertSARtoCurrency } from '../utils/pricing.ts';
import { generateWhatsAppDirectLink, OFFICIAL_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';
import { INITIAL_BANK_ACCOUNTS, INITIAL_COUPONS } from '../data/mockData.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: CurrencyType;
  yerRate: number;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderCreated: (order: Order, clearCart?: boolean) => void;
  settings?: StoreSettings;
  banks?: BankAccount[];
  coupons?: Coupon[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  yerRate,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
  settings,
  banks = INITIAL_BANK_ACCOUNTS,
  coupons = INITIAL_COUPONS,
}) => {
  if (!isOpen) return null;

  const activeBankList = banks.length > 0 ? banks.filter(b => b.isActive !== false) : INITIAL_BANK_ACCOUNTS;
  const activeCouponsList = coupons.length > 0 ? coupons : INITIAL_COUPONS;

  const [activeTab, setActiveTab] = useState<'cart' | 'whatsapp_export' | 'bank_deposit'>('cart');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Customer checkout info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerCity, setCustomerCity] = useState<string>('صنعاء');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>(activeBankList[0]?.bankName || 'بنك الكريمي');
  const [depositNotes, setDepositNotes] = useState<string>('');
  const [uploadedReceiptName, setUploadedReceiptName] = useState<string>('');
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  const [orderSentSuccess, setOrderSentSuccess] = useState<{
    orderNumber: string;
    url: string;
    itemCount: number;
  } | null>(null);

  const [formError, setFormError] = useState<string>('');

  // Dynamic shipping fee determined by Admin settings
  const customShippingFeeSAR = settings?.shippingFeeSAR ?? 25;
  const customFreeShippingThresholdSAR = settings?.freeShippingThresholdSAR ?? 400;
  const isFreeShippingActive = settings?.isFreeShippingActive ?? true;

  const totals = calculateCartTotals(
    items, 
    appliedCoupon, 
    currency, 
    yerRate,
    customShippingFeeSAR,
    customFreeShippingThresholdSAR,
    isFreeShippingActive
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    const found = activeCouponsList.find((c) => c.code.toUpperCase() === code);

    if (!found) {
      setCouponError('كود الخصم غير صحيح أو منتهي الصلاحية');
      return;
    }

    if (found.minSpendSAR && totals.subtotalSAR < found.minSpendSAR) {
      setCouponError(`الحد الأدنى لتطبيق هذا الكوبون هو ${formatCurrencyLabel(convertSARtoCurrency(found.minSpendSAR, currency, yerRate), currency)}`);
      return;
    }

    setAppliedCoupon(found);
  };

  const handleCopyAccount = (text: string, bankId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankId(bankId);
    setTimeout(() => setCopiedBankId(null), 2500);
  };

  const handleProceedWhatsAppOrder = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('يرجى ملء الاسم ورقم الهاتف لإكمال تأكيد السلة');
      return;
    }
    setFormError('');

    const orderNumber = 'IN-' + Math.floor(10000 + Math.random() * 90000);
    const orderDetails = {
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerCity: customerCity.trim(),
      customerAddress: customerAddress.trim(),
      paymentMethod: activeTab === 'bank_deposit' ? ('bank_deposit' as const) : ('whatsapp_order' as const),
      depositBank: activeTab === 'bank_deposit' ? selectedBank : undefined,
      notes: depositNotes.trim() + (uploadedReceiptName ? ` [مرفق إشعار: ${uploadedReceiptName}]` : ''),
      currency,
      yerRate,
    };

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      orderNumber,
      createdAt: new Date().toISOString(),
      items: [...items],
      subtotal: totals.subtotalDisplay,
      couponDiscount: totals.couponDiscountDisplay,
      shippingFee: totals.shippingFeeDisplay,
      total: totals.totalDisplay,
      currency,
      status: 'pending_confirmation',
      customerName: orderDetails.customerName,
      customerPhone: orderDetails.customerPhone,
      customerCity: orderDetails.customerCity,
      customerAddress: orderDetails.customerAddress,
      paymentMethod: orderDetails.paymentMethod,
      depositBank: orderDetails.depositBank,
      depositNotes: orderDetails.notes,
      whatsappMessageSent: true,
      updatedAt: new Date().toISOString(),
    };

    // User request: Allow adding multiple products and repeated sharing without forced cart clearing
    onOrderCreated(newOrder, false);

    const url = generateWhatsAppDirectLink(items, totals, orderDetails);
    window.open(url, '_blank', 'noopener,noreferrer');

    setOrderSentSuccess({
      orderNumber,
      url,
      itemCount: items.length,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-start animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E5DFD7] text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EFECE6] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C5A880]" />
            <h2 className="text-base font-bold text-[#111111]">سلة المشتريات والطلب المباشر</h2>
            <span className="text-xs bg-[#111111] text-white px-2 py-0.5 rounded-full font-mono tabular-nums">
              {items.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            aria-label="إغلاق السلة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step Tab Navigation */}
        <div className="flex border-b border-[#EFECE6] bg-[#FAF9F6] text-xs font-medium">
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'cart'
                ? 'border-[#111111] text-[#111111] font-bold bg-white'
                : 'border-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            1. محتويات السلة ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('whatsapp_export')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'whatsapp_export'
                ? 'border-[#25D366] text-[#1B5E20] font-bold bg-[#E8F5E9]/50'
                : 'border-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>2. مشاركة الواتساب</span>
          </button>
          <button
            onClick={() => setActiveTab('bank_deposit')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'bank_deposit'
                ? 'border-[#8B6B3F] text-[#8B6B3F] font-bold bg-[#FAF8F5]'
                : 'border-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#8B6B3F]" />
            <span>3. الإيداع البنكي</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Order Sent / Re-share Success Banner */}
          {orderSentSuccess && (
            <div className="bg-[#E8F5E9] border border-[#2E7D32]/40 p-4 rounded-xl text-xs space-y-2.5 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 text-[#1B5E20] font-bold">
                <Check className="w-5 h-5 text-[#2E7D32] shrink-0" />
                <span>تم فتح الواتساب بنجاح لمشاركة {orderSentSuccess.itemCount} منتجات</span>
              </div>
              <p className="text-[11px] text-[#2E7D32] leading-relaxed">
                رقم الطلب: <strong className="font-mono text-[#111111]">{orderSentSuccess.orderNumber}</strong>. محتويات سلتك محفوظة ولم يتم مسحها، لتتمكن من إضافة قطع أخرى أو مشاركة السلة مجدداً متى شئت.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => window.open(orderSentSuccess.url, '_blank', 'noopener,noreferrer')}
                  className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white py-2 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة المشاركة بالواتساب</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-[#111111] hover:bg-[#333333] text-white py-2 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>إضافة منتجات أخرى للسلة</span>
                </button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center text-[#888888]">
                <ShoppingBag className="w-8 h-8 text-[#C5A880]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">سلة المشتريات فارغة حالياً</h3>
                <p className="text-xs text-[#777777] mt-1">تصفحي تشكيلتنا الراقية وأضيفي قطعك المفضلة</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-full hover:bg-[#333333] transition-colors cursor-pointer shadow-sm"
              >
                تصفح تشكيلة الأزياء
              </button>
            </div>
          ) : activeTab === 'cart' ? (
            /* Items List Tab */
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-[#777777] bg-[#F7F5F0] p-2.5 rounded-lg border border-[#EDE8DC]">
                <button
                  onClick={onClose}
                  className="text-[#111111] font-bold hover:text-[#8B6B3F] flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#8B6B3F]" />
                  <span>+ إضافة منتجات أخرى (متابعة التصفح)</span>
                </button>
                <button
                  onClick={onClearCart}
                  className="text-[#A34E36] hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ السلة</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const itemPrice = convertSARtoCurrency(item.unitPriceSAR, currency, yerRate);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-xl border border-[#EDE8DC] bg-[#FAF9F6] relative group hover:border-[#D5CFC7] transition-all"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-20 h-24 object-cover rounded-lg bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between py-0.5 text-xs">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-[#111111] text-xs leading-snug line-clamp-2">
                              {item.product.title}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-[#888888] hover:text-[#A34E36] p-1 cursor-pointer"
                              title="حذف من السلة"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#666666] mt-1">
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E5DFD7]">
                              المقاس: <strong>{item.selectedSize}</strong>
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E5DFD7]">
                              اللون: <strong>{item.selectedColor}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="font-bold text-[#111111] text-sm font-mono tabular-nums">
                            {formatCurrencyLabel(itemPrice * item.quantity, currency)}
                          </span>

                          {/* Quantity Controls */}
                          <div className="flex items-center border border-[#D5CFC7] rounded-lg bg-white overflow-hidden">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-[#555555] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
                              aria-label="إنقاص الكمية"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-mono font-bold text-[#111111] tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-[#555555] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
                              aria-label="زيادة الكمية"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <form onSubmit={handleApplyCoupon} className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#888888] absolute top-2.5 right-2.5" />
                    <input
                      type="text"
                      placeholder="كوبون الخصم (جرب FIRST15 أو LUXE20 أو VIP50)..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg pr-8 pl-3 py-1.5 text-xs text-[#111111] uppercase font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#111111] text-white rounded-lg text-xs font-semibold hover:bg-[#333333] transition-colors cursor-pointer"
                  >
                    تطبيق
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-[11px] text-[#2E7D32] mt-1 font-medium">
                    ✓ تم تطبيق كود {appliedCoupon.code} ({appliedCoupon.description})
                  </p>
                )}
                {couponError && (
                  <p className="text-[11px] text-[#A34E36] mt-1 font-medium">
                    {couponError}
                  </p>
                )}
              </form>
            </div>
          ) : activeTab === 'whatsapp_export' ? (
            /* WhatsApp Share Tab */
            <div className="space-y-4 text-xs">
              {/* Highlighted Bank Receipt Instructions as requested */}
              <div className="bg-[#FFF8E7] border-2 border-[#D4AF37] p-4 rounded-xl text-[#78540B] shadow-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#111111]">
                  <Camera className="w-4 h-4 text-[#C5A880] shrink-0" />
                  <span>📸 تعليمات هامة عند مشاركة السلة عبر الواتساب:</span>
                </div>
                <p className="text-[11px] leading-relaxed font-medium text-[#573E07]">
                  يرجى التقاط صورة لسند أو إشعار الإيداع/التحويل البنكي وإرفاقها مباشرة داخل محادثة الواتساب فور إرسال السلة ليتمكن مشرف المتجر من مطابقة الحساب والبدء بتجهيز وشحن طلبك فورياً.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8C6D23] font-semibold pt-1 border-t border-[#F0DFA7]">
                  <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>يتم إرسال كافة تفاصيل المقاسات، والأسعار، وكود المنتجات بضغطة زر واحدة.</span>
                </div>
              </div>

              <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-3.5 rounded-xl text-[#1B5E20] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>آلية الطلب المباشر ومشاركة السلة مع المشرف</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#2E7D32]">
                  سيتم فتح تطبيق الواتساب المعتمد على الرقم: <strong>(+{OFFICIAL_WHATSAPP_NUMBER})</strong> مع رسالة مشفرة ومكتملة البيانات.
                </p>
              </div>

              {/* Customer Info Form */}
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#EDE8DC] space-y-3">
                <span className="font-bold text-[#111111] block">بياناتك لتسليم وتأكيد الطلب:</span>

                <div>
                  <label className="block text-[11px] text-[#555555] mb-1">الاسم الكامل *:</label>
                  <input
                    type="text"
                    placeholder="مثال: ريم محمد الشامي"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#555555] mb-1">رقم الواتساب للتواصل *:</label>
                    <input
                      type="tel"
                      placeholder="+967..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#555555] mb-1">المدينة / المحافظة:</label>
                    <input
                      type="text"
                      placeholder="صنعاء / عدن / الرياض..."
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#555555] mb-1">العنوان التفصيلي للتوصيل:</label>
                  <input
                    type="text"
                    placeholder="الشارع، الحي، أقرب معلم بارز..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111]"
                  />
                </div>

                {/* Optional Attachment */}
                <div className="bg-white p-3 rounded-lg border border-[#D5CFC7] space-y-1.5">
                  <label className="block text-[11px] text-[#444444] font-bold">
                    إرفاق سند الإيداع (اختياري، أو أرسله عبر محادثة الواتساب):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadedReceiptName(e.target.files[0].name);
                      }
                    }}
                    className="text-[11px] text-[#555555] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-[#111111] file:text-white file:cursor-pointer"
                  />
                  {uploadedReceiptName && (
                    <p className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>جاهز للإرفاق: {uploadedReceiptName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-[#555555] mb-1">ملاحظات إضافية للمشرف:</label>
                  <textarea
                    placeholder="أي استفسار عن قماش أو طلب تغليف خاص للهدايا..."
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111]"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-[#FFEBEE] text-[#C62828] p-2.5 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Bank Deposit Tab */
            <div className="space-y-4 text-xs">
              {/* Instructions banner */}
              <div className="bg-[#FFF8E7] border border-[#E0C988] p-3.5 rounded-xl text-[#78540B] space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#111111]">
                  <Camera className="w-4 h-4 text-[#8B6B3F]" />
                  <span>تعليمات الإيداع البنكي وإرفاق السند:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  قم بالتحويل أو الإيداع لحسابنا بأحد البنوك أدناه، ثم التقط صورة لسند الإيداع وأرفقها عند إرسال السلة عبر الواتساب.
                </p>
              </div>

              <div className="space-y-2.5">
                {activeBankList.map((bank) => (
                  <div
                    key={bank.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      selectedBank === bank.bankName
                        ? 'border-[#8B6B3F] bg-[#FAF8F5] shadow-xs'
                        : 'border-[#EFECE6] bg-white hover:border-[#D5CFC7]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#111111]">{bank.bankName}</span>
                      <button
                        onClick={() => setSelectedBank(bank.bankName)}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                          selectedBank === bank.bankName
                            ? 'bg-[#8B6B3F] text-white font-bold'
                            : 'bg-[#F2EFE9] text-[#555555]'
                        }`}
                      >
                        {selectedBank === bank.bankName ? 'البنك المختار' : 'اختيار'}
                      </button>
                    </div>

                    <div className="space-y-1 text-[11px] text-[#444444]">
                      <div>الاسم: <strong className="text-[#111111]">{bank.accountName}</strong></div>
                      <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-[#E5DFD7] font-mono">
                        <span className="font-bold text-[#111111]">{bank.accountNumber}</span>
                        <button
                          onClick={() => handleCopyAccount(bank.accountNumber, bank.id)}
                          className="text-[#8B6B3F] hover:text-[#111111] flex items-center gap-1 cursor-pointer text-[10px]"
                        >
                          {copiedBankId === bank.id ? <Check className="w-3 h-3 text-[#2E7D32]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBankId === bank.id ? 'تم النسخ!' : 'نسخ الرقم'}</span>
                        </button>
                      </div>
                      {bank.iban && (
                        <div className="text-[10px] text-[#777777] font-mono">IBAN: {bank.iban}</div>
                      )}
                      <p className="text-[10px] text-[#888888] pt-1">{bank.notes}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Deposit Receipt */}
              <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-dashed border-[#C5A880] text-center space-y-2">
                <UploadCloud className="w-6 h-6 mx-auto text-[#8B6B3F]" />
                <span className="font-bold text-xs text-[#111111] block">إرفاق صورة إشعار التحويل / الإيداع</span>
                <p className="text-[10px] text-[#777777]">
                  يمكنك رفع صورة السند هنا ليتم ربطها تلقائياً بالطلب وإرسالها لمشرف الواتساب.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadedReceiptName(e.target.files[0].name);
                    }
                  }}
                  className="text-[11px] text-[#555555] file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#111111] file:text-white file:cursor-pointer"
                />
                {uploadedReceiptName && (
                  <p className="text-xs text-[#2E7D32] font-semibold">
                    ✓ تم اختيار الملف: {uploadedReceiptName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Order Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#EFECE6] bg-[#FAF9F6] space-y-3">
            <div className="space-y-1.5 text-xs text-[#555555]">
              <div className="flex justify-between">
                <span>المجموع الفرعي ({items.length} قطع):</span>
                <span className="font-mono tabular-nums text-[#111111]">
                  {formatCurrencyLabel(totals.subtotalDisplay, currency)}
                </span>
              </div>
              {totals.couponDiscountDisplay > 0 && (
                <div className="flex justify-between text-[#2E7D32]">
                  <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrencyLabel(totals.couponDiscountDisplay, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>رسوم الشحن والتوصيل (محدد من المشرف):</span>
                <span className="font-mono tabular-nums text-[#111111]">
                  {totals.shippingFeeDisplay === 0 ? 'مجاني (عرض خاص)' : formatCurrencyLabel(totals.shippingFeeDisplay, currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#111111] pt-2 border-t border-[#E5DFD7]">
                <span>المبلغ الإجمالي المطلوب:</span>
                <span className="font-mono tabular-nums text-lg text-[#111111]">
                  {formatCurrencyLabel(totals.totalDisplay, currency)}
                </span>
              </div>
            </div>

            {activeTab === 'cart' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('whatsapp_export')}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مشاركة عبر واتساب</span>
                </button>
                <button
                  onClick={() => setActiveTab('bank_deposit')}
                  className="bg-[#111111] hover:bg-[#2A2A2A] text-white py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-[#C5A880]" />
                  <span>بيانات الإيداع البنكي</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleProceedWhatsAppOrder}
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>إرسال السلة والطلب إلى المشرف (+{OFFICIAL_WHATSAPP_NUMBER})</span>
                </button>

                {/* Reminder note */}
                <p className="text-[11px] text-center text-[#78540B] bg-[#FFF8E7] py-1.5 px-2 rounded-lg font-medium">
                  📸 تذكير: يرجى إرفاق صورة سند الإيداع في نفس محادثة الواتساب لتأكيد الشحن فوراً
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#777777]">
                  <button
                    onClick={() => setActiveTab('cart')}
                    className="hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    <span>العودة لمراجعة السلة</span>
                  </button>
                  <span className="flex items-center gap-1 text-[#2E7D32]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>حساب مشفر ومحمي من التلاعب</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
