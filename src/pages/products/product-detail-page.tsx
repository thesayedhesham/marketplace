import { useParams, Link, useNavigate } from 'react-router';
import {
  Container,
  Title,
  Text,
  Image,
  Badge,
  Group,
  Stack,
  Button,
  Paper,
  Textarea,
  Avatar,
  Skeleton,
  Alert,
  Divider,
  Grid,
  ActionIcon,
  Tooltip,
  ThemeIcon,
} from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useProduct } from '@/hooks/use-products';
import { useCreateOrder } from '@/hooks/use-orders';
import { useAuth } from '@/hooks/use-auth';

import '@mantine/carousel/styles.css';

// ─── Skeleton shown while loading ────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <Container size="lg">
      <Skeleton height={16} width={120} mb="lg" />
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Skeleton height={400} radius="md" />
          <Group mt="sm" justify="center" gap="xs">
            {[0, 1, 2].map((i) => <Skeleton key={i} height={64} width={64} radius="sm" />)}
          </Group>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Skeleton height={36} width="70%" />
            <Group>
              <Skeleton height={28} width={90} radius="xl" />
              <Skeleton height={22} width={80} radius="xl" />
              <Skeleton height={22} width={60} radius="xl" />
            </Group>
            <Skeleton height={14} />
            <Skeleton height={14} />
            <Skeleton height={14} width="80%" />
            <Skeleton height={100} radius="md" mt="md" />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

// ─── Photo carousel ───────────────────────────────────────────────────────────

const PLACEHOLDER = 'https://placehold.co/800x500?text=No+Image';

function ProductCarousel({ images, title }: { images: string[]; title: string }) {
  const slides = images.length > 0 ? images : [PLACEHOLDER];

  if (slides.length === 1) {
    return (
      <Image
        src={slides[0]}
        fallbackSrc={PLACEHOLDER}
        alt={title}
        radius="md"
        height={400}
        fit="cover"
      />
    );
  }

  return (
    <Carousel
      withIndicators
      emblaOptions={{ loop: true }}
      height={400}
      styles={{
        indicator: { width: 8, height: 8, transition: 'width 250ms ease' },
        indicators: { bottom: 12 },
      }}
    >
      {slides.map((src, i) => (
        <Carousel.Slide key={i}>
          <Image
            src={src}
            fallbackSrc={PLACEHOLDER}
            alt={`${title} — photo ${i + 1}`}
            height={400}
            fit="cover"
            radius="md"
          />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}

// ─── Status badge colour map ──────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  draft: 'gray',
  inactive: 'orange',
  sold: 'red',
};

// ─── Order request form ───────────────────────────────────────────────────────

function OrderForm({
  productId,
  sellerId,
  price,
}: {
  productId: string;
  sellerId: string;
  price: number;
}) {
  const createOrder = useCreateOrder();
  const form = useForm({ initialValues: { message: '' } });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createOrder.mutateAsync({
        product_id: productId,
        seller_id: sellerId,
        message: values.message || undefined,
        total_price: price,
      });
      notifications.show({
        title: 'Request sent!',
        message: 'The seller will review your request shortly.',
        color: 'green',
      });
      form.reset();
    } catch (err) {
      notifications.show({
        title: 'Request failed',
        message: err instanceof Error ? err.message : 'Something went wrong.',
        color: 'red',
      });
    }
  };

  const openConfirm = () =>
    modals.openConfirmModal({
      title: 'Confirm order request',
      children: (
        <Text size="sm">
          Send a request to the seller for <strong>${price.toFixed(2)}</strong>?
          {form.values.message && (
            <>
              <br /><br />
              <em>"{form.values.message}"</em>
            </>
          )}
        </Text>
      ),
      labels: { confirm: 'Send request', cancel: 'Cancel' },
      confirmProps: { color: 'green' },
      onConfirm: () => form.onSubmit(handleSubmit)(),
    });

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={4} mb="xs">Request this product</Title>
      <Text size="sm" c="dimmed" mb="md">
        Send the seller a message and they'll get back to you.
      </Text>
      <form>
        <Stack gap="sm">
          <Textarea
            placeholder="Add a message to the seller (optional)"
            minRows={3}
            autosize
            {...form.getInputProps('message')}
          />
          <Button
            size="md"
            color="green"
            loading={createOrder.isPending}
            onClick={openConfirm}
          >
            Request — ${price.toFixed(2)}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: product, isLoading, isError, error, refetch } = useProduct(id!);

  if (isLoading) return <ProductDetailSkeleton />;

  if (isError) {
    return (
      <Container size="sm" mt="xl">
        <Alert color="red" title="Failed to load product">
          {error instanceof Error ? error.message : 'Something went wrong.'}
          <Group mt="sm">
            <Button size="xs" variant="light" color="red" onClick={() => refetch()}>
              Retry
            </Button>
            <Button size="xs" variant="subtle" onClick={() => navigate('/products')}>
              Back to products
            </Button>
          </Group>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container size="sm" mt="xl">
        <Alert color="orange" title="Product not found">
          This listing may have been removed or made inactive.
          <Button size="xs" variant="subtle" mt="sm" onClick={() => navigate('/products')}>
            Browse all products
          </Button>
        </Alert>
      </Container>
    );
  }

  const isOwnProduct = user?.id === product.seller_id;
  const canOrder = !!user && !isOwnProduct && product.status === 'active';
  const seller = product.seller;

  return (
    <Container size="lg">
      <Stack gap="xl">
        {/* Breadcrumb nav */}
        <Group gap="xs">
          <Button
            variant="subtle"
            size="sm"
            component={Link}
            to="/products"
            px={0}
          >
            ← Products
          </Button>
          {product.category && (
            <>
              <Text c="dimmed">/</Text>
              <Text size="sm" c="dimmed">{product.category.name}</Text>
            </>
          )}
        </Group>

        <Grid gutter="xl">
          {/* Left: carousel */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="sm">
              <ProductCarousel images={product.images ?? []} title={product.title} />

              {/* Thumbnail strip for multi-image products */}
              {product.images?.length > 1 && (
                <Group gap="xs" justify="center">
                  {product.images.slice(0, 5).map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      fallbackSrc={PLACEHOLDER}
                      alt={`Thumbnail ${i + 1}`}
                      width={64}
                      height={64}
                      fit="cover"
                      radius="sm"
                      style={{ border: '2px solid var(--mantine-color-default-border)', cursor: 'pointer' }}
                    />
                  ))}
                </Group>
              )}
            </Stack>
          </Grid.Col>

          {/* Right: product info */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <div>
                <Title order={2} mb="xs">{product.title}</Title>
                <Group gap="xs" wrap="wrap">
                  <Badge size="xl" color="green" variant="light">
                    ${product.price.toFixed(2)}
                  </Badge>
                  {product.category && (
                    <Badge variant="light" color="blue">
                      {product.category.name}
                    </Badge>
                  )}
                  <Badge
                    variant="dot"
                    color={STATUS_COLOR[product.status] ?? 'gray'}
                  >
                    {product.status}
                  </Badge>
                </Group>
              </div>

              <Divider />

              <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {product.description || 'No description provided.'}
              </Text>

              {product.tags?.length > 0 && (
                <Group gap="xs">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}

              <Text size="xs" c="dimmed">
                Listed {new Date(product.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </Text>

              <Divider />

              {/* Seller card */}
              {seller && (
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Avatar
                        src={seller.avatar_url}
                        alt={seller.display_name || seller.full_name}
                        size="md"
                        radius="xl"
                        color="blue"
                      >
                        {(seller.display_name || seller.full_name)?.[0]?.toUpperCase()}
                      </Avatar>
                      <div>
                        <Text fw={600} size="sm">
                          {seller.display_name || seller.full_name}
                        </Text>
                        <Group gap={4}>
                          <ThemeIcon size="xs" variant="transparent" color="green">
                            ✓
                          </ThemeIcon>
                          <Text size="xs" c="dimmed">Seller</Text>
                        </Group>
                        {seller.bio && (
                          <Text size="xs" c="dimmed" lineClamp={1} maw={200}>
                            {seller.bio}
                          </Text>
                        )}
                      </div>
                    </Group>
                    <Tooltip label="View seller profile">
                      <ActionIcon
                        variant="light"
                        component={Link}
                        to={`/profile/${seller.id}`}
                        aria-label="View seller profile"
                      >
                        →
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Paper>
              )}

              {/* Not-active notice */}
              {product.status !== 'active' && (
                <Alert color="orange" variant="light">
                  This listing is currently <strong>{product.status}</strong> and cannot be ordered.
                </Alert>
              )}

              {/* Own product notice */}
              {isOwnProduct && (
                <Alert color="blue" variant="light">
                  This is your listing.
                  <Button
                    size="xs"
                    variant="light"
                    mt="xs"
                    component={Link}
                    to="/my-listings"
                  >
                    Manage listings
                  </Button>
                </Alert>
              )}
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Order form — below the grid on all screen sizes */}
        {canOrder && (
          <OrderForm
            productId={product.id}
            sellerId={product.seller_id}
            price={product.price}
          />
        )}

        {/* Prompt unauthenticated users */}
        {!user && product.status === 'active' && (
          <Paper withBorder p="lg" radius="md">
            <Group justify="space-between">
              <div>
                <Text fw={500}>Want to request this product?</Text>
                <Text size="sm" c="dimmed">Sign in or create an account to contact the seller.</Text>
              </div>
              <Group>
                <Button variant="default" component={Link} to="/login">Sign in</Button>
                <Button component={Link} to="/register">Register</Button>
              </Group>
            </Group>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
