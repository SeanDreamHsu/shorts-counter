# Repository Guidelines

## Project Structure & Module Organization
This repo tracks two sibling apps: `extension/` (Vite/React Chrome extension) and `shorts-tracker/` (Next.js dashboard). In `extension/src`, reusable UI lives in `components/`, host integrations in `content/`, helpers in `utils/`, and static assets in `public/`; `dist/` is generated only. The dashboard mirrors Next conventions—routes and layouts in `app/`, shared UI in `components/`, data helpers in `lib/`, and public assets in `public/`. Keep cross-cutting logic local to each surface; only share typed data structures when both apps truly need them.

## Build, Test, and Development Commands
- `cd <app> && npm install` — install dependencies (run separately in each folder).
- `npm run dev` — start the local dev server or extension watch build.
- `npm run build` — production bundling (`tsc && vite build` or `next build`).
- `npm run lint` — ESLint checks; run `--fix` before committing.
- `npm run preview` (extension) / `npm start` (dashboard) — review optimized output.

## Coding Style & Naming Conventions
Everything is TypeScript + React. Use functional components, hooks, and strict typing instead of `any`. Components and files remain `PascalCase` (`AppleLiquidCard.tsx`), utilities stay `camelCase` (`aiAnalyzer.ts`), and route folders mirror their URL segment. Match existing indentation (4 spaces throughout the extension, 2 spaces inside Next) and rely on Tailwind utility-first classes with clsx/tailwind-merge for conditional styling. Chrome-specific work belongs in `src/content`, while popup/options UI stays under `src/components` or `src/popup`.

## Testing Guidelines
Automated tests are not wired in yet, so add coverage when touching critical timers, analytics, or parsing. Favor Vitest + React Testing Library for the extension (`src/__tests__/...`) and either Playwright E2E or Jest/RTL for dashboard components. Document manual verification steps (e.g., “load unpacked extension, start/stop timer”) in every PR until suites exist. Aim for smoke coverage on any new store, hook, or API client.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`) so the history stays scannable. Keep extension and dashboard changes in separate commits whenever possible. Every PR description should outline the problem, solution, and verification commands, plus screenshots or GIFs for UI changes. Mention new env vars, confirm `npm run build` + `npm run lint` passed, and keep generated directories such as `dist/` and `.next/` out of Git.

## Environment & Security Tips
Store secrets in ignored env files (`extension/.env`, `shorts-tracker/.env.local`) and load them via `import.meta.env` or `process.env`. Never commit API keys or raw analytics logs.
