import { NavLink, Stack } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentProfile } from '@/hooks/use-profiles';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Stack gap={0}>
      <NavLink
        label="Browse Products"
        active={isActive('/products') || location.pathname === '/'}
        onClick={() => navigate('/products')}
      />
      {user && (
        <>
          <NavLink
            label="My Orders"
            active={isActive('/orders')}
            onClick={() => navigate('/orders')}
          />
          <NavLink
            label="My Listings"
            active={isActive('/my-listings')}
            onClick={() => navigate('/my-listings')}
          />
          <NavLink
            label="Create Listing"
            active={isActive('/products/new')}
            onClick={() => navigate('/products/new')}
          />
          <NavLink
            label="Profile"
            active={isActive('/profile')}
            onClick={() => navigate('/profile')}
          />
        </>
      )}
      {profile?.role === 'admin' && (
        <NavLink
          label="Admin Dashboard"
          active={isActive('/admin')}
          onClick={() => navigate('/admin')}
        />
      )}
    </Stack>
  );
}
