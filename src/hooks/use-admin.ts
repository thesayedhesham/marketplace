import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminProducts,
  getAdminUsers,
  getAdminOrders,
  getAdminStats,
} from '@/services/admin-service';
import { updateProduct, deleteProduct } from '@/services/product-service';
import { updateProfile } from '@/services/profile-service';
import type { Product, User } from '@/types';

// Isolated query key namespace — keeps admin cache separate from user-facing queries
export const adminKeys = {
  all: ['admin'] as const,
  products: () => [...adminKeys.all, 'products'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  orders: () => [...adminKeys.all, 'orders'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};

export function useAdminProducts() {
  return useQuery({
    queryKey: adminKeys.products(),
    queryFn: getAdminProducts,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: getAdminUsers,
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: adminKeys.orders(),
    queryFn: getAdminOrders,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getAdminStats,
    staleTime: 1000 * 60, // 1 min — stats are summary data, ok to be slightly stale
  });
}

// ── Product mutations with optimistic updates ────────────────────────────────

export function useAdminUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      updateProduct(id, updates),

    // 1. Snapshot + immediately apply change to the admin list cache
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.products() });
      const previous = queryClient.getQueryData<Product[]>(adminKeys.products());

      queryClient.setQueryData<Product[]>(adminKeys.products(), (old = []) =>
        old.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );

      return { previous };
    },

    // 2. On failure, roll back to snapshot
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminKeys.products(), context.previous);
      }
    },

    // 3. Always re-sync with server after settle (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useAdminDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.products() });
      const previous = queryClient.getQueryData<Product[]>(adminKeys.products());

      queryClient.setQueryData<Product[]>(adminKeys.products(), (old = []) =>
        old.filter((p) => p.id !== id)
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminKeys.products(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// ── User mutation with optimistic update ────────────────────────────────────

export function useAdminUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: User['role'] }) =>
      updateProfile(userId, { role }),

    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });
      const previous = queryClient.getQueryData<User[]>(adminKeys.users());

      queryClient.setQueryData<User[]>(adminKeys.users(), (old = []) =>
        old.map((u) => (u.id === userId ? { ...u, role } : u))
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminKeys.users(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}
