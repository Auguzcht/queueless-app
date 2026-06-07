# src/lib/ — SDK Client Initialization

Thin wrappers around third-party SDKs. Each file initializes a client once and exports it for use across the app.

## Files

```
lib/
├── supabase.ts         # Supabase client (auth, database, realtime, functions)
├── firebase.ts         # Firebase app + Storage
└── env.ts              # Zod-validated environment variables
```

## supabase.ts

Initializes the Supabase client with AsyncStorage for persistent sessions on mobile.

```typescript
import 'react-native-url-polyfill/auto'; // Required for Supabase in RN
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from './env';
import type { Database } from '@/types/supabase';

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Important: must be false for React Native
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
```

Key points:
- `detectSessionInUrl: false` — React Native doesn't have URL-based auth callbacks
- `storage: AsyncStorage` — persists the session token across app restarts
- Typed with `Database` generic for full query type safety
- Import `react-native-url-polyfill/auto` at the top (Supabase needs it in RN)

## firebase.ts

Initializes Firebase for profile image storage only. We don't use Firebase Auth or Firestore.

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { env } from './env';

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

// Prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const storage = getStorage(app);

// Helper: upload a local image URI to Firebase Storage
export async function uploadImage(
  path: string,       // e.g. 'avatars/user-uuid.jpg'
  localUri: string    // file:///path/to/image.jpg
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytesResumable(storageRef, blob);
  return getDownloadURL(storageRef);
}
```

Firebase Storage rules (set in Firebase Console):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}.{ext} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## env.ts

Runtime validation of environment variables using Zod. Crashes early with a clear error if any required variable is missing.

```typescript
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
});

export const env = envSchema.parse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
});

export type Env = z.infer<typeof envSchema>;
```

All env vars must be prefixed with `EXPO_PUBLIC_` to be accessible in the Expo client bundle.

## Conventions

- One SDK per file
- Initialize once, export the instance
- Guard against re-initialization on hot reload (check `getApps().length`)
- Use `env.ts` instead of raw `process.env` — catches missing vars at app start
- Keep these files thin — no business logic, just initialization
