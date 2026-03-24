import { useParams } from 'react-router';
import { Container, Title, Text, Stack, Avatar, Group, Paper } from '@mantine/core';
import { useProfile } from '@/hooks/use-profiles';
import { useProducts } from '@/hooks/use-products';
import { LoadingScreen } from '@/components/common/loading-screen';
import { Grid, Card, Badge, Image, Button } from '@mantine/core';
import { Link } from 'react-router';

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: profile, isLoading: profileLoading } = useProfile(userId!);
  const { data: products, isLoading: productsLoading } = useProducts({ seller_id: userId });

  if (profileLoading || productsLoading) return <LoadingScreen />;
  if (!profile) return <Text>User not found</Text>;

  return (
    <Container size="lg">
      <Stack>
        <Paper withBorder p="xl" radius="md">
          <Group>
            <Avatar size="xl" radius="xl" />
            <div>
              <Title order={3}>{profile.full_name}</Title>
              <Badge>{profile.role}</Badge>
              {profile.bio && <Text mt="xs">{profile.bio}</Text>}
              <Text size="sm" c="dimmed" mt="xs">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </div>
          </Group>
        </Paper>

        {products && products.data.length > 0 && (
          <>
            <Title order={3}>Listings</Title>
            <Grid>
              {products.data.map((product) => (
                <Grid.Col key={product.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Card.Section>
                      <Image
                        src={product.images?.[0] ?? 'https://placehold.co/300x200?text=No+Image'}
                        height={160}
                        alt={product.title}
                      />
                    </Card.Section>
                    <Group justify="space-between" mt="md" mb="xs">
                      <Text fw={500} lineClamp={1}>{product.title}</Text>
                      <Badge color="green">${product.price.toFixed(2)}</Badge>
                    </Group>
                    <Button component={Link} to={`/products/${product.id}`} variant="light" fullWidth mt="md">
                      View
                    </Button>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </>
        )}
      </Stack>
    </Container>
  );
}
