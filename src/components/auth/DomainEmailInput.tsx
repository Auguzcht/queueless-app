import { Input } from '@/components/ui/input';
import { COLORS } from '@/constants/theme';

interface DomainEmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function DomainEmailInput({ value, onChangeText, error }: DomainEmailInputProps) {
  return (
    <Input

      placeholder="your@mcm.edu.ph"
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      value={value}
      onChangeText={onChangeText}
    />
  );
}
