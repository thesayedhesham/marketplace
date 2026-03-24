import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/common/protected-route';
import { AdminRoute } from '@/components/common/admin-route';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { ProductListPage } from '@/pages/products/product-list-page';
import { ProductDetailPage } from '@/pages/products/product-detail-page';
import { CreateProductPage } from '@/pages/products/create-product-page';
import { MyListingsPage } from '@/pages/products/my-listings-page';
import { OrdersPage } from '@/pages/orders/orders-page';
import { ProfilePage } from '@/pages/profile/profile-page';
import { PublicProfilePage } from '@/pages/profile/public-profile-page';
import { AdminDashboardPage } from '@/pages/admin/admin-dashboard-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ProductListPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'products/new', element: <CreateProductPage /> },
          { path: 'my-listings', element: <MyListingsPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/:userId', element: <PublicProfilePage /> },
        ],
      },

      // Admin routes
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin', element: <AdminDashboardPage /> },
        ],
      },
    ],
  },
]);
