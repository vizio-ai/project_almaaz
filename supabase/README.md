# dora — Supabase Database

## Project Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### 2. Link to your project

Get the project ref from the dashboard URL (`https://app.supabase.com/project/<PROJECT_REF>`):

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
```

### 3. Apply migrations

```bash
# Apply all migrations to production
supabase db push

# Reset and seed local database
supabase db reset
supabase start
```

### 4. Connect the mobile app

```bash
cd ../mobile
cp .env.example .env
# Edit .env → set SUPABASE_URL and SUPABASE_ANON_KEY
```

From Supabase Dashboard → **Settings** → **API**:
- `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Migration Files

| File | Milestone | Description |
|------|-----------|-------------|
| `00001_auth_profiles.sql` | M2 | `profiles` table, auth trigger, RLS |
| `00002_itineraries.sql` | M3 & M4 | `itineraries`, `itinerary_days`, `activities`, `travel_info`, RLS |
| `00003_social.sql` | M6 | `bookmarks`, `follows`, `clone_itinerary()` function |
| `00004_notes.sql` | M5 & M7 | `trip_notes` table |
| `00005_storage.sql` | M3+ | Storage buckets and policies |
| `00006_views.sql` | M3+ | `itineraries_with_author`, `popular_itineraries`, `following_feed` |
| `00007_storage_avatars_update.sql` | M2+ | UPDATE policy for avatar upsert |

---

## Auth — Phone OTP Setup

1. Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Phone**
3. Select **SMS Provider**: **Twilio** (recommended)
   - Enter Account SID, Auth Token, Twilio Phone Number
4. OTP message template:
   ```
   Your Dora verification code: {{ .Code }}
   ```
5. **OTP expiry**: 300 seconds (5 minutes)

### Local testing

Supabase supports test phone numbers for local development:
- Dashboard → Auth → Rate Limits → disable `Enable captcha protection`
- Add test number: `+15551234567` → OTP: `123456`

---

## RLS Policy Summary

| Table | SELECT | INSERT / UPDATE / DELETE |
|-------|--------|--------------------------|
| `profiles` | Public | Owner only |
| `itineraries` | Public + own | Owner only |
| `itinerary_days` | Follows parent itinerary | Parent itinerary owner |
| `activities` | Follows parent itinerary | Parent itinerary owner |
| `bookmarks` | Own only | Own only |
| `follows` | Public | Follower only |
| `trip_notes` | Owner only | Owner only |

---

## Storage Structure

```
avatars/
  {user_id}/avatar.jpg

covers/
  {user_id}/{itinerary_id}.jpg

attachments/
  {user_id}/{itinerary_id}/{activity_id}/{filename}
```

---

## Key Functions

### `clone_itinerary(source_id, user_id)`
Clones a public itinerary for the given user (M6 — Trip Cloning).

```sql
SELECT clone_itinerary('itinerary-uuid', auth.uid());
```

### `handle_new_user()` (trigger)
Automatically creates an empty `profiles` row when a new auth user is created.
