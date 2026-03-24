import { AppShell, Burger, Group, Title, Button, Menu, Avatar, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, Link } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from './navbar';

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3} renderRoot={(props) => <Link to="/" {...props} />} style={{ textDecoration: 'none', color: 'inherit' }}>
              Marketplace
            </Title>
          </Group>
          <Group>
            {user ? (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="subtle" leftSection={<Avatar size="sm" radius="xl" />}>
                    <Text size="sm">{user.email}</Text>
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/profile">Profile</Menu.Item>
                  <Menu.Item component={Link} to="/orders">My Orders</Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={handleSignOut}>Sign Out</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group>
                <Button variant="subtle" component={Link} to="/login">Login</Button>
                <Button component={Link} to="/register">Register</Button>
              </Group>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
