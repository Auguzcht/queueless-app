import { SafeAreaView, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
}

export function SafeAreaWrapper({ children }: SafeAreaWrapperProps) {
  return (
    <SafeAreaView style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
  },
});
