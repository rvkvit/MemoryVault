# UI Flow & Experience Design

---

## 1. Design Language

The application uses a **Microsoft Fluent Design System** aesthetic with a farewell-appropriate dark, elegant theme:

- **Primary palette:** Deep midnight blue `#0C0F1E`, Microsoft blue `#0078D4`, luminous accent `#60EFFF`
- **Typography:** Segoe UI Variable (system font on Windows), Inter as fallback
- **Motion:** Framer Motion — spring physics, staggered reveals, no abrupt cuts
- **Atmosphere:** Subtle particle field (Three.js) on hero — feels like looking at stars, not a web page
- **Tone:** Warm, sincere, professional — not a birthday card, not a corporate memo

---

## 2. Page & Route Map

```
/                           →  302 /to/{slug} (if from email link)
/to/{slug}                  →  Recipient farewell page (SSR + auth)
/to/{slug}#guestbook        →  Deep link to guestbook section
/denied                     →  Access denied (identity mismatch)
/auth/login                 →  Entra ID redirect (no UI — instant redirect)
/auth/callback              →  OAuth callback (no UI — server-side processing)

/admin                      →  Admin dashboard
/admin/recipients           →  List all recipients
/admin/recipients/new       →  Create recipient
/admin/recipients/{id}      →  Edit recipient
/admin/pages/{recipientId}  →  Page content editor
/admin/media/{pageId}       →  Media manager
```

---

## 3. User Journey: Recipient

### Step 1 — Receives Email

```
┌────────────────────────────────────────────────────────────────┐
│  FROM:  Your Farewell Team <farewell@contoso.com>              │
│  TO:    jane.doe@contoso.com                                   │
│  SUBJ:  Something special awaits you, Jane ✨                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  [CONTOSO LOGO]                          │  │
│  │                                                          │  │
│  │     Jane, your journey here has been extraordinary.     │  │
│  │                                                          │  │
│  │   We've put something together — just for you.          │  │
│  │                                                          │  │
│  │          ┌─────────────────────────────┐                │  │
│  │          │  Open Your Farewell Page → │                │  │
│  │          └─────────────────────────────┘                │  │
│  │                                                          │  │
│  │   This page is private, created just for you.          │  │
│  │   You'll sign in with your work account to view it.    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

Email is rendered as an HTML template via React Email + Azure Communication Services.

---

### Step 2 — Click Link → Microsoft Login

The link navigates to `/api/v1/auth/login?slug=jane-doe-2024` which immediately redirects to the Microsoft login page. No intermediate page is shown.

After sign-in → automatic redirect back to the app.

---

### Step 3 — AI Loading Screen (2–3 seconds)

The first thing the authenticated user sees after redirect is a full-screen AI loading experience while the page data loads server-side:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                                                                │
│              [Animated particle constellation]                 │
│                  Stars slowly connecting                       │
│                                                                │
│                                                                │
│              Assembling your memories...          [████░░░] 72%│
│                                                                │
│                                                                │
│         Subtle typewriter: "Every great journey leaves        │
│                              a trail of stars."               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Implementation:
- `loading.tsx` in Next.js App Router renders during SSR data fetch
- Three.js particle network — 200 nodes, WebGL, 60fps
- Lottie animation for progress indicator
- Typewriter effect cycles through 5 curated quotes

---

### Step 4 — Hero Section (Full Screen, Cinematic)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│              [Floating particle field — background]            │
│                                                                │
│                                                                │
│         ╔═══════════════════════════════════════╗             │
│         ║                                       ║             │
│         ║    [Avatar photo — circular, glowing] ║             │
│         ║                                       ║             │
│         ║           JANE DOE                    ║             │
│         ║     Senior Software Engineer          ║             │
│         ║         Azure Core · 6.7 years        ║             │
│         ║                                       ║             │
│         ║    "Wishing you the most incredible   ║             │
│         ║      next chapter, Jane."             ║             │
│         ║                                       ║             │
│         ╚═══════════════════════════════════════╝             │
│                                                                │
│                    ↓ scroll to explore ↓                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Animation sequence (Framer Motion):
1. Background particles fade in (0.8s)
2. Avatar image scales from 0.8 → 1.0 with glow pulse (1.0s, spring)
3. Name fades up from y+20 (1.2s)
4. Title and tenure fade up with 200ms stagger
5. Message reveals character-by-character (typewriter, 1.8s)
6. Scroll indicator appears after all elements settle (2.5s)

---

### Step 5 — Personal Message Section

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │     [Decorative horizontal rule with gradient]           │  │
│  │                                                          │  │
│  │     A Message From Your Team                             │  │
│  │                                                          │  │
│  │     Jane, when you joined Azure Core in March 2018,      │  │
│  │     the networking stack looked very different. Over      │  │
│  │     the next 6+ years, you touched every major           │  │
│  │     initiative — from the VNet peering redesign          │  │
│  │     to leading the QUIC protocol team...                 │  │
│  │                                                          │  │
│  │     [Rich HTML, styled, responsive]                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Reveal: Section fades in as user scrolls into view (Intersection Observer → Framer Motion).

---

### Step 6 — Timeline Section

Horizontal scrollable timeline on desktop, vertical stack on mobile.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  The Journey                                                   │
│                                                                │
│  ────●──────────●──────────●──────────●──────────●────        │
│      │          │          │          │          │            │
│   Mar 2018  Dec 2018   Sep 2020   Jan 2022   Nov 2023        │
│   Joined    First      QUIC       Principal  Promoted        │
│   Azure     promo      Lead       Eng        to L66          │
│   Core      to L63                                            │
│                                                                │
│   [Hover/tap each dot → tooltip with full description]        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Timeline nodes animate in with staggered delays as user scrolls to section.  
Active node pulsates gently (CSS keyframe, not JS).

---

### Step 7 — Photo Gallery

Masonry grid layout with lightbox.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Moments                                                       │
│                                                                │
│  ┌────────┐  ┌────────────────┐  ┌──────┐                     │
│  │        │  │                │  │      │                     │
│  │ Photo  │  │    Photo       │  │Photo │                     │
│  │   1    │  │      2         │  │  3   │                     │
│  │        │  │                │  │      │                     │
│  └────────┘  └────────────────┘  └──────┘                     │
│  ┌──────────────┐  ┌─────────┐  ┌──────────┐                 │
│  │              │  │         │  │          │                 │
│  │    Photo 4   │  │ Photo 5 │  │  Photo 6 │                 │
│  │              │  │         │  │          │                 │
│  └──────────────┘  └─────────┘  └──────────┘                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

- Photos load lazily with placeholder blur (Next.js `Image` with `blurDataURL`)
- Click opens full-screen lightbox (Framer Motion layout animation)
- Lightbox: keyboard arrows, touch swipe, ESC to close
- Captions displayed on hover (desktop) / always visible (mobile)

---

### Step 8 — Video Section (Optional)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  A Message From The Team                                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │        [Video player — custom styled controls]           │  │
│  │                        ▶                                 │  │
│  │                                                          │  │
│  │        [Widescreen 16:9 thumbnail with play overlay]     │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Video served via Azure CDN with SAS token. Uses native `<video>` element with custom controls.  
No third-party video embeds (Vimeo/YouTube) — all media stays within the org's Azure tenant.

---

### Step 9 — Guestbook

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Words From Your Colleagues             [47 messages]          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Avatar]  John Smith · Engineering Director             │  │
│  │           "Jane, your calm approach to the most         │  │
│  │            chaotic incidents was legendary. We'll        │  │
│  │            miss you in the war room. 🌟"                │  │
│  │                                             Dec 15, 2024 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Avatar]  Sarah Chen · Staff Engineer                   │  │
│  │           "Working with you on the QUIC project was      │  │
│  │            the highlight of my last two years. 💙"       │  │
│  │                                             Dec 14, 2024 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ────────────────────────────────────────────────────────────  │
│                                                                │
│  Leave a message for Jane                                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Your message...                                         │  │
│  │                                                          │  │
│  │  [Emoji picker]                     [2000 chars max]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│                                    [Post Message →]            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

- Author identity comes from the authenticated session (not self-typed)
- New messages animate in at the top with a green highlight fade
- Infinite scroll (cursor pagination, loads 20 at a time)
- If the guestbook author is the recipient themselves: "Writing in your own guestbook? 💙" (allowed, charming edge case)

---

## 4. Access Denied Page (`/denied`)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    [Lock icon — animated]                      │
│                                                                │
│              This page is private.                             │
│                                                                │
│    This farewell page was created for a specific person.       │
│    The page can only be viewed by its intended recipient.      │
│                                                                │
│    If you received this link by mistake, please let           │
│    the sender know.                                            │
│                                                                │
│                    [Sign Out]                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

- Never reveals the recipient's name or email
- Never reveals the slug content
- Shows the signed-in user's own name: "Signed in as: john.smith@contoso.com"
- Clean, non-accusatory tone

---

## 5. Admin Portal UI

### Dashboard
- Summary cards: Total recipients, Published pages, Pending invites, Guestbook entries today
- Recent activity feed (from audit log)
- Quick actions: Create Recipient, Send Pending Emails

### Page Editor
- Two-panel layout: editor left, live preview right
- Rich text editor (TipTap) for personalized message
- Timeline builder: drag-and-drop event ordering
- Theme selector: 5 dark themes (midnight blue, emerald, violet, rose, slate)
- Toggle switches for sections
- Publish/Unpublish button with confirmation modal

### Media Manager
- Drag-and-drop photo/video upload
- Direct-to-Blob upload via SAS (progress bar)
- Thumbnail grid with drag-to-reorder
- Caption editor per asset

---

## 6. Responsive Breakpoints

| Breakpoint | Layout Change |
|---|---|
| `< 640px` (mobile) | Single column, vertical timeline, stack gallery, full-width guestbook form |
| `640–1024px` (tablet) | Two-column gallery, horizontal timeline condensed, sidebar-less admin |
| `> 1024px` (desktop) | Full masonry gallery, horizontal timeline, admin split-panel |

All animations respect `prefers-reduced-motion: reduce` — replaced with simple fade-ins.

---

## 7. Accessibility

- WCAG 2.1 AA target
- All interactive elements keyboard-navigable (tab order, focus rings)
- ARIA roles on custom components (lightbox, timeline, guestbook feed)
- Color contrast: all text meets 4.5:1 on dark backgrounds
- Alt text on all photos (admin-supplied caption used as alt)
- Video: captions required before upload is allowed
- Screen reader: `aria-live` regions for guestbook new-post feedback

---

## 8. Performance Targets

| Metric | Target |
|---|---|
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100ms |
| Total Blocking Time (TBT) | < 300ms |
| Bundle size (initial JS, gzipped) | < 180 KB |

Optimizations:
- Next.js Image optimization (auto-webP, size variants)
- Photos loaded with `priority` only for above-the-fold avatar
- Three.js loaded dynamically (only on hero section, deferred)
- Framer Motion tree-shaken to needed features only
- Azure CDN for all static assets (cache-forever with content hash)
