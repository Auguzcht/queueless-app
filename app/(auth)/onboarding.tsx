import { useState, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Confetti } from '@/components/ui/confetti';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { authService } from '@/services/auth.service';
import { profileService } from '@/services/profile.service';
import { supabase } from '@/lib/supabase';


import { router } from 'expo-router';
import { ChevronRight, CheckCircle2, GraduationCap, Users, School, BookOpen, Eye, EyeOff, Camera } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { PasswordStrength } from '@/components/ui/password-strength';

type UserType = 'student' | 'parent';
type EduLevel = 'junior_high' | 'senior_high' | 'college';
type YearLvl = 'grade_7' | 'grade_8' | 'grade_9' | 'grade_10' | 'grade_11' | 'grade_12'
  | 'first_year' | 'second_year' | 'third_year' | 'fourth_year' | 'fifth_year';

interface OnboardingData {
  userType: UserType | null;
  firstName: string; middleName: string; lastName: string; suffix: string;
  email: string; phone: string; studentId: string;
  educationLevel: EduLevel | null; yearLevel: YearLvl | null;
  collegeId: string | null; programId: string | null;
  parentStudentId: string;
  relationship: string;
  password: string; confirmPassword: string;
  avatarUri: string | null;
}

const COLLEGES = [
  { id: 'c1000000-0000-0000-0000-000000000001', name: 'College of Computer and Information Science' },
  { id: 'c1000000-0000-0000-0000-000000000002', name: 'College of Engineering and Architecture' },
  { id: 'c1000000-0000-0000-0000-000000000003', name: 'Alfonso T. Yuchengco College of Business' },
  { id: 'c1000000-0000-0000-0000-000000000004', name: 'College of Arts and Science' },
  { id: 'c1000000-0000-0000-0000-000000000005', name: 'College of Health Sciences' },
];

const PROGRAMS: Record<string, string[]> = {
  'c1000000-0000-0000-0000-000000000001': ['BSCS', 'BSEMC', 'BSIS'],
  'c1000000-0000-0000-0000-000000000002': ['BSArch', 'BSChE', 'BSCE', 'BSCpE', 'BSEE', 'BSECE', 'BSIE', 'BSME'],
  'c1000000-0000-0000-0000-000000000003': ['BSEntrep', 'BSMA', 'BSREM', 'BSTM', 'BSA', 'BSAIS'],
  'c1000000-0000-0000-0000-000000000004': ['BAC', 'BMA'],
  'c1000000-0000-0000-0000-000000000005': ['BSBioMed', 'BSPharm', 'BSPsych', 'BSPT', 'BSMT'],
};

const JHS_YEARS: YearLvl[] = ['grade_7', 'grade_8', 'grade_9', 'grade_10'];
const SHS_YEARS: YearLvl[] = ['grade_11', 'grade_12'];
const COLLEGE_YEARS: YearLvl[] = ['first_year', 'second_year', 'third_year', 'fourth_year', 'fifth_year'];

const EDU_LABELS: Record<string, string> = {
  junior_high: 'Junior High School', senior_high: 'Senior High School', college: 'College',
};

const YEAR_LABELS: Record<string, string> = {
  grade_7: 'Grade 7', grade_8: 'Grade 8', grade_9: 'Grade 9', grade_10: 'Grade 10',
  grade_11: 'Grade 11', grade_12: 'Grade 12',
  first_year: '1st Year', second_year: '2nd Year', third_year: '3rd Year', fourth_year: '4th Year', fifth_year: '5th Year',
};

function getStudentSteps() {
  return [
    { title: 'Who are you?', desc: 'Select your account type' },
    { title: 'Your Name', desc: 'Tell us who you are' },
    { title: 'Profile Photo', desc: 'Add a profile picture' },
    { title: 'School Email', desc: 'Your MMCM email and student ID' },
    { title: 'Education Level', desc: 'Your current year and program' },
    { title: 'Secure Account', desc: 'Create your password' },
  ];
}

function getParentSteps() {
  return [
    { title: 'Who are you?', desc: 'Select your account type' },
    { title: 'Your Name', desc: 'Tell us who you are' },
    { title: 'Profile Photo', desc: 'Add a profile picture' },
    { title: 'Contact Info', desc: 'Your email and phone number' },
    { title: 'Link Student', desc: 'Connect to your child\'s account' },
    { title: 'Secure Account', desc: 'Create your password' },
  ];
}

export default function OnboardingScreen() {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    userType: null, firstName: '', middleName: '', lastName: '', suffix: '',
    email: '', phone: '', studentId: '', parentStudentId: '', relationship: '',
    educationLevel: null, yearLevel: null, collegeId: null, programId: null,
    password: '', confirmPassword: '', avatarUri: null,
  });
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (success) {
      successTimer.current = setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 3500);
    }
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, [success]);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [studentLookup, setStudentLookup] = useState<'idle' | 'found' | 'not_found'>('idle');
  const { signUp, session } = useAuthStore();

  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleStudentLookup = (id: string) => {
    update('parentStudentId', id);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (id.length !== 10) { setStudentLookup('idle'); return; }
    lookupTimer.current = setTimeout(async () => {
      const { data } = await supabase.rpc('fn_find_student_by_id', { p_student_id: id }).maybeSingle();
      setStudentLookup(data ? 'found' : 'not_found');
    }, 500);
  };
  const progressWidth = useSharedValue(25);

  const steps = userType === 'student' ? getStudentSteps() : getParentSteps();
  const totalSteps = steps.length;

  const update = (key: keyof OnboardingData, value: any) => setData((prev) => ({ ...prev, [key]: value }));

  const goToStep = (s: number) => {
    setStep(s);
    progressWidth.value = withTiming(((s + 1) / totalSteps) * 100, { duration: 500, easing: Easing.out(Easing.cubic) });
  };

  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

  const canProceed = () => {
    if (step === 0) return userType !== null;
    if (step === 1) return data.firstName.length > 0 && data.lastName.length > 0;
    if (step === 2) return true; // photo is optional
    if (userType === 'student') {
      if (step === 3) return data.email.includes('@') && data.studentId.length === 10;
      if (step === 4) return data.educationLevel !== null && data.yearLevel !== null
        && (data.educationLevel !== 'college' || (data.collegeId !== null && data.programId !== null));
      if (step === 5) return data.password.length >= 8 && data.password === data.confirmPassword;
    } else {
      if (step === 3) return data.email.includes('@');
      if (step === 4) return true;
      if (step === 5) return data.password.length >= 8 && data.password === data.confirmPassword;
    }
    return false;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) goToStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      // Pass all data via metadata — the trigger creates profile + student_profiles atomically
      await signUp({
        firstName: data.firstName, middleName: data.middleName, lastName: data.lastName,
        email: data.email, password: data.password, confirmPassword: data.password,
        userType: data.userType ?? undefined,
        suffix: data.suffix || undefined,
        studentId: data.studentId,
        parentStudentId: data.parentStudentId || undefined,
        relationship: data.relationship || undefined,
        educationLevel: data.educationLevel ?? undefined,
        yearLevel: data.yearLevel ?? undefined,
        collegeId: data.educationLevel === 'college' ? (data.collegeId ?? undefined) : undefined,
        programId: data.educationLevel === 'college' ? (data.programId ?? undefined) : undefined,
      });

      // Sign in to get a session
      const loggedIn = await authService.signInWithEmail({ email: data.email, password: data.password });

      // Upload avatar if one was selected
      if (data.avatarUri && loggedIn.session?.user?.id) {
        try {
          await profileService.uploadAvatar(loggedIn.session.user.id, data.avatarUri);
        } catch (e) {
          console.error('Avatar upload failed:', e);
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error('Signup failed:', err);
    }
    setSubmitting(false);
  }, [data]);

  const selectUserType = (t: UserType) => {
    setUserType(t);
    update('userType', t);
    goToStep(1);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {success ? (
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View entering={FadeIn} className="items-center gap-4">
            <Confetti />
            <View className="w-20 h-20 rounded-full bg-success/10 items-center justify-center mb-4">
              <Icon as={CheckCircle2} size={40} color="#22C55E" />
            </View>
            <Text variant="h2" className="text-foreground text-center">Registration Complete!</Text>
            <Text variant="p" className="text-center">Welcome to QueueLess. You'll be redirected shortly.</Text>
          </Animated.View>
        </View>
      ) : (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Progress */}
        <View className="mx-6 h-1.5 bg-muted rounded-full overflow-hidden mt-4 mb-6">
          <Animated.View className="h-full bg-primary rounded-full" style={progressStyle} />
        </View>

        <ScrollView contentContainerClassName="px-6 pb-4" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-2">
            <Image source={require('../../assets/QueueLess-Logo-Transparent.png')} className="w-14 h-14 mb-1" resizeMode="contain" />
          </View>

          <Animated.View key={step} entering={FadeIn} className="gap-6">
            <View className="items-center mb-2">
              <Text variant="h2" className="text-foreground text-center">{steps[step].title}</Text>
              <Text variant="p" className="text-center mt-1">{steps[step].desc}</Text>
            </View>

            {/* Step 0 — User type selection */}
            {step === 0 && (
              <View className="gap-4 pt-2">
                {([
                  { type: 'student' as UserType, icon: GraduationCap, color: '#004E98', title: "I'm a Student", desc: 'Access your queue tickets using your MMCM credentials' },
                  { type: 'parent' as UserType, icon: Users, color: '#FF6700', title: "I'm a Parent / Guardian", desc: 'Monitor and manage your child\'s queue on campus' },
                ]).map(({ type, icon, color, title, desc }) => (
                  <TouchableOpacity key={type} onPress={() => selectUserType(type)}
                    className="flex-row items-center gap-4 rounded-2xl border-2 p-5 border-border bg-card active:bg-primary/5"
                    activeOpacity={0.7}>
                    <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: color + '15' }}>
                      <Icon as={icon} size={28} color={color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-lg font-semibold">{title}</Text>
                      <Text variant="small" className="text-muted-foreground mt-1">{desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Step 1 — Name (shared) */}
            {step === 1 && (
              <View className="gap-4">
                <Input placeholder="First Name" value={data.firstName} onChangeText={(v) => update('firstName', v)} />
                <Input placeholder="Middle Name (optional)" value={data.middleName} onChangeText={(v) => update('middleName', v)} />
                <Input placeholder="Last Name" value={data.lastName} onChangeText={(v) => update('lastName', v)} />
              </View>
            )}

            {/* Step 2 — Photo (shared) */}
            {step === 2 && (
              <View className="items-center gap-4 py-4">
                <View className="w-28 h-28 rounded-full bg-muted items-center justify-center overflow-hidden">
                  {data.avatarUri ? (
                    <Image source={{ uri: data.avatarUri }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Icon as={Camera} size={36} color="#9CA3AF" />
                  )}
                </View>
                <TouchableOpacity onPress={async () => {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') return;
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                  });
                  if (!result.canceled && result.assets[0]) {
                    update('avatarUri', result.assets[0].uri);
                  }
                }} activeOpacity={0.7} className="bg-primary rounded-full px-6 py-3">
                  <Text className="text-white font-semibold text-sm">
                    {data.avatarUri ? 'Change Photo' : 'Upload Photo'}
                  </Text>
                </TouchableOpacity>
                {data.avatarUri && (
                  <TouchableOpacity onPress={() => update('avatarUri', null)}>
                    <Text className="text-red-500 text-sm">Remove</Text>
                  </TouchableOpacity>
                )}
                <Text variant="small" className="text-muted-foreground text-center">You can also skip this and add one later</Text>
              </View>
            )}

            {/* Step 3 — Student: Email + ID | Parent: Email */}
            {step === 3 && userType === 'student' && (
              <View className="gap-4">
                <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" value={data.email} onChangeText={(v) => update('email', v)} />
                <Input placeholder="Student ID (e.g. 2021120266)" keyboardType="number-pad" maxLength={10} value={data.studentId} onChangeText={(v) => update('studentId', v.replace(/[^0-9]/g, ''))} />
                <View className="flex-row gap-3">
                  <View className="w-20 justify-center items-center bg-muted rounded-2xl">
                    <Text className="text-foreground font-medium">🇵🇭 +63</Text>
                  </View>
                  <View className="flex-1">
                    <Input placeholder="Phone (optional)" keyboardType="number-pad" maxLength={10} value={data.phone} onChangeText={(v) => { update('phone', v.replace(/[^0-9]/g, '')); }} />
                  </View>
                </View>
              </View>
            )}
            {step === 3 && userType === 'parent' && (
              <View className="gap-4">
                <Input placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" value={data.email} onChangeText={(v) => update('email', v)} />
                <View className="flex-row gap-3">
                  <View className="w-24 justify-center items-center bg-muted rounded-2xl">
                    <Text className="text-foreground font-medium">🇵🇭 +63</Text>
                  </View>
                  <View className="flex-1">
                    <Input placeholder="Phone (optional)" keyboardType="number-pad" maxLength={10} value={data.phone} onChangeText={(v) => { update('phone', v.replace(/[^0-9]/g, '')); }} />
                  </View>
                </View>
              </View>
            )}

            {/* Step 4 — Student: Education Level + College/Program */}
            {step === 4 && userType === 'student' && (
              <View className="gap-4">
                <Text className="text-foreground font-semibold text-base">Education Level</Text>
                {(['junior_high', 'senior_high', 'college'] as EduLevel[]).map((el) => (
                  <TouchableOpacity key={el} onPress={() => { update('educationLevel', el); update('yearLevel', null); }}
                    className={`rounded-2xl border-2 p-4 ${data.educationLevel === el ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                    <Text className={`text-foreground font-medium ${data.educationLevel === el ? 'text-primary' : ''}`}>{EDU_LABELS[el]}</Text>
                  </TouchableOpacity>
                ))}

                {data.educationLevel && (
                  <>
                    <Text className="text-foreground font-semibold text-base mt-2">Year Level</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(data.educationLevel === 'junior_high' ? JHS_YEARS : data.educationLevel === 'senior_high' ? SHS_YEARS : COLLEGE_YEARS).map((yl) => (
                        <TouchableOpacity key={yl} onPress={() => update('yearLevel', yl)}
                          className={`rounded-xl border-2 px-4 py-3 ${data.yearLevel === yl ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                          <Text className={data.yearLevel === yl ? 'text-primary font-medium' : 'text-foreground'}>{YEAR_LABELS[yl]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {data.educationLevel === 'college' && data.yearLevel && (
                  <>
                    <Text className="text-foreground font-semibold text-base mt-2">College / Department</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2" contentContainerClassName="gap-2">
                      {COLLEGES.map((c) => (
                        <TouchableOpacity key={c.id} onPress={() => { update('collegeId', c.id); update('programId', null); }}
                          className={`rounded-xl border-2 px-4 py-3 ${data.collegeId === c.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                          <Text className={data.collegeId === c.id ? 'text-primary font-medium' : 'text-foreground'}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                {data.collegeId && (
                  <>
                    <Text className="text-foreground font-semibold text-base mt-2">Program</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(PROGRAMS[data.collegeId] || []).map((p) => (
                        <TouchableOpacity key={p} onPress={() => update('programId', p)}
                          className={`rounded-xl border-2 px-4 py-3 ${data.programId === p ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                          <Text className={data.programId === p ? 'text-primary font-medium' : 'text-foreground'}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Step 4 — Parent: Link Student (optional) */}
            {step === 4 && userType === 'parent' && (
              <View className="gap-4">
                <Text className="text-foreground font-semibold text-base">Link to your child</Text>
                <Text variant="small" className="text-muted-foreground -mt-3">Enter your child's student ID to connect accounts. You can skip this and link later.</Text>
                <View className="relative">
                  <Input placeholder="Student ID (e.g. 2021120266)" keyboardType="number-pad" maxLength={10}
                    value={data.parentStudentId}
                    onChangeText={handleStudentLookup} />
                  {data.parentStudentId.length === 10 && (
                    <View className="absolute right-4 top-1/2 -translate-y-1/2">
                      {studentLookup === 'found' ? (
                        <Icon as={CheckCircle2} size={22} color="#22C55E" />
                      ) : studentLookup === 'not_found' ? (
                        <Text className="text-destructive font-bold text-lg">✕</Text>
                      ) : null}
                    </View>
                  )}
                </View>
                {studentLookup === 'found' && <Text variant="small" className="text-success">Student found ✓</Text>}
                {studentLookup === 'not_found' && <Text variant="small" className="text-destructive">No student found with that ID</Text>}

                {data.parentStudentId.length === 10 && studentLookup === 'found' && (
                  <>
                    <Text className="text-foreground font-semibold text-base mt-2">Your relationship</Text>
                    <Text variant="small" className="text-muted-foreground -mt-2">How are you related to this student?</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {['Mother', 'Father', 'Guardian', 'Grandparent', 'Other'].map((r) => (
                        <TouchableOpacity key={r} onPress={() => update('relationship', r)}
                          className={`rounded-full border-2 px-5 py-2.5 ${data.relationship === r ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                          <Text className={`text-sm font-medium ${data.relationship === r ? 'text-primary' : 'text-foreground'}`}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {((userType === 'student' && step === 5) || (userType === 'parent' && step === 5)) && (
              <View className="gap-4">
                {/* Password field */}
                <View className="relative">
                  <Input placeholder="Password (min. 8 chars)" secureTextEntry={!showPw} value={data.password}
                    onChangeText={(v) => update('password', v)} />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Icon as={showPw ? EyeOff : Eye} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Strength indicator */}
                <PasswordStrength password={data.password} />
                {/* Confirm password */}
                <View className="relative">
                  <Input placeholder="Confirm password" secureTextEntry={!showConfirm} value={data.confirmPassword}
                    onChangeText={(v) => update('confirmPassword', v)} />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Icon as={showConfirm ? EyeOff : Eye} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {data.confirmPassword.length > 0 && data.password !== data.confirmPassword && (
                  <Text variant="small" className="text-destructive">Passwords do not match</Text>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View className="px-6 pb-6">
          {step === 0 ? null : (
            <View className="flex-row gap-3">
              <Button variant="outline" size="lg" className="flex-1" onPress={() => goToStep(step - 1)}>
                <Text className="text-foreground">Go back</Text>
              </Button>
              <Button size="lg" className="flex-[2]" onPress={handleNext} disabled={!canProceed() || submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text>Continue</Text>}
                {!submitting && <Icon as={ChevronRight} size={20} color="#FFFFFF" />}
              </Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}


