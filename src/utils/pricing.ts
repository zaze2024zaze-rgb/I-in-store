import { CartItem, Coupon, CurrencyType } from '../types.ts';

export interface CartCalculationResult {
  subtotalSAR: number;
  subtotalDisplay: number;
  couponDiscountSAR: number;
  couponDiscountDisplay: number;
  shippingFeeSAR: number;
  shippingFeeDisplay: number;
  totalSAR: number;
  totalDisplay: number;
  currency: CurrencyType;
  freeShippingQualified: boolean;
  freeShippingThresholdSAR: number;
}

export const DEFAULT_YER_RATE = 140;
export const DEFAULT_SHIPPING_FEE_SAR = 25;
export const DEFAULT_FREE_SHIPPING_THRESHOLD_SAR = 400;
export const STANDARD_SHIPPING_FEE_SAR = DEFAULT_SHIPPING_FEE_SAR;
export const FREE_SHIPPING_THRESHOLD_SAR = DEFAULT_FREE_SHIPPING_THRESHOLD_SAR;

export function convertSARtoCurrency(amountSAR: number, currency: CurrencyType, rate: number = DEFAULT_YER_RATE): number {
  if (currency === 'YER') {
    return Math.round(amountSAR * rate);
  }
  return Number(amountSAR.toFixed(2));
}

export function formatCurrencyLabel(amount: number, currency: CurrencyType): string {
  if (currency === 'YER') {
    return `${amount.toLocaleString('ar-YE')} ر.ي`;
  }
  return `${amount.toLocaleString('ar-SA')} ر.س`;
}

/**
 * Calculates cart totals using admin-configured shipping fees and free shipping thresholds.
 */
export function calculateCartTotals(
  items: CartItem[],
  coupon: Coupon | null = null,
  currency: CurrencyType = 'SAR',
  yerRate: number = DEFAULT_YER_RATE,
  customShippingFeeSAR: number = DEFAULT_SHIPPING_FEE_SAR,
  customFreeShippingThresholdSAR: number = DEFAULT_FREE_SHIPPING_THRESHOLD_SAR,
  isFreeShippingActive: boolean = true
): CartCalculationResult {
  const subtotalSAR = items.reduce((acc, item) => {
    const verifiedPrice = Number(item.product?.priceSAR ?? item.unitPriceSAR ?? 0);
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    return acc + verifiedPrice * qty;
  }, 0);

  const freeShippingQualified = isFreeShippingActive && (subtotalSAR >= customFreeShippingThresholdSAR || customShippingFeeSAR === 0);
  const shippingFeeSAR = (subtotalSAR === 0 || freeShippingQualified) ? 0 : customShippingFeeSAR;

  let couponDiscountSAR = 0;
  if (coupon && subtotalSAR > 0) {
    if (!coupon.minSpendSAR || subtotalSAR >= coupon.minSpendSAR) {
      if (coupon.discountType === 'percentage') {
        const calculated = (subtotalSAR * coupon.discountValue) / 100;
        couponDiscountSAR = coupon.maxDiscountSAR ? Math.min(calculated, coupon.maxDiscountSAR) : calculated;
      } else {
        couponDiscountSAR = Math.min(subtotalSAR, coupon.discountValue);
      }
    }
  }

  const postCouponSAR = Math.max(0, subtotalSAR - couponDiscountSAR);
  const totalSAR = Number((postCouponSAR + shippingFeeSAR).toFixed(2));

  return {
    subtotalSAR,
    subtotalDisplay: convertSARtoCurrency(subtotalSAR, currency, yerRate),
    couponDiscountSAR,
    couponDiscountDisplay: convertSARtoCurrency(couponDiscountSAR, currency, yerRate),
    shippingFeeSAR,
    shippingFeeDisplay: convertSARtoCurrency(shippingFeeSAR, currency, yerRate),
    totalSAR,
    totalDisplay: convertSARtoCurrency(totalSAR, currency, yerRate),
    currency,
    freeShippingQualified,
    freeShippingThresholdSAR: customFreeShippingThresholdSAR,
  };
}
