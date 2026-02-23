# dora — AI-Powered Travel Companion

A React Native / Expo mobile application with a Supabase backend that helps travelers plan, manage, and share their journeys with an AI-powered assistant named Dora.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo Router) |
| Language | TypeScript |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| SMS / OTP | Twilio Verify |
| Architecture | Vertical Slice / Clean Architecture |

---

## Project Structure

```
almaaz/
├── mobile/              # React Native application
│   ├── app/             # Expo Router screens & layouts
│   ├── features/        # Domain features (auth, profile, trips…)
│   └── infrastructure/  # External service implementations (Supabase, etc.)
└── supabase/
    ├── migrations/      # Ordered database migrations
    ├── functions/       # Supabase Edge Functions (send-otp, verify-otp)
    └── seed.sql         # Development seed data
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone the repository

```bash
git clone <repo-url>
cd almaaz
```

### 2. Set up environment variables

```bash
cd mobile
cp .env.example .env
```

Fill in `mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=https://<project-ref>.supabase.co/functions/v1
```

### 3. Apply database migrations

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### 4. Deploy edge functions

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_VERIFY_SID=VAxxxxxxxx

supabase functions deploy send-otp
supabase functions deploy verify-otp
```

### 5. Install dependencies and run

```bash
cd mobile
npm install
npx expo start --clear
```

---

## Features

- **Phone OTP authentication** via Twilio Verify
- **Onboarding flow** — travel persona (pace, interests, journaling style, companionship)
- **Profile management** — avatar upload with image compression
- **AI-powered itinerary builder** (M4)
- **Social features** — follow, bookmark, share itineraries (M6)

---

## Database

See [`supabase/README.md`](./supabase/README.md) for the full database schema, RLS policies, and migration details.

---

## License

Private — All rights reserved.
