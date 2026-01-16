# Nego Design System

A comprehensive guide to the visual design language used throughout the Nego talent marketplace.

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons](#icons)
7. [Animations & Transitions](#animations--transitions)
8. [Effects & Treatments](#effects--treatments)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)

---

## Brand Identity

### Brand Essence
Nego is a **premium, sophisticated talent marketplace** with a dark, luxurious aesthetic. The design communicates exclusivity, elegance, and trustworthiness.

### Design Principles
| Principle | Description |
|-----------|-------------|
| **Dark & Luxurious** | Pure black backgrounds with selective red accents |
| **Premium Feel** | High-end typography, generous spacing, subtle animations |
| **Trust & Security** | Clean interfaces, clear actions, consistent patterns |
| **Sophistication** | Elegant serif headings, refined color palette |

### Logo
- **Font**: Cinzel Decorative (serif)
- **Weight**: 700 (Bold)
- **Letter Spacing**: 0.05em
- **CSS Class**: `.logo-font`

```css
.logo-font {
  font-family: 'Cinzel Decorative', serif;
  font-weight: 700;
  letter-spacing: 0.05em;
}
```

---

## Color System

### Primary Palette

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Primary Red** | `#df2531` | rgb(223, 37, 49) | CTAs, accents, highlights |
| **Primary Hover** | `#c41f2a` | rgb(196, 31, 42) | Hover states |
| **Primary Light** | `rgba(223, 37, 49, 0.1)` | — | Backgrounds, overlays |

### Neutral Palette

| Color | Hex/Value | Usage |
|-------|-----------|-------|
| **Background** | `#000000` | Primary background |
| **Background Secondary** | `#0a0a0f` | Cards, modals, elevated surfaces |
| **Foreground** | `#ffffff` | Primary text |
| **Muted** | `rgba(255, 255, 255, 0.6)` | Secondary text |
| **Border** | `rgba(255, 255, 255, 0.1)` | Dividers, card borders |

### CSS Variables

```css
:root {
  --primary: #df2531;
  --primary-hover: #c41f2a;
  --primary-light: rgba(223, 37, 49, 0.1);
  --background: #000000;
  --background-secondary: #0a0a0f;
  --foreground: #ffffff;
  --muted: rgba(255, 255, 255, 0.6);
  --border: rgba(255, 255, 255, 0.1);
}
```

### Semantic Colors

| State | Color | Usage |
|-------|-------|-------|
| Success | `#22c55e` (green-500) | Confirmations, completed states |
| Warning | `#f59e0b` (amber-500) | Warnings, pending states |
| Error | `#ef4444` (red-500) | Errors, destructive actions |
| Info | `#3b82f6` (blue-500) | Information, links |

### Color Application

```
┌─────────────────────────────────────────────────────┐
│  Background: #000000                                │
│  ┌───────────────────────────────────────────────┐  │
│  │  Card: #0a0a0f                                │  │
│  │  Border: rgba(255,255,255,0.1)                │  │
│  │                                               │  │
│  │  [Primary Button: #df2531]                    │  │
│  │                                               │  │
│  │  Heading: #ffffff                             │  │
│  │  Body: rgba(255,255,255,0.6)                  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Typography

### Font Stack

| Usage | Font | Fallback |
|-------|------|----------|
| **Body** | DM Sans | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif |
| **Headings** | Playfair | Georgia, 'Times New Roman', serif |
| **Logo** | Cinzel Decorative | serif |

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair:wght@300..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@100..1000&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&display=swap');
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | `clamp(2.5rem, 8vw, 9rem)` | 900 (Black) | 0.95 |
| H2 | `text-3xl` to `text-5xl` | 700 (Bold) | 1.1 |
| H3 | `text-xl` to `text-2xl` | 600 (Semibold) | 1.2 |
| Body | `text-base` (16px) | 400 (Regular) | 1.5 |
| Small | `text-sm` (14px) | 400 | 1.4 |
| Caption | `text-xs` (12px) | 500 | 1.3 |

### Text Colors

```jsx
// Primary text
className="text-white"

// Secondary text
className="text-white/60"

// Muted text
className="text-white/40"

// Accent text
className="text-[#df2531]"
```

### Letter Spacing

| Usage | Value |
|-------|-------|
| Logo | `tracking-[0.05em]` |
| Subheading | `tracking-[0.2em]` to `tracking-[0.3em]` |
| Uppercase labels | `tracking-wider` |

---

## Spacing & Layout

### Spacing Scale (Tailwind)

| Token | Size | Usage |
|-------|------|-------|
| `space-1` | 4px | Tight spacing, icon gaps |
| `space-2` | 8px | Small padding |
| `space-3` | 12px | Button padding |
| `space-4` | 16px | Card padding |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Large gaps |
| `space-12` | 48px | Section margins |
| `space-16` | 64px | Hero padding |

### Container Width

```jsx
// Standard container
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"

// Narrow container (forms, modals)
className="max-w-md mx-auto"

// Wide container (dashboards)
className="max-w-screen-2xl mx-auto"
```

### Grid System

```jsx
// 2 Column Grid
className="grid grid-cols-1 md:grid-cols-2 gap-6"

// 3 Column Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// 4 Column Grid (talent cards)
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

// Sidebar Layout
className="flex flex-col lg:flex-row gap-8"
```

---

## Components

### Buttons

#### Primary Button
```jsx
<Button className="bg-[#df2531] hover:bg-transparent text-white font-bold px-10 py-5 rounded-full border-2 border-[#df2531] transition-all duration-300 hover:scale-105">
  Button Text
</Button>
```

#### Secondary Button
```jsx
<Button className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full border border-white/20 transition-all duration-300">
  Button Text
</Button>
```

#### Ghost Button
```jsx
<Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
  Button Text
</Button>
```

#### Button Sizes

| Size | Padding | Font |
|------|---------|------|
| Small | `px-3 py-2` | `text-xs` |
| Default | `px-6 py-3` | `text-sm` |
| Large | `px-10 py-5` | `text-base` |

### Cards

#### Standard Card
```jsx
<div className="bg-[#0a0a0f] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
  {/* Content */}
</div>
```

#### Elevated Card (with hover)
```jsx
<div className="bg-[#0a0a0f] rounded-2xl border border-white/10 p-6 card-hover">
  {/* Content */}
</div>
```

#### Glass Card
```jsx
<div className="glass rounded-2xl p-6">
  {/* Content */}
</div>
```

### Form Inputs

```jsx
<input
  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
  placeholder="Enter text..."
/>
```

### Badges

```jsx
// Status Badge
<span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
  Active
</span>

// Category Badge
<span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
  Category
</span>
```

### Modals

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
  <div className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden">
    {/* Header */}
    <div className="p-6 border-b border-white/10">
      <h2 className="text-xl font-bold text-white">Modal Title</h2>
    </div>
    
    {/* Body */}
    <div className="p-6">
      {/* Content */}
    </div>
    
    {/* Footer */}
    <div className="p-6 border-t border-white/10">
      {/* Actions */}
    </div>
  </div>
</div>
```

---

## Icons

### Icon Library
**Phosphor Icons** (`@phosphor-icons/react`)

### Common Icons Used

| Icon | Usage |
|------|-------|
| `Gift` | Gifting feature |
| `Coin` | Currency/wallet |
| `User` | Profile |
| `Calendar` | Bookings |
| `ChatCircle` | Messages |
| `Bell` | Notifications |
| `Heart` | Favorites |
| `Check` | Success |
| `Warning` | Alerts |
| `X` | Close/cancel |
| `SpinnerGap` | Loading |
| `CaretLeft/Right` | Navigation |

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| Small | 16px | Inline text |
| Default | 20px | Buttons |
| Medium | 24px | Cards |
| Large | 32px | Feature icons |
| XL | 48px | Hero sections |

### Icon Weights

```jsx
// Default (regular)
<Gift size={24} />

// Bold
<Gift size={24} weight="bold" />

// Fill (solid)
<Gift size={24} weight="fill" />

// Duotone
<Gift size={24} weight="duotone" />
```

---

## Animations & Transitions

### CSS Keyframes

```css
/* Fade In Up - Page load animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Fade In Down */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Float - Decorative elements */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Shimmer - Loading states */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Pulse Glow - CTAs */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(223, 37, 49, 0.3); }
  50% { box-shadow: 0 0 40px rgba(223, 37, 49, 0.5); }
}
```

### Animation Classes

```css
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
.animate-fade-in-down { animation: fadeInDown 0.8s ease-out forwards; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
```

### Transition Durations

| Duration | Usage |
|----------|-------|
| `duration-150` | Micro-interactions (opacity) |
| `duration-300` | Standard transitions |
| `duration-500` | Page transitions |
| `duration-700` | Hero animations |
| `duration-1000` | Dramatic reveals |

### Easing Functions

```jsx
// Standard ease
className="transition-all duration-300 ease-in-out"

// Smooth deceleration
className="transition-all duration-500 ease-out"

// Custom cubic bezier (image zoom)
style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
```

### Interactive States

```jsx
// Hover scale
className="hover:scale-105 active:scale-95 transition-transform"

// Card hover lift
className="hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"

// Button press
className="active:scale-98"
```

---

## Effects & Treatments

### Glass Morphism

```css
.glass {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Gradients

```jsx
// Hero overlay
className="bg-gradient-to-r from-black/90 via-black/50 to-black/70"

// Vertical fade
className="bg-gradient-to-t from-black via-transparent to-black/60"

// Red accent overlay
className="bg-[#df2531]/5 mix-blend-overlay"

// Button gradient
className="bg-gradient-to-r from-amber-500 to-orange-500"
```

### Shadows

```jsx
// Subtle shadow
className="shadow-lg"

// Colored glow
className="shadow-lg shadow-[#df2531]/20"

// Elevated card
className="shadow-xl shadow-black/50"

// Dramatic hover
className="hover:shadow-2xl hover:shadow-black/40"
```

### Image Zoom Effect

```css
.img-zoom {
  overflow: hidden;
}
.img-zoom img {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.img-zoom:hover img {
  transform: scale(1.1);
}
```

### Custom Scrollbar

```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #000000; }
::-webkit-scrollbar-thumb { background: #df2531; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #c41f2a; }
```

### Selection Color

```css
::selection {
  background-color: rgba(223, 37, 49, 0.3);
  color: #ffffff;
}
```

---

## Responsive Design

### Breakpoints (Tailwind)

| Breakpoint | Min Width | Typical Device |
|------------|-----------|----------------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Patterns

```jsx
// Typography scaling
className="text-base md:text-lg lg:text-xl"

// Spacing scaling
className="p-4 md:p-6 lg:p-8"

// Grid changes
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

// Show/hide
className="hidden md:block"  // Hide on mobile
className="md:hidden"        // Show only on mobile
```

### Responsive Typography Example

```jsx
<h1 className="text-[clamp(2.5rem,8vw,9rem)] font-black leading-[0.95]">
  Hero Title
</h1>
```

---

## Accessibility

### Focus States

```jsx
className="focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
```

### Color Contrast
- Primary text (`#ffffff`) on background (`#000000`): **21:1** ✅
- Muted text (`rgba(255,255,255,0.6)`) on background: **7.5:1** ✅
- Primary red (`#df2531`) on background: **5.8:1** ✅

### ARIA Labels

```jsx
<button aria-label="Close modal">
  <X size={24} />
</button>

<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Modal Title</h2>
</div>
```

### Test IDs

All interactive elements include `data-testid` attributes:

```jsx
<button data-testid="gift-coins-button">Gift Coins</button>
<div data-testid="gift-success">Success Message</div>
```

---

## Quick Reference

### Common Tailwind Patterns

```jsx
// Card
"bg-[#0a0a0f] rounded-2xl border border-white/10 p-6"

// Button Primary
"bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-6 py-3 rounded-full transition-all"

// Input
"bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-[#df2531]/50"

// Text Primary
"text-white"

// Text Secondary
"text-white/60"

// Section Container
"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

### CSS Variable Usage

```jsx
// In JSX
style={{ backgroundColor: 'var(--primary)' }}

// In Tailwind (via arbitrary values)
className="bg-[var(--primary)]"
className="text-[var(--muted)]"
```

---

## File References

| File | Purpose |
|------|---------|
| `src/app/globals.css` | CSS variables, keyframes, base styles |
| `src/components/ui/` | Shadcn UI components |
| `src/components/*.tsx` | Custom components |

---

*Last updated: January 2025*
