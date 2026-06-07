import { Stack } from 'expo-router';

export default function SheetLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="get-started"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.45, 0.85],
          sheetGrabberVisible: true,
          sheetExpandsWhenScrolledToEdge: true,
        }}
      />
    </Stack>
  );
}
