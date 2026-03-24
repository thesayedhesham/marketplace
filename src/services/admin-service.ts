import { supabase } from '@/lib/supabase';
import type { Product, User, Order } from '@/types';

export interface AdminStats {
  products: {
    total: number;
    active: number;
    draft: number;
    inactive: number;
    sold: number;
  };
  users: {
    total: number;
    buyers: number;
    sellers: number;
    admins: number;
  };
  orders: {
    total: number;
    pending: number;
    accepted: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
  revenue: number; // sum of completed order total_prices
}

// All products regardless of status — admin view
export async function getAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), seller:profiles(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Product[]) ?? [];
}

// All users
export async function getAdminUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as User[]) ?? [];
}

// All orders with joins
export async function getAdminOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, product:products(*), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)'
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Order[]) ?? [];
}

// Aggregate stats — runs 3 lightweight count queries in parallel
export async function getAdminStats(): Promise<AdminStats> {
  const [productsRes, usersRes, ordersRes] = await Promise.all([
    supabase.from('products').select('status'),
    supabase.from('profiles').select('role'),
    supabase.from('orders').select('status, total_price'),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (usersRes.error) throw usersRes.error;
  if (ordersRes.error) throw ordersRes.error;

  const products = productsRes.data ?? [];
  const users = usersRes.data ?? [];
  const orders = ordersRes.data ?? [];

  const revenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_price), 0);

  return {
    products: {
      total: products.length,
      active: products.filter((p) => p.status === 'active').length,
      draft: products.filter((p) => p.status === 'draft').length,
      inactive: products.filter((p) => p.status === 'inactive').length,
      sold: products.filter((p) => p.status === 'sold').length,
    },
    users: {
      total: users.length,
      buyers: users.filter((u) => u.role === 'buyer').length,
      sellers: users.filter((u) => u.role === 'seller').length,
      admins: users.filter((u) => u.role === 'admin').length,
    },
    orders: {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      accepted: orders.filter((o) => o.status === 'accepted').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    },
    revenue,
  };
}
