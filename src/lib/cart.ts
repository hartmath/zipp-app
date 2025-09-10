export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
}

const CART_KEY = 'zipp_cart_v1';

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


