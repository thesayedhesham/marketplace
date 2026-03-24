import { TextInput, Textarea, NumberInput, Select, Button, Container, Title, Stack, TagsInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { useCreateProduct, useCategories } from '@/hooks/use-products';
import { useAuth } from '@/hooks/use-auth';

export function CreateProductPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();

  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      price: 0,
      category_id: '',
      tags: [] as string[],
      images: [] as string[],
    },
    validate: {
      title: (v) => (v.trim().length > 0 ? null : 'Title is required'),
      description: (v) => (v.trim().length > 0 ? null : 'Description is required'),
      price: (v) => (v > 0 ? null : 'Price must be greater than 0'),
      category_id: (v) => (v ? null : 'Category is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;
    try {
      const product = await createProduct.mutateAsync({
        ...values,
        seller_id: user.id,
        status: 'active',
      });
      notifications.show({ title: 'Success', message: 'Product created!', color: 'green' });
      navigate(`/products/${product.id}`);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to create product', color: 'red' });
    }
  };

  return (
    <Container size="sm">
      <Title order={2} mb="lg">Create New Listing</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Title" placeholder="Product title" required {...form.getInputProps('title')} />
          <Textarea label="Description" placeholder="Describe your product" required minRows={4} {...form.getInputProps('description')} />
          <NumberInput label="Price" placeholder="0.00" required min={0} decimalScale={2} prefix="$" {...form.getInputProps('price')} />
          <Select label="Category" placeholder="Select category" required data={categoryOptions} {...form.getInputProps('category_id')} />
          <TagsInput label="Tags" placeholder="Add tags" {...form.getInputProps('tags')} />
          <Button type="submit" loading={createProduct.isPending}>Create Listing</Button>
        </Stack>
      </form>
    </Container>
  );
}
