import React, { useState } from 'react';
import { X, Lock, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
  correctPin: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  correctPin,
}) => {
  if (!isOpen) return null;

  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === correctPin.trim()) {
      onAuthenticate();
      onClose();
      setPinInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('رمز الدخول السري غير صحيح. يرجى التأكد والمحاولة مجدداً.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 text-right shadow-2xl border border-[#DCD5C9]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex justify-between items-center border-b border-[#EFECE6] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#111111] text-[#C5A880] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">دخول المشرف الخاص</h3>
              <p className="text-[10px] text-[#777777]">منطقة تحكم آمنة ومحمية</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#888888] hover:text-black p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#555555] leading-relaxed">
          هذه اللوحة مخصصة لإدارة المتجر ومحمية برمز سري مشفر. يرجى إدخال الرمز الخاص بك للمتابعة:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[#333333] mb-1.5">
              الرمز السري الخاص (PIN):
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 text-[#888888] absolute right-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoFocus
                required
                className="w-full bg-[#FAF9F6] border border-[#D5CFC7] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] rounded-xl pr-9 pl-10 py-2.5 text-center text-sm font-mono tracking-widest text-[#111111] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 text-[#888888] hover:text-[#111111] p-1 cursor-pointer transition-colors"
                title={showPassword ? 'إخفاء الرمز' : 'إظهار الرمز'}
                aria-label={showPassword ? 'إخفاء الرمز' : 'إظهار الرمز'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-[#A34E36] font-semibold mt-2 bg-[#FDF2F2] p-2 rounded-lg border border-[#F8D7DA]">
                {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#2A2A2A] text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg"
          >
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>فتح لوحة التحكم</span>
          </button>
        </form>
      </div>
    </div>
  );
};
