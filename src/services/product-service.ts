import { supabase } from '@/lib/supabase';
import type { Product, ProductFilters, PaginatedResponse } from '@/types';

const DEFAULT_PER_PAGE = 12;

// Converts a free-text search string into a tsquery prefix expression.
// e.g. "gaming lap" → "gaming:* & lap:*"
// Falls back to ilike on title if the input is empty or would produce
// an invalid tsquery (single special chars, etc.).
function toTsQuery(search: string): string | null {
  const words = search.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  return words.map((w) => `${w.replace(/[^a-zA-Z0-9]/g, '')}:*`).filter(Boolean).join(' & ') || null;
}

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
  const {
    search,
    category_id,
    min_price,
    max_price,
    status = 'active',
    seller_id,
    sort_by = 'created_at',
    sort_order = 'desc',
    page = 1,
    per_page = DEFAULT_PER_PAGE,
  } = filters;

  let query = supabase
    .from('products')
    .select('*, category:categories(*), seller:profiles(*)', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (category_id) query = query.eq('category_id', category_id);
  if (seller_id) query = query.eq('seller_id', seller_id);
  if (min_price !== undefined) query = query.gte('price', min_price);
  if (max_price !== undefined) query = query.lte('price', max_price);

  if (search) {
    const tsQuery = toTsQuery(search);
    if (tsQuery) {
      // Use the GIN-indexed search_vector column for full-text search
      query = query.textSearch('search_vector', tsQuery, { type: 'websearch' });
    } else {
      query = query.ilike('title', `%${search}%`);
    }
  }

  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  query = query.order(sort_by, { ascending: sort_order === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count ?? 0;
  return {
    data: (data as Product[]) ?? [],
    count: total,
    page,
    per_page,
    total_pages: Math.ceil(total / per_page),
  };
}

export async function getProduct(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), seller:profiles(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Product;
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'seller'>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('*, category:categories(*), seller:profiles(*)')
    .single();

  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('*, category:categories(*), seller:profiles(*)')
    .single();

  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getMaxPrice(): Promise<number> {
  const { data, error } = await supabase
    .from('products')
    .select('price')
    .eq('status', 'active')
    .order('price', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 10000;
  return Math.ceil(Number(data.price) / 100) * 100; // round up to nearest 100
}
