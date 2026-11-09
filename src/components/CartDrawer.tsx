import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  MessageCircle, 
  Building2, 
  Copy, 
  Check, 
  Tag, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck,
  AlertCircle,
  Plus,
  RefreshCw,
  User,
  LogIn
} from 'lucide-react';
import { CartItem, Coupon, Order, CurrencyType, StoreSettings, BankAccount, CustomerAccount } from '../types.ts';
import { calculateCartTotals, formatCurrencyLabel, convertSARtoCurrency } from '../utils/pricing.ts';
import { generateWhatsAppDirectLink, OFFICIAL_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';
import { INITIAL_BANK_ACCOUNTS, INITIAL_COUPONS } from '../data/mockData.ts';
import { saveOrderToCloud } from '../services/firebase.ts';

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
  currentCustomer?: CustomerAccount | null;
  onOpenCustomerAuth?: () => void;
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
  currentCustomer,
  onOpenCustomerAuth,
}) => {
  if (!isOpen) return null;

  const activeBankList = banks.length > 0 ? banks.filter(b => b.isActive !== false) : INITIAL_BANK_ACCOUNTS;
  const activeCouponsList = coupons.length > 0 ? coupons : INITIAL_COUPONS;

  const [activeTab, setActiveTab] = useState<'cart' | 'whatsapp_export' | 'bank_deposit'>('cart');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Customer checkout info
  const [customerName, setCustomerName] = useState<string>(currentCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentCustomer?.phone || '');
  const [customerCity, setCustomerCity] = useState<string>(currentCustomer?.city || 'صنعاء');
  const [customerAddress, setCustomerAddress] = useState<string>(currentCustomer?.address || '');
  const [selectedBank, setSelectedBank] = useState<string>(activeBankList[0]?.bankName || 'بنك الكريمي');
  const [depositNotes, setDepositNotes] = useState<string>('');
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  // Sync with currentCustomer prop when updated
  useEffect(() => {
    if (currentCustomer) {
      if (currentCustomer.name) setCustomerName(currentCustomer.name);
      if (currentCustomer.phone) setCustomerPhone(currentCustomer.phone);
      if (currentCustomer.city) setCustomerCity(currentCustomer.city);
      if (currentCustomer.address) setCustomerAddress(currentCustomer.address);
    }
  }, [currentCustomer]);

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

  const openExternalUrl = (targetUrl: string) => {
    if (!targetUrl) return;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProceedWhatsAppOrder = async () => {
    const cleanName = (customerName || '').trim();
    const cleanPhone = (customerPhone || '').trim();
    if (!cleanName || !cleanPhone) {
      setFormError('يرجى كتابة الاسم الكريم ورقم الجوال للتواصل');
      return;
    }

    if (currentCustomer && currentCustomer.isActive === false) {
      setFormError('عذراً، هذا الحساب معلق من قِبل إدارة المتجر. يرجى التواصل مع المشرف لتفعيله.');
      return;
    }

    setFormError('');

    const orderNumber = 'IN-' + Math.floor(10000 + Math.random() * 90000);
    const orderDetails = {
      orderNumber,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerCity: (customerCity || '').trim(),
      customerAddress: (customerAddress || '').trim(),
      paymentMethod: activeTab === 'bank_deposit' ? ('bank_deposit' as const) : ('whatsapp_order' as const),
      depositBank: activeTab === 'bank_deposit' ? selectedBank : undefined,
      notes: (depositNotes || '').trim(),
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

    // Save to Cloud Firestore in real-time
    saveOrderToCloud(newOrder).catch((err) => {
      console.warn('Could not sync order immediately to cloud:', err);
    });

    // Notify App state without forced clearing so customer can re-share or add more items
    onOrderCreated(newOrder, false);

    const url = generateWhatsAppDirectLink(items, totals, orderDetails);
    openExternalUrl(url);

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

        {/* Customer Account Indicator Banner */}
        <div className="px-5 py-2.5 bg-[#FAF8F5] border-b border-[#EFECE6] flex items-center justify-between text-xs">
          {currentCustomer ? (
            <div className="flex items-center gap-2 text-[#111111]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
              <User className="w-3.5 h-3.5 text-[#8B6B3F]" />
              <span>الحساب: <strong>{currentCustomer.name}</strong> ({currentCustomer.phone})</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[#666666] text-[11px]">طلب كزائر أو تسجيل الدخول للمزامنة:</span>
              {onOpenCustomerAuth && (
                <button
                  type="button"
                  onClick={onOpenCustomerAuth}
                  className="text-[#8B6B3F] hover:text-[#111111] font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول / إنشاء حساب</span>
                </button>
              )}
            </div>
          )}
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
            <span>2. إرسال الطلب (واتساب)</span>
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
            <span>3. الحسابات البنكية</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Order Sent / Re-share Success Banner */}
          {orderSentSuccess && (
            <div className="bg-[#E8F5E9] border border-[#2E7D32]/40 p-4 rounded-xl text-xs space-y-2.5 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 text-[#1B5E20] font-bold">
                <Check className="w-5 h-5 text-[#2E7D32] shrink-0" />
                <span>تم إرسال الطلب والمزامنة سحابياً بنجاح!</span>
              </div>
              <p className="text-[11px] text-[#2E7D32] leading-relaxed">
                رقم الطلب: <strong className="font-mono text-[#111111]">{orderSentSuccess.orderNumber}</strong>. تم تسجيل طلبك ويظهر في لوحة المشرف لحظياً، ويتم استكمال المتابعة حصرياً عبر محادثة الواتساب.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => openExternalUrl(orderSentSuccess.url)}
                  className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white py-2 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>فتح محادثة الواتساب مجدداً</span>
                </button>
                <button
                  onClick={() => setOrderSentSuccess(null)}
                  className="px-3 py-2 bg-white border border-[#C8E6C9] text-[#1B5E20] rounded-lg text-[11px] hover:bg-[#E8F5E9] cursor-pointer"
                >
                  إخفاء التنبيه
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cart' ? (
            /* Items List */
            items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto text-[#CCCCCC]" />
                <p className="text-sm font-bold text-[#111111]">سلة المشتريات فارغة</p>
                <p className="text-xs text-[#777777]">
                  تصفح المجموعات وأضف فساتينك وقطعك المفضلة للمتابعة.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const itemTitle = item.product?.title || 'قطعة مختارة';
                  const itemImage = item.product?.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80';
                  const baseSAR = item.unitPriceSAR || item.product?.priceSAR || 0;
                  const itemPrice = currency === 'YER' 
                    ? Math.round(baseSAR * yerRate)
                    : baseSAR;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-[#FAF9F6] border border-[#EFECE6] rounded-xl hover:border-[#D5CFC7] transition-all"
                    >
                      <img
                        src={itemImage}
                        alt={itemTitle}
                        className="w-16 h-20 object-cover rounded-lg border border-[#E5DFD7] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-[#111111] truncate">{itemTitle}</h4>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-[#999999] hover:text-[#C62828] p-1 transition-colors cursor-pointer"
                            aria-label="حذف من السلة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#777777] mt-0.5">
                          المقاس: <strong className="text-[#111111]">{item.selectedSize}</strong>
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-[#D5CFC7] bg-white rounded-md text-xs">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-[#555555] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono tabular-nums text-[#111111] font-bold">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-[#555555] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-bold font-mono text-[#111111] tabular-nums">
                            {formatCurrencyLabel(itemPrice * item.quantity, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Free shipping progress indicator */}
                {isFreeShippingActive && (
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] text-xs">
                    {totals.freeShippingRemainingSAR > 0 ? (
                      <p className="text-[#8B6B3F] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          أضف بقيمة <strong>{formatCurrencyLabel(convertSARtoCurrency(totals.freeShippingRemainingSAR, currency, yerRate), currency)}</strong> إضافية للحصول على شحن وتوصيل مجاني!
                        </span>
                      </p>
                    ) : (
                      <p className="text-[#2E7D32] font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>مبارك! لقد حصلت على توصيل مجاني لهذا الطلب.</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Coupon Input */}
                <form onSubmit={handleApplyCoupon} className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="أدخل كود الخصم (مثال: LUXURY10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111] uppercase font-mono tracking-wider focus:outline-none focus:border-[#111111]"
                    />
                    <button
                      type="submit"
                      className="bg-[#111111] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#2C2C2C] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      <span>تطبيق</span>
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-[#C62828] mt-1">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-[11px] text-[#2E7D32] mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>تم تطبيق الخصم: {appliedCoupon.description}</span>
                    </p>
                  )}
                </form>
              </div>
            )
          ) : activeTab === 'whatsapp_export' ? (
            /* WhatsApp Direct Checkout Form */
            <div className="space-y-4 text-xs">
              <div className="bg-[#E8F5E9] border border-[#A5D6A7] p-3.5 rounded-xl text-[#1B5E20] space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>تأكيد الطلب المباشر عبر الواتساب الحصري:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  يتم إرسال سلتك والبيانات مباشرة لمشرف المتجر على الواتساب المعتمد (<strong className="font-mono">+{OFFICIAL_WHATSAPP_NUMBER}</strong>) وتظهر في لوحة المشرف لحظياً.
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F6] p-4 rounded-xl border border-[#EFECE6]">
                <h3 className="font-bold text-xs text-[#111111]">بيانات العميل للتسليم والتواصل:</h3>

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

                <div>
                  <label className="block text-[11px] text-[#555555] mb-1">ملاحظات إضافية للمشرف (اختياري):</label>
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
            /* Bank Deposit Tab - Direct WhatsApp communication without file upload */
            <div className="space-y-4 text-xs">
              {/* Instructions banner */}
              <div className="bg-[#FFF8E7] border border-[#E0C988] p-3.5 rounded-xl text-[#78540B] space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#111111]">
                  <Building2 className="w-4 h-4 text-[#8B6B3F]" />
                  <span>الحسابات البنكية المعتمدة والتواصل عبر الواتساب:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  يمكنك التحويل لأي من حساباتنا أدناه، ثم إتمام إرسال الطلب ليتم اعتماد التواصل والتحقق عبر الواتساب المعتمد حصرياً وبأعلى موثوقية.
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
                      {bank.notes && <p className="text-[10px] text-[#888888] pt-1">{bank.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#EAE5DC] text-[11px] text-[#555555] space-y-1">
                <span className="font-bold text-[#111111] block">اعتماد فوري عبر الواتساب:</span>
                <p>
                  عند الضغط على إرسال الطلب، سيتم توجيهك مباشرة لمحادثة المشرف مع تفاصيل البنك المختار والسلة ليتم التأكيد الفوري بدون الحاجة لرفع صور.
                </p>
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
                  <span>إرسال عبر الواتساب</span>
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
                    <span>تأكيد حصري عبر الواتساب</span>
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
