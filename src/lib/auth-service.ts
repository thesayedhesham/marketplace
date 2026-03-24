import type { AuthChangeEvent, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AuthUser, SignInData, SignUpData } from '@/types';

// Abstraction layer for authentication.
// Nothing outside this file calls supabase.auth directly.
// To migrate to Microsoft SSO (Supabase SAML/OIDC), replace SupabaseAuthService
// with a new implementation of the AuthService interface — no component changes needed.

export interface AuthService {
  signUp(data: SignUpData): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signIn(data: SignInData): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signOut(): Promise<{ error: AuthError | null }>;
  getSession(): Promise<{ session: Session | null; error: AuthError | null }>;
  getUser(): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): { unsubscribe: () => void };
  // ── Microsoft SSO (future) ────────────────────────────────────────────────
  // Uncomment and configure a SAML/OIDC provider in Supabase Dashboard, then
  // call this with either { domain: 'yourcompany.com' } or { providerId: '<uuid>' }.
  //
  // signInWithSSO(options: { domain?: string; providerId?: string }): Promise<{
  //   url: string | null;
  //   error: AuthError | null;
  // }>;
}

function mapUser(supabaseUser: { id: string; email?: string } | null): AuthUser | null {
  if (!supabaseUser) return null;
  return { id: supabaseUser.id, email: supabaseUser.email ?? '' };
}

class SupabaseAuthService implements AuthService {
  async signUp(data: SignUpData) {
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role ?? 'buyer',
        },
      },
    });
    return { user: mapUser(result.user), error };
  }

  async signIn(data: SignInData) {
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    return { user: mapUser(result.user), error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: mapUser(data.user), error };
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return { unsubscribe: () => data.subscription.unsubscribe() };
  }
}

// Singleton — swap the class assigned here to change auth providers globally
export const authService: AuthService = new SupabaseAuthService();
