import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Heart, 
  CheckCircle2, 
  MessageCircle,
} from 'lucide-react';
import { Order, Product, OrderStatus, CurrencyType } from '../types.ts';
import { OFFICIAL_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';
import { formatCurrencyLabel } from '../utils/pricing.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  wishlist: Product[];
  currency: CurrencyType;
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  orders,
  wishlist,
  currency,
  onRemoveFromWishlist,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const stepsList = [
    { label: 'بانتظار التأكيد', desc: 'مراجعة الإيداع والطلب' },
    { label: 'جاري التحضير', desc: 'فحص المقاس والتغليف' },
    { label: 'تم الشحن', desc: 'تم التسليم لشركة الشحن' },
    { label: 'قيد التوصيل', desc: 'مع مندوب التوصيل' },
    { label: 'تم الاستلام', desc: 'وصلت بنجاح' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E0D8] relative text-right flex flex-col"
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
              <p className="text-xs text-[#777777]">متجر I in - تجربة تسوق آمنة وموثوقة</p>
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

        {/* Tab Controls (Orders & Wishlist only, Points removed as requested) */}
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
            <span>طلباتي وتتبع الشحنات ({orders.length})</span>
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
              {orders.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-[#AAAAAA]" />
                  <h3 className="text-sm font-bold text-[#111111]">لا توجد طلبات سابقة حتى الآن</h3>
                  <p className="text-xs text-[#777777]">عند إرسال سلتك عبر الواتساب أو الإيداع البنكي ستظهر هنا خطوة بخطوة.</p>
                </div>
              ) : (
                orders.map((order) => {
                  const stepIndex = getStatusStepIndex(order.status);
                  return (
                    <div key={order.id} className="bg-[#FAF9F6] border border-[#E8E4DD] rounded-xl p-5 space-y-4">
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E4DD] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-[#111111] text-white px-2 py-0.5 rounded">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-[#666666]">
                              {new Date(order.createdAt).toLocaleDateString('ar-YE', { dateStyle: 'medium' })}
                            </span>
                          </div>
                          <p className="text-xs text-[#444444] mt-1">
                            العميل: <strong className="text-[#111111]">{order.customerName}</strong> ({order.customerPhone})
                          </p>
                        </div>

                        <div className="text-left">
                          <span className="text-xs text-[#777777] block">المبلغ الإجمالي</span>
                          <span className="text-base font-bold font-mono text-[#111111] tabular-nums">
                            {formatCurrencyLabel(order.total, order.currency || currency)}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Tracker */}
                      <div className="py-2">
                        <span className="text-xs font-bold text-[#111111] block mb-3">حالة الطلب المباشرة:</span>
                        <div className="grid grid-cols-5 gap-1 relative">
                          {stepsList.map((st, idx) => {
                            const isDone = idx <= stepIndex;
                            const isCurrent = idx === stepIndex;
                            return (
                              <div key={idx} className="flex flex-col items-center text-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                                    isDone
                                      ? 'bg-[#111111] text-[#E5D3B3]'
                                      : 'bg-[#E5DFD7] text-[#888888]'
                                  } ${isCurrent ? 'ring-2 ring-[#C5A880] ring-offset-2' : ''}`}
                                >
                                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-[10px] font-bold ${isDone ? 'text-[#111111]' : 'text-[#888888]'}`}>
                                  {st.label}
                                </span>
                                <span className="text-[9px] text-[#888888] hidden sm:inline">
                                  {st.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Item details */}
                      <div className="border-t border-[#E8E4DD] pt-3">
                        <span className="text-xs font-bold text-[#444444] block mb-2">محتويات الشحنة:</span>
                        <div className="space-y-2">
                          {order.items.map((it) => (
                            <div key={it.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-[#EDE8DF]">
                              <div className="flex items-center gap-2">
                                <img src={it.product.images[0]} alt="" className="w-9 h-11 object-cover rounded bg-[#F7F5F0]" />
                                <div>
                                  <span className="font-semibold text-[#111111] block line-clamp-1">{it.product.title}</span>
                                  <span className="text-[10px] text-[#777777]">مقاس: {it.selectedSize} | لون: {it.selectedColor}</span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-[#111111]">
                                {it.quantity} × {formatCurrencyLabel(it.unitPriceSAR, 'SAR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin Notes */}
                      {order.adminNotes && (
                        <div className="bg-[#FAF5EC] border border-[#E5DAC4] p-2.5 rounded-lg text-xs text-[#666666]">
                          <strong className="text-[#8B6B3F]">ملاحظة مشرف I in:</strong> {order.adminNotes}
                        </div>
                      )}

                      <div className="pt-2 flex justify-between items-center text-xs">
                        <span className="text-[#777777]">
                          طريقة الدفع: {order.paymentMethod === 'bank_deposit' ? `إيداع بنكي (${order.depositBank || 'الكريمي'})` : 'طلب عبر الواتساب'}
                        </span>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${OFFICIAL_WHATSAPP_NUMBER}&text=${encodeURIComponent(`استفسار عن طلبي رقم ${order.orderNumber}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#25D366] hover:underline font-bold flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>تواصل مع المشرف بخصوص هذا الطلب</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Wishlist Tab */
            <div>
              {wishlist.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Heart className="w-10 h-10 mx-auto text-[#AAAAAA]" />
                  <h3 className="text-sm font-bold text-[#111111]">قائمة أمنياتك فارغة</h3>
                  <p className="text-xs text-[#777777]">احفظي القطع التي تعجبك بالضغط على أيقونة القلب للرجوع إليها لاحقاً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((item) => (
                    <div key={item.id} className="flex gap-3 bg-[#FAF9F6] border border-[#E8E4DD] rounded-xl p-3 items-center justify-between">
                      <img src={item.images[0]} alt="" className="w-16 h-20 object-cover rounded-lg bg-[#F7F5F0]" />
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-[#111111] line-clamp-1">{item.title}</h4>
                        <span className="font-mono font-bold text-[#111111] block mt-1">
                          {formatCurrencyLabel(item.priceSAR, 'SAR')}
                        </span>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => onAddToCart(item)}
                            className="bg-[#111111] hover:bg-[#333333] text-white px-3 py-1 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            إضافة للسلة
                          </button>
                          <button
                            onClick={() => onRemoveFromWishlist(item)}
                            className="text-[#A34E36] hover:underline text-[11px] cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
