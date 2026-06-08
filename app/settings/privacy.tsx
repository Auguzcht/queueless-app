import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Shield, Mail, CreditCard, Eye, EyeOff } from 'lucide-react-native';
import { PasswordStrength } from '@/components/ui/password-strength';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/useAuthStore';

export default function PrivacyScreen() {
  const session = useAuthStore((s) => s.session);
  const userEmail = session?.user?.email ?? 'Not available';
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSave = currentPw.length > 0 && newPw.length >= 8 && newPw === confirmPw;

  const handleChangePassword = async () => {
    if (!canSave) return;
    setError(null);
    setSuccess(false);
    setChanging(true);
    try {
      await authService.updatePassword(currentPw, newPw);
      setSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      Alert.alert('Password Updated', 'Your password has been changed successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    }
    setChanging(false);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Privacy & Security',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 5 }}>
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8F9FA' },
        headerTintColor: '#111827',
        headerBackTitleVisible: false,
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Info */}
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <Icon as={Shield} size={22} color="#6B7280" />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Account Security</Text>
              <Text style={styles.rowValue}>Email + Password</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Icon as={Mail} size={22} color="#6B7280" />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{userEmail ?? 'Not available'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Icon as={CreditCard} size={22} color="#6B7280" />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Student ID</Text>
              <Text style={styles.rowValue}>Linked to account</Text>
            </View>
          </View>
        </View>

        {/* Password Change */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Password updated successfully.</Text>
            </View>
          )}

          <Text style={styles.label}>CURRENT PASSWORD</Text>
          <View style={styles.fieldWrap}>
            <Input
              placeholder="Enter current password"
              secureTextEntry={!showCurrent}
              value={currentPw}
              onChangeText={setCurrentPw}
              style={{ flex: 1, paddingRight: 44 }}
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
              <Icon as={showCurrent ? EyeOff : Eye} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>NEW PASSWORD</Text>
          <View style={styles.fieldWrap}>
            <Input
              placeholder="Min. 8 characters"
              secureTextEntry={!showNew}
              value={newPw}
              onChangeText={setNewPw}
              style={{ flex: 1, paddingRight: 44 }}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
              <Icon as={showNew ? EyeOff : Eye} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <PasswordStrength password={newPw} />

          <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
          <View style={styles.fieldWrap}>
            <Input
              placeholder="Repeat new password"
              secureTextEntry={!showConfirm}
              value={confirmPw}
              onChangeText={setConfirmPw}
              style={{ flex: 1, paddingRight: 44 }}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Icon as={showConfirm ? EyeOff : Eye} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {newPw.length > 0 && confirmPw.length > 0 && newPw !== confirmPw && (
            <Text style={styles.matchError}>Passwords do not match</Text>
          )}

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={!canSave || changing}
            style={[styles.updateBtn, (!canSave || changing) && styles.updateBtnDisabled]}
          >
            {changing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Updating...</Text>
              </View>
            ) : (
              <Text style={styles.updateBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          Your personal information is encrypted and securely stored. Access is strictly limited to you and authorized Mapua Malayan Colleges Mindanao (MMCM) administration.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16, fontFamily: 'Inter-SemiBold' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#111827', fontFamily: 'Inter-Regular' },
  rowValue: { fontSize: 13, color: '#9CA3AF', marginTop: 2, fontFamily: 'Inter-Regular' },
  label: { fontSize: 11, lineHeight: 16, includeFontPadding: false, color: '#6B7280', fontWeight: '600', marginBottom: 4, marginTop: 12, letterSpacing: 0.5, fontFamily: 'Inter-SemiBold' },
  fieldWrap: { position: 'relative', justifyContent: 'center' },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  matchError: { color: '#EF4444', fontSize: 12, marginTop: 4, fontFamily: 'Inter-Regular' },
  errorBanner: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontFamily: 'Inter-Regular' },
  successBanner: { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  successText: { color: '#16A34A', fontSize: 13, textAlign: 'center', fontFamily: 'Inter-Regular' },
  updateBtn: { backgroundColor: '#004E98', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  updateBtnDisabled: { opacity: 0.5 },
  updateBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  note: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 24, lineHeight: 20, fontFamily: 'Inter-Regular' },
});
