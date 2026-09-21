# Hindustan Motor Works — Mobile App Context

Source of truth for AI agents working on this repo. Read before making changes. Anything marked **unverified** needs confirmation against the live backend or a human before relying on it.

## 1. Project Overview

- **Product:** Workshop-management mobile app for Hindustan Electricals Winding Works (motor winding workshop). App display name: "Hindustan Motor Works".
- **Users:** an OWNER (workshop admin) and EMPLOYEEs (technicians). Owner can assign/register everything; employees get task lists and can update job/task statuses.
- **Domain:** registered motors (customer motors in for repair), jobs (repair work on a motor), tasks (work items assigned to employees), employee roster ("Team Roster"), audit history.
- **Purpose of this doc:** give any AI agent an accurate, current map of the codebase so changes are consistent, verified, and don't duplicate or contradict existing work.

## 2. Tech Stack & Config (verified)

| Area | Value |
| --- | --- |
| Framework | Expo SDK 57 (`expo ~57.0.24`, `expo-router ~57.0.22`) |
| React Native | `0.86.3`, React `19.2.3`, `react-dom 19.2.3` |
| Web | `react-native-web ~0.21.0` (web output `static`) |
| Language | TypeScript `~6.0.3`, strict mode (`tsconfig.json`) |
| Entry | `expo-router/entry` (`package.json` `main`) |
| Bundlers/compiler | React Compiler + typed routes enabled (`app.json` `experiments: { typedRoutes: true, reactCompiler: true }`) |
| Data fetching | `@tanstack/react-query ~5.103.1` |
| HTTP | `axios ^1.20.0` |
| Forms | `react-hook-form ^7.88.0` + `zod ^4.6.5` + `@hookform/resolvers ^5.9.1` |
| Global state | `zustand ^5.0.15` (auth store) |
| Storage | `expo-secure-store ~57.0.4` (native) / localStorage (web) |
| Media | `expo-image-manipulator`, `expo-image-picker`, `expo-image` |
| Misc | `expo-haptics`, `@react-native-community/netinfo`, `date-fns ^4.4.0`, `expo-constants`, `expo-linking`, `expo-splash-screen`, `expo-status-bar`, `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler ~2.32.0`, `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1` |

### Paths & aliases
- `@/*` → `./src/*`; `@/assets/*` → `./assets/*` (`tsconfig.json`).
- Routes live under `src/app/` (Expo Router file-based routing).

### Scripts (`package.json`)
- `npm start` → `expo start`; `npm run android` → `expo run:android`; `npm run ios` → `expo run:ios`; `npm run web` → `expo start --web`; `npm run lint` → `expo lint` (`eslint-config-expo/flat`, ignores `dist/*`).
- **NOTE:** there is **no `typecheck` script**, despite AIRULE.md/AGENTS.md mentioning one. Run `npx tsc --noEmit` for type checking.
- `npm run reset-project` → `scripts/reset-project.js` (default Expo template script; harmless, unrelated to app).

## 3. Git State (verified at time of writing)

- Branch `main`, up to date with `origin/main`.
- 7 commits (newest-first): `bc7d2fa feat: add authentication screens, common input component, global styles, and agent protocols` → `b4a2151 chore: add EAS configuration, build documentation, and agent skill definitions` → `cad2f52 feat: add authentication login screen, store, and web storage service` → `73898ba feat: add initial mobile application structure, screens, and components` → `e4b192c feat: add environment configuration module and .env.example template` → `6244107 feat: initialize mobile application with core screens, navigation, and domain services` → `7334949 initize`.
- **Uncommitted (WIP, verified current):** modified — `src/app/(app)/index.tsx` (Floor dashboard: brand header "Hindustan Electricals", `EmptyState` for empty team, stats/token cleanup), `src/app/(app)/motors/_layout.tsx` (header bg → `Colors.light.backgroundSubtle`), `src/app/(app)/motors/index.tsx` (uses `SearchInput` + `EmptyState`; spec line shows power/RPM/phase/brand + phone), `src/components/layout/StickyBottomCTA.tsx` (`Pressable`, theme tokens, `gap`). New (untracked) — `src/components/common/SearchInput.tsx`, `src/components/feedback/EmptyState.tsx`, plus this `context.md`. All color usage in the WIP uses existing tokens (no hardcoded hex). ⚠️ The WIP introduces **emoji glyphs as icons** (`⚡`, `👷`, `⚙️`, `🔍`, `✕`, `📋`) which conflicts with AIRULE.md ("no emojis in UI text unless requested") — flag for review/cleanup.
- `/ios` and `/android` are gitignored; an `android/` generated native project exists locally only (package `com.hindustanelectricals.motorapp`, `usesCleartextTraffic: true`, `predictiveBackGestureEnabled: false`).

## 4. Route Graph (verified)

```
src/app/_layout.tsx          Root: QueryClientProvider, SafeAreaProvider, SplashScreen.preventAutoHideAsync,
                             restoreSession() on mount, Stack (index, (auth), (app)).
src/app/index.tsx            Redirect: activeActorId ? (app) : (auth)/select-actor.

(auth)/_layout.tsx           If activeActorId → Redirect to (app). Stack header shown by default
                             (default title 'Workshop Sign In'); select-actor headerShown:false.
  (auth)/login.tsx           'Owner Login' — email/password → authService.login → setAdminSession → /(auth)/select-actor.
  (auth)/select-actor.tsx    Actor picker (Owner vs Staff sign-in). Staff path requires token+actor
                             (owner sign-in alert otherwise). [WIP: uses showStaffRoster]

(app)/_layout.tsx            If no activeActorId → Redirect to /(auth)/select-actor. Tabs:
                             Floor(index), Motors, Jobs, Tasks, Team(employees), Settings, Audit Log(history, href:null).
                             Each tab renders its own nested Stack.

Floor   (app)/index.tsx                      Dashboard: brand header + greeting ("Shop-Floor Overview"), stats row
                                             (Active Tasks / Floor Staff / System via systemClient health), primary CTA
                                             "Register Incoming Motor", Team Workload list w/ EmptyState. [WIP: redesigned]
Motors  (app)/motors/index.tsx               List + SearchInput + status filter chips (incl DELIVERED); limit 20;
                                             pagination; EmptyState when no matches. [WIP: redesigned]
        (app)/motors/register.tsx            Register Motor form (zod + react-hook-form).
        (app)/motors/[id]/index.tsx          Motor detail, photos, call-customer (tel:), power/phase display.
        (app)/motors/[id]/edit.tsx           Edit Motor (form pre-filled).
        (app)/motors/[id]/upload.tsx         Photo upload (pickAndCompress → uploadMotorImage).
        (app)/motors/[id]/history.tsx        Motor history (TimelineItem).
Jobs    (app)/jobs/index.tsx                 List w/ status filters (incl CANCELLED) + client-side search (jobNumber/motor/customer).
        (app)/jobs/create.tsx                New Job (accepts motorId param).
        (app)/jobs/[id]/index.tsx            Job detail; status transition modal (notes) via getNextJobStatuses + haptics.
        (app)/jobs/[id]/add-task.tsx         Add task (owner-only employee list enable).
        (app)/jobs/[id]/history.tsx          Job history timeline.
Tasks   (app)/tasks/index.tsx                List; my/all view modes; owner sees team dashboard (STATUS_TABS).
        (app)/tasks/[id].tsx                 Task detail; assign modal (employees isActive limit 100); status updates + haptics.
Team    (app)/employees/index.tsx            Status dashboard + search + Add Staff.
        (app)/employees/create.tsx           Add Staff (name/phone; role default EMPLOYEE).
        (app)/employees/[id].tsx             Staff profile; edit modal (name/phone/role/isActive); task list.
Settings(app)/settings/index.tsx             Health check + Sign out (clears session → /(auth)/select-actor).
Audit   (app)/history/index.tsx              Global audit log; action filter chips; useGlobalHistory (limit 25).
```

Header styling is shared across all nested stacks: `headerTintColor: Colors.light.primary`, `headerShadowVisible: false`, header bg `Colors.light.background`, back title "Back". Screen titles: Motors, Register Motor, Motor Detail, Edit Motor, Upload Photo, Motor History / Jobs, New Job, Job Detail, Add Task, Job History / Tasks, Task Detail / Team Roster, Add Staff, Staff Profile / Settings / Audit Log.

## 5. Auth & Networking Layer (verified)

- **Store:** `src/store/useAuthStore.ts` (Zustand). Persists via `expo-secure-store` keys: `hww_access_token`, `hww_refresh_token`, `hww_actor_id`, `hww_actor_name`, `hww_actor_role`. Web uses `src/services/storage.service.web.ts` (localStorage + in-memory Map fallback). Methods: `setAdminSession`, `setActorSession`, `clearActor`, `clearAll`.
- **Client:** `src/api/client.ts` (axios). Attaches `Authorization: Bearer <token>` and `X-Employee-Id`; response interceptor with a **refresh-token queue**; skips refresh for `/auth/login` and `/auth/refresh`.
- **Errors:** `src/api/errors.ts` — `parseApiError` → `AppError` (`message`, `code`, `validationErrors`, `isNetworkError`). Network error copy: "Unable to connect to workshop server. Check your network or server status."
- **Env:** `src/config/env.ts` — `API_BASE_URL` from `EXPO_PUBLIC_API_URL`; dev fallback derives from `Constants.expoConfig?.hostUri` (Android emulator: `http://10.0.2.2:5000/api/v1`); `normalizeApiUrl()` appends `/api/v1`; `TIMEOUT_MS` 15000; `APP_VERSION '1.0.0'`; `CONTACT_PHONE '+919825272547'`, `WHATSAPP_URL 'https://wa.me/919825272547'`; `getDevApiUrl()`.
- **Secrets note:** the only env var referenced anywhere in source is `EXPO_PUBLIC_API_URL` (grep of `process.env`; the only other usage is `EXPO_OS` in `src/components/external-link.tsx`). `.env` and `.env.example` hold the same value — a public client config (API base URL), **not** a secret. Never log tokens/keys. `.env` is gitignored.

### ⚠️ API.md summary is stale vs its own body (verified, important)
`API.md` line 15 states *"There are no login or JWT endpoints in the MVP"* and shows an `X-Employee-Id`-only model — **that summary line is stale**. The same file's Auth section (lines ~160–334) fully documents `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, 15-min access JWTs, 7-day refresh tokens with rotation + reuse detection, and cookie-based delivery. `guide.md` confirms the two-tier model: admin OWNER via Bearer JWT, technicians via `X-Employee-Id` when an actor is selected (profile switching). The app code matches this auth section (JWT + refresh queue + `X-Employee-Id`).

**Known doc-vs-code nuance:** API.md says refresh tokens live in `HttpOnly, Secure` cookies and are "never exposed in JSON responses"; the app instead stores the refresh token client-side in SecureStore (`hww_refresh_token`) and refreshes itself, and parses login responses via `data.accessToken || data.token` (doc shows `{ token, tokenType }`).
**Unverified:** whether the deployed backend (`https://hindustan-motor-backend.onrender.com/api/v1`, set via `EXPO_PUBLIC_API_URL` — same value in `.env.example`) actually implements these auth endpoints. The backend repo is not present here; confirm before trusting either doc or code.

## 6. Domain Model (verified)

Defined in `src/types/domain.ts`, `src/types/api.ts`, `src/utils/jobTransitions.ts`:

- **Roles:** `OWNER`, `EMPLOYEE`.
- **JobStatus:** `RECEIVED`, `IN_PROGRESS`, `TESTING`, `READY_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`.
- **TaskStatus:** `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- **HistoryAction (13):** e.g. job/task status changes, motor registered/updated, employee added/updated, media uploaded — const array in `types/domain.ts`.
- **Job status transitions** (`getNextJobStatuses`): RECEIVED→[IN_PROGRESS, CANCELLED]; IN_PROGRESS→[TESTING, READY_FOR_DELIVERY, CANCELLED]; TESTING→[IN_PROGRESS, READY_FOR_DELIVERY, CANCELLED]; READY_FOR_DELIVERY→[DELIVERED, IN_PROGRESS, CANCELLED]; DELIVERED→[]; CANCELLED→[RECEIVED, IN_PROGRESS].
- Motor fields include customer, machine/power (HP/kW), phase (Single/Three), serial, received/expected dates, notes; photo URLs via `motor.images`.

**Unverified vs backend:** exact response envelopes for the global history endpoint and motors history (the code defensively handles both bare arrays and `{ history, pagination }`).

## 7. Services → Endpoint Mapping (verified in code)

All in `src/services/*.ts`. Base: `ENV.API_BASE_URL` (`config/env.ts`); the axios client appends `/api/v1`.

| Service | Endpoints |
| --- | --- |
| `auth.service.ts` | `POST /auth/login` (`data.accessToken || data.token`), `POST /auth/logout` (errors ignored), `GET /auth/me`. `LoginPayload: { email, password }`. |
| `motor.service.ts` | `GET /motors` (params: search/status/page/limit), `GET /motors/:id`, `POST /motors`, `PATCH /motors/:id`, `GET /motors/:id/history` (array OR `{history,pagination}`), `POST /motors/:id/images` (multipart). |
| `job.service.ts` | `GET /jobs`, `GET /jobs/:id`, `POST /jobs` (`{ motorId, notes }`), `PATCH /jobs/:id/status`, `GET /jobs/:id/tasks`, `POST /jobs/:id/tasks`, `GET /jobs/:id/history`. |
| `task.service.ts` | `GET /tasks/:id`, `PATCH /tasks/:id`, `PATCH /tasks/:id/status`. |
| `employee.service.ts` | `GET /employees`, `GET /employees/status` (dashboard), `GET /employees/:id`, `POST /employees`, `PATCH /employees/:id`, `GET /employees/:id/tasks`. |
| `history.service.ts` | `GET /history` (params: actorEmployeeId/action/startDate/endDate/page/limit). |
| `media.service.ts` | `pickAndCompressImage` — permissions, camera/gallery, resize to 1600px, JPEG 0.75 quality; `uploadMotorImage` → `POST /motors/:id/images`. |
| `systemClient` | `GET /health` — health check that bypasses actor requirements. |

## 8. Hooks / State (verified)

`src/hooks/*.ts` — thin React Query wrappers per domain with centralized `queryKeys` (`src/config/queryKeys.ts`):
- `useMotors`, `useJobs`, `useTasks`, `useEmployees`, `useHistory` (+ `useGlobalHistory`), `useNetworkStatus` (`@react-native-community/netinfo`).
- `useTheme` (`use-theme.ts`) / `useColorScheme` (`use-color-scheme.ts`, `.web.ts`) are in the same folder but are **template-chain only** — consumed only by the unused template components in §10, never by app screens. Prefer `useTheme()` for token access.
- Query config in root layout: retry only on 5xx (max 2, none for <500), `staleTime` 2 min; mutations invalidate relevant query groups.

## 9. Design Tokens (verified — must be used)

- `src/constants/colors.ts` — light/dark semantic palettes (`Colors.light`, `Colors.dark` indicated by `useColorScheme`), `StatusColors` for job/task status tones, `HistoryActionColors`. **Never hardcode hex or invent colors; use these tokens.**
- `src/constants/theme.ts` — `Spacing` (`xs4`…`six64`, `half/one/two/three/four/five`), `Radius` (`sm6`/`md10`/`lg14`/`full9999`), `Typography`, `Fonts` (platform-aware incl. web CSS vars).
- `src/global.css` — web font-family CSS vars; autofill overrides.
- UI rules (AGENTS.md / AIRULE.md): minimal UI, one primary CTA per screen, no gradients/heavy shadows/ornament, native controls preferred, no emojis in UI text.

## 10. Component Inventory (verified)

**In use:**
- `src/components/common/` — `Button`, `Input`, `SearchInput` (added in WIP: search box with clear "✕" button), `StatusBadge`.
- `src/components/feedback/` — `ErrorBanner`, `EmptyState` (added in WIP: icon + title + description + optional action button).
- `src/components/layout/` — `ScreenWrapper`.
- `src/components/domain/` — `TimelineItem` (used by motor/job history).

**Unused — Expo template leftovers (grep-verified: not imported from `src/app`):**
- `src/components/AppTabs` / `AppTabs.web` (`app-tabs.tsx`), `AnimatedIcon`/`AnimatedIcon.web` (splash overlay), `WebBadge`, `HintRow`, `Collapsible` (`components/ui/`), `ThemedText`, `ThemedView`, `ExternalLink`, plus template hooks `use-theme.ts`, `use-color-scheme.ts/.web.ts` (used only by the template components above, never by app screens).
- `StickyBottomCTA` (`src/components/layout/`) is **defined but unused** — safe to wire into bottom CTAs, or remove.
- Related unused deps: `@expo/ui`, `expo-glass-effect`, `expo-device`, `expo-system-ui`, `expo-font`, `expo-symbols`, `expo-web-browser` (some are indirect expo-router requirements — verify before removing).

## 11. Testing & Verification

- **No test files, no jest/babel/metro configs exist.** No test runner configured.
- Lint: `npm run lint`. Typecheck: `npx tsc --noEmit` (there is no `typecheck` script).
- Deploy/build config: `eas.json` — `development` (dev-client, internal), `preview` + `production` (APK, auto-incremented build number), `submit.production {}`. EAS projectId in `app.json` (`extra.eas`), owner `samirshaikh-devs-team`.
- `app.json`: name "Hindustan Motor Works", slug `hindustan-motor-mobile`, scheme `hindustanmotormobile`, splash bg `#208AEF`, plugins: `expo-router`, `expo-splash-screen`, `expo-secure-store`; typed routes + React Compiler on.

## 12. Skills & Agent Tooling

- `opencode.jsonc` instructions: `["AGENTS.md", "gemini.md", "AIRULE.md"]`; skill paths `.agents/skills` + `agents/skills`.
- `.agents/skills/` — 26 Expo/EAS skills (versions mirrored in `skills-lock.json`, source `expo/skills`, `plugins/expo/skills/<name>/SKILL.md`).
- `agents/skills/` — 5 custom skills (e.g. `ui-ux-engineer`, `frontend-engineer`, `seo-engineer`, `performance-engineer`, `Seo-keyword-research-implementation`).
- **Mandatory pre-change protocol (from AGENTS.md/gemini.md):** before ANY change, load ALL 5 custom skills + read `AIRULE.md`; Expo code must follow the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ and use color tokens from `src/constants/colors.ts`.
- `.claude/settings.json` exists (Claude tooling); `.kilo/` = worktrees gitignore.
- `API.md` (repo root — auth endpoint docs; see the stale-summary caveat in §5), `guide.md` (product/architecture overview incl. two-tier auth, storage & token refresh flow), `build.md` (build docs — read before EAS/build work). All three are at the **repo root**, not in a `docs/` folder. `README.md` is the default Expo template (not informative).

## 13. Working Notes for Agents

- Never commit unless explicitly asked.
- Follow AIRULE 4-state UI rule: every screen handles loading / empty / error / success (the new `EmptyState` component is the canonical empty-state treatment).
- **AIRULE: no emojis in UI text** — the current WIP uses emoji glyphs as icons (see §3); prefer `expo-symbols`/vector icons or text-only when continuing that work unless the user approves emoji icons.
- Don't invent endpoints or payloads — use `API.md` (its auth section, not the stale line-15 summary) **plus** the service wrappers in `src/services/*` as ground truth (the wrappers are the implemented reality).
- Reuse existing hooks/services/components; check `package.json` before adding deps.
- Environment/`.env` values are client config, but treat `.env` as sensitive (never commit it; it's gitignored).
- If a screen needs the four-state treatment or a new status, check `StatusColors` / `jobTransitions.ts` first.