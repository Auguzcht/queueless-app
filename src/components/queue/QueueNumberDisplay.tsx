import { Text } from '@/components/ui/text';

export function QueueNumberDisplay({ ticketNumber, large }: { ticketNumber: string; large?: boolean }) {
  return <Text variant={large ? 'h1' : 'h2'} className="text-primary font-display tracking-widest">{ticketNumber}</Text>;
}
