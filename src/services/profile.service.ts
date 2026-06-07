import { supabase } from '@/lib/supabase';
import { updateProfileSchema, profileResponseSchema, type UpdateProfileInput, type ProfileResponse } from '@/schemas/profile.schema';
import { AppError, ValidationError } from '@/types/errors';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const profileService = {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new AppError(error.message, 'PROFILE_FETCH_ERROR');
    return profileResponseSchema.parse(data);
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const parsed = updateProfileSchema.parse(input);

    const updateData: Record<string, any> = {};
    if (parsed.firstName !== undefined) updateData.first_name = parsed.firstName;
    if (parsed.middleName !== undefined) updateData.middle_name = parsed.middleName === '' ? null : parsed.middleName;
    if (parsed.lastName !== undefined) updateData.last_name = parsed.lastName;
    if (parsed.phone !== undefined) updateData.phone = parsed.phone;
    if (parsed.studentId !== undefined) updateData.student_id = parsed.studentId;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw new AppError(error.message, 'PROFILE_UPDATE_ERROR');
  },

  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `avatars/${userId}/${Date.now()}.jpg`);

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    // Update profile with new avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: downloadUrl })
      .eq('id', userId);

    return downloadUrl;
  },
};
