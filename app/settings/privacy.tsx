import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { Shield, Mail, CreditCard } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

const ITEMS = [
  { icon: Shield, label: 'Account Security', value: 'Email + Password' },
  { icon: Mail, label: 'Email', value: 'your@mcm.edu.ph' },
  { icon: CreditCard, label: 'Student ID', value: 'Linked to account' },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6">
        <Text variant="h2" className="text-foreground mb-6">Privacy & Security</Text>
        <View className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
          {ITEMS.map((item, i) => (
            <View key={item.label}>
              <View className="flex-row items-center p-4">
                <Icon as={item.icon} size={24} color="#6B7280" className="mr-4" />
                <View className="flex-1">
                  <Text className="text-foreground">{item.label}</Text>
                  <Text variant="small" className="text-muted-foreground">{item.value}</Text>
                </View>
              </View>
              {i < ITEMS.length - 1 && <Separator className="ml-16" />}
            </View>
          ))}
        </View>
        <Text variant="small" className="text-muted-foreground text-center mt-6 leading-5">
          Your data is stored securely using Supabase authentication and Row-Level Security. Only you can see your personal information.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
