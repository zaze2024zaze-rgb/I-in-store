/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { SquareHeroBanners } from './components/SquareHeroBanners.tsx';
import { FlashDealsCountdown } from './components/FlashDealsCountdown.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { ProductSlideOver } from './components/ProductSlideOver.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { HowItWorksModal } from './components/HowItWorksModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AdminAuthModal } from './components/AdminAuthModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { HorizontalProductSlider } from './components/HorizontalProductSlider.tsx';
import { CustomerAuthModal } from './components/CustomerAuthModal.tsx';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_BANNERS, 
  INITIAL_COUPONS, 
  INITIAL_ORDERS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_REVIEWS,
  INITIAL_CUSTOMERS
} from './data/mockData.ts';
import { 
  Product, 
  CartItem, 
  Order, 
  Coupon, 
  AuditLog, 
  ProductCategory, 
  BannerItem, 
  CurrencyType, 
  StoreSettings,
  BankAccount,
  CustomerReview,
  CustomerAccount
} from './types.ts';
import { 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  RotateCcw, 
  MessageCircle, 
  Building2, 
  SlidersHorizontal,
  Bell,
  X,
  Lock,
  Grid,
  Layers,
  ShoppingBag,
  User
} from 'lucide-react';
import { OFFICIAL_WHATSAPP_NUMBER } from './utils/whatsapp.ts';
import { formatCurrencyLabel, convertSARtoCurrency } from './utils/pricing.ts';
import { 
  subscribeToProducts, 
  subscribeToSettings, 
  subscribeToBanners,
  subscribeToOrders,
  subscribeToCustomers,
  subscribeToCustomerData,
  subscribeToBanks,
  saveBanksToCloud,
  syncCustomerCartAndWishlist,
  isCloudConfigured 
} from './services/firebase.ts';

const CATEGORY_TITLES: Record<string, string> = {
  perfumes: 'عطور راقية وبخور فاخر',
  makeup: 'مستحضرات تجميل ومكياج أصلي',
  apparel: 'تشكيلة الملابس العامة والتريكو',
  shoes_bags: 'الأحذية والحقائب الفاخرة',
  kitchen: 'مستلزمات وأواني المطبخ الراقية',
  accessories: 'إكسسوارات ومجوهرات راقية',
  phone: 'ملحقات وإكسسوارات الهواتف الذكية',
  toys: 'ألعاب أطفال وهوايات مميزة',
  dresses: 'تشكيلة فساتين السهرة والهوت كوتور',
  suits: 'الأطقم والبليزرات الفاخرة',
  flash_deals: 'عروض اليوم المؤقتة (Flash Deals)',
  all: 'التشكيلة الراقية والمختارة',
};

// Safe localStorage loader to solve: "حل مشكله بانه لا يتم الحفظ بعد التعديل من قبل المشرف"
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
};

const DEFAULT_SETTINGS: StoreSettings = {
  enableLoyaltyPoints: false,
  loyaltyPointsRate: 1,
  yerToSarRate: 140,
  shippingFeeSAR: 25,
  freeShippingThresholdSAR: 400,
  isFreeShippingActive: true,
  topAnnouncementText: 'عروض حصرية لفترة محدودة | طلب مباشر وتنسيق فوري عبر الواتساب (+967784935535)',
  showTopAnnouncement: true,
  adminPin: '7849',
  bannerDisplaySize: 'medium',
  productCardLayout: 'standard',
  defaultSaleBadgeText: 'خصم 25% اليوم فقط',
  defaultUrgencyBadgeText: 'عرض حصري محدود ⏳',
  showHorizontalProductSlider: true,
  horizontalSliderTitle: 'مختارات حصرية تُسحب جانبياً ✨',
};

export default function App() {
  // Store Settings (Persistent in localStorage, merged with defaults)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const loaded = loadFromStorage('iin_store_settings', DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...loaded };
  });

  // Current selected currency (SAR or YER)
  const [currency, setCurrency] = useState<CurrencyType>('SAR');

  // Dynamic Banners (Persistent in localStorage)
  const [banners, setBanners] = useState<BannerItem[]>(() =>
    loadFromStorage('iin_store_banners', INITIAL_BANNERS)
  );

  // Global Store State (Persistent in localStorage)
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage('iin_store_products', INITIAL_PRODUCTS)
  );
  const [banks, setBanks] = useState<BankAccount[]>(() =>
    loadFromStorage('iin_store_banks', INITIAL_BANK_ACCOUNTS)
  );
  const [reviews, setReviews] = useState<CustomerReview[]>(() =>
    loadFromStorage('iin_store_reviews', INITIAL_REVIEWS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage('iin_store_orders', INITIAL_ORDERS)
  );
  const [coupons, setCoupons] = useState<Coupon[]>(() =>
    loadFromStorage('iin_store_coupons', INITIAL_COUPONS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadFromStorage('iin_store_audit_logs', INITIAL_AUDIT_LOGS)
  );

  // Customer accounts state
  const [customers, setCustomers] = useState<CustomerAccount[]>(() =>
    loadFromStorage('iin_store_customers', INITIAL_CUSTOMERS)
  );
  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(() =>
    loadFromStorage('iin_current_customer', null)
  );
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([INITIAL_PRODUCTS[0]]);

  // Layout mode: standard vs compact (User request: Small product cards)
  const [cardLayout, setCardLayout] = useState<'standard' | 'compact'>(
    settings.productCardLayout || 'standard'
  );

  // Sync state changes automatically to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('iin_store_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save products to localStorage', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_banners', JSON.stringify(banners));
    } catch (e) {
      console.warn('Failed to save banners to localStorage', e);
    }
  }, [banners]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_banks', JSON.stringify(banks));
    } catch (e) {
      console.warn('Failed to save banks to localStorage', e);
    }
  }, [banks]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.warn('Failed to save reviews to localStorage', e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_coupons', JSON.stringify(coupons));
    } catch (e) {
      console.warn('Failed to save coupons to localStorage', e);
    }
  }, [coupons]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_customers', JSON.stringify(customers));
    } catch (e) {
      console.warn('Failed to save customers to localStorage', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      if (currentCustomer) {
        localStorage.setItem('iin_current_customer', JSON.stringify(currentCustomer));
      } else {
        localStorage.removeItem('iin_current_customer');
      }
    } catch (e) {
      console.warn('Failed to save currentCustomer to localStorage', e);
    }
  }, [currentCustomer]);

  useEffect(() => {
    try {
      localStorage.setItem('iin_store_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Failed to save audit logs to localStorage', e);
    }
  }, [auditLogs]);

  // Sync customer cart & wishlist to Firestore
  useEffect(() => {
    if (currentCustomer && currentCustomer.phone) {
      const wishlistIds = wishlist.map((p) => p.id);
      syncCustomerCartAndWishlist(currentCustomer.phone, cartItems, wishlistIds).catch((err) => {
        console.warn('Failed to sync customer cart/wishlist to cloud:', err);
      });
    }
  }, [cartItems, wishlist, currentCustomer]);

  // Listen to customer data changes from cloud (e.g. if admin suspended them)
  useEffect(() => {
    if (!currentCustomer?.phone) return;
    const unsubscribe = subscribeToCustomerData(currentCustomer.phone, (cloudData) => {
      if (cloudData) {
        setCurrentCustomer(cloudData);
        if (cloudData.isActive === false) {
          setToastNotification('تنبيه: تم تعليق حسابك من قبل الإدارة. يرجى التواصل مع المشرف عبر الواتساب.');
        }
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentCustomer?.phone]);

  // Real-time Cloud Synchronization (Firebase Firestore onSnapshot)
  useEffect(() => {
    let unsubscribeProducts: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;
    let unsubscribeBanners: (() => void) | null = null;
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeCustomers: (() => void) | null = null;
    let unsubscribeBanks: (() => void) | null = null;

    try {
      unsubscribeProducts = subscribeToProducts((cloudProducts) => {
        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
        }
      });

      unsubscribeSettings = subscribeToSettings((cloudSettings) => {
        if (cloudSettings) {
          setSettings((prev) => ({ ...prev, ...cloudSettings }));
        }
      });

      unsubscribeBanners = subscribeToBanners((cloudBanners) => {
        if (cloudBanners && cloudBanners.length > 0) {
          setBanners(cloudBanners);
        }
      });

      // Real-time onSnapshot for Bank Accounts (instant cloud sync across all devices)
      unsubscribeBanks = subscribeToBanks((cloudBanks) => {
        if (cloudBanks && Array.isArray(cloudBanks) && cloudBanks.length > 0) {
          setBanks(cloudBanks);
        }
      });

      // Real-time onSnapshot for Orders (instant incoming orders and status updates)
      unsubscribeOrders = subscribeToOrders((cloudOrders) => {
        if (cloudOrders && cloudOrders.length > 0) {
          setOrders((prev) => {
            const map = new Map<string, Order>();
            // Cloud orders are authoritative
            cloudOrders.forEach((o) => map.set(o.id, o));
            // Keep any locally created orders not yet committed
            prev.forEach((o) => {
              if (!map.has(o.id)) {
                map.set(o.id, o);
              }
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
            });
            return merged;
          });
        }
      });

      // Real-time onSnapshot for Customers (instant updates and suspension status)
      unsubscribeCustomers = subscribeToCustomers((cloudCustomers) => {
        if (cloudCustomers && cloudCustomers.length > 0) {
          setCustomers(cloudCustomers);
        }
      });
    } catch (err) {
      console.warn('Real-time cloud sync subscription notice:', err);
    }

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeBanners) unsubscribeBanners();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeCustomers) unsubscribeCustomers();
      if (unsubscribeBanks) unsubscribeBanks();
    };
  }, []);

  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'flash' | 'bestsellers' | 'new_arrivals'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceMaxFilterSAR, setPriceMaxFilterSAR] = useState<number>(800);

  // Modals & Panels
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [slideOverProduct, setSlideOverProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);

  // Live Toast Notification
  const [toastNotification, setToastNotification] = useState<string | null>(
    'مرحباً بك في متجر I in! استخدم كود FIRST15 لخصم 15% أو كود VIP50 للخصومات الخاصة ✨'
  );

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [toastNotification]);

  // Cart Handlers - Multi-product additions without interrupting browsing
  const handleAddToCart = (
    product: Product,
    size: string = (product.availableSizes[0] || 'M'),
    color: string = product.availableColors[0]?.name || 'افتراضي',
    quantity: number = 1,
    openDrawer: boolean = false
  ) => {
    let currentTotalCount = 0;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.productId === product.id && it.selectedSize === size && it.selectedColor === color
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        currentTotalCount = next.reduce((sum, item) => sum + item.quantity, 0);
        return next;
      } else {
        const newItem: CartItem = {
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          productId: product.id,
          product,
          selectedColor: color,
          selectedSize: size,
          quantity,
          unitPriceSAR: product.priceSAR,
        };
        const next = [...prev, newItem];
        currentTotalCount = next.reduce((sum, item) => sum + item.quantity, 0);
        return next;
      }
    });

    setToastNotification(`تمت إضافة "${product.title}" إلى السلة (${(cartItems.reduce((acc, it) => acc + it.quantity, 0) + quantity)} قطع بالسلة) ✨`);
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it))
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        setToastNotification(`تمت إضافة "${product.title}" إلى قائمة أمنياتك.`);
        return [...prev, product];
      }
    });
  };

  const handleOrderCreated = (order: Order, clearCart: boolean = false) => {
    setOrders((prev) => [order, ...prev]);
    setToastNotification(`تم تسجيل طلبك برقم ${order.orderNumber} وتجهيز مشاركته عبر الواتساب.`);
    if (clearCart) {
      setCartItems([]);
      setIsCartOpen(false);
    }
  };

  const handleCustomerLogout = () => {
    setCurrentCustomer(null);
    setToastNotification('تم تسجيل الخروج بنجاح.');
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'flash_deals') {
        if (!p.isFlashDeal) return false;
      } else if (p.category !== selectedCategory) {
        return false;
      }
    }

    if (quickFilter === 'flash' && !p.isFlashDeal) return false;
    if (quickFilter === 'bestsellers' && !p.isBestSeller) return false;
    if (quickFilter === 'new_arrivals' && !p.isNewArrival) return false;

    if (p.priceSAR > priceMaxFilterSAR) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchEn = p.titleEn.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchFabric = p.fabricDetails.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchEn && !matchDesc && !matchFabric && !matchTags) {
        return false;
      }
    }

    return true;
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#C5A880]/30 selection:text-black">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed bottom-5 left-5 z-50 bg-[#111111] text-[#FAF9F6] px-4 py-3 rounded-xl shadow-2xl border border-[#C5A880]/40 flex items-center gap-3 animate-fade-in max-w-md">
          <Bell className="w-4 h-4 text-[#C5A880] shrink-0" />
          <p className="text-xs leading-relaxed flex-1">{toastNotification}</p>
          <button
            onClick={() => setToastNotification(null)}
            className="text-gray-400 hover:text-white p-1 cursor-pointer"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Storefront vs Admin Mode */}
      {isAdminMode ? (
        <ErrorBoundary fallbackTitle="لوحة تحكم المشرف محمية" onReset={() => setIsAdminMode(false)}>
          <AdminDashboard
            products={products}
            onUpdateProducts={setProducts}
            banners={banners}
            onUpdateBanners={setBanners}
            orders={orders}
            onUpdateOrders={setOrders}
            coupons={coupons}
            onUpdateCoupons={setCoupons}
            banks={banks}
            onUpdateBanks={setBanks}
            reviews={reviews}
            onUpdateReviews={setReviews}
            customers={customers}
            onUpdateCustomers={setCustomers}
            auditLogs={auditLogs}
            onAddAuditLog={(log) => setAuditLogs((prev) => [log, ...prev])}
            settings={settings}
            onUpdateSettings={setSettings}
            onExitAdmin={() => setIsAdminMode(false)}
            onBroadcastNotification={(msg) => setToastNotification(msg)}
          />
        </ErrorBoundary>
      ) : (
        <>
          {/* Header */}
          <Header
            cartCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
            wishlistCount={wishlist.length}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenWishlist={() => setIsProfileOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setQuickFilter('all');
            }}
            currency={currency}
            onToggleCurrency={setCurrency}
            announcementText={settings.topAnnouncementText}
            showAnnouncement={settings.showTopAnnouncement}
            currentCustomer={currentCustomer}
            onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
          />

          <main className="flex-1">
            {/* Square Banners in Top 1/3 (Dynamic and Editable by Admin) */}
            <SquareHeroBanners
              banners={banners}
              displaySize={settings.bannerDisplaySize}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setQuickFilter('all');
              }}
              onExploreProduct={(pId) => {
                const prod = products.find((p) => p.id === pId);
                if (prod) setSelectedProduct(prod);
              }}
            />

            {/* Flash Deals Live Countdown & Fast Navigation Filter */}
            <FlashDealsCountdown
              onViewFlashDeals={() => {
                setSelectedCategory('flash_deals');
                setQuickFilter('flash');
              }}
              activeFilter={quickFilter}
              onFilterChange={(filter) => {
                setQuickFilter(filter);
                if (filter === 'flash') setSelectedCategory('flash_deals');
                else setSelectedCategory('all');
              }}
            />

            {/* Trust and How-it-works Bar */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#E8E4DD] text-xs">
                <div className="flex items-center gap-2.5 p-2">
                  <ShieldCheck className="w-5 h-5 text-[#8B6B3F] shrink-0" />
                  <div>
                    <strong className="text-[#111111] block">فحص جودة معتمد</strong>
                    <span className="text-[#777777] text-[11px]">مفحوص وموثق من إدارة I in</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2">
                  <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0" />
                  <div>
                    <strong className="text-[#111111] block">شراء فوري بالواتس</strong>
                    <span className="text-[#777777] text-[11px]">مشاركة السلة مع المشرف</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2">
                  <Building2 className="w-5 h-5 text-[#8B6B3F] shrink-0" />
                  <div>
                    <strong className="text-[#111111] block">إيداع بنكي حصري</strong>
                    <span className="text-[#777777] text-[11px]">الكريمي، التضامن، والقطيبي</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2">
                  <Truck className="w-5 h-5 text-[#111111] shrink-0" />
                  <div>
                    <strong className="text-[#111111] block">شحن آمن وتتبع مباشر</strong>
                    <span className="text-[#777777] text-[11px]">رسوم محددة وتوصيل فوري</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Horizontal Product Slider (User request: مربعات منتجات يمكن سحبها جانبياً) */}
            {settings.showHorizontalProductSlider !== false && (
              <HorizontalProductSlider
                products={products}
                title={settings.horizontalSliderTitle || 'مختارات حصرية تُسحب جانبياً ✨'}
                currency={currency}
                yerRate={settings.yerToSarRate}
                onAddToCart={(prod, sz, clr, qty) => handleAddToCart(prod, sz, clr, qty, false)}
                onSelectProduct={(prod) => setSelectedProduct(prod)}
                onOpenSlideOver={(prod) => setSlideOverProduct(prod)}
                isWishlisted={(pId) => wishlist.some((w) => w.id === pId)}
                onToggleWishlist={handleToggleWishlist}
              />
            )}

            {/* Catalog Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-[#E8E4DD] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#111111] tracking-tight">
                    {CATEGORY_TITLES[selectedCategory] || 'التشكيلة الراقية والمختارة'}
                  </h2>
                  <p className="text-xs text-[#777777] mt-0.5">
                    عرض {filteredProducts.length} من أصل {products.length} قطعة متوفرة
                  </p>
                </div>

                {/* Price, Layout and Category Filter */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Grid Layout Switcher (User request: مربعات صغيرة للمنتجات حتى لا تكون بشكل واحد) */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#D5CFC7]">
                    <button
                      onClick={() => setCardLayout('standard')}
                      className={`px-2 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                        cardLayout === 'standard'
                          ? 'bg-[#111111] text-white shadow-xs font-semibold'
                          : 'text-[#666666] hover:text-[#111111] hover:bg-gray-100'
                      }`}
                      title="مربعات العرض القياسية"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span className="text-[11px]">مربعات قياسية</span>
                    </button>
                    <button
                      onClick={() => setCardLayout('compact')}
                      className={`px-2 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                        cardLayout === 'compact'
                          ? 'bg-[#111111] text-white shadow-xs font-semibold'
                          : 'text-[#666666] hover:text-[#111111] hover:bg-gray-100'
                      }`}
                      title="مربعات العرض الصغيرة المدمجة"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="text-[11px]">مربعات صغيرة</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#D5CFC7]">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#888888]" />
                    <span className="text-[#666666]">السعر حتى:</span>
                    <span className="font-mono font-bold text-[#111111]">
                      {formatCurrencyLabel(convertSARtoCurrency(priceMaxFilterSAR, currency, settings.yerToSarRate), currency)}
                    </span>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={priceMaxFilterSAR}
                      onChange={(e) => setPriceMaxFilterSAR(Number(e.target.value))}
                      className="w-20 accent-[#111111] cursor-pointer"
                    />
                  </div>

                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#A34E36] underline cursor-pointer"
                    >
                      مسح البحث ({searchQuery})
                    </button>
                  )}
                </div>
              </div>

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E4DD] p-8 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#888888]">
                    <SlidersHorizontal className="w-6 h-6 text-[#C5A880]" />
                  </div>
                  <h3 className="text-base font-bold text-[#111111]">لم نجد قطعاً تطابق خيارات البحث الحالية</h3>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setQuickFilter('all');
                      setSearchQuery('');
                      setPriceMaxFilterSAR(800);
                    }}
                    className="px-5 py-2 bg-[#111111] text-white text-xs font-semibold rounded-full hover:bg-[#333333] transition-colors cursor-pointer"
                  >
                    إعادة ضبط الفلاتر
                  </button>
                </div>
              ) : (
                <div className={cardLayout === 'compact' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currency={currency}
                      yerRate={settings.yerToSarRate}
                      layout={cardLayout}
                      onOpenDetails={(p) => setSelectedProduct(p)}
                      onOpenSlideOver={(p) => setSlideOverProduct(p)}
                      onQuickAddToCart={(p) => handleAddToCart(p)}
                      isWishlisted={wishlist.some((w) => w.id === product.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Story & Philosophy Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="bg-[#18181B] text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-[#2E2822]">
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#C5A880] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>فلسفة متجر I in الفاخر</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#FAF9F6] leading-snug">
                    أناقة استثنائية، خامات نقية، وضمان جودة ومطابقة معتمد
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed font-light">
                    نحن نتكفل بفحص كل درزة وجودة كل خيط ومطابقة كل مقاس، مع إمكانية مشاركة سلتك مباشرة وتنسيق شرائها وإيداع قيمتها بالريال اليمني أو الريال السعودي بكل سهولة وأمان.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4">
                    <button
                      onClick={() => setIsHowItWorksOpen(true)}
                      className="bg-[#C5A880] text-[#111111] hover:bg-[#D4BC96] px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      تعرف على آلية الفحص والطلب
                    </button>
                    <a
                      href={`https://api.whatsapp.com/send?phone=${OFFICIAL_WHATSAPP_NUMBER}&text=${encodeURIComponent('مرحباً، أود الاستفسار عن توفر منتجات معينة في متجر I in')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm px-5 py-2.5 rounded-full text-xs font-medium border border-white/20 transition-all flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>تواصل مع مشرف المتجر (+967784935535)</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-[#111111] text-[#A0A0A0] text-xs py-10 border-t border-[#222222]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2B2F] pb-6">
                <div>
                  <span className="text-2xl font-extrabold text-white tracking-tighter">
                    I <span className="font-light italic text-[#C5A880]">in</span>
                  </span>
                  <p className="text-[11px] text-[#777777] mt-1">
                    منصة التسوق الراقية والطلب المباشر عبر الواتساب والإيداع البنكي (بالريال اليمني والسعودي)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-white text-xs">
                  <button onClick={() => setIsHowItWorksOpen(true)} className="hover:text-[#C5A880] transition-colors cursor-pointer">
                    كيف نعمل؟
                  </button>
                  <button onClick={() => setIsProfileOpen(true)} className="hover:text-[#C5A880] transition-colors cursor-pointer">
                    تتبع الشحنات
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#666666]">
                <div className="flex items-center gap-2">
                  <p>© 2026 متجر I in الفاخر. جميع الحقوق محفوظة.</p>
                  {/* Subtle secret admin entrance (User request: مكان دخول المشرف مكان خفي في اسفل الصفحة) */}
                  <button
                    onClick={() => setIsAdminAuthOpen(true)}
                    className="opacity-20 hover:opacity-90 transition-opacity p-1 text-[#666666] hover:text-[#C5A880] cursor-pointer inline-flex items-center"
                    title="التحكم"
                    aria-label="لوحة الإدارة"
                  >
                    <Lock className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span>خدمة العملاء: +{OFFICIAL_WHATSAPP_NUMBER}</span>
                  <span aria-hidden="true">·</span>
                  <span>العملات: ريال سعودي (ر.س) / ريال يمني (ر.ي)</span>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        currency={currency}
        yerRate={settings.yerToSarRate}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, sz, col, qty) => {
          handleAddToCart(prod, sz, col, qty);
          setSelectedProduct(null);
        }}
        onDirectWhatsApp={(prod, sz, col, qty) => {
          handleAddToCart(prod, sz, col, qty);
          setSelectedProduct(null);
        }}
        isWishlisted={selectedProduct ? wishlist.some((w) => w.id === selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        reviews={reviews}
        onAddReview={(newRev) => setReviews((prev) => [newRev, ...prev])}
      />

      {/* Side Slide-Over Product Drawer (User request: مربعات المتجات تخرج من الجهة الجانبية بشكل انيق) */}
      <ProductSlideOver
        product={slideOverProduct}
        isOpen={Boolean(slideOverProduct)}
        onClose={() => setSlideOverProduct(null)}
        currency={currency}
        yerRate={settings.yerToSarRate}
        onAddToCart={(p, sz, col, qty) => handleAddToCart(p, sz, col, qty)}
        onDirectWhatsApp={(p, sz, col, qty) => handleAddToCart(p, sz, col, qty)}
        isWishlisted={slideOverProduct ? wishlist.some((w) => w.id === slideOverProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        reviews={reviews}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        currency={currency}
        yerRate={settings.yerToSarRate}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderCreated={handleOrderCreated}
        settings={settings}
        banks={banks}
        coupons={coupons}
        currentCustomer={currentCustomer}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
      />

      {/* User Profile & Tracking Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        orders={orders}
        wishlist={wishlist}
        currency={currency}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p)}
        currentCustomer={currentCustomer}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
        onLogoutCustomer={handleCustomerLogout}
      />

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {/* Admin Secret Entry Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        correctPin={settings.adminPin}
        onAuthenticate={() => setIsAdminMode(true)}
      />

      {/* Customer Login & Registration Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        onLoginSuccess={(customer) => {
          setCurrentCustomer(customer);
          setToastNotification(`أهلاً بك مجدداً ${customer.name}! تم تسجيل الدخول ومزامنة سلتك سحابياً ✨`);
          if (customer.cart && customer.cart.length > 0) {
            setCartItems(customer.cart);
          }
          if (customer.wishlist && customer.wishlist.length > 0) {
            const restoredWishlist = products.filter((p) => customer.wishlist?.includes(p.id));
            if (restoredWishlist.length > 0) {
              setWishlist(restoredWishlist);
            }
          }
        }}
      />

      {/* Floating Multi-Product Cart Bar (User request: إضافة أكثر من منتج ومشاركتها) */}
      {cartItems.length > 0 && !isCartOpen && !isAdminMode && (
        <div className="fixed bottom-5 left-4 sm:left-6 z-40 animate-fade-in">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 bg-[#111111] hover:bg-[#2A2A2A] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#C5A880]/50 transition-all transform hover:scale-105 cursor-pointer group"
            aria-label="عرض سلة المشتريات ومشاركتها"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#C5A880]" />
              <span className="absolute -top-2 -right-2 bg-[#A34E36] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
              </span>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>سلة المشتريات</span>
                <span className="text-[#C5A880] font-mono">({cartItems.length} منتجات)</span>
              </div>
              <div className="text-[10px] text-gray-300">
                انقر للمراجعة والمشاركة عبر الواتساب
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#25D366] animate-ping ml-1" />
          </button>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
