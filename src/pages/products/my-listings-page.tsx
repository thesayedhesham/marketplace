import { Title, Stack, Table, Badge, Button, Group, Text } from '@mantine/core';
import { Link } from 'react-router';
import { useProducts } from '@/hooks/use-products';
import { useAuth } from '@/hooks/use-auth';
import { LoadingScreen } from '@/components/common/loading-screen';

const statusColors: Record<string, string> = {
  active: 'green',
  draft: 'gray',
  inactive: 'yellow',
  sold: 'blue',
};

export function MyListingsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useProducts({ seller_id: user?.id, status: undefined });

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>My Listings</Title>
        <Button component={Link} to="/products/new">Create New Listing</Button>
      </Group>

      {data && data.data.length === 0 ? (
        <Text c="dimmed">You haven't created any listings yet.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Price</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((product) => (
              <Table.Tr key={product.id}>
                <Table.Td>{product.title}</Table.Td>
                <Table.Td>${product.price.toFixed(2)}</Table.Td>
                <Table.Td><Badge color={statusColors[product.status]}>{product.status}</Badge></Table.Td>
                <Table.Td>{new Date(product.created_at).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Button size="xs" variant="light" component={Link} to={`/products/${product.id}`}>
                    View
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
