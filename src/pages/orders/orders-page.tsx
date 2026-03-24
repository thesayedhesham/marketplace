import { Title, Stack, Tabs, Table, Badge, Button, Text, Group } from '@mantine/core';
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router';
import { LoadingScreen } from '@/components/common/loading-screen';
import type { Order } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  accepted: 'green',
  rejected: 'red',
  completed: 'blue',
  cancelled: 'gray',
};

function OrderTable({ orders, role }: { orders: Order[]; role: 'buyer' | 'seller' }) {
  const updateStatus = useUpdateOrderStatus();

  const handleStatus = async (id: string, status: Order['status']) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      notifications.show({ title: 'Updated', message: `Order ${status}`, color: 'green' });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update order', color: 'red' });
    }
  };

  if (orders.length === 0) return <Text c="dimmed">No orders found.</Text>;

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Product</Table.Th>
          <Table.Th>{role === 'buyer' ? 'Seller' : 'Buyer'}</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Date</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {orders.map((order) => (
          <Table.Tr key={order.id}>
            <Table.Td>
              <Button variant="subtle" size="compact-sm" component={Link} to={`/products/${order.product_id}`}>
                {order.product?.title ?? 'Unknown'}
              </Button>
            </Table.Td>
            <Table.Td>{role === 'buyer' ? order.seller?.full_name : order.buyer?.full_name}</Table.Td>
            <Table.Td>${order.total_price.toFixed(2)}</Table.Td>
            <Table.Td><Badge color={statusColors[order.status]}>{order.status}</Badge></Table.Td>
            <Table.Td>{new Date(order.created_at).toLocaleDateString()}</Table.Td>
            <Table.Td>
              {role === 'seller' && order.status === 'pending' && (
                <Group gap="xs">
                  <Button size="xs" color="green" onClick={() => handleStatus(order.id, 'accepted')}>Accept</Button>
                  <Button size="xs" color="red" variant="light" onClick={() => handleStatus(order.id, 'rejected')}>Reject</Button>
                </Group>
              )}
              {role === 'buyer' && order.status === 'pending' && (
                <Button size="xs" color="gray" variant="light" onClick={() => handleStatus(order.id, 'cancelled')}>Cancel</Button>
              )}
              {order.status === 'accepted' && (
                <Button size="xs" color="blue" onClick={() => handleStatus(order.id, 'completed')}>Complete</Button>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function OrdersPage() {
  const { data: buyerOrders, isLoading: buyerLoading } = useOrders('buyer');
  const { data: sellerOrders, isLoading: sellerLoading } = useOrders('seller');

  if (buyerLoading || sellerLoading) return <LoadingScreen />;

  return (
    <Stack>
      <Title order={2}>My Orders</Title>
      <Tabs defaultValue="purchases">
        <Tabs.List>
          <Tabs.Tab value="purchases">Purchases ({buyerOrders?.length ?? 0})</Tabs.Tab>
          <Tabs.Tab value="sales">Sales ({sellerOrders?.length ?? 0})</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="purchases" pt="md">
          <OrderTable orders={buyerOrders ?? []} role="buyer" />
        </Tabs.Panel>
        <Tabs.Panel value="sales" pt="md">
          <OrderTable orders={sellerOrders ?? []} role="seller" />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
