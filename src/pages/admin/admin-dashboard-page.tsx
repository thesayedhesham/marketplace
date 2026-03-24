import { useState } from 'react';
import {
  Stack,
  Title,
  Tabs,
  Table,
  Badge,
  Button,
  Group,
  Text,
  Paper,
  SimpleGrid,
  Avatar,
  Select,
  ActionIcon,
  TextInput,
  Skeleton,
  Alert,
  Anchor,
  Tooltip,
  Progress,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router';

import {
  useAdminProducts,
  useAdminUsers,
  useAdminStats,
  useAdminUpdateProduct,
  useAdminDeleteProduct,
  useAdminUpdateUserRole,
} from '@/hooks/use-admin';
import type { Product, User } from '@/types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const PRODUCT_STATUS_COLOR: Record<string, string> = {
  active: 'green',
  draft: 'gray',
  inactive: 'orange',
  sold: 'blue',
};

const ROLE_COLOR: Record<string, string> = {
  buyer: 'blue',
  seller: 'violet',
  admin: 'red',
};

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Table.Tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <Table.Td key={j}><Skeleton height={16} /></Table.Td>
          ))}
        </Table.Tr>
      ))}
    </>
  );
}

// ─── Tab 3: Analytics ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <Paper withBorder p="lg" radius="md">
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
        {label}
      </Text>
      <Title order={2} c={color}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Title>
      {sub && <Text size="xs" c="dimmed" mt={4}>{sub}</Text>}
    </Paper>
  );
}

function AnalyticsTab() {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return (
      <Stack gap="lg" pt="md">
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Paper key={i} withBorder p="lg" radius="md">
              <Skeleton height={12} width={80} mb="sm" />
              <Skeleton height={32} width={60} />
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>
    );
  }

  if (isError || !stats) {
    return <Alert color="red" mt="md">Failed to load analytics.</Alert>;
  }

  const orderCompletionRate = stats.orders.total > 0
    ? Math.round((stats.orders.completed / stats.orders.total) * 100)
    : 0;

  return (
    <Stack gap="xl" pt="md">
      {/* Products */}
      <div>
        <Text fw={600} size="sm" tt="uppercase" c="dimmed" mb="sm">Products</Text>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <StatCard label="Total" value={stats.products.total} color="blue" />
          <StatCard label="Active" value={stats.products.active} color="green"
            sub={`${stats.products.total > 0 ? Math.round((stats.products.active / stats.products.total) * 100) : 0}% of total`} />
          <StatCard label="Draft" value={stats.products.draft} color="gray" />
          <StatCard label="Sold" value={stats.products.sold} color="violet" />
        </SimpleGrid>
      </div>

      {/* Users */}
      <div>
        <Text fw={600} size="sm" tt="uppercase" c="dimmed" mb="sm">Users</Text>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <StatCard label="Total Users" value={stats.users.total} color="blue" />
          <StatCard label="Buyers" value={stats.users.buyers} color="cyan" />
          <StatCard label="Sellers" value={stats.users.sellers} color="violet" />
          <StatCard label="Admins" value={stats.users.admins} color="red" />
        </SimpleGrid>
      </div>

      {/* Orders */}
      <div>
        <Text fw={600} size="sm" tt="uppercase" c="dimmed" mb="sm">Orders</Text>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <StatCard label="Total Orders" value={stats.orders.total} color="blue" />
          <StatCard label="Pending" value={stats.orders.pending} color="yellow" />
          <StatCard label="Completed" value={stats.orders.completed} color="green"
            sub={`${orderCompletionRate}% completion rate`} />
          <StatCard
            label="Revenue"
            value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="teal"
            sub="From completed orders"
          />
        </SimpleGrid>

        <Paper withBorder p="md" radius="md" mt="md">
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>Order completion rate</Text>
            <Text size="sm" c="dimmed">{stats.orders.completed} / {stats.orders.total}</Text>
          </Group>
          <Progress value={orderCompletionRate} color="green" size="lg" radius="xl" />
          <Group mt="xs" gap="lg">
            {(['pending', 'accepted', 'completed', 'rejected', 'cancelled'] as const).map((s) => (
              <Group key={s} gap={4}>
                <Badge size="xs" color={s === 'completed' ? 'green' : s === 'pending' ? 'yellow' : s === 'accepted' ? 'blue' : 'red'} variant="dot">{s}</Badge>
                <Text size="xs" c="dimmed">{stats.orders[s]}</Text>
              </Group>
            ))}
          </Group>
        </Paper>
      </div>
    </Stack>
  );
}

// ─── Tab 1: Manage Products ───────────────────────────────────────────────────

function ProductsTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: products, isLoading, isError } = useAdminProducts();
  const updateProduct = useAdminUpdateProduct();
  const deleteProduct = useAdminDeleteProduct();

  const filtered = (products ?? []).filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.seller?.display_name ?? p.seller?.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (product: Product, newStatus: Product['status']) => {
    updateProduct.mutate(
      { id: product.id, updates: { status: newStatus } },
      {
        onSuccess: () => notifications.show({ title: 'Updated', message: `"${product.title}" is now ${newStatus}`, color: 'green' }),
        onError: () => notifications.show({ title: 'Failed', message: 'Could not update product status', color: 'red' }),
      }
    );
  };

  const handleDelete = (product: Product) => {
    modals.openConfirmModal({
      title: 'Delete product',
      children: (
        <Text size="sm">
          Permanently delete <strong>{product.title}</strong>? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteProduct.mutate(product.id, {
          onSuccess: () => notifications.show({ title: 'Deleted', message: `"${product.title}" removed`, color: 'green' }),
          onError: () => notifications.show({ title: 'Failed', message: 'Could not delete product', color: 'red' }),
        }),
    });
  };

  return (
    <Stack gap="md" pt="md">
      <Group>
        <TextInput
          placeholder="Search by title or seller…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="All statuses"
          clearable
          data={[
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'sold', label: 'Sold' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          w={160}
        />
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {filtered.length} of {products?.length ?? 0}
        </Text>
      </Group>

      {isError && <Alert color="red">Failed to load products.</Alert>}

      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Seller</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Listed</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading
            ? <TableSkeleton cols={7} />
            : filtered.map((product) => (
              <Table.Tr key={product.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/products/${product.id}`} size="sm" fw={500} lineClamp={1} maw={200}>
                    {product.title}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{product.seller?.display_name ?? product.seller?.full_name ?? '—'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{product.category?.name ?? '—'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>${Number(product.price).toFixed(2)}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={PRODUCT_STATUS_COLOR[product.status]} variant="light" size="sm">
                    {product.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{new Date(product.created_at).toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    {product.status !== 'active' && (
                      <Tooltip label="Approve (set active)">
                        <ActionIcon
                          size="sm"
                          color="green"
                          variant="light"
                          loading={updateProduct.isPending && updateProduct.variables?.id === product.id}
                          onClick={() => handleStatusChange(product, 'active')}
                        >
                          ✓
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {product.status === 'active' && (
                      <Tooltip label="Deactivate">
                        <ActionIcon
                          size="sm"
                          color="orange"
                          variant="light"
                          loading={updateProduct.isPending && updateProduct.variables?.id === product.id}
                          onClick={() => handleStatusChange(product, 'inactive')}
                        >
                          ✕
                        </ActionIcon>
                      </Tooltip>
                    )}
                    <Tooltip label="Delete permanently">
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="light"
                        loading={deleteProduct.isPending && deleteProduct.variables === product.id}
                        onClick={() => handleDelete(product)}
                      >
                        🗑
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>

      {!isLoading && filtered.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">No products match the current filters.</Text>
      )}
    </Stack>
  );
}

// ─── Tab 2: Manage Users ──────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('');

  const { data: users, isLoading, isError } = useAdminUsers();
  const updateRole = useAdminUpdateUserRole();

  const filtered = (users ?? []).filter((u) => {
    const term = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.display_name ?? u.full_name ?? '').toLowerCase().includes(term)
    );
  });

  const handleRoleChange = (user: User, role: User['role']) => {
    updateRole.mutate(
      { userId: user.id, role },
      {
        onSuccess: () => notifications.show({ title: 'Role updated', message: `${user.display_name || user.full_name} is now a ${role}`, color: 'green' }),
        onError: () => notifications.show({ title: 'Failed', message: 'Could not update role', color: 'red' }),
      }
    );
  };

  return (
    <Stack gap="md" pt="md">
      <Group>
        <TextInput
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {filtered.length} of {users?.length ?? 0}
        </Text>
      </Group>

      {isError && <Alert color="red">Failed to load users.</Alert>}

      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Joined</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading
            ? <TableSkeleton cols={5} />
            : filtered.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar
                      src={user.avatar_url}
                      size="sm"
                      radius="xl"
                      color={ROLE_COLOR[user.role]}
                    >
                      {(user.display_name || user.full_name)?.[0]?.toUpperCase()}
                    </Avatar>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {user.display_name || user.full_name || '—'}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{user.email}</Text>
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={110}
                    data={[
                      { value: 'buyer', label: 'Buyer' },
                      { value: 'seller', label: 'Seller' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                    value={user.role}
                    onChange={(v) => v && handleRoleChange(user, v as User['role'])}
                    disabled={updateRole.isPending && updateRole.variables?.userId === user.id}
                    styles={{ input: { color: `var(--mantine-color-${ROLE_COLOR[user.role]}-filled)` } }}
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{new Date(user.created_at).toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Button size="compact-xs" variant="subtle" component={Link} to={`/profile/${user.id}`}>
                    View
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>

      {!isLoading && filtered.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">No users match the search.</Text>
      )}
    </Stack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const { data: stats } = useAdminStats();

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Admin Dashboard</Title>
          <Text c="dimmed" size="sm">Manage your marketplace</Text>
        </div>
        {stats && (
          <Group gap="xs">
            <Badge variant="light" color="green">{stats.products.active} active listings</Badge>
            <Badge variant="light" color="yellow">{stats.orders.pending} pending orders</Badge>
          </Group>
        )}
      </Group>

      <Tabs defaultValue="analytics" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
          <Tabs.Tab value="products">
            Products {stats ? `(${stats.products.total})` : ''}
          </Tabs.Tab>
          <Tabs.Tab value="users">
            Users {stats ? `(${stats.users.total})` : ''}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="analytics">
          <AnalyticsTab />
        </Tabs.Panel>

        <Tabs.Panel value="products">
          <ProductsTab />
        </Tabs.Panel>

        <Tabs.Panel value="users">
          <UsersTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
