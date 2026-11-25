# Design — Memora (Gen Z v2)

A locked design system for the Memora frontend (`memora-frontend`). Every route reads this system before emitting or updating UI code. Preserves the approved Memora Gen Z v2 brand identity (`BRAND_SYSTEM.md`, `MIGRACAO_BRAND_GENZ_V2.md`, `docs/specs/frontend/design-system.md`) while enforcing Hallmark anti-slop structural, typographic, contrast, state, and responsive discipline.

## Genre
`playful` (tactile, photographic consumer studio — expressive but restrained; never SaaS dashboard, never glassmorphism, never neon gradients)

## Macrostructure families
- **Marketing (`/`):** Split Diptych (`H2`, desktop 7/5 left-copy + photographic collage) collapsing to Photographic Fold (`H6`, mobile full-bleed) + Statement Band (`Ft5`).
- **Catalog & Collections (`/templates`, `/meus-murais`, `/biblioteca`, `/m/[shareToken]`):** Portfolio / Product Card Grid (`F6`) with single-layer containment (no card-in-card), hairline dividers, and tabular metadata.
- **Studio & Creation Flows (`/criar`, `/editor/[draftId]`, `/murais/[muralId]/configurar`, `/murais/[muralId]/compartilhar`, `/murais/[muralId]/contribuicoes`, `/templates/meu-niver`):** Workbench (`05 · Workbench`) with dedicated dark studio chrome for the composition editor and focused warm-paper workspaces for creation, publishing, sharing, and moderation.

## Theme (Memora Gen Z v2 — locked brand palette)
- `--color-ink`: `#191d20` (`oklch(22.5% 0.008 235)`) — primary ink, dark studio surface, high-contrast text on lime/paper
- `--color-paper`: `#f7f7f2` (`oklch(97.3% 0.008 106)`) — warm off-white page base
- `--color-paper-2`: `#f0f0e9` (`oklch(95.1% 0.010 106)`) — subtle raised/hover neutral surface
- `--color-paper-3`: `#e6e6dd` (`oklch(92.0% 0.012 106)`) — sunken/muted neutral surface
- `--color-white`: `#ffffff` — elevated card surfaces and text on dark ink
- `--color-lime`: `#d9fd61` (`oklch(93.8% 0.195 123)`) — primary CTA fill (always paired with `--color-ink`, 14.68:1 contrast)
- `--color-cobalt`: `#475cfa` (`oklch(54.8% 0.228 267)`) — focus ring, active selection, editorial display accent
- `--color-coral`: `#ff725e` (`oklch(71.5% 0.188 28)`) — celebratory highlight & contextual badge/action (never competing as a second primary CTA next to lime)
- `--color-muted`: `#4e565c` — secondary copy on light paper (6.96:1 contrast)
- `--color-border` / `--color-rule`: `#e3e3dc` — hairline 1px dividers and neutral borders
- `--color-focus`: `var(--color-cobalt)` — instant, non-animated 2–3px `:focus-visible` ring

## Typography
- **Display:** `"Space Grotesk"`, `system-ui, sans-serif` — weights `600`, `700`, roman (`font-style: normal`; italic headers banned), tight tracking (`-0.055em` to `-0.03em`), `overflow-wrap: anywhere; min-width: 0`.
- **Body & UI:** `"DM Sans"`, `system-ui, sans-serif` — weights `400`, `500`, `600`, `700`; minimum 16px body copy where comfortable, 14px minimum for UI controls, `font-variant-numeric: tabular-nums` on all counters, counts, dates, and dimensions.
- **Wordmark:** lowercase `memora` in Space Grotesk `700` paired with the rounded-square ink/lime `m` monogram.
- **No serifs** in v2 UI (`design-system.test.ts` enforces non-serif pairing).

## Spacing
4-point named scale (`--space-3xs` = `0.25rem` through `--space-3xl` = `6rem`) defined in `tokens.css`. Use `gap` for sibling spacing; avoid uniform padding across unrelated sections.

## Motion
- **Easings:** `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in: cubic-bezier(0.7, 0, 0.84, 0)`, `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`. Banned: browser default `ease`, `transition: all`, bouncy overshoot.
- **Durations:** `--dur-micro: 120ms`, `--dur-short: 220ms`, `--dur-long: 380ms`.
- **Properties:** animate `transform`, `opacity`, `background-color`, `border-color`, `color` only — never layout properties (`width`, `height`, `border-width`, `margin`, `padding`).
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` collapses transitions and animations to ≤ 150ms opacity / instant state switches.

## Microinteractions & 8-State Discipline
- Every interactive control handles: `default`, `hover` (gated by `@media (hover: hover)` for transforms), `:focus-visible` (instant, never transitioned), `:active` (`translateY(1px)` tactile press), `disabled` (`opacity` + muted surface + `cursor: not-allowed`), `loading` (skeletons or clear inline busy copy), `error` (constant 1px border width + error token + icon/text — never color-only or layout-shifting 2px border), and `success` (quiet inline confirmation).
- All touch targets ≥ 44×44 CSS px across 320–1920px viewports.
- No clickable text wraps to two lines (`white-space: nowrap` on buttons, nav links, pills, CTAs).
- Global `overflow-x: clip` on both `html` and `body` (never `hidden`, never `100vw`).

## CTA Voice
- **Primary CTA:** filled `--color-lime` pill/rounded button with `--color-ink` text, hover `--color-hover` (`#c8f043`), active `translateY(1px)`.
- **Secondary CTA:** crisp hairline outline (`1px solid var(--color-ink)` or `--color-border-strong`) on `--color-surface`, hover `--color-paper-2`. Never place a bright coral filled CTA directly beside a bright lime CTA as competing primaries.
- **Dark-surface rule:** any container overriding `background` to `--color-ink` or dark studio surface MUST explicitly declare light foreground tokens (`--color-white` / `--color-on-dark-muted`) for all text and footer children.

## What pages MUST share
- Wordmark (`memora`) + ink/lime `m` monogram.
- Locked palette from `tokens.css` (zero inline hex improvisation).
- Space Grotesk + DM Sans typography pairing.
- Single-line buttons, 44×44px touch targets, instant cobalt focus rings, constant-width form borders, and dark-surface contrast pairing.

## Exports

### tokens.css
See [`tokens.css`](tokens.css) at the frontend root (imported first by `src/app/global.css`).

### Tailwind v4 `@theme`
```css
@theme {
  --color-ink: #191d20;
  --color-paper: #f7f7f2;
  --color-paper-2: #f0f0e9;
  --color-paper-3: #e6e6dd;
  --color-lime: #d9fd61;
  --color-cobalt: #475cfa;
  --color-coral: #ff725e;
  --color-muted: #4e565c;
  --color-border: #e3e3dc;
  --color-focus: #475cfa;
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --spacing-3xs: 0.25rem;
  --spacing-2xs: 0.5rem;
  --spacing-xs: 0.75rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`
```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "ink": { "$value": "#191d20", "$type": "color" },
    "paper": { "$value": "#f7f7f2", "$type": "color" },
    "paper-2": { "$value": "#f0f0e9", "$type": "color" },
    "lime": { "$value": "#d9fd61", "$type": "color" },
    "cobalt": { "$value": "#475cfa", "$type": "color" },
    "coral": { "$value": "#ff725e", "$type": "color" },
    "muted": { "$value": "#4e565c", "$type": "color" },
    "border": { "$value": "#e3e3dc", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Space Grotesk, system-ui, sans-serif", "$type": "fontFamily" },
    "body": { "$value": "DM Sans, system-ui, sans-serif", "$type": "fontFamily" }
  },
  "duration": {
    "micro": { "$value": "120ms", "$type": "duration" },
    "short": { "$value": "220ms", "$type": "duration" },
    "long": { "$value": "380ms", "$type": "duration" }
  }
}
```

### shadcn/ui CSS variables
```css
:root {
  --background: 97.3% 0.008 106;
  --foreground: 22.5% 0.008 235;
  --card: 100% 0 0;
  --card-foreground: 22.5% 0.008 235;
  --primary: 93.8% 0.195 123;
  --primary-foreground: 22.5% 0.008 235;
  --secondary: 95.1% 0.010 106;
  --secondary-foreground: 22.5% 0.008 235;
  --muted: 92.0% 0.012 106;
  --muted-foreground: 45.2% 0.012 230;
  --accent: 54.8% 0.228 267;
  --accent-foreground: 100% 0 0;
  --destructive: 50.5% 0.190 27;
  --destructive-foreground: 100% 0 0;
  --border: 91.5% 0.010 106;
  --input: 91.5% 0.010 106;
  --ring: 54.8% 0.228 267;
  --radius: 14px;
}
```
