import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Heart, 
  CheckCircle2, 
  MessageCircle,
  User,
  LogOut,
  LogIn,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  Truck,
  Clock,
  Clock3,
  Sparkles
} from 'lucide-react';
import { Order, Product, OrderStatus, CurrencyType, CustomerAccount } from '../types.ts';
import { OFFICIAL_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';
import { formatCurrencyLabel } from '../utils/pricing.ts';
import { normalizePhoneKey } from '../services/firebase.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  wishlist: Product[];
  currency: CurrencyType;
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  currentCustomer?: CustomerAccount | null;
  onOpenCustomerAuth?: () => void;
  onLogoutCustomer?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  orders,
  wishlist,
  currency,
  onRemoveFromWishlist,
  onAddToCart,
  currentCustomer,
  onOpenCustomerAuth,
  onLogoutCustomer,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');

  // Filter orders for the logged-in customer's phone number safely
  const customerOrders = currentCustomer && currentCustomer.phone
    ? orders.filter((o) => {
        if (!o.customerPhone) return false;
        const phoneA = normalizePhoneKey(o.customerPhone);
        const phoneB = normalizePhoneKey(currentCustomer.phone);
        return Boolean(phoneA && phoneB && phoneA === phoneB);
      })
    : orders; // If not logged in, show session orders

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const stepsList = [
    { label: 'بانتظار التأكيد', desc: 'مراجعة وتأكيد الطلب' },
    { label: 'جاري التحضير', desc: 'فحص المقاس والتجهيز' },
    { label: 'تم الشحن', desc: 'التسليم لشركة الشحن' },
    { label: 'قيد التوصيل', desc: 'مع مندوب التوصيل' },
    { label: 'تم الاستلام', desc: 'وصلت بنجاح' },
  ];

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation':
        return <span className="bg-[#FFF8E7] text-[#78540B] border border-[#E0C988] px-2.5 py-0.5 rounded-full text-[11px] font-bold">بانتظار التأكيد</span>;
      case 'processing':
        return <span className="bg-[#E3F2FD] text-[#0D47A1] border border-[#90CAF9] px-2.5 py-0.5 rounded-full text-[11px] font-bold">جاري التحضير والتجهيز</span>;
      case 'shipped':
        return <span className="bg-[#EDE7F6] text-[#4A148C] border border-[#D1C4E9] px-2.5 py-0.5 rounded-full text-[11px] font-bold">تم الشحن</span>;
      case 'out_for_delivery':
        return <span className="bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80] px-2.5 py-0.5 rounded-full text-[11px] font-bold">قيد التوصيل مع المندوب</span>;
      case 'delivered':
        return <span className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] px-2.5 py-0.5 rounded-full text-[11px] font-bold">تم الاستلام بنجاح ✓</span>;
      case 'cancelled':
        return <span className="bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] px-2.5 py-0.5 rounded-full text-[11px] font-bold">ملغي</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E0D8] relative text-right flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EFECE6] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#111111] text-[#E5D3B3] flex items-center justify-center font-bold text-sm">
              I
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111111]">الملف الشخصي وتتبع الطلبات</h2>
              <p className="text-xs text-[#777777]">متجر I in - تجربة تسوق آمنة ومزامنة سحابية لحظية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            aria-label="إغلاق الملف الشخصي"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Account Summary Card */}
        <div className="bg-[#FAF8F5] border-b border-[#EFECE6] p-4 sm:px-6">
          {currentCustomer ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#111111] text-[#C5A880] flex items-center justify-center shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#111111]">{currentCustomer.name}</span>
                    <span className="bg-[#E8F5E9] text-[#1B5E20] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span>
                      <span>حساب نشط</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-[#8B6B3F]" />
                      <span>{currentCustomer.phone}</span>
                    </span>
                    {currentCustomer.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8B6B3F]" />
                        <span>{currentCustomer.city}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {onLogoutCustomer && (
                <button
                  type="button"
                  onClick={onLogoutCustomer}
                  className="inline-flex items-center gap-1.5 text-xs text-[#C62828] hover:bg-[#FFEBEE] px-3 py-1.5 rounded-lg border border-[#FFCDD2] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#111111] block">
                  أنت تتصفح كزائر حالياً
                </span>
                <p className="text-[11px] text-[#777777]">
                  سجّل دخولك برقم جوالك لتظهر طلباتك السابقة وتتمكن من تتبع الشحنات لحظياً.
                </p>
              </div>

              {onOpenCustomerAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomerAuth();
                  }}
                  className="bg-[#111111] text-white hover:bg-[#2C2C2C] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>تسجيل الدخول / إنشاء حساب</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 border-b border-[#EFECE6] bg-[#F7F5F0] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-[#111111] border-b-2 border-[#111111] font-bold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>طلباتي وتتبع الشحنات ({customerOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'wishlist'
                ? 'bg-white text-[#A34E36] border-b-2 border-[#A34E36] font-bold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>قائمة الأمنيات ({wishlist.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'orders' ? (
            <div className="space-y-6">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-12 h-12 mx-auto text-[#BBBBBB]" />
                  <h3 className="text-sm font-bold text-[#111111]">
                    {currentCustomer ? 'لا توجد طلبات مسجلة لرقم جوالك حتى الآن' : 'لا توجد طلبات معروضة'}
                  </h3>
                  <p className="text-xs text-[#777777] max-w-sm mx-auto">
                    عند إرسال طلبك عبر الواتساب أو الإيداع البنكي سيتم تسجيله تلقائياً وتحديث مساره هنا لحظة بلحظة.
                  </p>
                </div>
              ) : (
                customerOrders.map((order) => {
                  const stepIndex = getStatusStepIndex(order.status);
                  const isCancelled = order.status === 'cancelled';
                  return (
                    <div key={order.id} className="bg-[#FAF9F6] border border-[#E8E4DD] rounded-2xl p-5 space-y-4 shadow-xs">
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E4DD] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-[#111111] text-white px-2.5 py-0.5 rounded">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-[#666666]">
                              {new Date(order.createdAt).toLocaleDateString('ar-YE', { dateStyle: 'medium' })}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-xs text-[#444444] mt-1.5">
                            العميل: <strong className="text-[#111111]">{order.customerName}</strong> ({order.customerPhone})
                          </p>
                          {order.customerCity && (
                            <p className="text-[11px] text-[#777777]">
                              وجهة التوصيل: {order.customerCity} - {order.customerAddress || 'عنوان قياسي'}
                            </p>
                          )}
                        </div>

                        <div className="text-left">
                          <span className="text-xs text-[#777777] block">المبلغ الإجمالي</span>
                          <span className="text-base font-bold font-mono text-[#111111] tabular-nums">
                            {formatCurrencyLabel(order.total, order.currency || currency)}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Tracker (Live Stepper) */}
                      {!isCancelled ? (
                        <div className="py-2">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-[#8B6B3F]" />
                              <span>تتبع مسار الطلب لحظياً:</span>
                            </span>
                            <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
                              <span>تحديث سحابي مباشر</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-1 relative">
                            {stepsList.map((st, idx) => {
                              const isDone = idx <= stepIndex;
                              const isCurrent = idx === stepIndex;
                              return (
                                <div key={idx} className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                                      isDone
                                        ? 'bg-[#111111] text-[#E5D3B3] ring-2 ring-[#C5A880]/30'
                                        : 'bg-[#E5DFD7] text-[#888888]'
                                    }`}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
                                    ) : (
                                      <span>{idx + 1}</span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] leading-tight ${isCurrent ? 'font-bold text-[#111111]' : 'text-[#777777]'}`}>
                                    {st.label}
                                  </span>
                                  <span className="text-[9px] text-[#999999] hidden sm:block mt-0.5">{st.desc}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Tracking Details Banner if provided by Admin */}
                          {(order.trackingNumber || order.shippingCarrier) && (
                            <div className="mt-3 p-3 rounded-xl bg-[#FAF9F6] border border-[#E5DFD7] flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-[#8B6B3F] shrink-0" />
                                <div>
                                  <span className="font-bold text-[#111111]">بيانات الشحن والتوصيل: </span>
                                  {order.shippingCarrier && (
                                    <span className="text-[#555555]">
                                      شركة الشحن: <strong>{order.shippingCarrier}</strong>
                                    </span>
                                  )}
                                  {order.trackingNumber && (
                                    <span className="mr-2 text-[#8B6B3F] font-mono font-bold bg-white px-2 py-0.5 rounded border border-[#E5DFD7]">
                                      بوليصة #{order.trackingNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#FFEBEE] text-[#C62828] p-3 rounded-xl text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>تم إلغاء هذا الطلب. يرجى التواصل مع المشرف للاستفسار أو إعادة الطلب.</span>
                        </div>
                      )}

                      {/* Items Preview */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#EFECE6] space-y-2">
                        <span className="text-xs font-bold text-[#111111] block">القطع المطلوبة ({order.items.length}):</span>
                        <div className="space-y-2">
                          {order.items.map((it, idx) => {
                            const itemImage = it.product?.images?.[0] || '';
                            const itemTitle = it.product?.title || 'قطعة مختارة';
                            const itemUnitPrice = it.unitPriceSAR || it.product?.priceSAR || 0;
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  {itemImage ? (
                                    <img src={itemImage} alt={itemTitle} className="w-9 h-11 object-cover rounded border border-[#E5DFD7]" />
                                  ) : (
                                    <div className="w-9 h-11 bg-[#F5F2EC] rounded border border-[#E5DFD7] flex items-center justify-center text-[10px] text-[#999]">I in</div>
                                  )}
                                  <div>
                                    <span className="font-medium text-[#111111] block">{itemTitle}</span>
                                    <span className="text-[10px] text-[#777777]">المقاس: {it.selectedSize} × {it.quantity}</span>
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-[#111111]">
                                  {formatCurrencyLabel(itemUnitPrice * it.quantity, order.currency || currency)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Direct WhatsApp Contact Button for this order */}
                      <div className="pt-1 flex items-center justify-between">
                        <a
                          href={`https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                            `السلام عليكم، أود الاستفسار عن حالة طلبي رقم (${order.orderNumber}) في متجر I in.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B5E20] hover:text-[#111111] transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>استفسار مباشر عن هذا الطلب عبر الواتساب</span>
                        </a>

                        <span className="text-[10px] text-[#888888] font-mono">
                          آخر تحديث: {order.updatedAt ? new Date(order.updatedAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }) : 'لحظي'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Wishlist Tab */
            <div className="space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Heart className="w-12 h-12 mx-auto text-[#BBBBBB]" />
                  <h3 className="text-sm font-bold text-[#111111]">قائمة أمنياتك فارغة</h3>
                  <p className="text-xs text-[#777777]">
                    اضغط على أيقونة القلب على أي فستان أو قطعة مميزة لإضافتها إلى قائمتك الخاصة هنا.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((item) => {
                    const itemImage = item.images?.[0] || '';
                    return (
                      <div
                        key={item.id}
                        className="bg-[#FAF9F6] border border-[#E8E4DD] rounded-2xl p-4 flex gap-3 items-center"
                      >
                        {itemImage ? (
                          <img
                            src={itemImage}
                            alt={item.title}
                            className="w-20 h-24 object-cover rounded-xl border border-[#E5DFD7]"
                          />
                        ) : (
                          <div className="w-20 h-24 bg-[#F5F2EC] rounded-xl border border-[#E5DFD7] flex items-center justify-center text-xs text-[#999]">I in</div>
                        )}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <h4 className="text-xs font-bold text-[#111111] truncate">{item.title}</h4>
                          <span className="text-xs font-mono font-bold text-[#111111] block">
                            {formatCurrencyLabel(item.priceSAR, currency)}
                          </span>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onAddToCart(item)}
                              className="bg-[#111111] text-white hover:bg-[#2C2C2C] px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              إضافة للسلة
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveFromWishlist(item)}
                              className="text-[#C62828] text-[11px] hover:underline cursor-pointer"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
