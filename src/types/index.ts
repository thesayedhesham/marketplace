export interface User {
  id: string;
  email: string;
  display_name: string;
  full_name: string;
  avatar_url: string | null;
  role: 'buyer' | 'seller' | 'admin';
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  seller_id: string;
  status: 'draft' | 'active' | 'inactive' | 'sold';
  images: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  seller?: User;
}

export interface Order {
  id: string;
  buyer_id: string;
  product_id: string;
  seller_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  message: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  product?: Product;
  buyer?: User;
  seller?: User;
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: Product['status'];
  seller_id?: string;
  sort_by?: 'created_at' | 'price' | 'title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role?: 'buyer' | 'seller';
}

export interface SignInData {
  email: string;
  password: string;
}
