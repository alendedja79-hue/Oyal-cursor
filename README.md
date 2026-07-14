# Oyal

**It's about experiences, not appearances.**

Oyal is a cross-platform (Web · iOS · Android) social travel app where people
share the trips they've actually taken — tagged photo by photo — discover other
travellers' adventures, and swap tips in a community forum.

Built with **Expo (React Native) + Expo Router + TypeScript** and a
**Supabase** backend (hosted Postgres, auth, and media storage). It ships with a
fully-featured **on-device demo backend** so you can run and explore everything
without any cloud setup.

---

## Features

| Area | What it does |
| --- | --- |
| **Authentication** | Login, Sign-up and Forgot-password screens. Email + password, **Google** and **Apple** sign-in. Email-based password reset. |
| **Home** | Slogan, personalised greeting, rotating travel-themed hero image, quick navigation to every section, and a randomised feed of community trips. |
| **Share a Trip** | Trip name, season, overall spend, party size, itinerary, and **multi-image upload**. Every photo requires a **location tag** with type-ahead autocomplete, plus the option to **use the photo's own gallery GPS location** (read from EXIF). |
| **Discovery** | Grid of trips in random order. Each tile shows the cover image, trip name, poster avatar and a unique-locations badge. Tap to open a **carousel trip detail** you can swipe through while reading the itinerary. Filter by **Country**, **Party size** and **Season**. |
| **Profile** | Profile photo, username, favourite place, top travel tip, a live **count of unique tagged locations**, and a grid of the user's own trips. |
| **Forum** | Discussion topics (newest first) with author + timestamp, full comment threads, and a "＋ New Topic" flow. |
| **Settings** | Update profile photo, username, favourite place and top travel tip. Sign out. |

---

## Tech stack

- **Expo SDK 57** / React Native 0.86 — one codebase for **Web, iOS and Android**
- **Expo Router** — file-based navigation with tabs + modals
- **Supabase** — Postgres database, authentication, and Storage for media
- **OpenStreetMap Nominatim** — free location autocomplete + reverse geocoding
  (no API key required; swap for any compatible geocoder)
- **expo-image-picker** — multi-select image upload with EXIF GPS extraction

---

## Getting started

```bash
npm install
npm start          # then press w / i / a for web / iOS / Android
# or target directly:
npm run web
npm run ios
npm run android
```

### Demo mode (no backend needed)

If no Supabase credentials are set, Oyal runs against a seeded, on-device mock
backend (AsyncStorage). Everything works — sign up freely, or log in with a
demo account:

```
maya@oyal.app / password
leo@oyal.app  / password
```

### Connecting the real backend (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). This
   creates the `profiles`, `trips`, `photos`, `forum_topics`, `forum_posts`
   tables, the public `media` storage bucket, Row-Level-Security policies, and a
   trigger that provisions a profile on sign-up.
3. (Optional) Enable the **Google** and **Apple** providers under
   *Authentication → Providers*.
4. Copy `.env.example` to `.env` and fill in your values:

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

5. Restart the dev server. Oyal now reads and writes to Supabase automatically.

---

## Database schema

| Table | Key columns |
| --- | --- |
| `profiles` (Users) | `id`, `email`, `username`, `profile_photo`, `favorite_place`, `travel_tip`, `created_at` |
| `trips` | `id`, `user_id → profiles`, `trip_name`, `season`, `spend`, `party_size`, `itinerary`, `created_at` |
| `photos` | `id`, `trip_id → trips`, `image_url`, `location_name`, `latitude`, `longitude`, `country` |
| `forum_topics` | `id`, `user_id → profiles`, `title`, `created_at` |
| `forum_posts` | `id`, `topic_id → forum_topics`, `user_id → profiles`, `message`, `created_at` |

Authentication is handled by Supabase Auth (`auth.users`); passwords are never
stored in application tables.

---

## Project structure

```
app/                         # Expo Router routes
  _layout.tsx                # Providers + auth-guard navigation
  (auth)/                    # LoginPage, SignUpPage, ForgotPasswordPage
  (tabs)/                    # HomePage, DiscoveryPage, ShareTripPage, ForumPage, ProfilePage
  trip/[id].tsx              # Trip detail (carousel modal)
  forum/[id].tsx             # Topic detail + comment thread
  new-topic.tsx              # Create forum topic (modal)
  settings.tsx               # SettingsPage
src/
  components/                # Reusable UI (Button, TextField, Select, LocationTagInput, ImageCarousel, …)
  context/AuthContext.tsx    # Auth state
  services/
    backend/                 # Backend interface + Supabase impl + seeded mock
    location.ts              # Geocoding (autocomplete + reverse geocode)
    imagePicker.ts           # Image selection + EXIF GPS
  theme/theme.ts             # Design system + branding
supabase/schema.sql          # Database + storage provisioning
```

---

## Notes

- **Location tagging** uses OpenStreetMap Nominatim by default. For production
  scale, point `EXPO_PUBLIC_GEOCODER_URL` at a self-hosted Nominatim or a
  commercial provider.
- **Photo GPS**: when a selected photo contains EXIF GPS data, Oyal offers a
  one-tap "use the photo's gallery location" option that reverse-geocodes the
  coordinates into a place name; otherwise you tag the location manually.
- The unique-locations count normalises place names (case/whitespace) so the
  same spot isn't counted twice.
