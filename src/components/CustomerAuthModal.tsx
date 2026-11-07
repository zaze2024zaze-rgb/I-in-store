import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles,
  MessageCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { CustomerAccount } from '../types.ts';
import { 
  getCustomerFromCloud, 
  saveCustomerToCloud, 
  normalizePhoneKey 
} from '../services/firebase.ts';
import { OFFICIAL_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: CustomerAccount) => void;
  initialTab?: 'login' | 'register';
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('صنعاء');
  const [address, setAddress] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);

  const resetForm = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSuspended(false);
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    resetForm();
    setActiveTab(tab);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    const cleanPhone = (phone || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanPhone || !cleanPass) {
      setErrorMessage('يرجى إدخال رقم الجوال وكلمة السر.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try cloud first
      let customer = await getCustomerFromCloud(cleanPhone);

      // 2. Fallback to localStorage registered customers if cloud is offline or user was saved locally
      if (!customer) {
        try {
          const localCustomersRaw = localStorage.getItem('iin_store_customers');
          if (localCustomersRaw) {
            const localCustomers: CustomerAccount[] = JSON.parse(localCustomersRaw);
            const found = localCustomers.find(
              (c) => normalizePhoneKey(c.phone) === normalizePhoneKey(cleanPhone)
            );
            if (found) {
              customer = found;
            }
          }
        } catch (e) {
          console.warn('Error reading local customers:', e);
        }
      }

      if (!customer) {
        setErrorMessage('لم يتم العثور على حساب بهذا الرقم. يمكنك إنشاء حساب جديد خلال ثوانٍ.');
        setIsLoading(false);
        return;
      }

      // Check if suspended
      if (customer.isActive === false) {
        setIsSuspended(true);
        setErrorMessage('عذراً، تم إيقاف أو تعليق هذا الحساب من قِبل إدارة المتجر. يرجى التواصل مع المشرف عبر الواتساب لإعادة التفعيل.');
        setIsLoading(false);
        return;
      }

      // Verify password
      if (customer.password && customer.password !== cleanPass) {
        setErrorMessage('كلمة السر غير صحيحة. يرجى التأكد وإعادة المحاولة.');
        setIsLoading(false);
        return;
      }

      // Update last login
      const updatedCustomer: CustomerAccount = {
        ...customer,
        lastLoginAt: new Date().toISOString(),
      };

      // Save back to cloud and local
      await saveCustomerToCloud(updatedCustomer);
      onLoginSuccess(updatedCustomer);
      setSuccessMessage(`أهلاً بك مجدداً، ${customer.name}!`);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    const cleanName = (fullName || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanPass = (password || '').trim();
    const cleanCity = (city || '').trim();
    const cleanAddress = (address || '').trim();

    if (!cleanName || !cleanPhone || !cleanPass) {
      setErrorMessage('يرجى تعبئة جميع الحقول المطلوبة (الاسم، رقم الجوال، كلمة السر).');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMessage('كلمة السر يجب أن تكون من 4 أحرف أو أرقام على الأقل.');
      return;
    }

    if (cleanPass !== (confirmPassword || '').trim()) {
      setErrorMessage('كلمتا السر غير متطابقتين.');
      return;
    }

    setIsLoading(true);

    try {
      // Check if already registered
      const existing = await getCustomerFromCloud(cleanPhone);
      if (existing) {
        setErrorMessage('يوجد حساب مسجل مسبقاً بهذا الرقم. يرجى تسجيل الدخول بدلاً من ذلك.');
        setIsLoading(false);
        return;
      }

      const newCustomer: CustomerAccount = {
        id: 'cust_' + Date.now(),
        name: cleanName,
        phone: cleanPhone,
        password: cleanPass,
        city: cleanCity || 'صنعاء',
        address: cleanAddress,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        cart: [],
        wishlist: [],
      };

      // Save to cloud Firestore
      await saveCustomerToCloud(newCustomer);

      // Save to local storage cache
      try {
        const localCustomersRaw = localStorage.getItem('iin_store_customers');
        const localList: CustomerAccount[] = localCustomersRaw ? JSON.parse(localCustomersRaw) : [];
        localList.push(newCustomer);
        localStorage.setItem('iin_store_customers', JSON.stringify(localList));
      } catch (err) {
        console.warn('Error saving customer to local storage:', err);
      }

      setSuccessMessage('تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...');
      onLoginSuccess(newCustomer);

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error('Register error:', err);
      setErrorMessage('تعذر إنشاء الحساب حالياً. يرجى التأكد من اتصال الإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const whatsappSupportUrl = `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `السلام عليكم إدارة متجر I in، أرجو المساعدة في إعادة تفعيل حسابي برقم الجوال: ${phone}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5DFD7] relative text-right flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Luxury Brand Accent */}
        <div className="bg-[#111111] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-full bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center mb-2">
            <User className="w-6 h-6 text-[#C5A880]" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>متجر</span>
            <span className="font-serif italic text-[#C5A880]">I in</span>
          </h2>
          <p className="text-xs text-[#C5A880]/90 mt-1">
            {activeTab === 'login' ? 'تسجيل الدخول ومتابعة طلباتك الحصرية' : 'إنشاء حساب جديد لمزامنة السلة وتتبع الشحنات'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-[#EFECE6] bg-[#FAF9F6] text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-[#111111] border-b-2 border-[#111111]'
                : 'text-[#777777] hover:text-[#111111]'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#111111] border-b-2 border-[#111111]'
                : 'text-[#777777] hover:text-[#111111]'
            }`}
          >
            إنشاء حساب عميل جديد
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className={`p-3.5 rounded-xl text-xs space-y-2 ${
              isSuspended 
                ? 'bg-[#FFF3E0] border border-[#FFE0B2] text-[#B78103]' 
                : 'bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828]'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
              {isSuspended && (
                <a
                  href={whatsappSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1EBE5D] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>تواصل مع الإدارة عبر الواتساب لتفعيل الحساب</span>
                </a>
              )}
            </div>
          )}

          {successMessage && (
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] p-3 rounded-xl flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#333333] mb-1.5">
                  رقم الجوال المسجل *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-[#888888]" />
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 784935535 أو 05xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3.5 py-2.5 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#333333] mb-1.5">
                  كلمة السر *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-[#888888] hover:text-[#111111] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3.5 py-2.5 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111111] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#2C2C2C] transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>جاري تسجيل الدخول...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    <span>تسجيل الدخول لحسابي</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className="text-xs text-[#8B6B3F] hover:underline cursor-pointer"
                >
                  ليس لديك حساب بعد؟ اضغط هنا لإنشاء حساب جديد
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#333333] mb-1">
                  الاسم الكامل أو اللقب الكريم *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#888888]" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: ريم الأحمد / سارة القحطاني"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3.5 py-2 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#333333] mb-1">
                  رقم الجوال (رقم الواتساب للتواصل) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-[#888888]" />
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 784935535 أو 05xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3.5 py-2 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#333333] mb-1">
                    المدينة / المحافظة:
                  </label>
                  <input
                    type="text"
                    placeholder="صنعاء / عدن / الرياض..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#333333] mb-1">
                    العنوان للتوصيل:
                  </label>
                  <input
                    type="text"
                    placeholder="الشارع أو الحي..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#333333] mb-1">
                    كلمة السر *:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#333333] mb-1">
                    تأكيد كلمة السر *:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111111] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#2C2C2C] transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span>جاري إنشاء الحساب والمزامنة...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <span>إنشاء الحساب ومزامنة السلة سحابياً</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="text-xs text-[#8B6B3F] hover:underline cursor-pointer"
                >
                  لديك حساب بالفعل؟ تسجيل الدخول
                </button>
              </div>
            </form>
          )}

          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EFECE6] text-[11px] text-[#666666] leading-relaxed">
            <span className="font-bold text-[#111111] block mb-0.5">مزايا حساب العميل في I in:</span>
            مزامنة فورية للسلة والمفضلة عبر قاعدة البيانات السحابية، وتتبع دقيق لحالة طلبك خطوة بخطوة عند الشحن والتوصيل.
          </div>
        </div>
      </div>
    </div>
  );
};
