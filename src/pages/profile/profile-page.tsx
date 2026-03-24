import { TextInput, Textarea, Button, Container, Title, Stack, Paper, Avatar, Group, Text, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/use-profiles';
import { LoadingScreen } from '@/components/common/loading-screen';

export function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useCurrentProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm({
    initialValues: {
      display_name: profile?.display_name ?? '',
      full_name: profile?.full_name ?? '',
      bio: profile?.bio ?? '',
      role: profile?.role ?? 'buyer',
    },
  });

  // Sync form when profile loads
  if (profile && form.values.full_name === '' && profile.full_name) {
    form.setValues({
      display_name: profile.display_name,
      full_name: profile.full_name,
      bio: profile.bio ?? '',
      role: profile.role,
    });
  }

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;
    try {
      await updateProfile.mutateAsync({ userId: user.id, updates: values });
      notifications.show({ title: 'Success', message: 'Profile updated', color: 'green' });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update profile', color: 'red' });
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <Container size="sm">
      <Title order={2} mb="lg">My Profile</Title>

      <Paper withBorder p="xl" radius="md" mb="lg">
        <Group>
          <Avatar size="xl" radius="xl" />
          <div>
            <Text fw={500} size="lg">{profile?.display_name || profile?.full_name}</Text>
            <Text c="dimmed">{user?.email}</Text>
          </div>
        </Group>
      </Paper>

      <Paper withBorder p="xl" radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Display Name" placeholder="How others see you" required {...form.getInputProps('display_name')} />
            <TextInput label="Full Name" required {...form.getInputProps('full_name')} />
            <Textarea label="Bio" placeholder="Tell us about yourself" minRows={3} {...form.getInputProps('bio')} />
            <Select
              label="Role"
              data={[
                { value: 'buyer', label: 'Buyer' },
                { value: 'seller', label: 'Seller' },
              ]}
              {...form.getInputProps('role')}
            />
            <Button type="submit" loading={updateProfile.isPending}>Save Changes</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
