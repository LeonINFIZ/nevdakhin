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

export interface Badge {
  id: number;
  name: string;
  bg_color: string;
  text_color: string;
  border_color: string;
  sort_order: number;
  created_at?: string;
  product_count?: number;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  step_number: number;
  title: string;
  description: string;
  image_url?: string;
  tip?: string;
}

export interface Recipe {
  id: number;
  product_id?: number | null;
  product_title?: string;
  product_price?: number;
  product_image?: string;
  product_weight?: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  video_url?: string;
  prep_time: string;
  portions: string;
  difficulty: string; // 'Легко' | 'Средне' | 'Мастер'
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  is_active: number;
  sort_order: number;
  created_at: string;
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
  badge?: string | null;
  badge_bg?: string | null;
  badge_text?: string | null;
  badge_border?: string | null;
  has_recipe?: boolean;
  recipe_slug?: string | null;
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
