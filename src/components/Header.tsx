import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Heart, Search, Sparkles, ChevronDown, Grid, X } from 'lucide-react';
import { ProductCategory, CurrencyType } from '../types.ts';

export const TOP_DROPDOWN_CATEGORIES = [
  { id: 'perfumes', labelAr: 'العطور', labelEn: 'Perfumes', key: 'a' },
  { id: 'makeup', labelAr: 'makeup', labelEn: 'Makeup & Beauty', key: 'b' },
  { id: 'apparel', labelAr: 'الملابس العامة', labelEn: 'General Apparel', key: 'c' },
  { id: 'shoes_bags', labelAr: 'الاحذية والحقائب', labelEn: 'Shoes & Bags', key: 'd' },
  { id: 'kitchen', labelAr: 'المطبخ', labelEn: 'Kitchen & Dining', key: 'e' },
  { id: 'accessories', labelAr: 'accessories', labelEn: 'Jewelry & Accessories', key: 'f' },
  { id: 'phone', labelAr: 'phone', labelEn: 'Phone Accessories', key: 'g' },
  { id: 'toys', labelAr: 'العاب', labelEn: 'Toys & Hobbies', key: 'h' },
] as const;

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenProfile: () => void;
  onOpenHowItWorks: () => void;
  onOpenAdminAuth: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  currency: CurrencyType;
  onToggleCurrency: (curr: CurrencyType) => void;
  announcementText?: string;
  showAnnouncement?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenProfile,
  onOpenHowItWorks,
  onOpenAdminAuth,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  currency,
  onToggleCurrency,
  announcementText = 'عروض حصرية لفترة محدودة | طلب مباشر وسريع عبر الواتساب (+967784935535)',
  showAnnouncement = true,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E5E0D8] transition-all">
      {/* Top Announcement Bar (Dynamic & Admin-editable) */}
      {showAnnouncement && (
        <div className="bg-[#111111] text-[#FAF9F6] text-xs py-1.5 px-4 text-center font-normal tracking-wide flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-[#E5D3B3] overflow-hidden truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
            <span className="truncate">{announcementText}</span>
          </div>

          {/* Currency Switcher (SAR / YER) */}
          <div className="flex items-center gap-2 shrink-0 mr-2">
            <div className="flex items-center bg-[#242424] rounded-full p-0.5 text-[11px] font-bold">
              <button
                onClick={() => onToggleCurrency('SAR')}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  currency === 'SAR' ? 'bg-[#C5A880] text-[#111111]' : 'text-gray-300 hover:text-white'
                }`}
                title="التبديل إلى الريال السعودي"
              >
                ريال سعودي (ر.س)
              </button>
              <button
                onClick={() => onToggleCurrency('YER')}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  currency === 'YER' ? 'bg-[#C5A880] text-[#111111]' : 'text-gray-300 hover:text-white'
                }`}
                title="التبديل إلى الريال اليمني"
              >
                ريال يمني (ر.ي)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Container: 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark & Top Dropdown Trigger */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => onSelectCategory('all')}
            className="flex items-baseline gap-1.5 group text-right cursor-pointer"
            aria-label="الصفحة الرئيسية لمتجر I in"
          >
            <span className="text-3xl font-extrabold tracking-tighter text-[#111111] group-hover:text-[#C5A880] transition-colors font-sans">
              I <span className="font-light italic text-[#C5A880]">in</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium uppercase tracking-widest text-[#777777] border-r border-[#D5CFC7] pr-2">
              Haute Couture
            </span>
          </button>

          {/* Requested Dropdown Menu (قائمة منسدلة أعلى الصفحة تشمل a إلى h) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-white border border-[#D5CFC7] hover:border-[#111111] hover:bg-[#FAF8F5] px-3 py-1.5 rounded-full text-xs font-bold text-[#111111] transition-all cursor-pointer shadow-xs"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              title="تصفح كافة أقسام المتجر (العطور، المكياج، الملابس، الأحذية، المطبخ، الإكسسوارات، الهواتف، الألعاب)"
            >
              <Grid className="w-3.5 h-3.5 text-[#8B6B3F]" />
              <span className="hidden sm:inline">أقسام المتجر</span>
              <span className="sm:hidden">الأقسام</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#8B6B3F]' : 'text-gray-500'}`} />
            </button>

            {/* Dropdown Content */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-[#E5DFD7] rounded-2xl shadow-2xl py-2 z-50 text-right animate-fade-in backdrop-blur-md">
                <div className="px-3.5 py-2 border-b border-[#F0ECE1] flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#111111] flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-[#8B6B3F]" />
                    قوائم الأقسام والتسوق
                  </span>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                    aria-label="إغلاق القائمة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-1.5 max-h-80 overflow-y-auto">
                  {TOP_DROPDOWN_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onSelectCategory(cat.id as ProductCategory);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF8F5] text-[#8B6B3F] font-bold border-r-4 border-[#8B6B3F]'
                            : 'text-[#333333] hover:bg-[#FAF9F6] hover:text-[#111111]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full text-[11px] font-mono font-bold flex items-center justify-center ${
                            isSelected ? 'bg-[#8B6B3F] text-white' : 'bg-[#EFECE6] text-[#666666]'
                          }`}>
                            {cat.key}
                          </span>
                          <span className="text-sm font-medium">{cat.labelAr}</span>
                        </div>
                        <span className="text-[11px] text-[#999999] font-sans">
                          {cat.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#F0ECE1] px-3.5 py-2 mt-1 bg-[#FAF9F6]/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectCategory('all');
                      setIsDropdownOpen(false);
                    }}
                    className="text-xs text-[#8B6B3F] hover:underline font-bold cursor-pointer"
                  >
                    عرض الكل (جميع المنتجات)
                  </button>
                  <span className="text-[10px] text-gray-500 font-mono">8 أقسام رئيسية</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#444444]">
          <button
            onClick={() => onSelectCategory('all')}
            className={`whitespace-nowrap transition-colors hover:text-[#111111] cursor-pointer ${
              selectedCategory === 'all' ? 'text-[#111111] font-semibold border-b-2 border-[#111111] pb-1' : ''
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => onSelectCategory('perfumes')}
            className={`whitespace-nowrap transition-colors hover:text-[#111111] cursor-pointer ${
              selectedCategory === 'perfumes' ? 'text-[#111111] font-semibold border-b-2 border-[#111111] pb-1' : ''
            }`}
          >
            العطور
          </button>
          <button
            onClick={() => onSelectCategory('makeup')}
            className={`whitespace-nowrap transition-colors hover:text-[#111111] cursor-pointer ${
              selectedCategory === 'makeup' ? 'text-[#111111] font-semibold border-b-2 border-[#111111] pb-1' : ''
            }`}
          >
            Makeup
          </button>
          <button
            onClick={() => onSelectCategory('apparel')}
            className={`whitespace-nowrap transition-colors hover:text-[#111111] cursor-pointer ${
              selectedCategory === 'apparel' ? 'text-[#111111] font-semibold border-b-2 border-[#111111] pb-1' : ''
            }`}
          >
            الملابس العامة
          </button>
          <button
            onClick={() => onSelectCategory('shoes_bags')}
            className={`whitespace-nowrap transition-colors hover:text-[#111111] cursor-pointer ${
              selectedCategory === 'shoes_bags' ? 'text-[#111111] font-semibold border-b-2 border-[#111111] pb-1' : ''
            }`}
          >
            الأحذية والحقائب
          </button>
          <button
            onClick={() => onSelectCategory('flash_deals')}
            className={`whitespace-nowrap transition-colors hover:text-[#111111] cursor-pointer text-[#A34E36] font-semibold ${
              selectedCategory === 'flash_deals' ? 'border-b-2 border-[#A34E36] pb-1' : ''
            }`}
          >
            عروض اليوم (Flash)
          </button>
          <button
            onClick={onOpenHowItWorks}
            className="whitespace-nowrap transition-colors hover:text-[#111111] text-[#666666] cursor-pointer"
          >
            طريقة الطلب والإيداع
          </button>
        </nav>

        {/* Zone 3: Functional Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Smart Search */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-white border border-[#D5CFC7] rounded-full px-3 py-1 shadow-sm w-48 sm:w-64 transition-all">
                <Search className="w-4 h-4 text-[#777777] shrink-0 ml-1.5" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج، قماش، ماركة..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full text-xs bg-transparent focus:outline-none text-[#111111] placeholder:text-[#999999]"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearchInput(false)}
                  className="text-xs text-[#888888] hover:text-[#111111] mr-1"
                  aria-label="إغلاق البحث"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="p-2 rounded-full text-[#444444] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors cursor-pointer"
                title="البحث الذكي"
                aria-label="فتح شريط البحث"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 rounded-full text-[#444444] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            title="قائمة الأمنيات"
            aria-label="قائمة الأمنيات"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#A34E36] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#111111] text-white px-4 py-2.5 rounded-full hover:bg-[#2A2A2A] transition-all shadow-sm cursor-pointer"
            aria-label={`سلة المشتريات تحتوي على ${cartCount} منتجات`}
          >
            <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
            <span className="text-xs font-medium hidden sm:inline-block">السلة</span>
            {cartCount > 0 && (
              <span className="bg-[#C5A880] text-[#111111] text-xs font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
