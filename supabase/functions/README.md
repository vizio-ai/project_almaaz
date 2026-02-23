# dora — Edge Functions

## Overview

Two Edge Functions handle phone OTP authentication via Twilio Verify:

| Function | Description |
|----------|-------------|
| `send-otp` | Receives a phone number and sends an SMS OTP via Twilio Verify |
| `verify-otp` | Receives a phone number + code, verifies with Twilio, creates a Supabase session, and returns it |

---

## Setup

### 1. Create a Twilio Verify Service

1. [Twilio Console](https://console.twilio.com) → **Verify** → **Services** → **Create new**
2. Copy the **Service SID** (`VAxxxxxxxx`)

### 2. Set secrets

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_VERIFY_SID=VAxxxxxxxx
```

`SUPABASE_ANON_KEY` is available by default in Edge Functions. If missing:

```bash
supabase secrets set SUPABASE_ANON_KEY=eyJ...
```

### 3. Deploy

```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
```

### 4. Set mobile environment variable

Add to `mobile/.env`:

```
EXPO_PUBLIC_API_BASE_URL=https://<PROJECT_REF>.supabase.co/functions/v1
```

---

## Flow

```
[Mobile] → POST /send-otp  { phone }        → [Twilio] sends SMS
[Mobile] → POST /verify-otp { phone, code } → [Twilio] verifies
                                             → [Supabase] creates session
                                             → returns { access_token, ... }
```
