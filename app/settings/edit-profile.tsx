import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileInput } from '@/schemas/profile.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';

export default function EditProfileScreen() {
  const { profile, updateProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: profile?.first_name ?? '', middleName: profile?.middle_name ?? '', lastName: profile?.last_name ?? '', phone: profile?.phone ?? '', studentId: profile?.student_id ?? '' },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    try { setError(null); await updateProfile(data); router.back(); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6 gap-4">
        <View className="items-center mb-4">
          <Avatar alt={name}>
            <AvatarImage source={{ uri: profile?.avatar_url ?? '' }} />
            <AvatarFallback><Text className="text-white font-bold">{name.slice(0, 2).toUpperCase()}</Text></AvatarFallback>
          </Avatar>
        </View>
        {error && <Text variant="small" className="text-destructive text-center">{error}</Text>}
        <Controller name="firstName" control={control} render={({ field }) => <Input placeholder="First Name" value={field.value} onChangeText={field.onChange} />} />
        <Controller name="middleName" control={control} render={({ field }) => <Input placeholder="Middle Name" value={field.value} onChangeText={field.onChange} />} />
        <Controller name="lastName" control={control} render={({ field }) => <Input placeholder="Last Name" value={field.value} onChangeText={field.onChange} />} />
        <Controller name="phone" control={control} render={({ field }) => <Input placeholder="+63 XXX XXX XXXX" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />} />
        <Controller name="studentId" control={control} render={({ field }) => <Input placeholder="Student ID" value={field.value} onChangeText={field.onChange} />} />
        <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full"><Text>Save Changes</Text></Button>
      </ScrollView>
    </SafeAreaView>
  );
}
