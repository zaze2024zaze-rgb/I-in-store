import { CartItem, Product, AuditLog } from '../types.ts';

export const ADMIN_DEFAULT_PIN = '7849'; // Default Admin Secret PIN (derived from phone +967784935535 or customizable)

export function verifyCartPriceIntegrity(
  cartItems: CartItem[],
  catalogProducts: Product[]
): { isValid: boolean; discrepancies: string[] } {
  const discrepancies: string[] = [];

  for (const item of cartItems) {
    const catalogItem = catalogProducts.find((p) => p.id === item.productId);
    if (!catalogItem) {
      discrepancies.push(`منتج غير موجود في الكتالوج المعتمد: ${item.product.title}`);
      continue;
    }

    if (Math.abs(item.unitPriceSAR - catalogItem.priceSAR) > 0.01) {
      discrepancies.push(
        `تلاعب بالسعر لمنتج ${catalogItem.title}: السعر المرسل ${item.unitPriceSAR} ر.س بينما السعر الرسمي ${catalogItem.priceSAR} ر.س`
      );
    }

    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      discrepancies.push(`كمية غير صالحة لمنتج ${catalogItem.title}: ${item.quantity}`);
    }
  }

  return {
    isValid: discrepancies.length === 0,
    discrepancies,
  };
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

export function createAuditLogEntry(
  action: string,
  target: string,
  details: string,
  adminUser: string = 'المشرف (Admin)'
): AuditLog {
  return {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    action,
    target,
    details,
    timestamp: new Date().toISOString(),
    adminUser,
  };
}
