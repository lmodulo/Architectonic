export interface CartItem {
  productId: string;
  slug: string;
  categorySlug: string;
  name: string;
  image: string | null;
  basePrice: number;
  salePrice: number | null;
  selections: Record<string, string>;
  quantity: number;
}

function itemKey(productId: string, selections: Record<string, string>): string {
  return productId + '::' + JSON.stringify(Object.entries(selections).sort());
}

class CartStore {
  items = $state<CartItem[]>([]);
  open = $state(false);

  get count() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal() {
    return this.items.reduce(
      (sum, item) => sum + (item.salePrice ?? item.basePrice) * item.quantity,
      0
    );
  }

  openCart() {
    this.open = true;
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.open = false;
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }

  addToCart(item: Omit<CartItem, 'quantity'>) {
    const key = itemKey(item.productId, item.selections);
    const existing = this.items.find((i) => itemKey(i.productId, i.selections) === key);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...item, quantity: 1 });
    }
  }

  removeFromCart(productId: string, selections: Record<string, string>) {
    const key = itemKey(productId, selections);
    const idx = this.items.findIndex((i) => itemKey(i.productId, i.selections) === key);
    if (idx !== -1) this.items.splice(idx, 1);
  }

  updateQty(productId: string, selections: Record<string, string>, delta: number) {
    const key = itemKey(productId, selections);
    const item = this.items.find((i) => itemKey(i.productId, i.selections) === key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) this.removeFromCart(productId, selections);
  }
}

export const cart = new CartStore();
