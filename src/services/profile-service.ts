import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/auth-service';
import type { User } from '@/types';

export async function getProfile(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as User;
}

export async function getCurrentProfile(): Promise<User> {
  const { user } = await authService.getUser();
  if (!user) throw new Error('Not authenticated');
  return getProfile(user.id);
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as User;
}

export async function getAllProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as User[]) ?? [];
}
