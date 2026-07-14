# AGENTS.md

## Cursor Cloud specific instructions

Oyal is an **Expo (React Native, SDK 57) + Expo Router + TypeScript** app that
also targets the **web**. Standard commands live in `README.md` and
`package.json` scripts — prefer those. Notes below are the non-obvious bits.

### Services / how to run

- **Web dev server (primary way to test in the cloud):** `npm run web`
  (`expo start --web`). Metro serves on `http://localhost:8081`. The first
  request triggers a bundle that can take ~10-45s before the UI appears — be
  patient rather than assuming it hung. Run it under a persistent session
  (e.g. tmux); it is a long-running process.
- `npm run ios` / `npm run android` need native simulators/devices and are not
  usable in this headless cloud VM. Use the web target.

### Backend modes

- **Demo mode is the default and needs no secrets.** When
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are unset, the app
  runs against a seeded on-device mock backend (AsyncStorage), so login, reads,
  and writes all work offline. Seeded demo logins: `maya@oyal.app` / `password`
  and `leo@oyal.app` / `password`.
- To use the real backend, copy `.env.example` to `.env`, fill the Supabase
  values, and run `supabase/schema.sql` (see `README.md`).

### Lint / typecheck / test / build

- No ESLint config and no automated test suite exist in this repo.
- Type checking is the closest thing to a lint gate: `npm run typecheck`
  (`tsc --noEmit`).
- There is no production "build" step wired up for the cloud; validate via the
  web dev server.

### Gotchas when testing flows

- **Sharing a trip requires at least one uploaded photo** (app-level
  validation). On web without a real file upload this flow can't be completed to
  submission. To exercise a create/write path end-to-end, use the **Forum →
  New Topic** flow or read a trip via the **Discovery** tab instead.
- Node 22 works for this Expo SDK.
