# AI Rules — Hindustan Electricals Winding Works (Mobile)

Rules for AI agents (and humans) working on this Expo / React Native codebase.

## 1. Context First
- Read `AGENTS.md`, `guide.md`, and `API.md` before making any changes.
- Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo code.
- Use the skills in `.agents/`.

## 2. UI Principles
- **Keep the UI minimal.** No decorative noise, no gradients, heavy shadows, or ornamental components.
- Prefer native controls and system defaults over custom-styled widgets.
- One clear call-to-action per screen. Everything else stays quiet.
- Use the existing design tokens where they exist; never invent new colors on the fly.
- No emojis in UI text unless explicitly requested.

## 3. Code Style
- TypeScript strict mode only.
- No comments unless asked. Code should be self-explanatory.
- Reuse existing components, hooks, and services instead of duplicating logic.
- Do not add a dependency until you have checked `package.json` and confirmed it is already used.

## 4. Behavior
- Every screen must handle the four UI states: loading, empty, error, success.
- Do not invent API endpoints or payload shapes — follow `API.md` exactly.
- Do not log, print, or expose secrets, tokens, or keys.

## 5. Verification
- Run the project's lint and typecheck scripts after changes.
- Verify changes against the running app on simulator/device where possible.
- Do not commit unless explicitly asked.