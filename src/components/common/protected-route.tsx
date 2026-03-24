import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { LoadingScreen } from './loading-screen';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
