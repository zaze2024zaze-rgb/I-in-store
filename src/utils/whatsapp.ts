import { CartItem, CurrencyType } from '../types.ts';
import { CartCalculationResult, formatCurrencyLabel, convertSARtoCurrency } from './pricing.ts';

export const OFFICIAL_WHATSAPP_NUMBER = '967784935535';

export interface CustomerOrderDetails {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress?: string;
  paymentMethod: 'bank_deposit' | 'whatsapp_order';
  depositBank?: string;
  notes?: string;
  currency: CurrencyType;
  yerRate?: number;
}

/**
 * Builds an elegant, structured WhatsApp message with SAR or YER currency
 * and instructions to attach the bank deposit receipt image.
 */
export function buildWhatsAppCartMessage(
  items: CartItem[],
  totals: CartCalculationResult,
  details: CustomerOrderDetails
): string {
  const dateStr = new Date().toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currencyLabel = details.currency === 'YER' ? 'ريال يمني (ر.ي)' : 'ريال سعودي (ر.س)';

  let message = `مرحباً متجر I in الفاخر ✨\n`;
  message += `أود إرسال طلبي المباشر وسلتي للشراء والتجهيز عبركم.\n\n`;
  message += `🔖 رقم الطلب المرجعي: *${details.orderNumber}*\n`;
  message += `📅 التاريخ: ${dateStr}\n`;
  message += `👤 اسم العميل: *${details.customerName}*\n`;
  message += `📱 رقم التواصل: ${details.customerPhone}\n`;
  message += `📍 المدينة/العنوان: ${details.customerCity} ${details.customerAddress ? `(${details.customerAddress})` : ''}\n`;
  message += `💱 العملة المختارة: *${currencyLabel}*\n`;
  message += `💳 طريقة السداد: ${details.paymentMethod === 'bank_deposit' ? `إيداع بنكي (${details.depositBank || 'بانتظار إشعار التحويل'})` : 'طلب مباشر وتنسيق عبر الواتساب'}\n\n`;

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🛍️ *محتويات السلة (${items.length} منتجات):*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  items.forEach((item, index) => {
    const unitPriceDisplay = convertSARtoCurrency(item.unitPriceSAR, details.currency, details.yerRate);
    const itemTotalDisplay = unitPriceDisplay * item.quantity;
    message += `${index + 1}. *${item.product.title}*\n`;
    message += `   • المقاس: [ ${item.selectedSize} ] | اللون: [ ${item.selectedColor} ]\n`;
    message += `   • الكمية: ${item.quantity} × ${formatCurrencyLabel(unitPriceDisplay, details.currency)} = *${formatCurrencyLabel(itemTotalDisplay, details.currency)}*\n`;
    if (item.product.code || item.product.id) {
      message += `   • كود المنتج: ${item.product.code || ('IN-' + item.product.id.slice(0, 6).toUpperCase())}\n`;
    }
    message += `\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💵 *ملخص الحساب الإجمالي:*\n`;
  message += `• المجموع الفرعي: ${formatCurrencyLabel(totals.subtotalDisplay, details.currency)}\n`;
  if (totals.couponDiscountDisplay > 0) {
    message += `• خصم الكوبون: -${formatCurrencyLabel(totals.couponDiscountDisplay, details.currency)}\n`;
  }
  message += `• الشحن: ${totals.shippingFeeDisplay === 0 ? 'مجاني (عرض VIP)' : formatCurrencyLabel(totals.shippingFeeDisplay, details.currency)}\n`;
  message += `⭐ *المبلغ الإجمالي المطلوب سداده: ${formatCurrencyLabel(totals.totalDisplay, details.currency)}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Required instruction for bank receipt upload
  message += `📸 *تعليمات هامة لإتمام الطلب:*\n`;
  message += `يرجى إرفاق صورة إشعار أو سند الإيداع/التحويل البنكي هنا في نفس المحادثة فوراً، ليقوم المشرف بتأكيد الحجز وبدء الشحن المباشر.\n\n`;

  if (details.notes) {
    message += `📝 ملاحظات إضافية من العميل: ${details.notes}\n\n`;
  }

  message += `شكراً لتسوقكم من I in!`;

  return message;
}

export function generateWhatsAppDirectLink(
  items: CartItem[],
  totals: CartCalculationResult,
  details: CustomerOrderDetails
): string {
  const message = buildWhatsAppCartMessage(items, totals, details);
  const cleanPhone = OFFICIAL_WHATSAPP_NUMBER.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
}
