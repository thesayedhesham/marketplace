import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/auth-service';
import type { Order } from '@/types';

export async function createOrder(order: {
  product_id: string;
  seller_id: string;
  message?: string;
  total_price: number;
}): Promise<Order> {
  const { user } = await authService.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .insert({ ...order, buyer_id: user.id, status: 'pending' })
    .select('*, product:products(*), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)')
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrders(role: 'buyer' | 'seller'): Promise<Order[]> {
  const { user } = await authService.getUser();
  if (!user) throw new Error('Not authenticated');

  const column = role === 'buyer' ? 'buyer_id' : 'seller_id';

  const { data, error } = await supabase
    .from('orders')
    .select('*, product:products(*), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)')
    .eq(column, user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Order[]) ?? [];
}

export async function getOrder(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, product:products(*), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('*, product:products(*), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)')
    .single();

  if (error) throw error;
  return data as Order;
}
