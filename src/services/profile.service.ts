import { supabase } from '@/lib/supabase';
import { updateProfileSchema, profileResponseSchema, type UpdateProfileInput, type ProfileResponse } from '@/schemas/profile.schema';
import { AppError, ValidationError } from '@/types/errors';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface StudentProfileInfo {
  student_id: string;
  education_level: string;
  year_level: string;
  college_name?: string;
  college_code?: string;
  program_name?: string;
  program_code?: string;
}

export interface GuardianInfo {
  linked_student_id: string;
  relationship: string | null;
  student_name?: string;
}

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
    if (parsed.suffix !== undefined) updateData.suffix = parsed.suffix === '' ? null : parsed.suffix;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw new AppError(error.message, 'PROFILE_UPDATE_ERROR');
  },

  async getStudentProfile(profileId: string): Promise<StudentProfileInfo | null> {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('student_id, education_level, year_level, colleges(name, code), programs(name, code)')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw new AppError(error.message, 'STUDENT_PROFILE_FETCH_ERROR');
    if (!data) return null;

    return {
      student_id: data.student_id,
      education_level: data.education_level,
      year_level: data.year_level,
      college_name: (data as any).colleges?.name ?? undefined,
      college_code: (data as any).colleges?.code ?? undefined,
      program_name: (data as any).programs?.name ?? undefined,
      program_code: (data as any).programs?.code ?? undefined,
    };
  },

  async getGuardianInfo(profileId: string): Promise<GuardianInfo | null> {
    const { data, error } = await supabase
      .from('student_guardians')
      .select('student_id, relationship')
      .eq('guardian_id', profileId)
      .maybeSingle();

    if (error) throw new AppError(error.message, 'GUARDIAN_FETCH_ERROR');
    if (!data) return null;

    // Get student profile details
    const { data: sp } = await supabase
      .from('student_profiles')
      .select('student_id, profile_id')
      .eq('id', data.student_id)
      .maybeSingle();

    let studentName: string | undefined;
    if (sp?.profile_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', sp.profile_id)
        .maybeSingle();
      if (prof) {
        studentName = `${prof.first_name} ${prof.last_name}`;
      }
    }

    return {
      linked_student_id: sp?.student_id ?? data.student_id,
      relationship: data.relationship,
      student_name: studentName,
    };
  },

  async linkStudent(guardianId: string, studentId: string, relationship: string = 'guardian') {
    // Resolve student_profiles.id from student_id
    const { data: sp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (!sp) throw new AppError('Student not found with that ID', 'STUDENT_NOT_FOUND');

    const { error } = await supabase
      .from('student_guardians')
      .insert({ guardian_id: guardianId, student_id: sp.id, relationship, is_primary: true })
      .single();

    if (error) throw new AppError(error.message, 'LINK_STUDENT_ERROR');
  },

  async updateRelationship(profileId: string, relationship: string) {
    const { error } = await supabase
      .from('student_guardians')
      .update({ relationship })
      .eq('guardian_id', profileId);

    if (error) throw new AppError(error.message, 'RELATIONSHIP_UPDATE_ERROR');
  },

  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    // Validate image type
    const ext = imageUri.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      throw new AppError('Invalid image format. Use JPG, PNG, WebP, or GIF.', 'INVALID_IMAGE');
    }

    const response = await fetch(imageUri);
    const blob = await response.blob();

    if (blob.size > 5 * 1024 * 1024) {
      throw new AppError('Image too large. Maximum size is 5MB.', 'IMAGE_TOO_LARGE');
    }

    const contentType = blob.type;
    if (!contentType.startsWith('image/')) {
      throw new AppError('Uploaded file is not a valid image.', 'INVALID_IMAGE');
    }

    // Fetch old avatar URL before overwriting
    const { data: oldProfile } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
    const oldUrl = oldProfile?.avatar_url;

    const storageRef = ref(storage, `QueueLess/avatars/${userId}/${Date.now()}.jpg`);

    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    const downloadUrl = await getDownloadURL(storageRef);

    // Update profile with new avatar URL
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: downloadUrl })
      .eq('id', userId);

    if (error) throw new AppError('Failed to save avatar URL', 'PROFILE_UPDATE_ERROR');

    // Delete old avatar from Firebase (best-effort — new image is already saved)
    if (oldUrl && oldUrl.includes('firebasestorage.googleapis.com') && oldUrl !== downloadUrl) {
      try {
        const oldRef = ref(storage, oldUrl);
        await deleteObject(oldRef);
      } catch {} // Fail silently — orphaned file is acceptable
    }

    return downloadUrl;
  },
};
