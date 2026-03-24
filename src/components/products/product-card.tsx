import { Card, Image, Text, Badge, Button, Group, Skeleton, Stack } from '@mantine/core';
import { Link } from 'react-router';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Card.Section>
        <Image
          src={product.images?.[0] ?? null}
          fallbackSrc="https://placehold.co/300x200?text=No+Image"
          height={180}
          alt={product.title}
        />
      </Card.Section>

      <Stack gap="xs" mt="md" style={{ flex: 1 }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={600} size="sm" lineClamp={2} style={{ flex: 1 }}>
            {product.title}
          </Text>
          <Badge color="green" variant="light" size="lg" style={{ whiteSpace: 'nowrap' }}>
            ${product.price.toFixed(2)}
          </Badge>
        </Group>

        {product.category && (
          <Badge variant="dot" color="blue" size="sm">
            {product.category.name}
          </Badge>
        )}

        <Text size="xs" c="dimmed" lineClamp={2} style={{ flex: 1 }}>
          {product.description || 'No description provided.'}
        </Text>

        {product.seller && (
          <Text size="xs" c="dimmed">
            by {product.seller.display_name || product.seller.full_name}
          </Text>
        )}
      </Stack>

      <Button
        component={Link}
        to={`/products/${product.id}`}
        variant="light"
        fullWidth
        mt="md"
        size="sm"
      >
        View Details
      </Button>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
      <Card.Section>
        <Skeleton height={180} />
      </Card.Section>
      <Stack gap="xs" mt="md">
        <Group justify="space-between">
          <Skeleton height={16} width="60%" />
          <Skeleton height={22} width="20%" radius="xl" />
        </Group>
        <Skeleton height={14} width="30%" radius="xl" />
        <Skeleton height={12} />
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="40%" />
        <Skeleton height={32} mt="xs" radius="md" />
      </Stack>
    </Card>
  );
}
