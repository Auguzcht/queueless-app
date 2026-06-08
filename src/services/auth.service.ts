import { supabase } from '@/lib/supabase';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@/schemas/auth.schema';
import { profileResponseSchema, type ProfileResponse } from '@/schemas/profile.schema';
import { AuthError, ValidationError } from '@/types/errors';

export const authService = {
  async signInWithEmail(input: LoginInput) {
    const parsed = loginSchema.parse(input);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    });

    if (error) throw new AuthError(error.message, 'INVALID_CREDENTIALS');
    return data;
  },

  async signUpWithEmail(input: RegisterInput) {
    const parsed = registerSchema.parse(input);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: {
          first_name: parsed.firstName,
          middle_name: parsed.middleName ?? '',
          last_name: parsed.lastName,
          user_type: parsed.userType ?? 'student',
          student_id: parsed.studentId ?? '',
          parent_student_id: parsed.parentStudentId ?? '',
          education_level: parsed.educationLevel ?? '',
          year_level: parsed.yearLevel ?? '',
          college_id: parsed.collegeId ?? '',
          program_id: parsed.programId ?? '',
        },
      },
    });

    if (error) throw new AuthError(error.message, 'REGISTRATION_FAILED');
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new AuthError(error.message);
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new AuthError(error.message);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new AuthError(error.message);
    return data.session;
  },

  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};
