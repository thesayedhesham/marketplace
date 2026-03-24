import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentProfile } from '@/hooks/use-profiles';
import { LoadingScreen } from './loading-screen';

export function AdminRoute() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();

  if (authLoading || profileLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}
