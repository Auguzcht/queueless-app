import { useEffect, useState, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileInput } from '@/schemas/profile.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, Camera, Lock, Users, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { profileService } from '@/services/profile.service';

export default function EditProfileScreen() {
  const { profile, studentProfile, guardianInfo, updateProfile, refreshExtendedProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkLookup, setLinkLookup] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  const { control, handleSubmit, formState: { isSubmitting, dirtyFields } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: profile?.first_name ?? '',
      middleName: profile?.middle_name ?? '',
      lastName: profile?.last_name ?? '',
      suffix: profile?.suffix ?? '',
      phone: profile?.phone ?? '',
    },
  });

  useEffect(() => {
    if (profile?.id) refreshExtendedProfile();
  }, [profile?.id]);

  useEffect(() => {
    const hasChanges = Object.keys(dirtyFields).length > 0;
    setDirty(hasChanges);
  }, [dirtyFields]);

  // Unsaved changes prompt on back
  const handleBack = useCallback(() => {
    if (dirty) {
      if (Platform.OS === 'ios') {
        Alert.alert('Unsaved Changes', 'You have unsaved changes. Discard them?', [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Unsaved Changes', 'You have unsaved changes. Discard them?', [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]);
      }
    } else {
      router.back();
    }
  }, [dirty]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Allow access to your photo library to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        await profileService.uploadAvatar(profile!.id, result.assets[0].uri);
        await useAuthStore.getState().fetchProfile();
      } catch (err: any) {
        Alert.alert('Upload Failed', err.message || 'Could not upload photo. Please try again.');
      }
      setUploading(false);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setError(null);
    try {
      if (!profile?.id) {
        setError('Profile not loaded. Please try again.');
        return;
      }
      await new Promise((r) => setTimeout(r, 1200));
      await updateProfile(data);
      setDirty(false);
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (err: any) {
      const msg = err.issues ? err.issues.map((i: any) => i.message).join(', ') : err.message;
      setError(msg || 'Failed to save changes. Please try again.');
    }
  };

  const isBusy = isSubmitting || uploading;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Edit Profile',
        headerLeft: () => (
          <TouchableOpacity onPress={handleBack} style={{ paddingLeft: 5 }}>
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8F9FA' },
        headerTintColor: '#111827',
        headerBackTitleVisible: false,
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} disabled={isBusy}>
          {uploading ? (
            <View style={[styles.avatar, styles.avatarUploading]}>
              <ActivityIndicator size="small" color="#004E98" />
            </View>
          ) : (
            <View>
              <Avatar alt={name} style={styles.avatar}>
                <AvatarImage source={{ uri: profile?.avatar_url ?? '' }} />
                <AvatarFallback style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
                </AvatarFallback>
              </Avatar>
              <View style={styles.cameraBadge}>
                <Icon as={Camera} size={14} color="#FFFFFF" />
              </View>
            </View>
          )}
          <Text style={styles.changePhotoText}>Change profile photo</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── SECTION: Account Info (locked) ─────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon as={Lock} size={16} color="#9CA3AF" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <LockedRow label="Account ID" value={profile?.id ?? ''} mono />
          <LockedRow label="Account Type" value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''} />
          <LockedRow label="Email" value={useAuthStore.getState().session?.user?.email ?? ''} />
          <LockedRow label="Verified" value={profile?.is_verified ? 'Yes' : 'No'} />

          {profile?.role === 'student' && studentProfile && (
            <>
              <LockedRow label="Student ID" value={studentProfile.student_id} />
              <LockedRow label="Education Level" value={studentProfile.education_level.replace(/_/g, ' ')} />
              <LockedRow label="Year Level" value={studentProfile.year_level.replace(/_/g, ' ')} />
              {studentProfile.college_name && <LockedRow label="College" value={studentProfile.college_name} />}
              {studentProfile.program_name && <LockedRow label="Program" value={studentProfile.program_name} />}
            </>
          )}

          {profile?.role === 'parent' && guardianInfo && (
            <>
              <LockedRow label="Linked Student" value={guardianInfo.student_name ?? guardianInfo.linked_student_id} />
              {guardianInfo.relationship && <LockedRow label="Guardian Role" value={guardianInfo.relationship} />}
            </>
          )}
        </View>

        {/* ── SECTION: Personal Info (editable) ──────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon as={Users} size={16} color="#6B7280" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <Text style={styles.label}>FIRST NAME</Text>
          <Controller name="firstName" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <Input placeholder={profile?.first_name ?? 'First Name'} value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />

          <Text style={styles.label}>MIDDLE NAME</Text>
          <Controller name="middleName" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <Input placeholder={profile?.middle_name ?? 'Middle Name'} value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />

          <Text style={styles.label}>LAST NAME</Text>
          <Controller name="lastName" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <Input placeholder={profile?.last_name ?? 'Last Name'} value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />

          <Text style={styles.label}>SUFFIX</Text>
          <Controller name="suffix" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <Input placeholder={profile?.suffix ?? 'e.g. Jr., III'} value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />

          <Text style={styles.label}>PHONE NUMBER</Text>
          <Controller name="phone" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.countryCode}>
                <Text style={{ fontSize: 14, color: '#111827' }}>🇵🇭 +63</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="9XX XXX XXXX"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={value}
                  onChangeText={(v) => {
                    const n = v.replace(/[^0-9]/g, '');
                    onChange(n);
                  }}
                  onBlur={onBlur}
                />
              </View>
            </View>
          )} />
        </View>

        <View style={styles.btnWrap}>
          <Button onPress={handleSubmit(onSubmit)} disabled={isBusy || !dirty} className="w-full">
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text>Save Changes</Text>
            )}
          </Button>
        </View>

        {/* ── SECTION: Link Student (parent only) ──────────── */}
        {profile?.role === 'parent' && !guardianInfo && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon as={Users} size={16} color="#6B7280" />
              <Text style={styles.sectionTitle}>Link to a Student</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, fontFamily: 'Inter-Regular' }}>
              Enter your child's student ID to connect accounts.
            </Text>

            <View style={{ position: 'relative' }}>
              <Input
                placeholder="Student ID (e.g. 2021120266)"
                keyboardType="number-pad"
                maxLength={10}
                value={linkStudentId}
                onChangeText={(v) => {
                  const id = v.replace(/[^0-9]/g, '');
                  setLinkStudentId(id);
                  if (lookupTimer.current) clearTimeout(lookupTimer.current);
                  if (id.length !== 10) { setLinkLookup('idle'); return; }
                  lookupTimer.current = setTimeout(async () => {
                    const { data } = await supabase.rpc('fn_find_student_by_id', { p_student_id: id }).maybeSingle();
                    setLinkLookup(data ? 'found' : 'not_found');
                  }, 500);
                }}
              />
              {linkStudentId.length === 10 && (
                <View style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
                  {linkLookup === 'found' ? (
                    <Icon as={CheckCircle2} size={22} color="#22C55E" />
                  ) : linkLookup === 'not_found' ? (
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 18 }}>✕</Text>
                  ) : null}
                </View>
              )}
            </View>
            {linkLookup === 'found' && <Text style={{ color: '#22C55E', fontSize: 12, marginTop: 4 }}>Student found ✓</Text>}
            {linkLookup === 'not_found' && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>No student found with that ID</Text>}
            {linkError && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{linkError}</Text>}

            <TouchableOpacity
              onPress={async () => {
                if (linkLookup !== 'found' || linking) return;
                setLinkError(null);
                setLinking(true);
                try {
                  await profileService.linkStudent(profile!.id, linkStudentId);
                  await refreshExtendedProfile();
                  setLinkStudentId('');
                  setLinkLookup('idle');
                } catch (err: any) {
                  setLinkError(err.message || 'Failed to link student.');
                }
                setLinking(false);
              }}
              disabled={linkLookup !== 'found' || linking}
              style={{
                backgroundColor: linkLookup === 'found' ? '#004E98' : '#D1D5DB',
                borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                {linking ? 'Linking...' : 'Link Student'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Password hint */}
        <View style={styles.passwordHint}>
          <Text style={styles.passwordHintText}>Want to change your password? </Text>
          <TouchableOpacity onPress={() => router.push('/settings/privacy')}>
            <Text style={{ fontSize: 12, color: '#004E98', fontWeight: '600', fontFamily: 'Inter-SemiBold' }}>Privacy & Security</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function LockedRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.lockedRow}>
      <Text style={styles.lockedLabel}>{label}</Text>
      <View style={styles.lockedValueWrap}>
        <Text style={styles.lockedValue} numberOfLines={1} ellipsizeMode="middle">
          {value}
        </Text>
        <Icon as={Lock} size={12} color="#D1D5DB" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatar: { width: 80, height: 80, overflow: 'hidden' },
  avatarUploading: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5E7EB' },
  avatarFallback: { backgroundColor: '#004E98', borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 22 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#004E98', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F8F9FA',
  },
  changePhotoText: { fontSize: 12, color: '#004E98', fontWeight: '600', marginTop: 6, fontFamily: 'Inter-SemiBold' },
  errorBanner: {
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontFamily: 'Inter-Regular' },
  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#111827', fontFamily: 'Inter-SemiBold' },
  lockedRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  lockedLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter-Regular', flexShrink: 0, marginRight: 8 },
  lockedValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  lockedValue: { fontSize: 13, color: '#111827', fontFamily: 'Inter-Medium', textAlign: 'right', maxWidth: 180 },
  label: {
    fontSize: 11, lineHeight: 16, includeFontPadding: false, color: '#6B7280',
    fontWeight: '600', marginBottom: 4, marginTop: 12, letterSpacing: 0.5, fontFamily: 'Inter-SemiBold',
  },
  countryCode: {
    height: 48, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  btnWrap: { marginTop: 24 },
  passwordHint: { marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  passwordHintText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' },
});
