export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: number;
}

export interface Product {
  id: number;
  category_id: number;
  subcategory_id?: number | null;
  category_name?: string;
  subcategory_name?: string;
  title: string;
  slug: string;
  description: string;
  composition: string;
  weight: string;
  storage: string;
  price: number;
  old_price?: number | null;
  images: string[];
  in_stock: number; // 1 = in stock, 0 = out of stock
  badge?: string | null; // e.g. "Хит", "Семейный рецепт", "Новинка", "Ограниченная партия"
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'cooking'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export type DeliveryType = 'pickup' | 'delivery';

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  title: string;
  price: number;
  weight: string;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_comment?: string;
  delivery_type: DeliveryType;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lon?: number;
  delivery_distance_km?: number;
  delivery_cost: number;
  subtotal: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid';
  status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
}

export interface StoreSettings {
  base_lat: number;
  base_lon: number;
  base_address: string;
  delivery_radius_km: number;
  delivery_price: number;
  free_delivery_threshold: number;
  producer_name: string;
  producer_inn: string;
  producer_ogrnip: string;
  producer_phone: string;
}
