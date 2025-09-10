export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  storeId?: string;
}

const CART_KEY = 'zipp_cart_v1';

function dispatchCartUpdated(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const detail = { count: items.reduce((sum, i) => sum + i.quantity, 0) };
    window.dispatchEvent(new CustomEvent('cart:updated', { detail }));
  } catch {}
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  dispatchCartUpdated(items);
}

export function addToCart(item: Omit<CartItem, 'quantity'>, qty: number = 1): CartItem[] {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    cart[idx].quantity += qty;
  } else {
    cart.push({ ...item, quantity: qty });
  }
  setCart(cart);
  return cart;
}

export function updateQuantity(id: string, qty: number): CartItem[] {
  const cart = getCart().map(i => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  setCart(cart);
  return cart;
}

export function removeFromCart(id: string): CartItem[] {
  const cart = getCart().filter(i => i.id !== id);
  setCart(cart);
  return cart;
}

export function clearCart(): void {
  setCart([]);
}

export function getCartTotal(items?: CartItem[]): number {
  const cart = items ?? getCart();
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function getCartCount(): number {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function subscribeToCart(callback: (count: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<{ count: number }>;
    if (ce.detail && typeof ce.detail.count === 'number') {
      callback(ce.detail.count);
    } else {
      callback(getCartCount());
    }
  };
  window.addEventListener('cart:updated', handler as EventListener);
  return () => window.removeEventListener('cart:updated', handler as EventListener);
}

export function openCartDrawer(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('cart:open'));
}


