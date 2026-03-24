import { useState, useCallback } from 'react';
import {
  Grid,
  TextInput,
  Group,
  Title,
  Stack,
  Text,
  Pagination,
  Chip,
  RangeSlider,
  Select,
  Alert,
  Button,
  Badge,
  Paper,
  Divider,
  ActionIcon,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useProducts, useCategories, useMaxPrice } from '@/hooks/use-products';
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';
import type { ProductFilters } from '@/types';

const PRICE_STEP = 50;
const SKELETON_COUNT = 8;

function FilterPanel({
  filters,
  search,
  priceRange,
  maxPrice,
  onSearch,
  onCategory,
  onPriceRange,
  onSort,
  onReset,
}: {
  filters: ProductFilters;
  search: string;
  priceRange: [number, number];
  maxPrice: number;
  onSearch: (v: string) => void;
  onCategory: (v: string) => void;
  onPriceRange: (v: [number, number]) => void;
  onSort: (v: string) => void;
  onReset: () => void;
}) {
  const { data: categories } = useCategories();

  const hasActiveFilters =
    search ||
    filters.category_id ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice;

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        {/* Search */}
        <TextInput
          placeholder="Search products…"
          value={search}
          onChange={(e) => onSearch(e.currentTarget.value)}
          rightSection={
            search ? (
              <ActionIcon variant="subtle" size="sm" onClick={() => onSearch('')}>
                ✕
              </ActionIcon>
            ) : null
          }
        />

        {/* Category chips */}
        <div>
          <Text size="sm" fw={500} mb="xs">Category</Text>
          <Chip.Group
            value={filters.category_id ?? 'all'}
            onChange={(v) => onCategory(v as string)}
          >
            <Group gap="xs">
              <Chip value="all" size="sm">All</Chip>
              {(categories ?? []).map((cat) => (
                <Chip key={cat.id} value={cat.id} size="sm">
                  {cat.name}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>

        <Divider />

        {/* Price range slider */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>Price Range</Text>
            <Text size="sm" c="dimmed">
              ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}
            </Text>
          </Group>
          <RangeSlider
            min={0}
            max={maxPrice}
            step={PRICE_STEP}
            value={priceRange}
            onChange={onPriceRange}
            label={(v) => `$${v.toLocaleString()}`}
            minRange={PRICE_STEP}
            mb="xs"
          />
        </div>

        <Divider />

        {/* Sort + reset row */}
        <Group justify="space-between">
          <Select
            size="sm"
            placeholder="Sort by"
            style={{ flex: 1 }}
            data={[
              { value: 'created_at_desc', label: 'Newest first' },
              { value: 'created_at_asc', label: 'Oldest first' },
              { value: 'price_asc', label: 'Price: low to high' },
              { value: 'price_desc', label: 'Price: high to low' },
              { value: 'title_asc', label: 'Title A–Z' },
            ]}
            value={`${filters.sort_by ?? 'created_at'}_${filters.sort_order ?? 'desc'}`}
            onChange={(v) => v && onSort(v)}
          />
          {hasActiveFilters && (
            <Button variant="subtle" size="sm" color="gray" onClick={onReset}>
              Clear all
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

export function ProductListPage() {
  const { data: maxPriceData } = useMaxPrice();
  const maxPrice = maxPriceData ?? 10000;

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 350);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    per_page: 12,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // Merge debounced search + price range into filters passed to the query
  const activeFilters: ProductFilters = {
    ...filters,
    search: debouncedSearch || undefined,
    min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
    max_price: priceRange[1] < maxPrice ? priceRange[1] : undefined,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts(activeFilters);

  const resetToPage1 = useCallback(
    <T,>(updater: (prev: ProductFilters) => T extends ProductFilters ? T : ProductFilters) =>
      setFilters((prev) => ({ ...(updater(prev) as ProductFilters), page: 1 })),
    []
  );

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setFilters((f) => ({ ...f, page: 1 }));
  }, []);

  const handleCategory = useCallback((v: string) => {
    resetToPage1((f) => ({ ...f, category_id: v === 'all' ? undefined : v }));
  }, [resetToPage1]);

  const handlePriceRange = useCallback((v: [number, number]) => {
    setPriceRange(v);
    setFilters((f) => ({ ...f, page: 1 }));
  }, []);

  const handleSort = useCallback((v: string) => {
    const [sort_by, sort_order] = v.split('_') as [ProductFilters['sort_by'], ProductFilters['sort_order']];
    setFilters((f) => ({ ...f, sort_by, sort_order, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setSearch('');
    setPriceRange([0, maxPrice]);
    setFilters({ page: 1, per_page: 12, sort_by: 'created_at', sort_order: 'desc' });
  }, [maxPrice]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={2}>Browse Products</Title>
        {data && (
          <Badge variant="light" size="lg">
            {data.count} {data.count === 1 ? 'product' : 'products'}
          </Badge>
        )}
        {isFetching && !isLoading && (
          <Text size="xs" c="dimmed">Updating…</Text>
        )}
      </Group>

      <FilterPanel
        filters={filters}
        search={search}
        priceRange={priceRange}
        maxPrice={maxPrice}
        onSearch={handleSearch}
        onCategory={handleCategory}
        onPriceRange={handlePriceRange}
        onSort={handleSort}
        onReset={handleReset}
      />

      {/* Error state */}
      {isError && (
        <Alert color="red" title="Failed to load products">
          {(error as Error)?.message ?? 'Something went wrong.'}
          <Button size="xs" variant="light" color="red" mt="xs" onClick={() => refetch()}>
            Try again
          </Button>
        </Alert>
      )}

      {/* Product grid */}
      <Grid>
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductCardSkeleton />
              </Grid.Col>
            ))
          : data?.data.map((product) => (
              <Grid.Col key={product.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductCard product={product} />
              </Grid.Col>
            ))}
      </Grid>

      {/* Empty state */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Stack align="center" py="xl" gap="sm">
          <Text size="xl">🔍</Text>
          <Text fw={500}>No products found</Text>
          <Text size="sm" c="dimmed">Try adjusting your search or filters</Text>
          <Button variant="light" size="sm" onClick={handleReset}>
            Clear filters
          </Button>
        </Stack>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            total={data.total_pages}
            value={data.page}
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
            withEdges
          />
        </Group>
      )}
    </Stack>
  );
}
