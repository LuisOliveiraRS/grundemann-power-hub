const GUEST_CART_KEY = "guest_cart_items";

export interface GuestCartItem {
  product_id: string;
  quantity: number;
  product: { name: string; price: number; image_url: string | null };
}

export const getGuestCart = (): GuestCartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
  } catch {
    return [];
  }
};

export const addToGuestCart = (item: GuestCartItem): GuestCartItem[] => {
  const cart = getGuestCart();
  const existing = cart.find((i) => i.product_id === item.product_id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const updateGuestCartQty = (productId: string, quantity: number): GuestCartItem[] => {
  let cart = getGuestCart();
  if (quantity < 1) {
    cart = cart.filter((i) => i.product_id !== productId);
  } else {
    const item = cart.find((i) => i.product_id === productId);
    if (item) item.quantity = quantity;
  }
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const removeFromGuestCart = (productId: string): GuestCartItem[] => {
  const cart = getGuestCart().filter((i) => i.product_id !== productId);
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const getGuestCartCount = (): number => {
  return getGuestCart().reduce((s, i) => s + i.quantity, 0);
};
