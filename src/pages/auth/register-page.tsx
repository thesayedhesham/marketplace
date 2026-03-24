import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor, Stack, Alert, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '', full_name: '', role: 'buyer' as 'buyer' | 'seller' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
      full_name: (v) => (v.trim().length > 0 ? null : 'Name is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    const { error } = await signUp(values);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate('/');
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Create an account</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have an account?{' '}
        <Anchor component={Link} to="/login" size="sm">Login</Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            <TextInput label="Full Name" placeholder="John Doe" required {...form.getInputProps('full_name')} />
            <TextInput label="Email" placeholder="you@example.com" required {...form.getInputProps('email')} />
            <PasswordInput label="Password" placeholder="Your password" required {...form.getInputProps('password')} />
            <Select
              label="I want to"
              data={[
                { value: 'buyer', label: 'Buy products' },
                { value: 'seller', label: 'Sell products' },
              ]}
              {...form.getInputProps('role')}
            />
            <Button type="submit" fullWidth loading={loading}>Create account</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
