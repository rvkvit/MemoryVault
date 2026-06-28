# Farewell — Product Design Specification

**Role:** Senior Product Designer, Microsoft Fluent UI  
**Version:** 1.0  
**Status:** Design Complete — Ready for Engineering Handoff  
**Last Updated:** 2026-06-27

---

## Design Philosophy

This is not a farewell card. It is a **memory artifact** — something a person opens once, alone, and feels something real.

The experience borrows from how modern AI products (Copilot, ChatGPT, Perplexity) communicate intelligence and depth through negative space, motion, and restrained color. Emotional weight comes not from decoration but from **timing, contrast, and restraint**.

Three governing principles:

1. **Earned emotion.** Nothing should feel forced. Animations emerge from meaning, not aesthetics alone. The loading screen doesn't spin — it *remembers*. The hero doesn't fade in — it *arrives*.
2. **Depth without clutter.** Glassmorphism used sparingly — only to create hierarchy, never as decoration. Every frosted panel earns its blur.
3. **Fluent Motion.** Every transition follows Microsoft Fluent Design motion principles: spring physics, directional consistency, meaningful duration. Nothing at constant velocity.

---

## Design System Foundation

### Color Palette

```
── Core Backgrounds ──────────────────────────────────────────
Space Black         #050810    Page background (true base)
Deep Navy           #080D1A    Secondary surfaces
Void Blue           #0A1128    Tertiary fills

── Glass Surfaces ────────────────────────────────────────────
Glass Primary       rgba(255, 255, 255, 0.04)   + backdrop-blur(24px)
Glass Hover         rgba(255, 255, 255, 0.07)   + backdrop-blur(24px)
Glass Active        rgba(255, 255, 255, 0.10)   + backdrop-blur(24px)
Glass Border        rgba(255, 255, 255, 0.08)   1px stroke
Glass Border Lit    rgba(255, 255, 255, 0.18)   hover/focus state

── Brand Spectrum ────────────────────────────────────────────
Microsoft Blue      #0078D4    Primary brand anchor
Electric Blue       #00A8E8    Elevated accent
Copilot Teal        #00D4B8    AI / intelligence signals
Luminous Cyan       #60EFFF    Highlight, glow halos
Warm Gold           #F0B429    Emotional warmth, milestones
Soft Violet         #8B7CF8    Timeline accents, depth
Blush Rose          #F472B6    Rare emotional accent (photos, goodbye)

── Typography ────────────────────────────────────────────────
Text Primary        rgba(255, 255, 255, 0.95)
Text Secondary      rgba(255, 255, 255, 0.55)
Text Tertiary       rgba(255, 255, 255, 0.30)
Text Disabled       rgba(255, 255, 255, 0.18)

── Semantic ──────────────────────────────────────────────────
Success             #22D3A5
Warning             #F0B429
Error               #F87171
Info                #60EFFF
```

### Gradient Vocabulary

```
Mesh Background
  Layer 1 (bottom-left):
    radial-gradient(ellipse 80% 60% at 10% 90%,
      rgba(0, 120, 212, 0.12) 0%, transparent 70%)
  Layer 2 (top-right):
    radial-gradient(ellipse 70% 50% at 90% 10%,
      rgba(0, 212, 184, 0.07) 0%, transparent 60%)
  Layer 3 (center):
    radial-gradient(ellipse 100% 80% at 50% 50%,
      rgba(139, 124, 248, 0.04) 0%, transparent 70%)
  All three layered via multiple backgrounds on <body>

Hero Gradient Orb (behind avatar):
  radial-gradient(circle 500px at center,
    rgba(0, 168, 232, 0.20) 0%,
    rgba(0, 212, 184, 0.10) 40%,
    transparent 70%)

Text Gradient (headline):
  linear-gradient(135deg,
    rgba(255,255,255,0.98) 0%,
    rgba(255,255,255,0.75) 100%)
  -webkit-background-clip: text

Accent Line:
  linear-gradient(90deg,
    transparent 0%,
    #00D4B8 30%,
    #0078D4 70%,
    transparent 100%)

Timeline Track:
  linear-gradient(180deg,
    transparent 0%,
    rgba(0, 212, 184, 0.40) 20%,
    rgba(139, 124, 248, 0.60) 80%,
    transparent 100%)
```

### Typography Scale

```
Font stack:   "Segoe UI Variable", "Segoe UI", Inter, system-ui, sans-serif
Font feature: "cv01", "cv02", "cv03" (optical size variants via @font-face)

──────────────────────────────────────────────────────────────────
Scale            Size   Line-height  Weight  Letter-spacing
──────────────────────────────────────────────────────────────────
Display XL       72px   1.0          300     -0.04em  (hero name)
Display L        56px   1.05         300     -0.03em  (section hero)
Display M        40px   1.1          400     -0.02em  (section titles)
Heading L        28px   1.25         500     -0.01em
Heading M        22px   1.3          500     0
Heading S        18px   1.4          600     0
Body L           17px   1.7          400     0        (message body)
Body M           15px   1.65         400     0        (guestbook)
Body S           13px   1.6          400     0        (captions)
Label L          12px   1.5          600     0.06em   (all-caps labels)
Label S          10px   1.4          700     0.10em   (all-caps micro)
──────────────────────────────────────────────────────────────────
```

### Motion Vocabulary

```
Easing:
  Cinematic Enter:  cubic-bezier(0.16, 1, 0.3, 1)    ← expo out
  Cinematic Exit:   cubic-bezier(0.7, 0, 0.84, 0)    ← expo in
  Spring Bounce:    spring(stiffness:300, damping:28)  ← Framer
  Soft Spring:      spring(stiffness:200, damping:35)  ← Framer
  Slide:            cubic-bezier(0.25, 0.46, 0.45, 0.94)

Duration:
  Micro:     150ms   (state changes: hover, focus)
  Standard:  350ms   (component enters)
  Medium:    600ms   (section reveals)
  Cinematic: 900ms   (hero, page transitions)
  Epic:     1400ms   (AI loading, constellation)

Stagger:
  Children offset:  60ms   (guestbook cards, gallery)
  Section offset:   120ms  (page section cascade)

Rule: Nothing animates at constant velocity. No linear easings anywhere.
Rule: Respect prefers-reduced-motion — all animations reduce to opacity only.
```

### Spacing & Layout

```
Base unit:    4px
Grid:         12-column, 1440px max-width, 80px horizontal padding (desktop)
              4-column,  20px horizontal padding (mobile)

Section spacing (vertical rhythm):
  Between sections:       160px (desktop), 80px (mobile)
  Section internal:        64px (desktop), 40px (mobile)
  Component internal:      24px standard, 16px compact

Border radius scale:
  Micro:     4px   (badges, tags)
  Small:     8px   (buttons, inputs)
  Medium:    16px  (cards, panels)
  Large:     24px  (hero card, modal)
  XLarge:    40px  (full-bleed containers)
  Pill:      9999px
```

---

## 01 · Landing / Gateway Page

*The URL from the email resolves here before authentication is confirmed. It is the first impression.*

### Visual Layout

The page is **one viewport tall, no scroll**. The entire screen is the moment of arrival.

```
┌─────────────────────────────────────────────────────────────────┐
│  Background: Space Black #050810                                 │
│                                                                  │
│  Mesh gradient orbs (subtle, moving slowly):                    │
│    Orb 1: Blue-teal ellipse, bottom-left, opacity 0.12          │
│    Orb 2: Violet ellipse, top-right, opacity 0.07               │
│                                                                  │
│                                                                  │
│                    [Microsoft logo — 18px, opacity 0.40]        │
│                    [top-left, 40px from edges]                  │
│                                                                  │
│                                                                  │
│                                                                  │
│            ┌────────────────────────────────────────┐           │
│            │  Glass panel                           │           │
│            │  Background: rgba(255,255,255,0.04)    │           │
│            │  Border: 1px rgba(255,255,255,0.10)    │           │
│            │  Border-radius: 24px                   │           │
│            │  Backdrop-filter: blur(40px)           │           │
│            │  Padding: 64px 56px                    │           │
│            │                                        │           │
│            │  [AI orb icon — 48px, animated]        │           │
│            │  [pulsing concentric rings, teal]      │           │
│            │                                        │           │
│            │  Something is waiting for you.         │           │
│            │  [Display M, weight 300, white 95%]    │           │
│            │                                        │           │
│            │  A private farewell page has been      │           │
│            │  created in your honor. Sign in with   │           │
│            │  your Microsoft account to open it.    │           │
│            │  [Body L, white 55%, max-width 320px]  │           │
│            │                                        │           │
│            │  [24px gap]                            │           │
│            │                                        │           │
│            │  ┌──────────────────────────────────┐  │           │
│            │  │  [Microsoft icon 16px]            │  │           │
│            │  │  Continue with Microsoft          │  │           │
│            │  │  Background: #0078D4              │  │           │
│            │  │  Height: 52px, border-radius: 8px │  │           │
│            │  │  Full width of panel              │  │           │
│            │  └──────────────────────────────────┘  │           │
│            │                                        │           │
│            │  This page is private and was sent     │           │
│            │  only to you. [Label S, 30% opacity]   │           │
│            └────────────────────────────────────────┘           │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Animations — Landing Page

**Background mesh orbs:**
- Both orbs drift extremely slowly — a complete loop in 40 seconds
- Orb 1: translate from (0,0) → (+30px, -20px) → (0,0), ease: `linear` (exception — continuous drift)
- Orb 2: translate from (0,0) → (-20px, +30px) → (0,0), offset phase by 20s
- Neither orb is ever static. The page breathes.

**Panel entrance:**
- Initial state: `opacity: 0`, `transform: translateY(24px) scale(0.98)`
- Animate to: `opacity: 1`, `transform: translateY(0) scale(1)`
- Duration: 900ms, easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Delay: 200ms (allows background to settle first)

**Content stagger inside panel:**
- AI orb icon: fade in at t=0 (relative to panel appearing)
- Headline: fade+slide up 16px at t=100ms
- Body text: fade+slide up 16px at t=200ms
- Button: fade+slide up 16px, scale 0.95→1 at t=320ms

**AI Orb icon animation:**
- A 48px circle with gradient fill: `radial-gradient(circle, #00D4B8, #0078D4)`
- Three concentric rings expand from center, each with opacity that decreases with distance
- Ring 1: diameter 48px → 80px, opacity 0.6 → 0, duration 2s, loop
- Ring 2: same, delayed by 667ms
- Ring 3: same, delayed by 1333ms
- Creates a continuous "breathing pulse" — like a sonar ping

**Microsoft button — hover:**
- Background: `#0078D4` → `#006CBD` (10ms, linear — intentionally fast for button)
- Subtle inner glow: `box-shadow: inset 0 1px 0 rgba(255,255,255,0.15)`
- Transform: `translateY(-1px)` on hover, `translateY(0)` on active
- Duration: 150ms

**Button — loading state (after click):**
- Text "Continue with Microsoft" dissolves (opacity 0, 200ms)
- Three dots appear, animate left-to-right: each dot scales 0.6→1→0.6
- Stagger: 120ms between dots
- Duration per cycle: 600ms
- Button background remains #0078D4 (no spinner style — subtle is premium)

---

## 02 · Authentication Handoff

*The transition from the Microsoft login page back into the app.*

No custom UI here — the user is on Microsoft's identity platform. What we control is what happens in the **milliseconds after the redirect returns**.

**Post-callback transition:**

The callback route processes silently. While it does:

- The page background is already at Space Black (set via `<meta name="theme-color">` and inline CSS in the `<head>`)
- A single horizontal line of light appears, center-screen: 0px wide → 100vw wide, duration 600ms, color: Copilot Teal `#00D4B8`, height 1px, `blur(2px)` applied via SVG filter
- Line holds for 200ms
- Then immediately dissolves as the AI loading screen erupts from its center point

This creates a "portal opening" metaphor — the line sweeps open the next space.

---

## 03 · AI Loading Screen — "Memory Retrieval"

*The most technically rich animation in the product. Takes 2.5–3.5 seconds. Sets the emotional and aesthetic tone.*

This is not a spinner. It is a **narrative**. The system is "finding your memories" — each visual element reinforces that meaning.

### Full Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Background: Space Black                                         │
│  Mesh gradients visible (same as landing, but more saturated)   │
│                                                                  │
│                                                                  │
│                                                                  │
│                    [Constellation canvas — full screen]         │
│                    Stars appear, connect, dissolve              │
│                                                                  │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │   Center of screen                      │             │
│         │                                         │             │
│         │   [Circular progress ring — 80px diam]  │             │
│         │   [Rotating arc, gradient stroke]        │             │
│         │                                         │             │
│         │   [Avatar appears inside ring — 64px]   │             │
│         │   [Blurred initially, sharpens]         │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│         Retrieving your memories...                              │
│         [Heading S, white 55%, centered]                         │
│                                                                  │
│         [Scrolling status text — typewriter]                    │
│         [Body S, Copilot Teal, monospace-ish]                   │
│         [Changes every 400ms]                                   │
│                                                                  │
│         [Linear progress bar — 480px wide]                      │
│         [Teal→Blue gradient fill, animated width]               │
│         [Thin: height 2px, border-radius 1px]                   │
│         [Track: rgba(255,255,255,0.08), same dimensions]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase-by-Phase Animation Breakdown

**Phase 0 — Portal Opens (0ms – 400ms)**
- The horizontal teal line from the callback transition is at full width
- Line contracts vertically into a bright point at screen center (400ms, Expo In)
- Point expands into the circular progress ring (scale 0 → 1, spring bounce)
- Background mesh orbs are already visible behind

**Phase 1 — Constellation Emerges (300ms – 1200ms)**
- 80–120 particles appear across the canvas, each with a random position
- Particles: white dots, diameter 2–4px (varied), opacity 0.15–0.50 (varied)
- Appearance: not all at once — staggered over 900ms using a wave pattern (top-to-bottom sweep)
- Each particle fades from 0 → its target opacity over 300ms individually
- Subtle slow drift: each particle moves randomly ±8px over a 6-second cycle (continuous after appearing)
- The particles loosely cluster in two regions: top-left quadrant and bottom-right — creating negative space in the center where the progress ring lives

**Phase 2 — Connections Form (800ms – 1800ms)**
- Lines draw between nearby particles (within 120px of each other)
- Line color: `rgba(0, 212, 184, 0.08)` — barely visible
- Line draw: SVG `stroke-dashoffset` animates from full-length to 0 (line "draws" itself)
- Duration per connection: 400ms with random delay per pair
- Not all particles connect — approximately 30% form connections
- The connections are not static: some fade out as new ones form. The constellation is **alive**

**Phase 3 — Avatar Appears (900ms – 1600ms)**
- Inside the circular progress ring, the recipient's avatar image fades in
- Initial state: heavily blurred (CSS `filter: blur(20px)`) and scaled up slightly (scale 1.1)
- Animates to: sharp (blur 0px), correct scale (1.0)
- Duration: 700ms, easing: Expo Out
- Simultaneously: a soft radial glow appears behind the avatar — `radial-gradient(circle 120px, rgba(0, 212, 184, 0.25) 0%, transparent 70%)`
- The glow pulses gently: opacity oscillates 0.8 → 1.0 → 0.8 over 2s, loop

**Phase 4 — Progress & Status Text (700ms – 2800ms)**
- Progress bar fills from 0% → ~95% over 2 seconds (never reaches 100% — feels more real)
- Fill uses `cubic-bezier(0.25, 1, 0.5, 1)` — starts fast, slows down near the end
- Status text changes every 400–600ms via typewriter effect:
  ```
  "Locating your timeline..."
  "Gathering team messages..."
  "Loading your moments..."
  "Almost there..."
  ```
- Each line: previous text dissolves (opacity 0, 150ms), new text materializes character by character (40ms per character)

**Phase 5 — Reveal Transition (2800ms – 3400ms)**
- Progress bar fills last 5% quickly and the bar glows bright teal momentarily
- Status text changes to `"Ready."` — appears all at once (no typewriter), font weight increases slightly (400 → 500)
- All particles and connections begin fading out simultaneously (duration 400ms)
- Progress ring and avatar scale up very slightly (1.0 → 1.05) and begin dissolving
- The entire loading screen fades out as a unit (opacity 0, 600ms)
- The hero section is already rendered behind it — it materializes as the loader disappears

**Circular Progress Ring Details:**
- Diameter: 80px outer, 64px inner (8px stroke width)
- Track ring: `rgba(255,255,255,0.08)`
- Active arc: gradient stroke — `#00D4B8` at start → `#0078D4` at end
- Rotation: continuous clockwise, 1.5s per full rotation (slows slightly as progress nears end)
- The arc length represents actual progress (not a spinner — a true progress ring)
- At Phase 5, the arc completes to full circle and the stroke color transitions to solid white briefly before dissolving

---

## 04 · Hero Section — Personalized Page

*The emotional peak. The moment the person sees their own name in this context.*

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Background: Space Black + mesh gradients (persistent)          │
│                                                                  │
│  [Full viewport height]                                         │
│                                                                  │
│                                                                  │
│                    [Glow orb — diffuse, 600px diameter]         │
│                    [position: absolute, centered behind card]   │
│                    [radial-gradient teal to transparent]        │
│                    [opacity 0.18, not interactive]              │
│                                                                  │
│         ┌────────────────────────────────────────────┐          │
│         │  Hero glass card                           │          │
│         │  max-width: 680px                          │          │
│         │  background: rgba(255,255,255,0.04)        │          │
│         │  border: 1px rgba(255,255,255,0.10)        │          │
│         │  border-radius: 32px                       │          │
│         │  backdrop-filter: blur(60px)               │          │
│         │  padding: 64px 56px 48px                   │          │
│         │  overflow: hidden                          │          │
│         │                                            │          │
│         │  [Top-left watermark: tiny Microsoft logo  │          │
│         │   opacity 0.20, 20px]                      │          │
│         │                                            │          │
│         │  ┌──────────────────────────────────────┐  │          │
│         │  │  Avatar ring assembly:               │  │          │
│         │  │  Outer ring: 144px dia, gradient     │  │          │
│         │  │  stroke, slowly rotating             │  │          │
│         │  │  Photo: 120px circle inside          │  │          │
│         │  │  Glow: radial behind photo           │  │          │
│         │  └──────────────────────────────────────┘  │          │
│         │                                            │          │
│         │  JANE DOE                                  │          │
│         │  [Display XL, weight 300, gradient text]   │          │
│         │  [gradient: white 98% → white 70%]         │          │
│         │                                            │          │
│         │  Senior Software Engineer  ·  Azure Core   │          │
│         │  [Body L, white 55%]                        │          │
│         │                                            │          │
│         │  ── [Accent gradient line, 48px wide] ──  │          │
│         │                                            │          │
│         │  6 years, 9 months                        │          │
│         │  of extraordinary work                    │          │
│         │  [Display M, weight 300, white 90%]        │          │
│         │                                            │          │
│         │  March 12, 2018 → December 20, 2024       │          │
│         │  [Label L, all-caps, white 35%]            │          │
│         │                                            │          │
│         │  [48px gap]                                │          │
│         │                                            │          │
│         │  [Scroll indicator — animated chevron]     │          │
│         │  "Scroll to explore your farewell"         │          │
│         │  [Label S, white 30%]                      │          │
│         └────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Animations — Hero Section

**Card entrance (continuation from loader dissolve):**
- The card is already positioned but has `opacity: 0` and `filter: blur(8px)` during loading
- As loader fades: card animates to `opacity: 1`, `filter: blur(0)`, `transform: scale(1.02) → scale(1)`
- Duration: 800ms, easing: Expo Out
- The glow orb behind the card fades in simultaneously, slightly delayed (100ms)

**Avatar ring:**
- Ring strokes: dashed gradient (teal → blue), 2px stroke, 4px gap pattern
- Rotates continuously: one full rotation every 8 seconds, clockwise
- On page load: ring starts at 0.5 opacity and rises to 1 over 600ms
- Photo itself: fades in from opacity 0 → 1 after ring appears (300ms delay)
- A very subtle scale pulse on the photo: 1.0 → 1.02 → 1.0 over 4s, infinite — barely perceptible

**Name headline:**
- Appears character by character — but not a traditional typewriter
- Each character fades in individually with a tiny upward translate (+8px → 0)
- Duration per character: 30ms, stagger 20ms between characters
- Total for "JANE DOE": ~250ms
- After complete: gradient shimmers once — a horizontal light sweep from left to right (pseudo-element `::after`, `background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)`, animates `translateX(-100%) → translateX(200%)` over 800ms)

**Subtitle and accent line:**
- Subtitle fades+slides up (+16px → 0) after name completes, 350ms delay
- Accent gradient line: draws from left to right — width animates 0 → 48px, 400ms
- After drawing, the line glows: `box-shadow` expands from 0 → `0 0 12px rgba(0, 212, 184, 0.6)`, then settles back to `0 0 6px rgba(0, 212, 184, 0.3)`

**Tenure display:**
- "6 years, 9 months" counts up from "0 years, 0 months"
- Number counting animation: 40 frames over 1200ms, ease Out
- "of extraordinary work" fades in after the number settles, 200ms delay

**Date range:**
- Appears via a slide-right motion: `translateX(-8px) opacity 0` → `translateX(0) opacity 1`
- 250ms, delayed after tenure line appears

**Scroll indicator:**
- Appears 2 seconds after hero fully loads (prevents distraction during reveal)
- Three chevrons stacked vertically, pointing down
- Each animates: opacity pulses 0.3 → 0.8 → 0.3 with 120ms stagger between chevrons
- Loop duration: 1800ms
- On scroll start: fades out and does not return

**Background behavior during hero:**
- The two mesh gradient orbs from the landing page are still present
- They now slowly shift position over 60 seconds — a barely perceptible migration
- This ensures the page never feels static even when the user is reading

---

## 05 · Personal Message Section

*The first text the user reads. The message their team wrote for them.*

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Section label — top, all-caps]                                │
│  A MESSAGE FROM YOUR TEAM                                       │
│  [Label L, Copilot Teal #00D4B8, letter-spacing 0.10em]        │
│  [Left-aligned, max-width 760px, centered on page]              │
│                                                                  │
│  [20px gap]                                                      │
│                                                                  │
│  Jane, when you first walked into Building 37 in March         │
│  2018, the Azure Core networking stack was...                   │
│                                                                  │
│  [Body L, white 90%, line-height 1.9, max-width 680px]         │
│  [Rich HTML — em, strong tags rendered elegantly]              │
│  [strong: white 98%, weight 600, no color change]              │
│  [em: italic, white 75%]                                        │
│                                                                  │
│  [Left-side accent: 2px vertical line]                          │
│  [Gradient: top transparent → Copilot Teal → bottom transparent]│
│  [height: 100% of the message container]                        │
│  [left: -32px from text]                                        │
│                                                                  │
│  [At the end of message]                                        │
│  ── With all our gratitude ──                                   │
│  [Label L, white 35%, italicized, centered]                     │
│                                                                  │
│  [Signature line: team names in small flowing script-ish font] │
│  [Or: initials avatars in a horizontal stack]                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Animations — Personal Message

**Section entrance (Intersection Observer trigger at 80% threshold):**
- Section label: slides in from the left — `translateX(-24px) opacity 0` → `translateX(0) opacity 1`, 400ms
- Left accent line: draws from top to bottom — `scaleY(0)` (transform-origin top) → `scaleY(1)`, 600ms, delayed 200ms after label
- Message body text: reveals in **paragraphs**, not individual characters
  - Each paragraph: `translateY(20px) opacity 0` → `translateY(0) opacity 1`, 500ms
  - Stagger: 150ms between paragraphs
  - Easing: Expo Out
- Closing signature fades in last, 800ms after first paragraph

**Reading enhancement — subtle behavior:**
- As the user scrolls through the message, the left accent line maintains a glowing dot that tracks scroll position
- The dot: a 6px circle with Copilot Teal fill and `box-shadow: 0 0 8px rgba(0, 212, 184, 0.8)`
- Smooth movement via `requestAnimationFrame`, no snap

---

## 06 · Timeline Section

*The career journey, visualized. This must feel like a Wikipedia info-graphic crossed with a Copilot data visualization.*

### Visual Layout — Desktop (Horizontal)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  YOUR JOURNEY                                                   │
│  [Label L, Copilot Teal]                                        │
│                                                                  │
│  6 years of milestones                                          │
│  [Display M, white 90%]                                         │
│                                                                  │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│  [Timeline track: full width, height 2px]                       │
│  [Gradient: see "Accent Line" from design system]               │
│                                                                  │
│  ●           ●           ●           ●           ●              │
│  │           │           │           │           │              │
│  Mar 2018  Dec 2018   Sep 2020   Jan 2022   Nov 2023           │
│                                                                  │
│  Joined     First       Led QUIC   Principal  Promoted         │
│  Azure      Promotion   Protocol   Engineer   to L66            │
│  Core       to L63      Project                                  │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  [Hover card — appears above active node]                       │
│  ┌────────────────────┐                                         │
│  │ Sep 2020           │                                         │
│  │ QUIC Protocol Lead │                                         │
│  │ ─────────────────  │                                         │
│  │ Led the team of 8  │                                         │
│  │ engineers that...  │                                         │
│  │ [Glass card]       │                                         │
│  └────────────────────┘                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Timeline Node Design

Each node on the timeline is a composed element:

```
Outer glow ring: 28px diameter, gradient stroke (not filled)
  Default: rgba(255,255,255,0.15) stroke
  Active/Hover: gradient stroke teal→blue
  
Center dot: 10px diameter, solid fill
  Default fill: rgba(255,255,255,0.30)
  Active fill: gradient #00D4B8 → #0078D4
  Box-shadow (active): 0 0 0 4px rgba(0, 212, 184, 0.20),
                        0 0 16px rgba(0, 212, 184, 0.40)

Icon: 14px icon inside center, white
  (briefcase, award, code, rocket — mapped to event type)
```

### Hover Card (Tooltip)

```
Background: rgba(10, 17, 40, 0.95)    ← darker glass for contrast
Border: 1px rgba(255,255,255,0.12)
Border-radius: 16px
Backdrop-filter: blur(24px)
Padding: 20px 24px
Max-width: 240px

Top strip: 3px height, gradient teal→blue, border-radius top

Date: [Label S, Copilot Teal, all-caps]
Title: [Heading S, white 95%]
Divider: 1px rgba(255,255,255,0.08)
Description: [Body S, white 55%]

Arrow pointer: 8px downward triangle at bottom center
  Fill: rgba(10, 17, 40, 0.95) + 1px border on two sides
```

### Animations — Timeline

**Section entrance:**
- Timeline track line: draws left-to-right — width animates 0 → 100%, 1000ms, delayed 200ms after section header reveals
- Nodes appear as the line reaches them (not all at once)
  - Each node scales from 0 → 1.2 → 1.0 (slight overshoot, spring)
  - Duration: 400ms per node, starts when line reaches node's x-position
- Node labels and dates fade up (+12px → 0, opacity 0 → 1, 300ms per label, 80ms stagger after node appears)

**Hover interaction:**
- Hover card: `scale(0.96) opacity(0)` → `scale(1) opacity(1)`, 200ms, spring
- Appears above the node, centered
- If node is near left/right edge: repositioned to avoid overflow (right-pinned or left-pinned)
- Node on hover: outer glow ring transitions from inactive → active state, 150ms

**Active node (last event / current milestone):**
- The final node on the timeline pulses continuously:
  - Outer ring: alternates between 28px and 36px diameter, opacity 0.8 → 0, period 2s, loop
  - This is a "live" marker indicating the most recent event

**Mobile layout (vertical timeline):**
- Track is vertical, nodes stack top-to-bottom
- Same entrance animation but axis changes (draws top-to-bottom)
- Nodes animate in from the right side (`translateX(24px) → 0`)

---

## 07 · Photo Gallery Section

*Not a photo album. A curated collection of shared moments. Emotional weight through composition.*

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  MOMENTS                                                        │
│  [Label L, Copilot Teal]                                        │
│                                                                  │
│  Memories worth keeping.                                        │
│  [Display M, white 90%]                                         │
│                                                                  │
│                                                                  │
│  ┌──────────────┐  ┌─────────────────────┐  ┌────────┐          │
│  │              │  │                     │  │        │          │
│  │    Photo 1   │  │       Photo 2       │  │Photo 3 │          │
│  │    (1×1)     │  │       (2×1)         │  │ (1×1)  │          │
│  │              │  │                     │  │        │          │
│  └──────────────┘  └─────────────────────┘  └────────┘          │
│                                                                  │
│  ┌────────────────────────────┐  ┌───────┐  ┌──────────────┐   │
│  │                            │  │       │  │              │   │
│  │          Photo 4           │  │Photo 5│  │    Photo 6   │   │
│  │          (2×1)             │  │ (1×1) │  │    (1×1)     │   │
│  │                            │  │       │  │              │   │
│  └────────────────────────────┘  └───────┘  └──────────────┘   │
│                                                                  │
│  [Gap between photos: 12px]                                     │
│  [All photos: border-radius 16px, overflow hidden]              │
│  [Masonry-style using CSS Grid with span classes]               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Photo Card Hover State

```
Default photo:
  transform: scale(1)
  overlay: linear-gradient(to top, rgba(5,8,16,0.60) 0%, transparent 60%)
  Caption: hidden (opacity 0)

Hover photo:
  transform: scale(1.03) — entire card, not just image
  transition: 350ms, cubic-bezier(0.25, 0.46, 0.45, 0.94)
  overlay: same gradient but opacity increases slightly
  
  Caption appears:
    Slides up from bottom: translateY(8px) → 0, opacity 0 → 1
    Duration: 250ms, Expo Out
    
  Subtle border appears:
    border: 1px rgba(255,255,255,0.12)
    Transitions over 150ms
    
  Glow: box-shadow 0 20px 60px rgba(0,0,0,0.50)
```

### Caption Design

```
Bottom of photo, always inside the card:
  Font: Body S, white 90%
  Background: none (the gradient overlay provides contrast)
  Padding: 16px 20px
  
  Photo index badge (top-right corner of card):
  [number]/[total]  e.g. "3/12"
  Label S, white 40%
  Glass pill: rgba(5,8,16,0.60), padding 4px 8px, border-radius 4px
```

### Lightbox

When any photo is clicked, a full-screen lightbox opens:

```
Background: rgba(5, 8, 16, 0.95) with backdrop-filter blur(8px)
Transition: opens over 300ms with scale animation (photo scales from
            thumbnail position → full size, Layout Animation in Framer)

Navigation:
  Left/Right arrows: glass pill buttons, 48px circular, centered vertically
  Keyboard: ← → arrows, ESC to close
  Swipe: touch swipe on mobile
  
Controls bar (bottom):
  Caption text: Body M, white 80%
  Counter: "4 / 12" [Label S, white 40%]
  Download button: small, glass, label "Save"
  Close button: top-right, X icon, 40px touch target

Photo display:
  max-width: 90vw, max-height: 85vh
  object-fit: contain
  border-radius: 12px
  Subtle drop shadow on photo itself
  
Between photos:
  Current photo: translateX(0) → translateX(-48px), opacity 1 → 0, 250ms
  New photo: from translateX(48px) → 0, opacity 0 → 1, 250ms
  (Direction reverses for left navigation)
```

### Animations — Gallery Section

**Section entrance:**
- Photos appear in two waves (first row, then second row), 200ms between waves
- Each photo in a wave: `scale(0.95) opacity(0)` → `scale(1) opacity(1)`, 500ms, 60ms stagger within wave
- Before images fully load: skeleton placeholder — same dimensions as photo, background `linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)`, animated left-to-right (shimmer effect)

**Shimmer skeleton:**
- Background position animates from `-200%` to `200%` on the x-axis
- Duration: 1.5s, linear, infinite loop
- This is the standard skeleton loader used across all deferred-content sections

---

## 08 · Video Section

*A video message from the team. Should feel like a cinema moment, not an embedded YouTube player.*

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  A MESSAGE FROM YOUR TEAM                                       │
│  [Label L, Copilot Teal]                                        │
│                                                                  │
│  Something they wanted you to hear.                             │
│  [Display M, white 90%]                                         │
│                                                                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Video container                                          │  │
│  │  border-radius: 24px, overflow: hidden                    │  │
│  │  border: 1px rgba(255,255,255,0.10)                       │  │
│  │  box-shadow: 0 40px 120px rgba(0,0,0,0.60)               │  │
│  │                                                           │  │
│  │  [Thumbnail with custom play overlay]                     │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │                                                  │    │  │
│  │  │  ▶  [Play button — centered]                     │    │  │
│  │  │     Circle 80px, glass: rgba(5,8,16,0.70)        │    │  │
│  │  │     Border: 1px rgba(255,255,255,0.20)           │    │  │
│  │  │     Icon: white triangle, 28px                   │    │  │
│  │  │     Backdrop-filter: blur(16px)                  │    │  │
│  │  │                                                  │    │  │
│  │  │  [Gradient overlay on thumbnail]                 │    │  │
│  │  │  radial-gradient(circle, transparent 25%,        │    │  │
│  │  │                  rgba(5,8,16,0.40) 100%)         │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  [Custom controls bar — glass, bottom of video]          │  │
│  │  ████████████████░░░░░░░░░  [progress bar, teal]         │  │
│  │  ▶  2:14 / 4:30    [vol] [cc] [fullscreen]               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Custom Video Controls Design

```
Controls bar:
  position: absolute, bottom: 0, full width
  height: 64px
  background: linear-gradient(to top, rgba(5,8,16,0.90) 0%, transparent 100%)
  padding: 0 20px
  
  Hides after 3 seconds of inactivity, reveals on hover/tap

Progress bar:
  height: 3px → 5px on hover (smooth transition)
  track: rgba(255,255,255,0.20)
  fill: #00D4B8 (Copilot Teal)
  thumb: 12px circle, white, only visible on hover
  
Time display:
  Body S, white 70%, monospace
  
Buttons (volume, CC, fullscreen):
  24px icons, white 60%, white 95% on hover
  Transition: 150ms opacity

Fullscreen:
  Enters with a smooth expand animation (not a jarring cut)
  Video container: border-radius transitions from 24px → 0px (300ms)
  Controls bar reappears in fullscreen
```

### Animations — Video Section

**Section entrance:**
- Video container: `translateY(32px) scale(0.98) opacity(0)` → `translateY(0) scale(1) opacity(1)`, 700ms, Expo Out
- Box shadow animates from `0 0 0 rgba(0,0,0,0)` → `0 40px 120px rgba(0,0,0,0.60)`, 700ms
- Play button scales from 0 → 1 with spring bounce after container appears, 200ms delay

**Play button hover:**
- Circle: scale 1.0 → 1.08, glass opacity increases
- Triangle icon: scale 1.0 → 1.1
- A ripple ring expands outward: scale 1 → 1.5, opacity 0.6 → 0, 400ms
- Duration: 200ms for scale, simultaneous with ripple

**On play (thumbnail to video transition):**
- Thumbnail fades out (opacity 0, 300ms)
- Video element fades in (opacity 0 → 1, 300ms, simultaneous)
- Play button scales down and vanishes (scale 1 → 0.8, opacity 0, 200ms)
- Controls bar fades in at bottom (opacity 0 → 1, 300ms)

---

## 09 · Guestbook Section

*The social layer. Where colleagues leave their mark. This must feel intimate, not like a comment section.*

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  WORDS FROM YOUR COLLEAGUES                        [47]         │
│  [Label L, Copilot Teal]          [Count badge: glass pill]     │
│                                                                  │
│  What they want you to know.                                    │
│  [Display M, white 90%]                                         │
│                                                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Entry card 1                                            │   │
│  │  background: rgba(255,255,255,0.04)                      │   │
│  │  border: 1px rgba(255,255,255,0.08)                      │   │
│  │  border-radius: 20px                                     │   │
│  │  padding: 28px 32px                                      │   │
│  │  backdrop-filter: blur(16px)                             │   │
│  │                                                          │   │
│  │  ┌────────┐  John Smith                    Dec 15, 2024  │   │
│  │  │ avatar │  Engineering Director · Azure Core          │   │
│  │  │ 44px   │                                              │   │
│  │  └────────┘                                              │   │
│  │                                                          │   │
│  │  "Jane, your calm in the middle of the most chaotic     │   │
│  │   incidents was something I'll always admire. Working    │   │
│  │   alongside you was a genuine privilege."               │   │
│  │  [Body M, white 80%, line-height 1.8]                   │   │
│  │                                                          │   │
│  │  [Reaction emoji if present]  🌟                        │   │
│  │  [36px, isolated, right-aligned, subtle float anim]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [More cards below, loaded on scroll]                           │
│                                                                  │
│  ──────────────────────────────────────────────────────────     │
│                                                                  │
│  LEAVE A MESSAGE                                                │
│  [Heading S, white 80%]                                         │
│                                                                  │
│  You're signed in as John Smith                                 │
│  [Label S, white 35%]                                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Textarea                                                │   │
│  │  background: rgba(255,255,255,0.04)                      │   │
│  │  border: 1px rgba(255,255,255,0.10)                      │   │
│  │  border-radius: 16px                                     │   │
│  │  padding: 20px 24px                                      │   │
│  │  min-height: 120px                                       │   │
│  │  font: Body M, white 90%                                 │   │
│  │  placeholder: white 25%                                  │   │
│  │  resize: none                                            │   │
│  │                                                          │   │
│  │  [On focus: border → rgba(255,255,255,0.25)]             │   │
│  │  [On focus: glow: 0 0 0 3px rgba(0,212,184,0.15)]        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Emoji picker row — 8 emoji options]   [2000 / 2000 chars]    │
│                                                                  │
│                                        [Post Message →]         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Avatar Design in Cards

```
Photo: 44px circle, object-fit cover
Border: 2px solid rgba(255,255,255,0.10)
Fallback (no photo): initials on gradient background
  Gradient seeded from author email hash → consistent per-person color
  e.g. John Smith always gets the same teal→blue gradient
```

### Emoji Picker Row

```
8 pre-selected emojis: 💙 🌟 🙏 🎉 ✨ 🚀 👏 💪

Each emoji pill:
  background: rgba(255,255,255,0.06)
  border: 1px rgba(255,255,255,0.10)
  border-radius: 9999px
  padding: 8px 14px
  font-size: 20px
  
  Hover: scale(1.15), background brightens, 150ms spring
  Selected: 
    background: rgba(0, 212, 184, 0.12)
    border: 1px rgba(0, 212, 184, 0.40)
    Scale pulse: 1.0 → 1.10 → 1.0 on select, 300ms spring
```

### Submit Button

```
Default:
  background: rgba(0, 120, 212, 0.20)
  border: 1px rgba(0, 120, 212, 0.50)
  color: white 90%
  border-radius: 10px
  padding: 14px 28px
  Heading S weight
  
  Disabled (empty textarea):
    opacity: 0.40, cursor: not-allowed
    
  Hover (enabled):
    background: rgba(0, 120, 212, 0.35)
    border: 1px rgba(0, 120, 212, 0.80)
    transform: translateY(-1px)
    box-shadow: 0 8px 24px rgba(0, 120, 212, 0.25)
    Duration: 200ms

  Loading (after click):
    Text fades out, small spinner appears (same 3-dot as landing page)
    Button width does not change (prevents layout shift)

  Success:
    Background transitions to rgba(34, 211, 165, 0.20) (green)
    Border: rgba(34, 211, 165, 0.50)
    Text: "Message posted" with checkmark icon
    Duration: 300ms transition
    After 2 seconds: button resets to default state
```

### Animations — Guestbook

**Section entrance:**
- Section header (label + title): standard fade+slide combo
- First 3 entry cards: staggered entrance, each with:
  - `translateY(24px) opacity(0)` → `translateY(0) opacity(1)`, 500ms, 100ms stagger
  - Easing: Expo Out

**New message submitted:**
- New entry card animates in at the top of the feed (not bottom)
- It materializes from a smaller scale: `scale(0.95) translateY(-16px) opacity(0)` → `scale(1) translateY(0) opacity(1)`
- Duration: 500ms, spring
- A Copilot Teal glow briefly highlights the new card's border: border color transitions from teal → default over 2 seconds
- Simultaneously: counter badge increments with a number scroll animation (previous number rolls up, new number rolls in from below)

**Infinite scroll trigger:**
- When user scrolls to within 200px of the bottom of visible entries: next page loads silently
- New cards appear below existing ones with the standard entrance animation
- No spinner or "loading more" text — seamlessly continuous

**Reaction emoji on cards:**
- If emoji is present, it floats gently: `translateY(0)` → `translateY(-4px)` → `translateY(0)`, duration 3s, ease: `cubic-bezier(0.45, 0.05, 0.55, 0.95)`, infinite loop
- Separate random phase offset per card so they don't all float in sync

**Textarea focus state:**
- Border transitions: 200ms
- Focus glow (`box-shadow`): expands from 0 → `0 0 0 3px rgba(0, 212, 184, 0.15)`, 200ms
- Textarea height: auto-expands as user types (no fixed height after initial state)
  - Expansion: smooth via CSS `transition: height 150ms ease`
  - Max-height: 240px, then scrolls internally

---

## 10 · Footer

*Final punctuation. Quiet, dignified, leaves an impression.*

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Top divider: 1px gradient line]                               │
│  [gradient: transparent → rgba(255,255,255,0.08) → transparent] │
│                                                                  │
│                                                                  │
│         Created with care for Jane Doe.                        │
│         [Body L, white 50%, centered]                           │
│                                                                  │
│         December 2024                                           │
│         [Label S, white 25%, centered]                          │
│                                                                  │
│                                                                  │
│         ────────────────────────────                            │
│                                                                  │
│         [Microsoft logo — 20px, opacity 0.25]                  │
│         Made with Microsoft Farewell                            │
│         [Label S, white 25%, centered]                          │
│                                                                  │
│                                                                  │
│  [Subtle background texture variation at bottom]               │
│  [radial-gradient fading into nothing]                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Footer Animation

**Entrance (when scrolled into view):**
- All footer content fades in as a single unit: `opacity(0)` → `opacity(1)`, 800ms, Expo Out
- The divider line draws from center outward simultaneously: `scaleX(0)` (transform-origin center) → `scaleX(1)`, 600ms

**Idle behavior:**
- Nothing animates in the footer. It is still.
- This stillness is intentional — the page has said everything it needs to say. The footer doesn't ask for attention.
- This restraint is the emotional conclusion.

---

## 11 · Access Denied Page

*For colleagues who click someone else's link. The tone must be clear without being accusatory.*

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Background: Space Black + single subtle mesh orb               │
│              (less saturated than main pages — cooler)         │
│                                                                  │
│                                                                  │
│            ┌──────────────────────────────────────┐             │
│            │  Glass panel (same as landing)       │             │
│            │  max-width: 480px                    │             │
│            │                                      │             │
│            │  [Lock icon — 40px]                  │             │
│            │  [Not animated. Static.]              │             │
│            │  [Stroke: white 30%]                 │             │
│            │                                      │             │
│            │  This page is private.               │             │
│            │  [Display M, white 90%]              │             │
│            │                                      │             │
│            │  This farewell was created for a     │             │
│            │  specific person and can only be     │             │
│            │  viewed by them.                     │             │
│            │  [Body M, white 50%]                 │             │
│            │                                      │             │
│            │  ─────────────────────────────────   │             │
│            │                                      │             │
│            │  You're signed in as:                │             │
│            │  john.smith@contoso.com              │             │
│            │  [Body S, white 35%]                 │             │
│            │                                      │             │
│            │  [Sign Out]  [glass button]          │             │
│            └──────────────────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tone note:** The lock icon is static — it does not shake, bounce, or do anything alarming. The person did nothing wrong. The experience is calm and factual.

**Animation:**
- Panel entrance: same as landing page panel (fade+slide up, 900ms)
- Content stagger: icon → headline → body → divider → email → button (60ms stagger)
- No looping animations. The page is quiet.

---

## 12 · Cross-Cutting UI Patterns

### Scrollbar

```css
/* Custom scrollbar — thin, non-intrusive */
::-webkit-scrollbar { width: 4px }
::-webkit-scrollbar-track { background: transparent }
::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.30);
}
```

### Focus Rings (Accessibility)

```
All interactive elements:
  :focus-visible outline: 2px solid #00D4B8
  outline-offset: 3px
  border-radius: matches component radius
  
Never: outline: none without a replacement
```

### Loading Skeleton Pattern

Used for any async-loaded content (guestbook cards, photos before decode):

```
background: linear-gradient(
  90deg,
  rgba(255,255,255,0.04) 0%,
  rgba(255,255,255,0.08) 50%,
  rgba(255,255,255,0.04) 100%
)
background-size: 200% 100%
animation: shimmer 1.5s linear infinite

@keyframes shimmer {
  0%   { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
```

### Toast Notifications

```
Position: bottom-right, 24px from edges
Max-width: 360px

Glass card:
  background: rgba(10, 17, 40, 0.95)
  border: 1px rgba(255,255,255,0.12)
  border-radius: 14px
  padding: 16px 20px
  backdrop-filter: blur(24px)
  
Left accent strip: 3px × full height, color by type:
  Success: #22D3A5 (teal)
  Error: #F87171 (red)
  Info: #60EFFF (cyan)
  
Enter: slides in from bottom-right (translateY(16px) → 0, translateX(0))
       opacity 0 → 1, scale 0.96 → 1, 350ms spring
       
Exit: slides out to right (translateX(100%)), opacity 1 → 0, 250ms Expo In

Auto-dismiss: 4 seconds (success/info), manual dismiss only (errors)
```

### Section Scroll Progress Indicator

A thin teal progress bar at the very top of the page (under the top edge):

```
Position: fixed, top 0, left 0, z-index: 9999
Height: 2px
Background: gradient teal → blue
Width: reflects scroll progress (0% → 100%)
Smooth: updated via requestAnimationFrame (not scroll event directly)
Appears: only after user scrolls past hero section
Disappears: in footer
```

---

## 13 · Responsive Behavior Summary

| Element | Desktop (>1280px) | Tablet (768–1280px) | Mobile (<768px) |
|---|---|---|---|
| Hero card | max-width 680px, centered | max-width 560px, centered | full-width, 20px padding |
| Name headline | 72px | 56px | 40px |
| Timeline | horizontal scroll | horizontal, condensed | vertical stack |
| Photo gallery | masonry, 3–4 columns | 2–3 columns | 1–2 columns |
| Video | 800px wide | full-width | full-width |
| Guestbook cards | max-width 760px | full-width | full-width |
| Background mesh | 3 orbs, full motion | 2 orbs | 1 orb, reduced opacity |
| Particle count | 100 particles | 60 particles | 0 particles (performance) |

---

## 14 · Design Tokens Export (Engineering Reference)

```json
{
  "color": {
    "bg-primary": "#050810",
    "bg-secondary": "#080D1A",
    "bg-tertiary": "#0A1128",
    "glass-fill": "rgba(255,255,255,0.04)",
    "glass-fill-hover": "rgba(255,255,255,0.07)",
    "glass-border": "rgba(255,255,255,0.08)",
    "glass-border-lit": "rgba(255,255,255,0.18)",
    "brand-blue": "#0078D4",
    "brand-electric": "#00A8E8",
    "brand-teal": "#00D4B8",
    "brand-cyan": "#60EFFF",
    "brand-gold": "#F0B429",
    "brand-violet": "#8B7CF8",
    "brand-rose": "#F472B6",
    "text-primary": "rgba(255,255,255,0.95)",
    "text-secondary": "rgba(255,255,255,0.55)",
    "text-tertiary": "rgba(255,255,255,0.30)",
    "text-disabled": "rgba(255,255,255,0.18)"
  },
  "radius": {
    "micro": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "pill": "9999px"
  },
  "blur": {
    "glass-sm": "16px",
    "glass-md": "24px",
    "glass-lg": "40px",
    "glass-xl": "60px"
  },
  "duration": {
    "micro": "150ms",
    "standard": "350ms",
    "medium": "600ms",
    "cinematic": "900ms",
    "epic": "1400ms"
  },
  "easing": {
    "enter": "cubic-bezier(0.16, 1, 0.3, 1)",
    "exit": "cubic-bezier(0.7, 0, 0.84, 0)",
    "slide": "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
  }
}
```
