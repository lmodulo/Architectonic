export interface Discount {
  type: 'percentage' | 'fixed' | 'quantity_tier';
  value: number;
  label: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  minQuantity?: number;
}

/** Returns the first currently-active discount on a product, or null. */
export function activeDiscount(discounts: Discount[]): Discount | null {
  const now = Date.now();
  return discounts.find(d => {
    if (!d.active) return false;
    if (d.startDate && new Date(d.startDate).getTime() > now) return false;
    if (d.endDate && new Date(d.endDate).getTime() < now) return false;
    return true;
  }) ?? null;
}

/** Format a price in cents as a locale currency string (e.g. $12.99). */
export function formatPrice(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

/** Apply a discount to a base price (cents) and return the discounted price (cents). */
export function applyDiscount(base: number, discount: Discount): number {
  if (discount.type === 'percentage') return Math.round(base * (1 - discount.value / 100));
  if (discount.type === 'fixed') return Math.max(0, base - discount.value);
  return base;
}

/** Badge label for a discount (e.g. "-20%" or "SALE"). */
export function discountLabel(discount: Discount): string {
  if (discount.type === 'percentage') return `-${discount.value}%`;
  return 'SALE';
}
