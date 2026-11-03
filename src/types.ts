export type ProductCategory = 
  | 'all'
  | 'perfumes'      // العطور
  | 'makeup'        // makeup
  | 'apparel'       // الملابس العامة
  | 'shoes_bags'    // الاحذية والحقائب
  | 'kitchen'       // المطبخ
  | 'accessories'   // accessories
  | 'phone'         // phone
  | 'toys'          // العاب
  | 'dresses'       // فساتين سهرة
  | 'suits'         // أطقم وبليزرات
  | 'women'         // أزياء نسائية
  | 'men'           // أزياء رجالية
  | 'flash_deals';  // عروض اليوم

export type CurrencyType = 'SAR' | 'YER';

export interface ProductVariant {
  id: string;
  colorName: string;
  colorHex: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | 'XXL' | '3XL' | '4XL' | 'ONE_SIZE' | string;
  stock: number;
  sku: string;
}

export interface CustomerReview {
  id: string;
  productId?: string;
  productTitle?: string;
  authorName: string;
  rating: number; // 1 to 5
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  sizePurchased?: string;
  heightWeight?: string;
  userImages?: string[];
  helpfulCount: number;
}

export interface AdminRating {
  score: number; // e.g. 9.8 / 10
  badgeLabel: string; // e.g. "مفحوص ومطابق للمواصفات"
  reviewerRole: string; // e.g. "إدارة الجودة - I in"
  fabricQuality: number; // 1-10
  sizingAccuracy: number; // 1-10
  finishingScore: number; // 1-10
  staffNotes: string;
  inspectionDate: string;
}

export interface Product {
  id: string;
  code?: string; // كود المنتج التلقائي مثل IN-8492
  title: string;
  titleEn: string;
  category: ProductCategory;
  subCategory?: string;
  priceSAR: number;
  originalPriceSAR?: number;
  customBadge?: string; // نص العرض المخصص مثل "عرض محدود" أو "خصم 30%"
  isFlashDeal?: boolean;
  flashDealEndsAt?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  featuredBanner?: boolean;
  description: string;
  fabricDetails: string;
  careInstructions: string;
  images: string[];
  videoThumbnail?: string;
  rating: number;
  reviewsCount: number;
  adminRating: AdminRating;
  variants: ProductVariant[];
  availableColors: { name: string; hex: string }[];
  availableSizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | 'XXL' | '3XL' | '4XL' | 'ONE_SIZE' | string)[];
  tags: string[];
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  category: ProductCategory;
  targetProductId?: string;
  badgeText: string;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedColor: string;
  selectedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | 'XXL' | '3XL' | '4XL' | 'ONE_SIZE' | string;
  quantity: number;
  unitPriceSAR: number;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpendSAR?: number;
  maxDiscountSAR?: number;
  expiresAt: string;
  description: string;
  usageCount: number;
  isPrivateVIP?: boolean; // كوبون خاص للمؤثرين / العملاء المميزين
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankLogo?: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swiftCode?: string;
  currency: string;
  notes?: string;
  isActive?: boolean;
}

export type OrderStatus = 
  | 'pending_confirmation'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  currency: CurrencyType;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  paymentMethod: 'bank_deposit' | 'whatsapp_order';
  depositBank?: string;
  depositReceiptUrl?: string;
  depositNotes?: string;
  whatsappMessageSent: boolean;
  adminNotes?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  adminUser: string;
}

export interface StoreSettings {
  enableLoyaltyPoints: boolean;
  loyaltyPointsRate: number; // e.g. 1 point per 2 SAR
  yerToSarRate: number;      // e.g. 1 SAR = 140 YER
  shippingFeeSAR: number;    // Customizable shipping fee by admin!
  freeShippingThresholdSAR: number;
  isFreeShippingActive: boolean;
  topAnnouncementText: string; // Editable top announcement text by admin!
  showTopAnnouncement: boolean;
  adminPin: string;
  bannerDisplaySize?: 'large' | 'medium' | 'compact'; // حجم مربعات العرض العلوية
  productCardLayout?: 'standard' | 'compact';         // نمط عرض مربعات المنتجات
  defaultSaleBadgeText?: string;                      // نص العرض التلقائي
  defaultUrgencyBadgeText?: string;                   // نص العرض المحدود التلقائي
}
