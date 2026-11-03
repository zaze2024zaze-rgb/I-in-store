import React from 'react';
import { X, MessageCircle, Building2, ShieldCheck, Ruler, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E0D8] relative text-right p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#111111] hover:text-white text-[#555555] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="إغلاق النافذة"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#EFECE6] pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8B6B3F] mb-1">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span>تجربة تسوق فريدة وموثوقة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111]">
            كيف يعمل متجر I in؟ (آلية الطلب والإيداع)
          </h2>
          <p className="text-xs text-[#666666] mt-1 leading-relaxed">
            صممنا المنصة لتمنحك تجربة تسوق راقية تحاكي جودة شي ان العالمية مع توفير أعلى درجات الأمان والشراء المباشر عبر الواتساب والإيداع البنكي.
          </p>
        </div>

        {/* 4 Steps */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-4 items-start p-4 bg-[#FAF9F6] rounded-xl border border-[#EDE8DF]">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#E5D3B3] flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-[#111111] text-sm">اختر القطع بمقاسك الدقيق</h3>
              <p className="text-[#666666] leading-relaxed">
                تصفح الأقسام واستخدم <strong>حاسبة المقاسات الذكية</strong> التي تحلل طولك ووزنك لتوصية المقاس الأنسب بدقة تزيد عن 95%.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start p-4 bg-[#FAF9F6] rounded-xl border border-[#EDE8DF]">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold text-sm shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-[#111111] text-sm">مشاركة السلة بنقرة واحدة عبر الواتساب</h3>
              <p className="text-[#666666] leading-relaxed">
                بدل الإجراءات المعقدة، السلة تولد رسالة مرتبة بكافة اختياراتك وتفاصيلها وترسلها فوراً إلى رقم الإدارة المعتمد:
                <span className="font-mono font-bold text-[#111111] block mt-1 dir-ltr text-right">
                  +{OFFICIAL_WHATSAPP_NUMBER}
                </span>
                ليقوم المشرف بالرد عليك ومتابعة الشراء نيابة عنك.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start p-4 bg-[#FAF9F6] rounded-xl border border-[#EDE8DF]">
            <div className="w-10 h-10 rounded-xl bg-[#8B6B3F] text-white flex items-center justify-center font-bold text-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-[#111111] text-sm">السداد عبر الإيداع البنكي المعتمد</h3>
              <p className="text-[#666666] leading-relaxed">
                طريقة الدفع الحالية هي الإيداع عبر حساباتنا البنكية الرسمية (بنك الكريمي، بنك التضامن، بنك القطيبي، وبنك اليمن والكويت). يمكنك إرفاق صورة السند أو إرسالها عبر الواتساب.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 items-start p-4 bg-[#FAF9F6] rounded-xl border border-[#EDE8DF]">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#C5A880] flex items-center justify-center font-bold text-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-[#111111] text-sm">فحص الجودة والتغليف الفاخر والشحن</h3>
              <p className="text-[#666666] leading-relaxed">
                يقوم مشرف الجودة بفحص الأقمشة والخياطة قبل التغليف، ثم تُشحن طلبيتك وتستطيع تتبعها خطوة بخطوة في حسابك حتى وصولها لباب منزلك.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-[#111111] hover:bg-[#2A2A2A] text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            فهمت ذلك، دعني أبدأ التسوق الآن
          </button>
        </div>
      </div>
    </div>
  );
};
