import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Tag, 
  Bell, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  X, 
  Star, 
  KeyRound, 
  Image as ImageIcon,
  Sliders,
  DollarSign,
  Layers,
  Lock,
  ArrowRight,
  Truck,
  Sparkles,
  Gift,
  Crown,
  MessageSquare,
  Eye,
  EyeOff,
  Database,
  Cloud,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { 
  Product, 
  Order, 
  Coupon, 
  AuditLog, 
  OrderStatus, 
  BannerItem, 
  CurrencyType, 
  StoreSettings, 
  ProductCategory,
  BankAccount,
  CustomerReview
} from '../types.ts';
import { createAuditLogEntry, sanitizeInput } from '../utils/security.ts';
import { formatCurrencyLabel } from '../utils/pricing.ts';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  testFirebaseConnection,
  syncAllProductsToCloud,
  saveProductToCloud,
  deleteProductFromCloud,
  saveSettingsToCloud,
  isCloudConfigured,
  FirebaseConfig
} from '../services/firebase.ts';

interface AdminDashboardProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  banners: BannerItem[];
  onUpdateBanners: (banners: BannerItem[]) => void;
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  coupons: Coupon[];
  onUpdateCoupons: (coupons: Coupon[]) => void;
  banks?: BankAccount[];
  onUpdateBanks?: (banks: BankAccount[]) => void;
  reviews?: CustomerReview[];
  onUpdateReviews?: (reviews: CustomerReview[]) => void;
  auditLogs: AuditLog[];
  onAddAuditLog: (log: AuditLog) => void;
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  onExitAdmin: () => void;
  onBroadcastNotification: (message: string) => void;
}

const ALL_CATEGORY_OPTIONS: { id: ProductCategory; label: string }[] = [
  { id: 'perfumes', label: 'العطور (perfumes)' },
  { id: 'makeup', label: 'makeup' },
  { id: 'apparel', label: 'الملابس العامة (apparel)' },
  { id: 'shoes_bags', label: 'الاحذية والحقائب (shoes_bags)' },
  { id: 'kitchen', label: 'المطبخ (kitchen)' },
  { id: 'accessories', label: 'accessories' },
  { id: 'phone', label: 'phone' },
  { id: 'toys', label: 'العاب (toys)' },
  { id: 'dresses', label: 'فساتين سهرة' },
  { id: 'suits', label: 'أطقم وبليزرات' },
  { id: 'women', label: 'أزياء نسائية' },
  { id: 'men', label: 'أزياء رجالية' },
  { id: 'flash_deals', label: 'عروض اليوم المؤقتة' },
];

export const ADMIN_AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

export const generateAutoProductCode = () => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `IN-${randomDigits}`;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProducts,
  banners,
  onUpdateBanners,
  orders,
  onUpdateOrders,
  coupons,
  onUpdateCoupons,
  banks = [],
  onUpdateBanks,
  reviews = [],
  onUpdateReviews,
  auditLogs,
  onAddAuditLog,
  settings,
  onUpdateSettings,
  onExitAdmin,
  onBroadcastNotification,
}) => {
  // Tabs
  const [currentTab, setCurrentTab] = useState<'settings' | 'banners' | 'products' | 'banks' | 'reviews' | 'coupons' | 'orders' | 'notifications' | 'kpis' | 'audit' | 'cloud'>('settings');

  // Cloud Database state (Firebase Firestore)
  const [isCloudActive, setIsCloudActive] = useState<boolean>(() => isCloudConfigured());
  const activeCfg = getActiveFirebaseConfig();
  const [cloudApiKey, setCloudApiKey] = useState(activeCfg?.apiKey || '');
  const [cloudAuthDomain, setCloudAuthDomain] = useState(activeCfg?.authDomain || '');
  const [cloudProjectId, setCloudProjectId] = useState(activeCfg?.projectId || '');
  const [cloudStorageBucket, setCloudStorageBucket] = useState(activeCfg?.storageBucket || '');
  const [cloudSenderId, setCloudSenderId] = useState(activeCfg?.messagingSenderId || '');
  const [cloudAppId, setCloudAppId] = useState(activeCfg?.appId || '');
  const [rawJsonConfig, setRawJsonConfig] = useState('');
  
  const [cloudTesting, setCloudTesting] = useState(false);
  const [cloudTestResult, setCloudTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<string | null>(null);
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string | null>(null);

  // Product editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);
  const [prodTitle, setProdTitle] = useState('');
  const [prodCode, setProdCode] = useState('');
  const [prodPriceSAR, setProdPriceSAR] = useState(300);
  const [prodOriginalPriceSAR, setProdOriginalPriceSAR] = useState<number | undefined>(undefined);
  const [prodCustomBadge, setProdCustomBadge] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('dresses');
  const [prodSubCategory, setProdSubCategory] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodFabric, setProdFabric] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodImageFileName, setProdImageFileName] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [prodSelectedSizes, setProdSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [prodAdminScore, setProdAdminScore] = useState(9.8);
  const [prodAdminBadge, setProdAdminBadge] = useState('فحص الجودة والمطابقة');
  const [prodAdminNotes, setProdAdminNotes] = useState('');

  // Banner editing state
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [isCreatingBanner, setIsCreatingBanner] = useState<boolean>(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerTag, setBannerTag] = useState('');
  const [bannerBadgeText, setBannerBadgeText] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerImageFileName, setBannerImageFileName] = useState('');
  const [bannerUploadLoading, setBannerUploadLoading] = useState(false);
  const [showBannerUrlInput, setShowBannerUrlInput] = useState(false);
  const [bannerCategory, setBannerCategory] = useState<ProductCategory>('dresses');

  // Bank Accounts Management state
  const [isCreatingBank, setIsCreatingBank] = useState<boolean>(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankAccountNameInput, setBankAccountNameInput] = useState('');
  const [bankAccountNumberInput, setBankAccountNumberInput] = useState('');
  const [bankIbanInput, setBankIbanInput] = useState('');
  const [bankCurrencyInput, setBankCurrencyInput] = useState('ريال يمني (ر.ي) / ريال سعودي (ر.س)');
  const [bankNotesInput, setBankNotesInput] = useState('');
  const [bankIsActiveInput, setBankIsActiveInput] = useState(true);

  // Reviews Moderation state
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');

  // Deletion confirmation state (avoids window.confirm in iframes)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'product' | 'banner' | 'coupon' | 'bank' | 'review';
    id: string;
    title: string;
  } | null>(null);

  // Coupon state
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponDiscountValue, setCouponDiscountValue] = useState(15);
  const [couponMinSpend, setCouponMinSpend] = useState(200);
  const [couponDesc, setCouponDesc] = useState('');
  const [couponIsVIP, setCouponIsVIP] = useState(false);

  // Bulk Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  // Push notifications
  const [notifText, setNotifText] = useState('');
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Store Settings state (Announcement, Shipping, Free shipping, PIN, Rate, Points, Display Sizes, Layout)
  const [newAdminPinInput, setNewAdminPinInput] = useState(settings.adminPin || '7849');
  const [confirmAdminPinInput, setConfirmAdminPinInput] = useState(settings.adminPin || '7849');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const [yerRateInput, setYerRateInput] = useState(settings.yerToSarRate);
  const [shippingFeeInput, setShippingFeeInput] = useState(settings.shippingFeeSAR ?? 25);
  const [freeShippingThresholdInput, setFreeShippingThresholdInput] = useState(settings.freeShippingThresholdSAR ?? 400);
  const [isFreeShippingActiveInput, setIsFreeShippingActiveInput] = useState(settings.isFreeShippingActive ?? true);
  const [announcementTextInput, setAnnouncementTextInput] = useState(settings.topAnnouncementText ?? 'عروض حصرية لفترة محدودة | طلب مباشر وتنسيق فوري عبر الواتساب (+967784935535)');
  const [showAnnouncementInput, setShowAnnouncementInput] = useState(settings.showTopAnnouncement ?? true);
  const [enablePointsInput, setEnablePointsInput] = useState(settings.enableLoyaltyPoints ?? false);
  const [bannerDisplaySizeInput, setBannerDisplaySizeInput] = useState<'large' | 'medium' | 'compact'>(settings.bannerDisplaySize || 'medium');
  const [productCardLayoutInput, setProductCardLayoutInput] = useState<'standard' | 'compact'>(settings.productCardLayout || 'standard');
  const [defaultSaleBadgeTextInput, setDefaultSaleBadgeTextInput] = useState(settings.defaultSaleBadgeText || 'خصم 25% اليوم فقط');
  const [defaultUrgencyBadgeTextInput, setDefaultUrgencyBadgeTextInput] = useState(settings.defaultUrgencyBadgeText || 'عرض حصري محدود ⏳');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Banner CRUD
  const startCreateBanner = () => {
    setIsCreatingBanner(true);
    setEditingBanner(null);
    setBannerTitle('عرض خاص جديد');
    setBannerSubtitle('أحدث التصاميم الحصرية بجودة فائقة وضمان معتمد');
    setBannerTag('عرض موسمي حصري');
    setBannerBadgeText('خصم 25% اليوم فقط');
    setBannerImage('/src/assets/images/banner_seasonal_collection_1793594468410.jpg');
    setBannerImageFileName('');
    setShowBannerUrlInput(false);
    setBannerCategory('dresses');
  };

  const startEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setIsCreatingBanner(false);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle);
    setBannerTag(b.tag);
    setBannerBadgeText(b.badgeText);
    setBannerImage(b.image);
    setBannerImageFileName('');
    setShowBannerUrlInput(false);
    setBannerCategory(b.category);
  };

  const handleBannerImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerImageFileName(file.name);
    setBannerUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBannerImage(result);
      }
      setBannerUploadLoading(false);
    };
    reader.onerror = () => {
      setBannerUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingBanner) {
      const newBanner: BannerItem = {
        id: 'banner_' + Date.now(),
        title: sanitizeInput(bannerTitle),
        subtitle: sanitizeInput(bannerSubtitle),
        tag: sanitizeInput(bannerTag),
        badgeText: sanitizeInput(bannerBadgeText),
        image: bannerImage || '/src/assets/images/banner_haute_couture_1793594467846.jpg',
        category: bannerCategory,
        isActive: true,
      };
      onUpdateBanners([...banners, newBanner]);
      onAddAuditLog(createAuditLogEntry('إضافة مربع عرض علوي جديد', newBanner.title, `العرض: ${newBanner.badgeText}`));
    } else if (editingBanner) {
      const updated = banners.map((b) => {
        if (b.id === editingBanner.id) {
          return {
            ...b,
            title: sanitizeInput(bannerTitle),
            subtitle: sanitizeInput(bannerSubtitle),
            tag: sanitizeInput(bannerTag),
            badgeText: sanitizeInput(bannerBadgeText),
            image: bannerImage || b.image,
            category: bannerCategory,
          };
        }
        return b;
      });
      onUpdateBanners(updated);
      onAddAuditLog(createAuditLogEntry('تعديل مربع عرض علوي', bannerTitle, `تحديث النصوص والعروض`));
    }
    setEditingBanner(null);
    setIsCreatingBanner(false);
  };

  const handleDeleteBanner = (bannerId: string, title: string) => {
    setItemToDelete({ type: 'banner', id: bannerId, title });
  };

  const handleToggleBannerActive = (bannerId: string) => {
    const updated = banners.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b));
    onUpdateBanners(updated);
  };

  // Safe Deletion Executor (Replaces window.confirm for iframe safety)
  const executeDelete = () => {
    if (!itemToDelete) return;
    const { type, id, title } = itemToDelete;
    if (type === 'product') {
      const updated = products.filter((p) => p.id !== id);
      onUpdateProducts(updated);
      onAddAuditLog(createAuditLogEntry('حذف منتج', title, `كود المنتج: ${id}`));
      if (editingProduct && editingProduct.id === id) {
        setEditingProduct(null);
      }
      if (isCloudConfigured()) {
        deleteProductFromCloud(id).catch((err) => console.warn('Cloud product deletion note:', err));
      }
    } else if (type === 'banner') {
      const updated = banners.filter((b) => b.id !== id);
      onUpdateBanners(updated);
      onAddAuditLog(createAuditLogEntry('حذف مربع عرض', title, `كود المربع: ${id}`));
      if (editingBanner && editingBanner.id === id) {
        setEditingBanner(null);
      }
    } else if (type === 'coupon') {
      onUpdateCoupons(coupons.filter((c) => c.code !== id));
      onAddAuditLog(createAuditLogEntry('حذف كوبون خصم', id, 'تم إلغاء تفعيل الكوبون'));
    } else if (type === 'bank') {
      if (onUpdateBanks) {
        onUpdateBanks(banks.filter((b) => b.id !== id));
        onAddAuditLog(createAuditLogEntry('حذف حساب بنكي', title, `معرف الحساب: ${id}`));
      }
    } else if (type === 'review') {
      if (onUpdateReviews) {
        onUpdateReviews(reviews.filter((r) => r.id !== id));
        onAddAuditLog(createAuditLogEntry('حذف تعليق عميل', title, `معرف التقييم: ${id}`));
      }
    }
    setItemToDelete(null);
  };

  // Image upload and size handlers
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProdImageFileName(file.name);
    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setProdImageUrl(result);
      }
      setImageUploadLoading(false);
    };
    reader.onerror = () => {
      setImageUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleProdSize = (sz: string) => {
    if (prodSelectedSizes.includes(sz)) {
      if (prodSelectedSizes.length > 1) {
        setProdSelectedSizes(prodSelectedSizes.filter((s) => s !== sz));
      }
    } else {
      setProdSelectedSizes([...prodSelectedSizes, sz]);
    }
  };

  const selectAllProdSizes = () => {
    setProdSelectedSizes([...ADMIN_AVAILABLE_SIZES]);
  };

  const selectStandardProdSizes = () => {
    setProdSelectedSizes(['S', 'M', 'L', 'XL']);
  };

  // Product CRUD
  const startCreateProduct = () => {
    setIsCreatingProduct(true);
    setEditingProduct(null);
    setProdTitle('');
    setProdCode(generateAutoProductCode());
    setProdPriceSAR(350);
    setProdOriginalPriceSAR(480);
    setProdCustomBadge('عرض حصري');
    setProdCategory('dresses');
    setProdSubCategory('فساتين سهرة');
    setProdDescription('قطعة أزياء استثنائية مصممة بأعلى معايير الفخامة.');
    setProdFabric('حرير طبيعي 100%، بطانة فاخرة');
    setProdImageUrl('/src/assets/images/banner_haute_couture_1793594467846.jpg');
    setProdImageFileName('');
    setShowUrlInput(false);
    setProdSelectedSizes(['S', 'M', 'L', 'XL', 'XXL']);
    setProdAdminScore(9.9);
    setProdAdminBadge('معتمد ومفحوص من الإدارة');
    setProdAdminNotes('تم فحص الخامة والمقاس وثبات اللون بنجاح تام.');
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsCreatingProduct(false);
    setProdTitle(prod.title);
    setProdCode(prod.code || (prod.id.startsWith('prod_IN-') ? prod.id.replace('prod_', '') : `IN-${prod.id.slice(-4)}`));
    setProdPriceSAR(prod.priceSAR);
    setProdOriginalPriceSAR(prod.originalPriceSAR);
    setProdCustomBadge(prod.customBadge || '');
    setProdCategory(prod.category);
    setProdSubCategory(prod.subCategory || '');
    setProdDescription(prod.description);
    setProdFabric(prod.fabricDetails);
    setProdImageUrl(prod.images[0] || '');
    setProdImageFileName('');
    setShowUrlInput(false);
    setProdSelectedSizes(prod.availableSizes && prod.availableSizes.length > 0 ? (prod.availableSizes as string[]) : ['S', 'M', 'L', 'XL']);
    setProdAdminScore(prod.adminRating?.score || 9.8);
    setProdAdminBadge(prod.adminRating?.badgeLabel || 'فحص الجودة والمطابقة');
    setProdAdminNotes(prod.adminRating?.staffNotes || '');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeInput(prodTitle);
    const cleanDesc = sanitizeInput(prodDescription);
    const finalCode = (prodCode.trim() || generateAutoProductCode()).toUpperCase();
    const finalSizes = prodSelectedSizes.length > 0 ? prodSelectedSizes : ['S', 'M', 'L', 'XL'];
    const finalImage = prodImageUrl || '/src/assets/images/product_silk_dress_1793594469558.jpg';

    if (isCreatingProduct) {
      const newProduct: Product = {
        id: 'prod_' + finalCode.replace(/[^A-Za-z0-9_-]/g, '') + '_' + Date.now(),
        code: finalCode,
        title: cleanTitle || 'منتج جديد فاخر',
        titleEn: cleanTitle,
        category: prodCategory,
        subCategory: prodSubCategory,
        priceSAR: Number(prodPriceSAR) || 100,
        originalPriceSAR: prodOriginalPriceSAR ? Number(prodOriginalPriceSAR) : undefined,
        customBadge: prodCustomBadge.trim() || undefined,
        description: cleanDesc,
        fabricDetails: prodFabric,
        careInstructions: 'تنظيف جاف أو غسيل يدوي لطيف.',
        images: [finalImage],
        rating: 5.0,
        reviewsCount: 1,
        adminRating: {
          score: Number(prodAdminScore) || 9.8,
          badgeLabel: prodAdminBadge || 'فحص معتمد',
          reviewerRole: 'إدارة الجودة - I in',
          fabricQuality: 10,
          sizingAccuracy: 10,
          finishingScore: 10,
          staffNotes: prodAdminNotes || 'تم فحص ومطابقة المنتج',
          inspectionDate: new Date().toISOString().split('T')[0],
        },
        variants: finalSizes.map((sz, idx) => ({
          id: `v_${finalCode}_${sz}_${idx}`,
          colorName: 'أساسي',
          colorHex: '#111111',
          size: (sz as any),
          stock: 15,
          sku: `${finalCode}-${sz}`,
        })),
        availableColors: [{ name: 'أساسي', hex: '#111111' }],
        availableSizes: finalSizes as any,
        tags: ['جديد', 'I in', prodCategory, finalCode],
      };

      onUpdateProducts([newProduct, ...products]);
      if (isCloudConfigured()) {
        saveProductToCloud(newProduct).catch((err) => console.warn('Cloud product add notice:', err));
      }
      onAddAuditLog(
        createAuditLogEntry(
          'إضافة منتج جديد وتوثيق تقييم المشرف',
          `${cleanTitle} (${finalCode})`,
          `السعر: ${prodPriceSAR} ر.س | المقاسات: ${finalSizes.join(', ')}`
        )
      );
    } else if (editingProduct) {
      let savedProductObj: Product | null = null;
      const updated = products.map((p) => {
        if (p.id === editingProduct.id) {
          const modProd: Product = {
            ...p,
            title: cleanTitle,
            code: finalCode,
            category: prodCategory,
            subCategory: prodSubCategory,
            priceSAR: Number(prodPriceSAR),
            originalPriceSAR: prodOriginalPriceSAR ? Number(prodOriginalPriceSAR) : undefined,
            customBadge: prodCustomBadge.trim() || undefined,
            description: cleanDesc,
            fabricDetails: prodFabric,
            images: finalImage ? [finalImage, ...p.images.slice(1)] : p.images,
            availableSizes: finalSizes as any,
            adminRating: {
              ...p.adminRating,
              score: Number(prodAdminScore),
              badgeLabel: prodAdminBadge,
              staffNotes: prodAdminNotes,
            },
          };
          savedProductObj = modProd;
          return modProd;
        }
        return p;
      });

      onUpdateProducts(updated);
      if (savedProductObj && isCloudConfigured()) {
        saveProductToCloud(savedProductObj).catch((err) => console.warn('Cloud product update notice:', err));
      }
      onAddAuditLog(
        createAuditLogEntry(
          'تعديل منتج وتحديث السعر والمواصفات',
          `${cleanTitle} (${finalCode})`,
          `السعر: ${prodPriceSAR} ر.س | المقاسات: ${finalSizes.join(', ')}`
        )
      );
    }

    setEditingProduct(null);
    setIsCreatingProduct(false);
  };

  const handleDeleteProduct = (productId: string, title: string) => {
    setItemToDelete({ type: 'product', id: productId, title });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    onUpdateOrders(updated);
    onAddAuditLog(
      createAuditLogEntry('تحديث حالة طلب', `طلب ${orderId}`, `الحالة الجديدة: ${newStatus}`)
    );
  };

  // Coupons management
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const newCoupon: Coupon = {
      code: couponCode.trim().toUpperCase(),
      discountType: couponDiscountType,
      discountValue: Number(couponDiscountValue) || 10,
      minSpendSAR: Number(couponMinSpend) || 0,
      description: couponDesc || (couponIsVIP ? 'كوبون خاص VIP للمؤثرين' : 'كوبون خصم عام'),
      expiresAt: '2028-12-31',
      usageCount: 0,
      isPrivateVIP: couponIsVIP,
    };

    onUpdateCoupons([newCoupon, ...coupons]);
    onAddAuditLog(createAuditLogEntry('إنشاء كوبون خصم جديد', newCoupon.code, `الخصم: ${newCoupon.discountValue}${newCoupon.discountType === 'percentage' ? '%' : ' ر.س'} | VIP: ${couponIsVIP ? 'نعم' : 'لا'}`));
    setCouponCode('');
    setCouponDesc('');
    setIsCreatingCoupon(false);
  };

  const handleDeleteCoupon = (code: string) => {
    setItemToDelete({ type: 'coupon', id: code, title: `كود الخصم (${code})` });
  };

  // Bank Accounts CRUD
  const startCreateBank = () => {
    setIsCreatingBank(true);
    setEditingBank(null);
    setBankNameInput('');
    setBankAccountNameInput('متجر I in للأزياء الفاخرة');
    setBankAccountNumberInput('');
    setBankIbanInput('');
    setBankCurrencyInput('ريال يمني (ر.ي) / ريال سعودي (ر.س)');
    setBankNotesInput('يرجى إرفاق صورة إشعار الإيداع أو التحويل عند الطلب بالواتساب.');
    setBankIsActiveInput(true);
  };

  const startEditBank = (b: BankAccount) => {
    setEditingBank(b);
    setIsCreatingBank(false);
    setBankNameInput(b.bankName);
    setBankAccountNameInput(b.accountName);
    setBankAccountNumberInput(b.accountNumber);
    setBankIbanInput(b.iban || '');
    setBankCurrencyInput(b.currency);
    setBankNotesInput(b.notes || '');
    setBankIsActiveInput(b.isActive !== false);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameInput.trim() || !bankAccountNumberInput.trim()) return;

    if (isCreatingBank) {
      const newBank: BankAccount = {
        id: 'bank_' + Date.now(),
        bankName: sanitizeInput(bankNameInput.trim()),
        accountName: sanitizeInput(bankAccountNameInput.trim()),
        accountNumber: sanitizeInput(bankAccountNumberInput.trim()),
        iban: bankIbanInput.trim() || undefined,
        currency: sanitizeInput(bankCurrencyInput.trim()),
        notes: sanitizeInput(bankNotesInput.trim()),
        isActive: bankIsActiveInput,
      };
      if (onUpdateBanks) {
        onUpdateBanks([...banks, newBank]);
      }
      onAddAuditLog(createAuditLogEntry('إضافة حساب بنكي جديد', newBank.bankName, `رقم الحساب: ${newBank.accountNumber}`));
    } else if (editingBank) {
      const updated = banks.map((b) => {
        if (b.id === editingBank.id) {
          return {
            ...b,
            bankName: sanitizeInput(bankNameInput.trim()),
            accountName: sanitizeInput(bankAccountNameInput.trim()),
            accountNumber: sanitizeInput(bankAccountNumberInput.trim()),
            iban: bankIbanInput.trim() || undefined,
            currency: sanitizeInput(bankCurrencyInput.trim()),
            notes: sanitizeInput(bankNotesInput.trim()),
            isActive: bankIsActiveInput,
          };
        }
        return b;
      });
      if (onUpdateBanks) {
        onUpdateBanks(updated);
      }
      onAddAuditLog(createAuditLogEntry('تعديل حساب بنكي', bankNameInput, `تحديث بيانات الحساب`));
    }
    setEditingBank(null);
    setIsCreatingBank(false);
  };

  const handleDeleteBank = (bankId: string, name: string) => {
    setItemToDelete({ type: 'bank', id: bankId, title: name });
  };

  const handleToggleBankActive = (bankId: string) => {
    if (!onUpdateBanks) return;
    const updated = banks.map((b) => b.id === bankId ? { ...b, isActive: b.isActive === false ? true : false } : b);
    onUpdateBanks(updated);
  };

  // Review Deletion
  const handleDeleteReview = (revId: string, author: string) => {
    setItemToDelete({ type: 'review', id: revId, title: `تعليق العميل: ${author}` });
  };

  // Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    let finalPin = settings.adminPin || '7849';
    if (newAdminPinInput.trim()) {
      if (newAdminPinInput.trim() !== confirmAdminPinInput.trim()) {
        setPinError('كلمة المرور وتأكيدها غير متطابقين!');
        return;
      }
      if (newAdminPinInput.trim().length < 4) {
        setPinError('يجب أن تتكون كلمة المرور من 4 خانات على الأقل.');
        return;
      }
      finalPin = newAdminPinInput.trim();
      setPinError('');
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 4000);
    }

    const updated: StoreSettings = {
      adminPin: finalPin,
      yerToSarRate: Number(yerRateInput) || 140,
      enableLoyaltyPoints: enablePointsInput,
      shippingFeeSAR: Number(shippingFeeInput) >= 0 ? Number(shippingFeeInput) : 25,
      freeShippingThresholdSAR: Number(freeShippingThresholdInput) || 400,
      isFreeShippingActive: isFreeShippingActiveInput,
      topAnnouncementText: announcementTextInput.trim() || 'عروض حصرية لفترة محدودة | طلب مباشر وسريع عبر الواتساب',
      showTopAnnouncement: showAnnouncementInput,
      bannerDisplaySize: bannerDisplaySizeInput,
      productCardLayout: productCardLayoutInput,
      defaultSaleBadgeText: defaultSaleBadgeTextInput.trim() || 'خصم 25% اليوم فقط',
      defaultUrgencyBadgeText: defaultUrgencyBadgeTextInput.trim() || 'عرض حصري محدود ⏳',
      loyaltyPointsRate: 1,
    };

    onUpdateSettings(updated);
    if (isCloudConfigured()) {
      saveSettingsToCloud(updated).catch((err) => console.warn('Cloud settings update notice:', err));
    }
    onAddAuditLog(
      createAuditLogEntry(
        'تحديث شامل لإعدادات المتجر',
        'الأسعار والشحن والعروض وكلمة المرور',
        `سعر الشحن: ${updated.shippingFeeSAR} ر.س | حجم المربعات: ${updated.bannerDisplaySize} | نمط البطاقات: ${updated.productCardLayout}`
      )
    );
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  // Cloud Database Handlers
  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setCloudSaveMessage(null);
    setCloudTestResult(null);

    let configToSave: FirebaseConfig;

    // Check if user pasted full raw JSON config
    if (rawJsonConfig.trim()) {
      try {
        let clean = rawJsonConfig.trim();
        // Support JS object syntax e.g. const firebaseConfig = { ... };
        if (clean.includes('{') && clean.includes('}')) {
          clean = clean.substring(clean.indexOf('{'), clean.lastIndexOf('}') + 1);
        }
        // Normalize keys if not quoted JSON
        const parsed = Function('"use strict";return (' + clean + ')')();
        if (!parsed.apiKey || !parsed.projectId) {
          throw new Error('الكود الملصق لا يحتوي على apiKey أو projectId صالح.');
        }
        configToSave = {
          apiKey: parsed.apiKey,
          authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
          projectId: parsed.projectId,
          storageBucket: parsed.storageBucket || `${parsed.projectId}.firebasestorage.app`,
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || '',
        };
        // Update input states
        setCloudApiKey(configToSave.apiKey);
        setCloudAuthDomain(configToSave.authDomain);
        setCloudProjectId(configToSave.projectId);
        setCloudStorageBucket(configToSave.storageBucket || '');
        setCloudSenderId(configToSave.messagingSenderId || '');
        setCloudAppId(configToSave.appId);
      } catch (err: any) {
        setCloudSaveMessage(`خطأ في قراءة كود الإعداد: ${err.message || 'تأكد من صحة الكود الملصق'}`);
        return;
      }
    } else {
      if (!cloudApiKey.trim() || !cloudProjectId.trim()) {
        setCloudSaveMessage('يرجى إدخال apiKey و projectId على الأقل.');
        return;
      }
      configToSave = {
        apiKey: cloudApiKey.trim(),
        authDomain: cloudAuthDomain.trim() || `${cloudProjectId.trim()}.firebaseapp.com`,
        projectId: cloudProjectId.trim(),
        storageBucket: cloudStorageBucket.trim() || `${cloudProjectId.trim()}.firebasestorage.app`,
        messagingSenderId: cloudSenderId.trim(),
        appId: cloudAppId.trim(),
      };
    }

    try {
      saveCustomFirebaseConfig(configToSave);
      setIsCloudActive(true);
      setCloudSaveMessage('✓ تم حفظ إعدادات الربط السحابي بنجاح! يتم الآن تفعيل المزامنة المباشرة.');
      onAddAuditLog(createAuditLogEntry('تحديث إعدادات السحابة Firebase', configToSave.projectId, 'تم حفظ مفاتيح قاعدة البيانات السحابية'));
    } catch (err: any) {
      setCloudSaveMessage(`تعذر الحفظ: ${err.message}`);
    }
  };

  const handleTestCloudConnection = async () => {
    setCloudTesting(true);
    setCloudTestResult(null);
    try {
      const res = await testFirebaseConnection();
      setCloudTestResult(res);
      if (res.success) {
        setIsCloudActive(true);
      }
    } catch (err: any) {
      setCloudTestResult({ success: false, message: err.message || 'فشل الاتصال' });
    } finally {
      setCloudTesting(false);
    }
  };

  const handleSyncAllToCloud = async () => {
    if (!isCloudConfigured()) {
      setCloudSyncResult('يرجى حفظ إعدادات السحابة أولاً قبل بدء المزامنة.');
      return;
    }
    setCloudSyncing(true);
    setCloudSyncResult(null);
    try {
      const count = await syncAllProductsToCloud(products);
      setCloudSyncResult(`✓ تم بنجاح رفع ومزامنة ${count} منتج إلى قاعدة بيانات Firebase Firestore السحابية! ستظهر الآن لجميع الزبائن فوراً.`);
      onAddAuditLog(createAuditLogEntry('مزامنة شاملة للمنتجات إلى السحابة', `${count} منتج`, 'رفع كافة المنتجات الحالية إلى Firestore'));
    } catch (err: any) {
      setCloudSyncResult(`تعذرت المزامنة: ${err.message || 'تحقق من قواعد الأمان وقفل Firestore'}`);
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleClearCloud = () => {
    clearCustomFirebaseConfig();
    setIsCloudActive(false);
    setCloudApiKey('');
    setCloudAuthDomain('');
    setCloudProjectId('');
    setCloudStorageBucket('');
    setCloudSenderId('');
    setCloudAppId('');
    setRawJsonConfig('');
    setCloudTestResult(null);
    setCloudSyncResult(null);
    setCloudSaveMessage('تم مسح إعدادات السحابة. المتجر يعمل الآن بالوضع المحلي الآمن.');
    onAddAuditLog(createAuditLogEntry('إلغاء ربط السحابة', 'Firebase', 'العودة للوضع المحلي'));
  };

  const totalRevenueSAR = orders.reduce((acc, ord) => acc + ord.total, 0);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#111111] p-4 sm:p-6 lg:p-8 font-sans text-right" dir="rtl">
      {/* Admin Top Bar */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-[#E5DFD7] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center text-[#C5A880]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#111111]">
              لوحة تحكم مشرف متجر I in الفاخر
            </h1>
            <p className="text-xs text-[#777777]">
              إدارة سرية ومطلقة للأسعار، مربعات العروض، شريط الإعلانات، الشحن، والكوبونات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isCloudActive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="حالة الربط السحابي مع Firebase Firestore"
          >
            <Database className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isCloudActive ? 'السحابة: متصلة حية 🟢' : 'السحابة: وضع محلي 🟡'}</span>
          </button>

          <button
            onClick={() => {
              onBroadcastNotification('تخفيضات استثنائية! استخدم كود VIP50 لخصم 50 ر.س على تشكيلة الهوت كوتور ✨');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] text-[#8B6B3F] hover:bg-[#F2EFE9] rounded-xl text-xs font-bold border border-[#E5DFD7] transition-all cursor-pointer"
            title="بث إشعار عروض VIP فوري للزوار"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>بث عرض VIP</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white hover:bg-[#333333] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>العودة للمتجر (معاينة)</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2 border-b border-[#E0D9CE] pb-3 text-xs font-bold">
        <button
          onClick={() => setCurrentTab('cloud')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'cloud' 
              ? 'bg-[#8B6B3F] text-white shadow-md' 
              : 'bg-white text-[#111111] hover:bg-[#EAE6DE] border border-[#E0D9CE]'
          }`}
        >
          <Database className="w-4 h-4 text-[#C5A880]" />
          <span>الربط السحابي (Firebase)</span>
          <span className={`w-2 h-2 rounded-full ${isCloudActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'settings' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#C5A880]" />
          <span>إعدادات الشحن والعروض والشريط</span>
        </button>

        <button
          onClick={() => setCurrentTab('banners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'banners' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#C5A880]" />
          <span>مربعات العروض العلوية ({banners.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'products' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <Package className="w-4 h-4 text-[#C5A880]" />
          <span>المنتجات والأسعار والتقييم ({products.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('banks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'banks' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#C5A880]" />
          <span>الحسابات البنكية والإيداع ({banks.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'reviews' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#C5A880]" />
          <span>التعليقات والتقييمات ({reviews.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'coupons' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <Tag className="w-4 h-4 text-[#C5A880]" />
          <span>الكوبونات والـ VIP ({coupons.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'orders' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-[#C5A880]" />
          <span>الطلبات والإيداعات ({orders.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'notifications' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <Bell className="w-4 h-4 text-[#C5A880]" />
          <span>بث الإشعارات الحية</span>
        </button>

        <button
          onClick={() => setCurrentTab('kpis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'kpis' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#C5A880]" />
          <span>التقارير والمبيعات</span>
        </button>

        <button
          onClick={() => setCurrentTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'audit' ? 'bg-[#111111] text-white shadow-sm' : 'bg-white text-[#666666] hover:bg-[#EAE6DE]'
          }`}
        >
          <FileText className="w-4 h-4 text-[#C5A880]" />
          <span>سجل التدقيق الأمني</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tab: Settings (Shipping, Top announcement, Free shipping, Exchange rate, Admin PIN) */}
        {currentTab === 'settings' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DCD5C9] shadow-sm space-y-6 max-w-3xl">
            <div className="border-b border-[#EFECE6] pb-4">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#8B6B3F]" />
                <span>إعدادات العروض، سعر الشحن، والشريط العلوي</span>
              </h3>
              <p className="text-xs text-[#777777] mt-1">
                التحكم المباشر بسعر الشحن، نص شريط الإعلانات أعلى الصفحة، والتحويل بين العملات
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              {/* Top Announcement Bar Customization (Replaces static text as requested) */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD7] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#111111] block">
                      نص شريط الإعلانات والعروض أعلى المتجر:
                    </label>
                    <span className="text-[11px] text-[#777777]">
                      يمكنك كتابة وتعديل أي عرض تريده يظهر للمتسوقين في أعلى الصفحة فوراً
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAnnouncementInput}
                      onChange={(e) => setShowAnnouncementInput(e.target.checked)}
                      className="w-4 h-4 accent-[#111111]"
                    />
                    <span>إظهار الشريط العلوي</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={announcementTextInput}
                  onChange={(e) => setAnnouncementTextInput(e.target.value)}
                  placeholder="اكتب العرض الموسمي أو كود الخصم هنا..."
                  className="w-full bg-white border border-[#D5CFC7] rounded-xl px-3.5 py-2.5 text-xs text-[#111111] font-medium"
                />
                <div className="p-2.5 bg-white/70 rounded-lg border border-[#EDE8DC] text-[11px] text-[#666666]">
                  <strong>المعاينة الحالية للشريط:</strong> {announcementTextInput}
                </div>
              </div>

              {/* Shipping Fee Setting (Admin sets shipping price) */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD7] space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8B6B3F]" />
                  <strong className="text-xs font-bold text-[#111111]">تحديد سعر ورسوم الشحن:</strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#444444] font-bold mb-1">
                      سعر الشحن الأساسي (بالريال السعودي ر.س):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={shippingFeeInput}
                        onChange={(e) => setShippingFeeInput(Number(e.target.value))}
                        className="w-full bg-white border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] font-mono font-bold"
                      />
                      <span className="text-gray-500 font-mono">ر.س</span>
                    </div>
                    <span className="text-[11px] text-[#777777] mt-1 block">
                      يعادل في اليمن: {(shippingFeeInput * yerRateInput).toLocaleString()} ر.ي
                    </span>
                  </div>

                  <div>
                    <label className="block text-[#444444] font-bold mb-1">
                      حد الشحن المجاني (Free Shipping Threshold):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={freeShippingThresholdInput}
                        onChange={(e) => setFreeShippingThresholdInput(Number(e.target.value))}
                        className="w-full bg-white border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] font-mono font-bold"
                      />
                      <span className="text-gray-500 font-mono">ر.س</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] text-[#555555] mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFreeShippingActiveInput}
                        onChange={(e) => setIsFreeShippingActiveInput(e.target.checked)}
                        className="accent-[#111111]"
                      />
                      <span>تفعيل ميزة الشحن المجاني التلقائي للطلبات فوق الحد</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Currency and Exchange Rate */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD7] space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#8B6B3F]" />
                  <strong className="text-xs font-bold text-[#111111]">سعر صرف الريال اليمني مقابل السعودي:</strong>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={yerRateInput}
                    onChange={(e) => setYerRateInput(Number(e.target.value))}
                    className="w-40 bg-white border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] font-mono font-bold"
                  />
                  <span className="text-xs text-[#555555]">
                    (1 ريال سعودي = {yerRateInput} ريال يمني)
                  </span>
                </div>
                <p className="text-[11px] text-[#777777]">
                  يتم تحديث جميع أسعار المنتجات وسلات العملاء ومجموع الواتساب فورياً بناءً على هذا الرقم.
                </p>
              </div>

              {/* Loyalty Points Admin Switch */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EDE8DC] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-xs font-bold text-[#111111] block flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#C5A880]" />
                      نظام نقاط المكافآت والولاء (Loyalty Rewards)
                    </strong>
                    <span className="text-[11px] text-[#666666]">
                      تفعيل أو تعطيل ظهور نظام النقاط والمكافآت للعملاء في واجهة المتجر
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePointsInput}
                    onChange={(e) => setEnablePointsInput(e.target.checked)}
                    className="w-5 h-5 accent-[#8B6B3F] cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-[#888888]">
                  الحالة الحالية: {enablePointsInput ? 'مفعل ويظهر للعملاء' : 'معطل ومخفي عن العملاء (بأمر المشرف)'}
                </p>
              </div>

              {/* Display Sizes for Square Top Banners (User request: Control display box sizes) */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD7] space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#8B6B3F]" />
                  <strong className="text-xs font-bold text-[#111111]">التحكم بحجم مربعات العرض العلوية (Top Banners Size):</strong>
                </div>
                <p className="text-[11px] text-[#666666]">
                  اختر المقاس المناسب لمربعات العروض في الثلث الأعلى ليتناسق بدقة مع تفضيلاتك وشاشات الهواتف:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBannerDisplaySizeInput('large')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      bannerDisplaySizeInput === 'large'
                        ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                        : 'bg-white text-[#444444] border-[#D5CFC7] hover:bg-gray-50'
                    }`}
                  >
                    مربعات كبيرة (Hero)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerDisplaySizeInput('medium')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      bannerDisplaySizeInput === 'medium'
                        ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                        : 'bg-white text-[#444444] border-[#D5CFC7] hover:bg-gray-50'
                    }`}
                  >
                    مربعات متوسطة (قياسي)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerDisplaySizeInput('compact')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      bannerDisplaySizeInput === 'compact'
                        ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                        : 'bg-white text-[#444444] border-[#D5CFC7] hover:bg-gray-50'
                    }`}
                  >
                    مربعات صغيرة ومدمجة
                  </button>
                </div>
              </div>

              {/* Product Cards Layout (Standard vs Compact) */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD7] space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#8B6B3F]" />
                  <strong className="text-xs font-bold text-[#111111]">نمط عرض مربعات المنتجات (Product Card Style):</strong>
                </div>
                <p className="text-[11px] text-[#666666]">
                  تحديد شكل مربعات المنتجات في الصفحة الرئيسية (قياسية بكامل التفاصيل أو صغيرة مدمجة لتنوع العرض):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductCardLayoutInput('standard')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      productCardLayoutInput === 'standard'
                        ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                        : 'bg-white text-[#444444] border-[#D5CFC7] hover:bg-gray-50'
                    }`}
                  >
                    مربعات قياسية كاملة التفاصيل
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductCardLayoutInput('compact')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      productCardLayoutInput === 'compact'
                        ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                        : 'bg-white text-[#444444] border-[#D5CFC7] hover:bg-gray-50'
                    }`}
                  >
                    مربعات صغيرة مدمجة (Compact Grid)
                  </button>
                </div>
              </div>

              {/* Badges and Urgency Text Customization */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD7] space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#8B6B3F]" />
                  <strong className="text-xs font-bold text-[#111111]">التحكم بنصوص شارات العروض والخصومات:</strong>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#555555] font-bold mb-1">
                      النص التلقائي لشارة التخفيضات:
                    </label>
                    <input
                      type="text"
                      value={defaultSaleBadgeTextInput}
                      onChange={(e) => setDefaultSaleBadgeTextInput(e.target.value)}
                      placeholder="خصم 25% اليوم فقط..."
                      className="w-full bg-white border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#555555] font-bold mb-1">
                      النص التلقائي لشارة العروض المحدودة:
                    </label>
                    <input
                      type="text"
                      value={defaultUrgencyBadgeTextInput}
                      onChange={(e) => setDefaultUrgencyBadgeTextInput(e.target.value)}
                      placeholder="عرض حصري محدود ⏳..."
                      className="w-full bg-white border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                </div>
              </div>

              {/* Secure Admin Secret PIN Change */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD7] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#8B6B3F]" />
                    <label className="text-xs font-bold text-[#111111]">
                      تعديل الرمز السري / كلمة المرور للمشرف (PIN):
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(!showAdminPin)}
                    className="text-[#888888] hover:text-[#111111] flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {showAdminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAdminPin ? 'إخفاء الرمز' : 'إظهار الرمز'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#666666]">
                  يمكنك تغيير الرمز السري هنا بأمان تام، وسيتم اعتماده وتشفيره فورياً في المتصفح:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#555555] mb-1">الرمز السري الجديد:</label>
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={newAdminPinInput}
                      onChange={(e) => {
                        setNewAdminPinInput(e.target.value);
                        if (pinError) setPinError('');
                      }}
                      placeholder="أدخل 4 خانات على الأقل..."
                      className="w-full bg-white border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] font-mono tracking-wider font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#555555] mb-1">تأكيد الرمز السري الجديد:</label>
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={confirmAdminPinInput}
                      onChange={(e) => {
                        setConfirmAdminPinInput(e.target.value);
                        if (pinError) setPinError('');
                      }}
                      placeholder="أعد إدخال الرمز السري للتأكيد..."
                      className="w-full bg-white border border-[#D5CFC7] rounded-xl px-3 py-2 text-xs text-[#111111] font-mono tracking-wider font-bold"
                    />
                  </div>
                </div>

                {pinError && (
                  <p className="text-xs text-[#A34E36] font-semibold bg-[#FFEBEE] p-2 rounded-lg border border-[#F8D7DA]">
                    ⚠️ {pinError}
                  </p>
                )}

                {pinSuccess && (
                  <p className="text-xs text-[#2E7D32] font-semibold bg-[#E8F5E9] p-2 rounded-lg border border-[#C8E6C9]">
                    ✓ تم تحديث الرمز السري بنجاح، الرمز الجديد مفعل ومحفوظ فورياً.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-[#111111] text-white hover:bg-[#333333] px-8 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  حفظ كافة الإعدادات وتطبيقها فوراً
                </button>

                {settingsSuccess && (
                  <div className="p-3 bg-[#E8F5E9] text-[#2E7D32] rounded-xl font-semibold text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>تم حفظ وتحديث الإعدادات بنجاح تام!</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tab 1: Square Hero Banners (Add, Edit, Delete) */}
        {currentTab === 'banners' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-[#111111]">إدارة مربعات العروض الإعلانية (الثلث الأعلى من الشاشة)</h3>
                <p className="text-xs text-[#777777]">يمكنك إضافة مربعات جديدة، تعديل نصوص الخصومات، أو حذف أي مربع فورياً</p>
              </div>

              <button
                onClick={startCreateBanner}
                className="flex items-center gap-2 bg-[#111111] text-white hover:bg-[#333333] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>إضافة مربع عرض جديد</span>
              </button>
            </div>

            {/* Banner Form Modal / Inline Editor */}
            {(isCreatingBanner || editingBanner) && (
              <div className="bg-white p-6 rounded-2xl border-2 border-[#111111] shadow-lg animate-fade-in space-y-4">
                <div className="flex justify-between items-center border-b border-[#EFECE6] pb-3">
                  <h4 className="font-bold text-sm text-[#111111]">
                    {isCreatingBanner ? 'إضافة مربع إعلاني جديد' : `تعديل المربع: ${bannerTitle}`}
                  </h4>
                  <button
                    onClick={() => {
                      setIsCreatingBanner(false);
                      setEditingBanner(null);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">العنوان الرئيسي للمربع *:</label>
                      <input
                        type="text"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">شارة العرض (الخصم أو الكود) *:</label>
                      <input
                        type="text"
                        value={bannerBadgeText}
                        onChange={(e) => setBannerBadgeText(e.target.value)}
                        placeholder="مثال: خصم 20% بكود LUXE20 أو عرض محدود"
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                        <span className="text-[10px] text-[#666666]">مقترحات سريعة:</span>
                        {['خصم 25% اليوم فقط', 'عرض حصري محدود ⏳', 'الأكثر طلباً 👑', 'وصلنا حديثاً ✨', 'كمية محدودة ⚡', 'هوت كوتور فاخر 💎'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBannerBadgeText(preset)}
                            className="text-[10px] px-2 py-0.5 bg-white border border-[#DDD6CE] hover:border-[#111111] rounded text-[#333333] cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">التاغ الصغير (مثل: هوت كوتور):</label>
                      <input
                        type="text"
                        value={bannerTag}
                        onChange={(e) => setBannerTag(e.target.value)}
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">القسم المرتبط عند النقر:</label>
                      <select
                        value={bannerCategory}
                        onChange={(e) => setBannerCategory(e.target.value as ProductCategory)}
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111] cursor-pointer"
                      >
                        {ALL_CATEGORY_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#444444] font-bold mb-1">الوصف الفرعي للمربع:</label>
                    <textarea
                      rows={2}
                      value={bannerSubtitle}
                      onChange={(e) => setBannerSubtitle(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>

                  {/* Device Image Upload for Banner */}
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#EDE8DC] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[#111111] block flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-[#8B6B3F]" />
                          رفع صورة المربع الإعلاني من جهازك (كمبيوتر / هاتف):
                        </strong>
                        <span className="text-[11px] text-[#666666]">
                          يمكنك اختيار صورة من جهازك مباشرة وسيتم عرضها في المربع العلوي فوراً
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBannerUrlInput(!showBannerUrlInput)}
                        className="text-[11px] text-[#8B6B3F] hover:underline cursor-pointer"
                      >
                        {showBannerUrlInput ? 'إخفاء خيار الرابط' : 'أو إدخال رابط خارجي (URL)'}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border-2 border-dashed border-[#D5CFC7] hover:border-[#111111] transition-colors">
                      <input
                        type="file"
                        id="banner-device-image-input"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleBannerImageFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="banner-device-image-input"
                        className="flex flex-col items-center justify-center gap-2 px-6 py-4 bg-[#FAF9F6] hover:bg-[#F2EFE9] border border-[#D5CFC7] rounded-xl cursor-pointer transition-all w-full sm:w-auto shrink-0 text-center"
                      >
                        <Upload className="w-6 h-6 text-[#111111]" />
                        <span className="font-bold text-xs text-[#111111]">اختيار صورة من الجهاز</span>
                        <span className="text-[10px] text-[#777777]">JPG, PNG, WebP</span>
                      </label>

                      <div className="flex-1 text-center sm:text-right space-y-1">
                        {bannerUploadLoading ? (
                          <span className="text-xs text-[#8B6B3F] font-semibold animate-pulse">جاري معالجة الصورة وتحميلها...</span>
                        ) : bannerImage ? (
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-16 rounded-lg overflow-hidden border-2 border-[#C5A880] shadow-sm shrink-0 bg-gray-50">
                              <img src={bannerImage} alt="معاينة المربع" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-[#2E7D32] block flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                تم تجهيز صورة المربع
                              </span>
                              <span className="text-[10px] text-[#888888] block truncate max-w-[220px]">
                                {bannerImageFileName || 'صورة مخصصة لمربع العرض'}
                              </span>
                              <label
                                htmlFor="banner-device-image-input"
                                className="text-[11px] text-[#8B6B3F] hover:underline cursor-pointer block mt-1"
                              >
                                استبدال بصورة أخرى من الجهاز
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#888888] text-[11px]">
                            لم يتم اختيار صورة. انقر على الزر لاختيار صورة من جهازك.
                          </div>
                        )}
                      </div>
                    </div>

                    {showBannerUrlInput && (
                      <div className="pt-2 border-t border-[#EFECE6]">
                        <label className="block text-[11px] text-[#555555] mb-1">أو أدخل رابط/مسار الصورة يدوياً:</label>
                        <input
                          type="text"
                          value={bannerImage}
                          onChange={(e) => {
                            setBannerImage(e.target.value);
                            setBannerImageFileName('');
                          }}
                          placeholder="/src/assets/images/... أو https://..."
                          className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111] font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Preview of the Banner */}
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#EDE8DC]">
                    <span className="text-[11px] font-bold text-[#666666] block mb-2">معاينة مباشرة لشكل المربع أعلى الشاشة:</span>
                    <div className="relative h-40 rounded-xl overflow-hidden bg-black text-white p-4 flex flex-col justify-end max-w-md">
                      <img src={bannerImage || '/src/assets/images/banner_haute_couture_1793594467846.jpg'} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      <div className="relative z-10 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#E5D3B3] font-bold">{bannerTag || 'عرض خاص'}</span>
                          <span className="bg-[#C5A880] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{bannerBadgeText || 'خصم 20%'}</span>
                        </div>
                        <h5 className="font-bold text-sm text-white">{bannerTitle || 'عنوان العرض'}</h5>
                        <p className="text-[11px] text-gray-200 line-clamp-1">{bannerSubtitle || 'تفاصيل العرض'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {editingBanner ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(editingBanner.id, bannerTitle)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-[#A34E36] text-[#A34E36] hover:bg-[#FFEBEE] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف هذا المربع</span>
                      </button>
                    ) : <div />}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingBanner(false);
                          setEditingBanner(null);
                        }}
                        className="px-4 py-2 border border-[#D5CFC7] rounded-lg text-xs hover:bg-[#F2EFE9] cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-[#333333] transition-colors cursor-pointer shadow-sm"
                      >
                        حفظ مربع العرض
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Banners List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {banners.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-[#DCD5C9] overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 bg-gray-100">
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                      <span className="absolute top-3 right-3 bg-[#111111] text-[#E5D3B3] text-[10px] font-bold px-2 py-1 rounded">
                        {b.badgeText}
                      </span>
                      <span className="absolute bottom-3 right-3 bg-black/60 text-white backdrop-blur-sm text-[10px] px-2 py-0.5 rounded">
                        القسم: {b.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5 text-xs">
                      <span className="text-[10px] text-[#C5A880] font-bold block">{b.tag}</span>
                      <h4 className="font-bold text-sm text-[#111111] line-clamp-1">{b.title}</h4>
                      <p className="text-[11px] text-[#777777] line-clamp-2">{b.subtitle}</p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#EFECE6] bg-[#FAF9F6] flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={b.isActive}
                        onChange={() => handleToggleBannerActive(b.id)}
                        className="accent-[#111111]"
                      />
                      <span>{b.isActive ? 'مفعّل' : 'معطّل'}</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditBanner(b)}
                        className="p-1.5 rounded hover:bg-[#EAE6DE] text-[#111111] cursor-pointer"
                        title="تعديل المربع"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id, b.title)}
                        className="p-1.5 rounded hover:bg-[#FFEBEE] text-[#A34E36] cursor-pointer"
                        title="حذف المربع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Products & Staff Rating */}
        {currentTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-[#111111]">إدارة المنتجات، الأسعار، وتقييم المشرف</h3>
                <p className="text-xs text-[#777777]">إمكانية إضافة منتجات جديدة لأي من الأقسام وتعديل الأسعار والمواصفات</p>
              </div>

              <button
                onClick={startCreateProduct}
                className="flex items-center gap-2 bg-[#111111] text-white hover:bg-[#333333] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {/* Product Edit/Create Form */}
            {(isCreatingProduct || editingProduct) && (
              <div className="bg-white p-6 rounded-2xl border-2 border-[#111111] shadow-lg animate-fade-in space-y-4">
                <div className="flex justify-between items-center border-b border-[#EFECE6] pb-3">
                  <h4 className="font-bold text-sm text-[#111111]">
                    {isCreatingProduct ? 'إضافة منتج جديد إلى المتجر' : `تعديل المنتج: ${prodTitle}`}
                  </h4>
                  <button
                    onClick={() => {
                      setIsCreatingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  {/* Automatic Product Code (SKU) */}
                  <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE8DC] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111111] mb-0.5">
                        كود المنتج التلقائي (Product Code / SKU) *:
                      </label>
                      <span className="text-[10px] text-[#777777]">
                        يتم إنشاؤه تلقائياً لكل منتج جديد لتمييزه وتتبعه في الفواتير والطلبات وسلة الواتساب
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={prodCode}
                        onChange={(e) => setProdCode(e.target.value)}
                        required
                        placeholder="مثال: IN-8492"
                        className="w-36 bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#111111] uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setProdCode(generateAutoProductCode())}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#C5A880] text-[#111111] hover:bg-[#F5EFE6] rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                        title="توليد كود عشوائي جديد"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>توليد كود تلقائي جديد</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[#444444] font-bold mb-1">اسم المنتج *:</label>
                      <input
                        type="text"
                        value={prodTitle}
                        onChange={(e) => setProdTitle(e.target.value)}
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">القسم الرئيسي *:</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111] cursor-pointer"
                      >
                        {ALL_CATEGORY_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">السعر بالريال السعودي (SAR) *:</label>
                      <input
                        type="number"
                        min="1"
                        value={prodPriceSAR}
                        onChange={(e) => setProdPriceSAR(Number(e.target.value))}
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111] font-mono font-bold"
                      />
                      <span className="text-[11px] text-[#777777]">
                        يعادل: {(prodPriceSAR * settings.yerToSarRate).toLocaleString()} ر.ي
                      </span>
                    </div>

                    <div>
                      <label className="block text-[#444444] font-bold mb-1">السعر الأصلي قبل الخصم (اختياري):</label>
                      <input
                        type="number"
                        value={prodOriginalPriceSAR || ''}
                        onChange={(e) => setProdOriginalPriceSAR(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="مثال: 450"
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#444444] font-bold mb-1">القسم الفرعي أو الوصف المختصر:</label>
                      <input
                        type="text"
                        value={prodSubCategory}
                        onChange={(e) => setProdSubCategory(e.target.value)}
                        placeholder="مثال: عطور فرنسية، ملابس صوفية..."
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                      />
                    </div>
                  </div>

                  {/* Custom Product Badge Input (User request: Control sale/limited badge texts) */}
                  <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE8DC] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#444444] font-bold text-xs">
                        شارة العرض الترويجي للمنتج (Custom Badge Text):
                      </label>
                      <span className="text-[10px] text-[#777777]">تظهر كشريط مميز على صورة المنتج</span>
                    </div>
                    <input
                      type="text"
                      value={prodCustomBadge}
                      onChange={(e) => setProdCustomBadge(e.target.value)}
                      placeholder="مثال: عرض محدود ⏳ أو خصم 30% أو الأكثر طلباً 👑..."
                      className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111]"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-[#666666] font-semibold">شارات سريعة:</span>
                      {['عرض محدود ⏳', 'خصم 25% 🔥', 'الأكثر طلباً 👑', 'وصل حديثاً ✨', 'كمية محدودة ⚡', 'هوت كوتور 💎'].map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setProdCustomBadge(bg)}
                          className="px-2 py-0.5 bg-white border border-[#DDD6CE] hover:border-[#111111] text-[10px] rounded text-[#333333] cursor-pointer"
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Sizes Selection (S, M, L, XL, XXL, 3XL, 4XL) */}
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#EDE8DC] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong className="text-xs font-bold text-[#111111] block flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#8B6B3F]" />
                          تحديد المقاسات المتوفرة للمنتج (s m l xl xxl 3xl 4xl):
                        </strong>
                        <span className="text-[11px] text-[#666666]">
                          اضغط على المقاس لتفعيله أو إلغائه (المقاسات المحددة ستظهر للعملاء للاختيار والشراء)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllProdSizes}
                          className="text-[11px] px-2.5 py-1 bg-white border border-[#D5CFC7] hover:border-[#111111] rounded-md font-medium text-[#222222] cursor-pointer"
                        >
                          تحديد كافة المقاسات
                        </button>
                        <button
                          type="button"
                          onClick={selectStandardProdSizes}
                          className="text-[11px] px-2.5 py-1 bg-white border border-[#D5CFC7] hover:border-[#111111] rounded-md font-medium text-[#222222] cursor-pointer"
                        >
                          المقاسات الأساسية (S - XL)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {ADMIN_AVAILABLE_SIZES.map((sz) => {
                        const isSelected = prodSelectedSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleProdSize(sz)}
                            className={`min-w-12 h-10 px-3.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                              isSelected
                                ? 'bg-[#111111] text-white border-[#C5A880] shadow-sm ring-1 ring-[#C5A880]'
                                : 'bg-white text-[#555555] border-[#D5CFC7] hover:border-[#111111]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A880]" />}
                            <span>{sz}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      المقاسات المحددة لهذا المنتج: <span className="font-bold text-[#111111]">{prodSelectedSizes.join(' ، ')}</span>
                    </div>
                  </div>

                  {/* Device Image Upload Zone */}
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#EDE8DC] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[#111111] block flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-[#8B6B3F]" />
                          رفع صورة المنتج من على جهازك (كمبيوتر / هاتف):
                        </strong>
                        <span className="text-[11px] text-[#666666]">
                          يمكنك اختيار ورفع الصورة مباشرة من ألبوم الصور أو ملفات جهازك
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-[11px] text-[#8B6B3F] hover:underline cursor-pointer"
                      >
                        {showUrlInput ? 'إخفاء خيار الرابط' : 'أو إدخال رابط خارجي (URL)'}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border-2 border-dashed border-[#D5CFC7] hover:border-[#111111] transition-colors">
                      <input
                        type="file"
                        id="product-device-image-input"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      
                      <label
                        htmlFor="product-device-image-input"
                        className="flex flex-col items-center justify-center gap-2 px-6 py-4 bg-[#FAF9F6] hover:bg-[#F2EFE9] border border-[#D5CFC7] rounded-xl cursor-pointer transition-all w-full sm:w-auto shrink-0 text-center"
                      >
                        <Upload className="w-6 h-6 text-[#111111]" />
                        <span className="font-bold text-xs text-[#111111]">اختيار صورة من الجهاز</span>
                        <span className="text-[10px] text-[#777777]">JPG, PNG, WebP</span>
                      </label>

                      <div className="flex-1 text-center sm:text-right space-y-1">
                        {imageUploadLoading ? (
                          <span className="text-xs text-[#8B6B3F] font-semibold animate-pulse">جاري معالجة الصورة وتحميلها...</span>
                        ) : prodImageUrl ? (
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-[#C5A880] shadow-sm shrink-0 bg-gray-50">
                              <img src={prodImageUrl} alt="معاينة" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-[#2E7D32] block flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                تم تجهيز الصورة بنجاح
                              </span>
                              <span className="text-[10px] text-[#888888] block truncate max-w-[220px]">
                                {prodImageFileName || 'صورة مخصصة للمنتج'}
                              </span>
                              <label
                                htmlFor="product-device-image-input"
                                className="text-[11px] text-[#8B6B3F] hover:underline cursor-pointer block mt-1"
                              >
                                استبدال بصورة أخرى من الجهاز
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#888888] text-[11px]">
                            لم يتم اختيار صورة بعد. انقر على الزر لرفع صورة للمنتج من جهازك مباشرة.
                          </div>
                        )}
                      </div>
                    </div>

                    {showUrlInput && (
                      <div className="pt-2 border-t border-[#EFECE6]">
                        <label className="block text-[11px] text-[#555555] mb-1">أو أدخل رابط/مسار الصورة يدوياً:</label>
                        <input
                          type="text"
                          value={prodImageUrl}
                          onChange={(e) => {
                            setProdImageUrl(e.target.value);
                            setProdImageFileName('');
                          }}
                          placeholder="/src/assets/images/... أو https://..."
                          className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111] font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#444444] font-bold mb-1">وصف المنتج:</label>
                    <textarea
                      rows={2}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>

                  {/* Admin Rating Customization */}
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#EDE8DC] space-y-3">
                    <strong className="text-xs font-bold text-[#111111] block flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-[#8B6B3F] fill-[#8B6B3F]" />
                      التقييم الممنوح للمنتج من قبل مشرف التطبيق:
                    </strong>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-[#555555] mb-1">درجة التقييم (من 10):</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="10"
                          value={prodAdminScore}
                          onChange={(e) => setProdAdminScore(Number(e.target.value))}
                          className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#555555] mb-1">شارة التوثيق:</label>
                        <input
                          type="text"
                          value={prodAdminBadge}
                          onChange={(e) => setProdAdminBadge(e.target.value)}
                          className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#555555] mb-1">ملاحظات وشهادة فحص المشرف للعميل:</label>
                      <input
                        type="text"
                        value={prodAdminNotes}
                        onChange={(e) => setProdAdminNotes(e.target.value)}
                        placeholder="تم فحص ومطابقة المقاس والخامة بنجاح..."
                        className="w-full bg-white border border-[#D5CFC7] rounded-lg px-3 py-1.5 text-xs text-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {editingProduct ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(editingProduct.id, prodTitle)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-[#A34E36] text-[#A34E36] hover:bg-[#FFEBEE] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف هذا المنتج نهائياً</span>
                      </button>
                    ) : <div />}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingProduct(false);
                          setEditingProduct(null);
                        }}
                        className="px-4 py-2 border border-[#D5CFC7] rounded-lg text-xs hover:bg-[#F2EFE9] cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-[#333333] transition-colors cursor-pointer shadow-sm"
                      >
                        {isCreatingProduct ? 'إضافة المنتج إلى المتجر' : 'حفظ التعديلات على المنتج'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#DCD5C9] overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E4DD] text-[#555555] font-semibold">
                  <tr>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">السعر (ر.س)</th>
                    <th className="p-3.5">تقييم المشرف</th>
                    <th className="p-3.5">المقاسات</th>
                    <th className="p-3.5 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF9F6]">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="w-10 h-12 rounded object-cover bg-[#F7F5F0]" />
                        <div>
                          <span className="font-bold text-[#111111] block">{p.title}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="bg-[#111111] text-[#E5D3B3] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {p.code || ('IN-' + p.id.slice(-4).toUpperCase())}
                            </span>
                            <span className="text-[10px] text-[#888888] font-mono">ID: {p.id.slice(0, 10)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-[#555555]">{p.subCategory || p.category}</td>
                      <td className="p-3.5 font-mono font-bold text-[#111111] tabular-nums">
                        {p.priceSAR} ر.س
                      </td>
                      <td className="p-3.5">
                        <span className="bg-[#111111] text-[#E5D3B3] px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                          ⭐ {p.adminRating?.score || 9.8}/10
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#666666]">
                        {p.availableSizes.join(', ')}
                      </td>
                      <td className="p-3.5 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEditProduct(p)}
                            className="p-1.5 rounded hover:bg-[#F2EFE9] text-[#111111] cursor-pointer"
                            title="تعديل السعر والمواصفات"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.title)}
                            className="p-1.5 rounded hover:bg-[#FFEBEE] text-[#A34E36] cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Bank Accounts Management (Full Admin Power: Banks, Accounts, IBAN, Notes) */}
        {currentTab === 'banks' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#8B6B3F]" />
                  <span>إدارة الحسابات البنكية والإيداع (اليمن والسعودية)</span>
                </h3>
                <p className="text-xs text-[#777777]">
                  تحكم كامل بإضافة وتعديل وحذف حسابات البنوك (الكريمي، التضامن، القطيبي، الراجحي، إلخ) وأرقام الحسابات
                </p>
              </div>

              <button
                onClick={startCreateBank}
                className="flex items-center gap-2 bg-[#111111] text-white hover:bg-[#333333] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>إضافة حساب بنكي جديد</span>
              </button>
            </div>

            {/* Bank Form (Add or Edit) */}
            {(isCreatingBank || editingBank) && (
              <div className="bg-white p-6 rounded-2xl border-2 border-[#111111] shadow-lg animate-fade-in space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
                  <h4 className="font-bold text-sm text-[#111111] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#8B6B3F]" />
                    <span>{isCreatingBank ? 'إضافة حساب بنكي جديد' : `تعديل الحساب: ${editingBank?.bankName}`}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingBank(false);
                      setEditingBank(null);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[#666666] font-semibold text-[11px]">بنوك مقترحة شائعة:</span>
                  {[
                    'بنك الكريمي للتمويل الأصغر الإسلامي',
                    'بنك التضامن الإسلامي',
                    'بنك القطيبي الإسلامي',
                    'بنك اليمن والكويت (YKB)',
                    'مصرف الراجحي (السعودية)',
                    'البنك الأهلي السعودي (SNB)'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBankNameInput(preset)}
                      className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD6CE] hover:border-[#111111] text-[11px] font-medium rounded-lg text-[#333333] cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">اسم البنك *:</label>
                      <input
                        type="text"
                        value={bankNameInput}
                        onChange={(e) => setBankNameInput(e.target.value)}
                        placeholder="مثال: بنك الكريمي أو بنك التضامن..."
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs font-bold text-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#444444] font-bold mb-1">اسم صاحب الحساب (المستفيد) *:</label>
                      <input
                        type="text"
                        value={bankAccountNameInput}
                        onChange={(e) => setBankAccountNameInput(e.target.value)}
                        placeholder="مثال: متجر I in للتجارة أو اسمك الشخصي..."
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">رقم الحساب البنكي *:</label>
                      <input
                        type="text"
                        value={bankAccountNumberInput}
                        onChange={(e) => setBankAccountNumberInput(e.target.value)}
                        placeholder="مثال: 3008942155 أو رقم الآيبان..."
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#444444] font-bold mb-1">رقم الآيبان الدولي (IBAN) - اختياري:</label>
                      <input
                        type="text"
                        value={bankIbanInput}
                        onChange={(e) => setBankIbanInput(e.target.value)}
                        placeholder="YE45TADH... أو SA..."
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs font-mono text-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">العملات المقبولة:</label>
                      <input
                        type="text"
                        value={bankCurrencyInput}
                        onChange={(e) => setBankCurrencyInput(e.target.value)}
                        placeholder="ريال يمني (ر.ي) / ريال سعودي (ر.س)..."
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bankIsActiveInput}
                          onChange={(e) => setBankIsActiveInput(e.target.checked)}
                          className="w-4 h-4 accent-[#111111]"
                        />
                        <span>تفعيل ظهور الحساب في صفحة الدفع وسلة التسوق</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#444444] font-bold mb-1">تعليمات وتوجيهات الإيداع للعميل:</label>
                    <textarea
                      rows={2}
                      value={bankNotesInput}
                      onChange={(e) => setBankNotesInput(e.target.value)}
                      placeholder="مثال: يرجى كتابة رقم الطلب في خانة الملاحظات وإرفاق صورة السند عبر الواتساب..."
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EFECE6]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingBank(false);
                        setEditingBank(null);
                      }}
                      className="px-4 py-2 border border-[#D5CFC7] rounded-xl text-xs hover:bg-[#F2EFE9] cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#111111] text-white rounded-xl text-xs font-bold hover:bg-[#333333] transition-colors cursor-pointer shadow-sm"
                    >
                      {isCreatingBank ? 'حفظ وإضافة الحساب' : 'حفظ التعديلات'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Banks List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  className="bg-white p-5 rounded-2xl border border-[#DCD5C9] shadow-sm flex flex-col justify-between space-y-4 hover:border-[#8B6B3F] transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#DDD6CE] flex items-center justify-center text-[#8B6B3F]">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#111111]">{bank.bankName}</h4>
                          <span className="text-[11px] text-[#777777]">{bank.currency}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          bank.isActive !== false ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                        }`}>
                          {bank.isActive !== false ? 'مفعل بالسلة' : 'معطل'}
                        </span>
                        <button
                          onClick={() => handleToggleBankActive(bank.id)}
                          className="text-[10px] text-[#888888] hover:text-[#111111] underline cursor-pointer"
                          title="تغيير الحالة"
                        >
                          تبديل
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE8DC] space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[#444444]">
                        <span>اسم الحساب:</span>
                        <strong className="text-[#111111] font-bold">{bank.accountName}</strong>
                      </div>

                      <div className="flex justify-between items-center text-[#444444] pt-1 border-t border-[#EFECE6]">
                        <span>رقم الحساب:</span>
                        <span className="font-mono font-bold text-[#111111] text-sm">{bank.accountNumber}</span>
                      </div>

                      {bank.iban && (
                        <div className="flex justify-between items-center text-[#444444] pt-1 border-t border-[#EFECE6]">
                          <span>IBAN:</span>
                          <span className="font-mono text-[10px] text-gray-700">{bank.iban}</span>
                        </div>
                      )}
                    </div>

                    {bank.notes && (
                      <p className="text-[11px] text-[#666666] bg-white p-2 rounded-lg border border-[#EFECE6]">
                        {bank.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFECE6]">
                    <button
                      onClick={() => startEditBank(bank)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#FAF8F5] text-[#111111] hover:bg-[#EAE6DE] rounded-lg text-xs font-semibold border border-[#D5CFC7] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#8B6B3F]" />
                      <span>تعديل الحساب</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBank(bank.id, bank.bankName)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#FFEBEE] text-[#A34E36] hover:bg-[#FFCDD2] rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Customer Reviews Moderation (User request: Admin can delete reviews) */}
        {currentTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#8B6B3F]" />
                  <span>إدارة التعليقات والتقييمات وحذفها</span>
                </h3>
                <p className="text-xs text-[#777777]">
                  مراقبة آراء العملاء في المتجر، وحذف أي تعليق غير لائق أو سبام فورياً
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#D5CFC7] rounded-xl px-3 py-1.5 text-xs">
                <span>إجمالي التعليقات:</span>
                <span className="font-bold font-mono text-[#8B6B3F]">{reviews.length}</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#DCD5C9] p-12 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto" />
                <h4 className="font-bold text-sm text-[#111111]">لا توجد تعليقات حتى الآن</h4>
                <p className="text-xs text-gray-500">ستظهر هنا أي تقييمات يكتبها العملاء على المنتجات.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white p-5 rounded-2xl border border-[#DCD5C9] shadow-sm flex flex-col justify-between space-y-3 hover:border-[#8B6B3F] transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-xs font-bold text-[#111111] block">{rev.authorName}</strong>
                          <span className="text-[10px] text-[#888888] font-mono">{rev.date}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[#C5A880]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-[#C5A880] text-[#C5A880]' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.sizePurchased && (
                        <div className="flex items-center gap-2 text-[10px] text-[#666666]">
                          <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EDE8DC]">
                            المقاس: {rev.sizePurchased}
                          </span>
                          {rev.heightWeight && (
                            <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EDE8DC]">
                              {rev.heightWeight}
                            </span>
                          )}
                          {rev.verifiedPurchase && (
                            <span className="text-[#2E7D32] font-semibold">✓ عملية شراء موثقة</span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-[#333333] leading-relaxed bg-[#FAF9F6] p-3 rounded-xl border border-[#EDE8DC]">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6] text-xs">
                      <span className="text-[11px] text-[#888888]">
                        إعجابات: {rev.helpfulCount || 0}
                      </span>

                      <button
                        onClick={() => handleDeleteReview(rev.id, rev.authorName)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFEBEE] text-[#A34E36] hover:bg-[#FFCDD2] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        title="حذف هذا التعليق نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف التعليق</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Coupons and VIP Codes */}
        {currentTab === 'coupons' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#8B6B3F]" />
                  <span>إدارة كوبونات الخصم والكوبونات الخاصة VIP</span>
                </h3>
                <p className="text-xs text-[#777777]">
                  إنشاء وتخصيص كوبونات للمؤثرين والعملاء المميزين وتحديد نسب وقيم الخصم
                </p>
              </div>

              <button
                onClick={() => setIsCreatingCoupon(!isCreatingCoupon)}
                className="flex items-center gap-2 bg-[#111111] text-white hover:bg-[#333333] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>{isCreatingCoupon ? 'إغلاق النموذج' : 'إضافة كوبون جديد'}</span>
              </button>
            </div>

            {isCreatingCoupon && (
              <div className="bg-white p-6 rounded-2xl border-2 border-[#111111] shadow-lg animate-fade-in space-y-4">
                <h4 className="font-bold text-sm text-[#111111]">إنشاء كود خصم جديد للمتجر أو للمؤثرين:</h4>
                <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">كود الكوبون *:</label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="مثال: VIP50 أو INFLUENCER20"
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">نوع الخصم:</label>
                      <select
                        value={couponDiscountType}
                        onChange={(e) => setCouponDiscountType(e.target.value as any)}
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="percentage">نسبة مئوية (%)</option>
                        <option value="fixed">مبلغ ثابت بالريال السعودي (ر.س)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">قيمة الخصم *:</label>
                      <input
                        type="number"
                        min="1"
                        value={couponDiscountValue}
                        onChange={(e) => setCouponDiscountValue(Number(e.target.value))}
                        required
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">الحد الأدنى للطلب (ر.س):</label>
                      <input
                        type="number"
                        min="0"
                        value={couponMinSpend}
                        onChange={(e) => setCouponMinSpend(Number(e.target.value))}
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#444444] font-bold mb-1">وصف الكوبون:</label>
                      <input
                        type="text"
                        value={couponDesc}
                        onChange={(e) => setCouponDesc(e.target.value)}
                        placeholder="خصم خاص لمتابعي المؤثر..."
                        className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8DC] flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-[#111111] block flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-[#D4AF37]" />
                        كوبون خاص VIP / سري:
                      </strong>
                      <span className="text-[11px] text-[#777777]">
                        تخصيص هذا الكوبون للمشاهير وكبار العملاء فقط
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={couponIsVIP}
                      onChange={(e) => setCouponIsVIP(e.target.checked)}
                      className="w-5 h-5 accent-[#8B6B3F] cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingCoupon(false)}
                      className="px-4 py-2 border border-[#D5CFC7] rounded-lg text-xs"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-[#333333] cursor-pointer"
                    >
                      حفظ وتفعيل الكوبون
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.code} className="bg-white p-5 rounded-2xl border border-[#DCD5C9] shadow-sm space-y-3 relative overflow-hidden">
                  {c.isPrivateVIP && (
                    <span className="absolute top-0 left-0 bg-[#D4AF37] text-[#111111] text-[10px] font-bold px-3 py-0.5 rounded-br-lg flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      VIP
                    </span>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-base font-bold bg-[#FAF8F5] border border-[#D5CFC7] px-3 py-1 rounded-lg text-[#111111]">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-[#8B6B3F]">
                      {c.discountType === 'percentage' ? `${c.discountValue}% خصم` : `${c.discountValue} ر.س خصم`}
                    </span>
                  </div>
                  <p className="text-xs text-[#555555] leading-snug">{c.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#888888] pt-2 border-t border-[#EFECE6]">
                    <span>الحد الأدنى: {c.minSpendSAR || 0} ر.س</span>
                    <button
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="text-[#A34E36] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Orders Logistics */}
        {currentTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-base font-bold text-[#111111]">متابعة وإدارة الطلبات الواردة</h3>
                <p className="text-xs text-[#777777]">الطلبات المستلمة عبر رسائل الواتساب والإيداع البنكي</p>
              </div>
              <span className="text-xs font-mono bg-[#111111] text-white px-3 py-1 rounded-full">
                إجمالي الطلبات: {orders.length}
              </span>
            </div>

            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white p-5 rounded-2xl border border-[#DCD5C9] space-y-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFECE6] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm bg-[#111111] text-white px-2.5 py-1 rounded">
                        {ord.orderNumber}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-[#111111] block">
                          {ord.customerName} ({ord.customerPhone})
                        </span>
                        <span className="text-[11px] text-[#777777]">
                          {ord.customerCity} - {ord.customerAddress || 'عنوان قياسي'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#666666]">تغيير الحالة:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className="bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg px-2.5 py-1 text-xs font-bold text-[#111111] cursor-pointer"
                      >
                        <option value="pending_confirmation">بانتظار التأكيد (Pending)</option>
                        <option value="processing">جاري التحضير (Processing)</option>
                        <option value="shipped">تم الشحن (Shipped)</option>
                        <option value="out_for_delivery">قيد التوصيل (Out for delivery)</option>
                        <option value="delivered">تم الاستلام (Delivered)</option>
                        <option value="cancelled">ملغي (Cancelled)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-[#555555]">
                    <div>
                      <span>طريقة الدفع: <strong>{ord.paymentMethod === 'bank_deposit' ? `إيداع بنكي (${ord.depositBank})` : 'طلب عبر الواتساب'}</strong></span>
                      {ord.depositNotes && <span className="mr-3 text-[#8B6B3F]">ملاحظات: {ord.depositNotes}</span>}
                    </div>

                    <span className="font-bold text-[#111111] text-sm font-mono tabular-nums">
                      الإجمالي: {formatCurrencyLabel(ord.total, ord.currency || 'SAR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: KPIs */}
        {currentTab === 'kpis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] shadow-sm">
                <span className="text-xs text-[#777777] block">إجمالي المبيعات المؤكدة</span>
                <span className="text-2xl font-bold font-mono text-[#111111] mt-1 block tabular-nums">
                  {totalRevenueSAR.toLocaleString()} ر.س
                </span>
                <span className="text-[10px] text-[#2E7D32] mt-1 block">
                  يعادل {(totalRevenueSAR * settings.yerToSarRate).toLocaleString()} ر.ي
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] shadow-sm">
                <span className="text-xs text-[#777777] block">إجمالي عدد الطلبات</span>
                <span className="text-2xl font-bold font-mono text-[#111111] mt-1 block tabular-nums">
                  {orders.length}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DCD5C9] shadow-sm">
                <span className="text-xs text-[#777777] block">رسوم الشحن المعتمدة الحالية</span>
                <span className="text-2xl font-bold font-mono text-[#8B6B3F] mt-1 block tabular-nums">
                  {settings.shippingFeeSAR} ر.س
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Notifications */}
        {currentTab === 'notifications' && (
          <div className="bg-white p-6 rounded-2xl border border-[#DCD5C9] shadow-sm space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-[#111111]">محرك الإشعارات الفورية للعملاء</h3>
            <p className="text-xs text-[#777777]">
              إرسال عروض خاصة أو تنبيهات بالنقاط أو الكوبونات أو الهوت كوتور وتظهر فوراً للمتسوقين
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!notifText.trim()) return;
                onBroadcastNotification(notifText.trim());
                onAddAuditLog(createAuditLogEntry('إرسال إشعار فوري', 'كافة العملاء', notifText));
                setNotifSuccess(true);
                setNotifText('');
                setTimeout(() => setNotifSuccess(false), 3000);
              }}
              className="space-y-3 text-xs"
            >
              <textarea
                rows={3}
                value={notifText}
                onChange={(e) => setNotifText(e.target.value)}
                placeholder="اكتب التنبيه أو العرض الخاص بالريال اليمني أو السعودي..."
                required
                className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg p-3 text-xs text-[#111111]"
              />
              <button
                type="submit"
                className="bg-[#111111] text-white hover:bg-[#333333] px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                بث التنبيه لجميع الزوار
              </button>
              {notifSuccess && (
                <p className="text-xs text-[#2E7D32] font-semibold">✓ تم بث الإشعار بنجاح للواجهة.</p>
              )}
            </form>
          </div>
        )}

        {/* Tab: Audit Logs */}
        {currentTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-[#DCD5C9] overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E8E4DD] text-[#555555]">
                <tr>
                  <th className="p-3.5">الإجراء</th>
                  <th className="p-3.5">الهدف</th>
                  <th className="p-3.5">التفاصيل</th>
                  <th className="p-3.5">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3.5 font-bold text-[#111111]">{l.action}</td>
                    <td className="p-3.5 text-[#555555]">{l.target}</td>
                    <td className="p-3.5 text-[#666666] font-mono text-[11px]">{l.details}</td>
                    <td className="p-3.5 text-[#888888] font-mono text-[11px]">
                      {new Date(l.timestamp).toLocaleString('ar-YE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Cloud Database (Firebase Firestore) */}
        {currentTab === 'cloud' && (
          <div className="space-y-6 max-w-4xl">
            {/* Header & Status Card */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#DCD5C9] shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFECE6] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF6F0] border border-[#C5A880]/30 flex items-center justify-center text-[#8B6B3F]">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                      <span>الربط السحابي والمزامنة الحية (Firebase Firestore)</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        isCloudActive 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isCloudActive ? '✓ متصل بالسحابة (مزامنة فورية حية)' : 'يعمل بالوضع المحلي الآمن'}
                      </span>
                    </h3>
                    <p className="text-xs text-[#777777] mt-0.5">
                      ربط المتجر بقاعدة بيانات Firebase مجانية بنسبة 100% لمزامنة المنتجات والأسعار بين كل الأجهزة فورياً.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestCloudConnection}
                    disabled={cloudTesting}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF8F5] text-[#8B6B3F] hover:bg-[#F2EFE9] rounded-xl text-xs font-bold border border-[#E5DFD7] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cloudTesting ? 'animate-spin' : ''}`} />
                    <span>{cloudTesting ? 'جاري الفحص...' : 'فحص واختبار الاتصال'}</span>
                  </button>
                </div>
              </div>

              {/* Status Details */}
              {isCloudActive ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">المزامنة السحابية مفعلة بنجاح!</p>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      أي منتج تضيفه أو تعدله أو تحذفه من جوالك أو حاسوبك يتم حفظه في قاعدة بيانات Firestore السحابية فورياً، وتظهر التحديثات لجميع العملاء والزوار في نفس اللحظة.
                      {cloudProjectId && <span className="block mt-1 font-mono text-[10px] text-emerald-700 font-semibold">المشروع الحالي: {cloudProjectId}</span>}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">المتجر يعمل حالياً بالوضع المحلي (Local Storage)</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      التعديلات محفوظة على هذا المتصفح. لربط جميع الأجهزة والزبائن معاً، اتبع الخطوات البسيطة أدناه لإنشاء حساب Firebase المجاني (Spark Plan) وإدخال المفاتيح.
                    </p>
                  </div>
                </div>
              )}

              {/* Feedback Alerts */}
              {cloudTestResult && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                  cloudTestResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}>
                  {cloudTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                  <span>{cloudTestResult.message}</span>
                </div>
              )}

              {cloudSaveMessage && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                  cloudSaveMessage.includes('✓') 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{cloudSaveMessage}</span>
                </div>
              )}

              {cloudSyncResult && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                  cloudSyncResult.includes('✓') 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}>
                  {cloudSyncResult.includes('✓') ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                  <span>{cloudSyncResult}</span>
                </div>
              )}

              {/* One-click Sync / Seed Button */}
              <div className="pt-2 border-t border-[#EFECE6] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">مزامنة المنتجات الحالية ({products.length} منتج)</h4>
                  <p className="text-[11px] text-[#777777]">
                    رفع كافة المنتجات المعروضة حالياً إلى قاعدة البيانات السحابية بضغطة زر واحدة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncAllToCloud}
                  disabled={cloudSyncing}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B6B3F] hover:bg-[#72562F] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Upload className={`w-3.5 h-3.5 ${cloudSyncing ? 'animate-bounce' : ''}`} />
                  <span>{cloudSyncing ? 'جاري الرفع والمزامنة...' : `مزامنة ${products.length} منتج إلى السحابة فوراً`}</span>
                </button>
              </div>
            </div>

            {/* Credentials Configuration Form */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#DCD5C9] shadow-sm space-y-5">
              <div className="border-b border-[#EFECE6] pb-3">
                <h4 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#8B6B3F]" />
                  <span>إدخال مفاتيح الربط (Firebase Config)</span>
                </h4>
                <p className="text-xs text-[#777777] mt-1">
                  يمكنك لصق كود الإعداد كاملاً من لوحة تحكم Firebase، أو إدخال الحقول يدوياً.
                </p>
              </div>

              <form onSubmit={handleSaveCloudConfig} className="space-y-4 text-xs">
                {/* Method 1: Raw JSON / Code Snippet */}
                <div className="space-y-1.5 bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E4DD]">
                  <label className="block text-xs font-bold text-[#111111]">
                    الطريقة السريعة: الصق كود (firebaseConfig) كاملاً هنا
                  </label>
                  <p className="text-[11px] text-[#777777]">
                    انسخ الكود الذي يظهر لك في Firebase Console وضعه هنا كما هو:
                  </p>
                  <textarea
                    rows={4}
                    value={rawJsonConfig}
                    onChange={(e) => setRawJsonConfig(e.target.value)}
                    placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "iin-store.firebaseapp.com",\n  projectId: "iin-store",\n  storageBucket: "iin-store.firebasestorage.app",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                    className="w-full bg-white border border-[#D5CFC7] rounded-lg p-2.5 font-mono text-[11px] text-[#111111] focus:ring-2 focus:ring-[#8B6B3F] focus:outline-none"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-2 my-2 text-xs text-[#888888] font-bold">
                  <div className="flex-1 h-px bg-[#E5DFD7]" />
                  <span>أو إدخال الحقول منفصلة</span>
                  <div className="flex-1 h-px bg-[#E5DFD7]" />
                </div>

                {/* Method 2: Individual Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#333333]">
                      مفتاح الواجهة (API Key) <span className="text-[#A34E36]">*</span>
                    </label>
                    <input
                      type="text"
                      value={cloudApiKey}
                      onChange={(e) => setCloudApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg p-2.5 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#333333]">
                      معرف المشروع (Project ID) <span className="text-[#A34E36]">*</span>
                    </label>
                    <input
                      type="text"
                      value={cloudProjectId}
                      onChange={(e) => setCloudProjectId(e.target.value)}
                      placeholder="iin-store-xxxx"
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg p-2.5 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#333333]">
                      معرف التطبيق (App ID)
                    </label>
                    <input
                      type="text"
                      value={cloudAppId}
                      onChange={(e) => setCloudAppId(e.target.value)}
                      placeholder="1:123456789:web:xxxx"
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg p-2.5 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#333333]">
                      نطاق المصادقة (Auth Domain)
                    </label>
                    <input
                      type="text"
                      value={cloudAuthDomain}
                      onChange={(e) => setCloudAuthDomain(e.target.value)}
                      placeholder="iin-store-xxxx.firebaseapp.com"
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg p-2.5 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#333333]">
                      سلة التخزين (Storage Bucket)
                    </label>
                    <input
                      type="text"
                      value={cloudStorageBucket}
                      onChange={(e) => setCloudStorageBucket(e.target.value)}
                      placeholder="iin-store-xxxx.firebasestorage.app"
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg p-2.5 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#333333]">
                      معرف المرسل (Messaging Sender ID)
                    </label>
                    <input
                      type="text"
                      value={cloudSenderId}
                      onChange={(e) => setCloudSenderId(e.target.value)}
                      placeholder="123456789012"
                      className="w-full bg-[#FAF9F6] border border-[#D5CFC7] rounded-lg p-2.5 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EFECE6]">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#111111] hover:bg-[#333333] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-[#C5A880]" />
                    <span>حفظ وتفعيل المزامنة الفورية</span>
                  </button>

                  {isCloudActive && (
                    <button
                      type="button"
                      onClick={handleClearCloud}
                      className="px-4 py-2 border border-[#D5CFC7] text-[#777777] hover:text-[#A34E36] hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      إلغاء الربط والرجوع للوضع المحلي
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Illustrated Setup Guide */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#DCD5C9] shadow-sm space-y-4">
              <div className="border-b border-[#EFECE6] pb-3">
                <h4 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8B6B3F]" />
                  <span>خطوات بسيطة للحصول على قاعدة البيانات المجانية (Spark Plan)</span>
                </h4>
                <p className="text-xs text-[#777777] mt-1">
                  خدمة Firebase من Google مجانية 100% بدون أي رسوم، وتمنحك 50,000 عملية قراءة يومياً.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DD] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-[#C5A880] text-xs font-bold flex items-center justify-center">1</span>
                    <strong className="text-[#111111]">فتح Firebase Console</strong>
                  </div>
                  <p className="text-[#555555] text-[11px] leading-relaxed">
                    توجه إلى موقع <strong>console.firebase.google.com</strong> وسجل الدخول بحساب Google العادي الخاص بك.
                  </p>
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#8B6B3F] hover:underline font-bold"
                  >
                    <span>فتح رابط Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DD] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-[#C5A880] text-xs font-bold flex items-center justify-center">2</span>
                    <strong className="text-[#111111]">إنشاء مشروع جديد (Add Project)</strong>
                  </div>
                  <p className="text-[#555555] text-[11px] leading-relaxed">
                    اضغط على زر <strong>Add project</strong> واختر اسماً للمتجر مثل <span className="font-mono text-[#8B6B3F]">i-in-store</span>. اختر الخطة الافتراضية المجانية <strong>Spark Plan (Free)</strong>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DD] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-[#C5A880] text-xs font-bold flex items-center justify-center">3</span>
                    <strong className="text-[#111111]">تفعيل قاعدة بيانات Firestore</strong>
                  </div>
                  <p className="text-[#555555] text-[11px] leading-relaxed">
                    من القائمة الجانبية اختر <strong>Build &gt; Firestore Database</strong> ثم اضغط <strong>Create database</strong>. اختر الوضع <strong>Start in test mode</strong> وحدد أقرب منطقة جغرافية.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DD] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-[#C5A880] text-xs font-bold flex items-center justify-center">4</span>
                    <strong className="text-[#111111]">نسخ كود الويب ولصقه هنا</strong>
                  </div>
                  <p className="text-[#555555] text-[11px] leading-relaxed">
                    اضغط على أيقونة الإعدادات ⚙️ أعلى اليسار (Project Settings) &gt; قسم Your apps &gt; اضغط على علامة الويب <strong>&lt;/&gt;</strong> وانسخ كائن <span className="font-mono">firebaseConfig</span> وضعه في المربع بالأعلى واضغط حفظ!
                  </p>
                </div>
              </div>

              {/* Firestore Rules Helper */}
              <div className="mt-4 p-4 rounded-xl bg-[#111111] text-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-[#C5A880]">قواعد الأمان الجاهزة (Firestore Rules):</strong>
                  <span className="text-[10px] text-gray-400">ملف firestore.rules موجود في المشروع</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  في Firebase Console &gt; Firestore Database &gt; تبويب Rules، الصق القواعد التالية لتسمح بالقراءة العامة والتعديل:
                </p>
                <pre className="bg-[#222222] p-3 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto text-left" dir="ltr">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Safe Deletion Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-2 border-[#111111] shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div className="flex items-center gap-2 text-[#A34E36] font-bold text-sm">
                <Trash2 className="w-5 h-5 text-[#A34E36]" />
                <span>
                  {itemToDelete.type === 'product' && 'تأكيد حذف المنتج'}
                  {itemToDelete.type === 'banner' && 'تأكيد حذف مربع العرض'}
                  {itemToDelete.type === 'coupon' && 'تأكيد حذف كود الخصم'}
                  {itemToDelete.type === 'bank' && 'تأكيد حذف الحساب البنكي'}
                  {itemToDelete.type === 'review' && 'تأكيد حذف تعليق العميل'}
                </span>
              </div>
              <button
                onClick={() => setItemToDelete(null)}
                className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#333333] leading-relaxed">
                هل أنت متأكد من رغبتك في حذف:
                <strong className="block text-sm text-[#111111] mt-1 font-bold">"{itemToDelete.title}"</strong>
              </p>
              <p className="text-[#888888] text-[11px] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EDE8DC]">
                ⚠️ هذا الإجراء سيقوم بإزالة العنصر فورياً من متجر I in وسجل العروض، ولن يتمكن الزوار من مشاهدته.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-[#D5CFC7] rounded-xl text-xs font-semibold hover:bg-[#F2EFE9] cursor-pointer"
              >
                إلغاء وتراجع
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 bg-[#A34E36] text-white rounded-xl text-xs font-bold hover:bg-[#823B27] cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، احذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
