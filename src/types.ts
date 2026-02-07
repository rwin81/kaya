
export type BadgeType = 'Paling Laris' | 'Favorit' | 'Paket Promo';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'PRE_ORDER';

export interface Category {
  id: string;
  name: string;
}

export interface Menu {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  badge?: BadgeType;
  isAvailable: boolean;
}

export interface CartItem extends Menu {
  quantity: number;
  notes?: string; // Catatan dikembalikan
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'QRIS' | 'CASH';

export interface Order {
  id: string;
  customerName: string;
  orderType: OrderType;
  tableNumber?: string;
  eventDate?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: number;
  items: CartItem[];
  createdAt: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  image: string;
  isActive: boolean;
}
