import { useState, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { ChevronRight, CheckCircle2, GraduationCap, Users, School, BookOpen, Eye, EyeOff } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

type UserType = 'student' | 'parent';
type EduLevel = 'junior_high' | 'senior_high' | 'college';
type YearLvl = 'grade_7' | 'grade_8' | 'grade_9' | 'grade_10' | 'grade_11' | 'grade_12'
  | 'first_year' | 'second_year' | 'third_year' | 'fourth_year' | 'fifth_year';

interface OnboardingData {
  userType: UserType | null;
  firstName: string; middleName: string; lastName: string;
  email: string; studentId: string;
  educationLevel: EduLevel | null; yearLevel: YearLvl | null;
  collegeId: string | null; programId: string | null;
  password: string; confirmPassword: string;
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

function pwScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s += 25;
  if (/[A-Z]/.test(pw)) s += 25;
  if (/[0-9]/.test(pw)) s += 25;
  if (/[^A-Za-z0-9]/.test(pw)) s += 25;
  return s;
}

function pwColor(pw: string): string {
  const s = pwScore(pw);
  if (s < 50) return '#EF4444';
  if (s < 75) return '#F59E0B';
  return '#22C55E';
}

function pwLabel(pw: string): string {
  const s = pwScore(pw);
  if (s < 25) return 'Very weak';
  if (s < 50) return 'Weak';
  if (s < 75) return 'Fair';
  return 'Strong';
}

function getStudentSteps() {
  return [
    { title: 'Who are you?', desc: 'Select your account type' },
    { title: 'Your Name', desc: 'Tell us who you are' },
    { title: 'School Email', desc: 'Your MMCM email and student ID' },
    { title: 'Education Level', desc: 'Your current year and program' },
    { title: 'Secure Account', desc: 'Create your password' },
  ];
}

function getParentSteps() {
  return [
    { title: 'Who are you?', desc: 'Select your account type' },
    { title: 'Your Name', desc: 'Tell us who you are' },
    { title: 'Contact Info', desc: 'Your email and phone number' },
    { title: 'Secure Account', desc: 'Create your password' },
  ];
}

export default function OnboardingScreen() {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    userType: null, firstName: '', middleName: '', lastName: '',
    email: '', studentId: '',
    educationLevel: null, yearLevel: null, collegeId: null, programId: null,
    password: '', confirmPassword: '',
  });
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (success) {
      successTimer.current = setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 2000);
    }
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, [success]);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signUp } = useAuthStore();
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
    if (userType === 'student') {
      if (step === 2) return data.email.includes('@') && data.studentId.length === 10;
      if (step === 3) return data.educationLevel !== null && data.yearLevel !== null
        && (data.educationLevel !== 'college' || (data.collegeId !== null && data.programId !== null));
      if (step === 4) return data.password.length >= 8 && data.password === data.confirmPassword;
    } else {
      if (step === 2) return data.email.includes('@');
      if (step === 3) return data.password.length >= 8 && data.password === data.confirmPassword;
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
      await signUp({
        firstName: data.firstName, middleName: data.middleName, lastName: data.lastName,
        email: data.email, password: data.password, confirmPassword: data.password,
      });

      // Insert into student_profiles if user is a student
      if (data.userType === 'student') {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (userId) {
          await supabase.from('student_profiles').insert({
            profile_id: userId,
            student_id: data.studentId,
            education_level: data.educationLevel,
            year_level: data.yearLevel,
            college_id: data.educationLevel === 'college' ? data.collegeId : null,
            program_id: data.educationLevel === 'college' ? data.programId : null,
          });
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

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Animated.View entering={FadeIn} className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-success/10 items-center justify-center">
            <Icon as={CheckCircle2} size={40} color="#22C55E" />
          </View>
          <Text variant="h2" className="text-foreground text-center">Registration Complete!</Text>
          <Text variant="p" className="text-center">Welcome to QueueLess. You'll be redirected shortly.</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
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

            {/* Step 2 — Student: Email + ID | Parent: Email */}
            {step === 2 && userType === 'student' && (
              <View className="gap-4">
                <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" value={data.email} onChangeText={(v) => update('email', v)} />
                <Input placeholder="Student ID (e.g. 2021120266)" keyboardType="number-pad" maxLength={10} value={data.studentId} onChangeText={(v) => update('studentId', v.replace(/[^0-9]/g, ''))} />
              </View>
            )}
            {step === 2 && userType === 'parent' && (
              <Input placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" value={data.email} onChangeText={(v) => update('email', v)} />
            )}

            {/* Step 3 — Student: Education Level + College/Program */}
            {step === 3 && userType === 'student' && (
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

            {/* Step 4/3 — Password (shared) */}
            {((userType === 'student' && step === 4) || (userType === 'parent' && step === 3)) && (
              <View className="gap-4">
                {/* Password field */}
                <View className="relative">
                  <Input placeholder="Password (min. 8 chars)" secureTextEntry={!showPw} value={data.password}
                    onChangeText={(v) => update('password', v)} />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Icon as={showPw ? EyeOff : Eye} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Strength indicator with smooth animation */}
                {data.password.length > 0 && <PasswordStrength password={data.password} />}
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
    </SafeAreaView>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = pwScore(password);
  const color = pwColor(password);
  const label = pwLabel(password);
  const width = useSharedValue(0);

  width.value = withTiming(score, { duration: 400, easing: Easing.out(Easing.cubic) });

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: color,
  }));

  return (
    <View className="gap-1.5">
      <View className="h-1.5 bg-muted rounded-full overflow-hidden">
        <Animated.View className="h-full rounded-full" style={[{ backgroundColor: color }, barStyle]} />
      </View>
      <Text variant="small" className={color === '#22C55E' ? 'text-success' : 'text-muted-foreground'}>{label}</Text>
    </View>
  );
}
