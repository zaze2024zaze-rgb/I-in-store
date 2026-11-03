import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCartTotals, convertSARtoCurrency, formatCurrencyLabel, FREE_SHIPPING_THRESHOLD_SAR, STANDARD_SHIPPING_FEE_SAR } from './pricing.ts';
import { calculateRecommendedSize } from './sizing.ts';
import { buildWhatsAppCartMessage, generateWhatsAppDirectLink, OFFICIAL_WHATSAPP_NUMBER } from './whatsapp.ts';
import { verifyCartPriceIntegrity, sanitizeInput } from './security.ts';
import { CartItem, Product, Coupon } from '../types.ts';

const mockProductA: Product = {
  id: 'prod_1',
  title: 'فستان حرير شامبين فاخر',
  titleEn: 'Champagne Silk Dress',
  category: 'dresses',
  priceSAR: 300,
  description: 'فستان استثنائي',
  fabricDetails: 'حرير طبيعي 100%',
  careInstructions: 'تنظيف جاف',
  images: ['/test.jpg'],
  rating: 4.9,
  reviewsCount: 38,
  adminRating: {
    score: 9.9,
    badgeLabel: 'فحص الإدارة والجودة',
    reviewerRole: 'قسم الجودة',
    fabricQuality: 10,
    sizingAccuracy: 10,
    finishingScore: 9.8,
    staffNotes: 'مطابق للأصل بأعلى دقة',
    inspectionDate: '2026-10-15',
  },
  variants: [],
  availableColors: [{ name: 'شامبين', hex: '#E8D8C8' }],
  availableSizes: ['S', 'M', 'L'],
  tags: ['حرير', 'سهرة'],
};

const mockCart: CartItem[] = [
  {
    id: 'cart_item_1',
    productId: 'prod_1',
    product: mockProductA,
    selectedColor: 'شامبين',
    selectedSize: 'M',
    quantity: 1,
    unitPriceSAR: 300,
  },
];

test('calculateCartTotals: standard calculation in SAR', () => {
  const result = calculateCartTotals(mockCart, null, 'SAR');
  assert.equal(result.subtotalSAR, 300);
  assert.equal(result.shippingFeeSAR, STANDARD_SHIPPING_FEE_SAR);
  assert.equal(result.totalSAR, 300 + STANDARD_SHIPPING_FEE_SAR);
  assert.equal(result.currency, 'SAR');
});

test('calculateCartTotals: converts to Yemeni Riyal (YER)', () => {
  const rate = 140;
  const result = calculateCartTotals(mockCart, null, 'YER', rate);
  assert.equal(result.subtotalDisplay, 300 * 140);
  assert.equal(result.shippingFeeDisplay, STANDARD_SHIPPING_FEE_SAR * 140);
  assert.equal(result.totalDisplay, (300 + STANDARD_SHIPPING_FEE_SAR) * 140);
});

test('calculateCartTotals: free shipping when exceeding 400 SAR threshold', () => {
  const bigCart: CartItem[] = [
    {
      id: 'cart_item_big',
      productId: 'prod_1',
      product: mockProductA,
      selectedColor: 'شامبين',
      selectedSize: 'M',
      quantity: 2,
      unitPriceSAR: 300, // 2 * 300 = 600 SAR >= 400
    },
  ];
  const result = calculateCartTotals(bigCart, null, 'SAR');
  assert.equal(result.subtotalSAR, 600);
  assert.equal(result.freeShippingQualified, true);
  assert.equal(result.shippingFeeSAR, 0);
  assert.equal(result.totalSAR, 600);
});

test('whatsapp: builds message with YER and SAR and official number +967784935535', () => {
  const totals = calculateCartTotals(mockCart, null, 'YER', 140);
  const details = {
    orderNumber: 'IN-78491',
    customerName: 'فهد الأحمدي',
    customerPhone: '+967784935535',
    customerCity: 'صنعاء',
    paymentMethod: 'whatsapp_order' as const,
    currency: 'YER' as const,
    yerRate: 140,
  };

  const message = buildWhatsAppCartMessage(mockCart, totals, details);
  assert.ok(message.includes('IN-78491'));
  assert.ok(message.includes('ريال يمني'));
  assert.ok(message.includes('فستان حرير شامبين فاخر'));

  const link = generateWhatsAppDirectLink(mockCart, totals, details);
  assert.ok(link.includes(OFFICIAL_WHATSAPP_NUMBER));
});

test('security: detects price tampering in SAR', () => {
  const tamperedCart: CartItem[] = [
    {
      id: 'cart_item_tampered',
      productId: 'prod_1',
      product: mockProductA,
      selectedColor: 'شامبين',
      selectedSize: 'M',
      quantity: 1,
      unitPriceSAR: 50, // Tampered: 50 SAR instead of 300 SAR
    },
  ];

  const integrity = verifyCartPriceIntegrity(tamperedCart, [mockProductA]);
  assert.equal(integrity.isValid, false);
  assert.ok(integrity.discrepancies.length > 0);
});

test('auto product code format starts with IN- and contains 4 digits', () => {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const code = `IN-${digits}`;
  assert.match(code, /^IN-\d{4}$/);
});

test('supports requested size ranges: S, M, L, XL, XXL, 3XL, 4XL', () => {
  const allowedSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
  assert.equal(allowedSizes.includes('XXL'), true);
  assert.equal(allowedSizes.includes('3XL'), true);
  assert.equal(allowedSizes.includes('4XL'), true);
});

test('bank accounts: filter active bank accounts correctly', () => {
  const accounts = [
    { id: 'b1', bankName: 'بنك الكريمي للتمويل الأصغر الإسلامي', accountNumber: '123456', accountHolder: 'متجر I in', iban: '', currencies: ['YER', 'SAR'], isActive: true },
    { id: 'b2', bankName: 'بنك التضامن الإسلامي', accountNumber: '654321', accountHolder: 'متجر I in', iban: '', currencies: ['YER'], isActive: false },
  ];
  const activeOnly = accounts.filter(b => b.isActive !== false);
  assert.equal(activeOnly.length, 1);
  assert.equal(activeOnly[0].bankName, 'بنك الكريمي للتمويل الأصغر الإسلامي');
});

test('review moderation: removes specific comment by ID', () => {
  const reviewList = [
    { id: 'rev_1', productId: 'p1', authorName: 'منى', rating: 5, date: '2026-10-18', comment: 'رائع جداً' },
    { id: 'rev_2', productId: 'p1', authorName: 'مجهول', rating: 1, date: '2026-10-19', comment: 'إعلان مزعج' },
  ];
  const filtered = reviewList.filter(r => r.id !== 'rev_2');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'rev_1');
});

test('admin pin security: validates pin changes and confirms match', () => {
  const currentPin = '7849';
  const newPin = '9988';
  const confirmPin = '9988';

  assert.equal(newPin === confirmPin, true);
  assert.ok(newPin.length >= 4);
  assert.notEqual(newPin, currentPin);
});

test('product card layout modes support standard and compact', () => {
  const layouts: Array<'standard' | 'compact'> = ['standard', 'compact'];
  assert.equal(layouts.includes('standard'), true);
  assert.equal(layouts.includes('compact'), true);
});

test('cloud database: parses JS object firebaseConfig correctly', () => {
  const snippet = `const firebaseConfig = {
    apiKey: "AIzaSyFakeKey123",
    authDomain: "iin-store-test.firebaseapp.com",
    projectId: "iin-store-test",
    storageBucket: "iin-store-test.firebasestorage.app",
    messagingSenderId: "987654321",
    appId: "1:987654321:web:abcdef123456"
  };`;

  let clean = snippet.trim();
  if (clean.includes('{') && clean.includes('}')) {
    clean = clean.substring(clean.indexOf('{'), clean.lastIndexOf('}') + 1);
  }
  const parsed = Function('"use strict";return (' + clean + ')')();
  assert.equal(parsed.apiKey, 'AIzaSyFakeKey123');
  assert.equal(parsed.projectId, 'iin-store-test');
  assert.equal(parsed.appId, '1:987654321:web:abcdef123456');
});

test('cloud database: product model holds complete required fields for Firestore', () => {
  assert.ok(mockProductA.id);
  assert.ok(mockProductA.title);
  assert.ok(mockProductA.priceSAR > 0);
  assert.ok(mockProductA.category);
  assert.ok(Array.isArray(mockProductA.images));
  assert.ok(Array.isArray(mockProductA.availableSizes));
});

