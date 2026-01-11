# Nego Design System v2.0

## Overview
Nego is a premium managed marketplace for elite escort services. The design emphasizes sophistication, luxury, and discretion through a dark, bold aesthetic with strategic red accents.

---

## 1. Color System

### Primary Colors
| Name | Hex | Transparency | Usage |
|------|-----|--------------|-------|
| Primary Red | `#df2531` | 100% | CTAs, accents, highlights, logo dot |
| Red 65% | `#df2531` | 65% | Secondary accents, hover states |
| Red 45% | `#df2531` | 45% | Backgrounds, subtle accents |
| Black | `#000000` | 100% | Primary background |
| White | `#ffffff` | 100% | Text, UI elements |

### Transparency Variations
```css
/* Primary Red variations */
bg-[#df2531]           /* Solid - CTAs, buttons */
bg-[#df2531]/65        /* 65% - Hover backgrounds */
bg-[#df2531]/45        /* 45% - Subtle backgrounds */
bg-[#df2531]/30        /* 30% - Borders, accents */
bg-[#df2531]/20        /* 20% - Pills, tags */
bg-[#df2531]/10        /* 10% - Background glows */
bg-[#df2531]/5         /* 5% - Subtle overlays */
```

### Neutral Scale
```css
text-white             /* Primary text */
text-white/80          /* Body text */
text-white/70          /* Secondary text */
text-white/60          /* Descriptions */
text-white/50          /* Muted text */
text-white/30          /* Placeholders */
text-white/10          /* Borders */
text-white/5           /* Subtle backgrounds */
```

---

## 2. Typography

### Font Families
```css
/* Headlines & Display (Playfair) */
font-family: 'Playfair', Georgia, serif;

/* Body & UI (DM Sans) */
font-family: 'DM Sans', -apple-system, sans-serif;
```

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair:wght@300..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@100..1000&display=swap');
```

---

## 3. Iconography

### Primary Library
**Phosphor Icons (Duotone)** - `@phosphor-icons/react`

### Fallback Library
**Lucide React** - `lucide-react`

### Usage
```jsx
import { Heart, Lock, MapPin } from '@phosphor-icons/react';

<Heart size={32} weight="duotone" className="text-[#df2531]" />
```

### Common Icons
| Icon | Import | Usage |
|------|--------|-------|
| `List` | `@phosphor-icons/react` | Mobile menu |
| `X` | `@phosphor-icons/react` | Close |
| `CaretLeft/Right` | `@phosphor-icons/react` | Navigation |
| `MapPin` | `@phosphor-icons/react` | Location |
| `Heart` | `@phosphor-icons/react` | Premium/Locked |
| `Lock` | `@phosphor-icons/react` | Locked content |
| `ShieldCheck` | `@phosphor-icons/react` | Verified |
| `Sparkle` | `@phosphor-icons/react` | Exclusive |
| `Globe` | `@phosphor-icons/react` | Website |
| `InstagramLogo` | `@phosphor-icons/react` | Social |
| `PaperPlaneTilt` | `@phosphor-icons/react` | Send |
| `Coins` | `@phosphor-icons/react` | Tokens |
| `ArrowRight` | `@phosphor-icons/react` | Links |

---

## 4. Components

### Buttons

#### Primary CTA
```jsx
<Button className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-10 py-6 rounded-full shadow-lg shadow-[#df2531]/30 hover:shadow-[#df2531]/50 hover:scale-105 active:scale-95">
  Negotiate
</Button>
```

#### Ghost Button
```jsx
<Button className="bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-full border border-white/10">
  Buy Tokens
</Button>
```

### Cards
```jsx
/* Glass Card */
<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 bento-item">

/* Image Card */
<div className="rounded-2xl overflow-hidden bento-item img-zoom">
  <img className="object-cover" />
  <div className="bg-gradient-to-t from-black/80 to-transparent" />
</div>
```

### Feature Pills
```jsx
<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#df2531]/20 border border-[#df2531]/30 hover:scale-105">
  <Icon weight="duotone" className="text-[#df2531]" />
  <span className="text-white text-sm">Label</span>
</div>
```

---

## 5. Animation Classes

```css
/* Bento Item */
.bento-item {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.bento-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(223, 37, 49, 0.15);
}

/* Image Zoom */
.img-zoom img { transition: transform 0.7s; }
.img-zoom:hover img { transform: scale(1.1); }
```

---

## 6. File Structure

```
src/
├── components/landing/
│   ├── Header.jsx      (Phosphor: List, X, Coins)
│   ├── HeroSection.jsx (Phosphor: CaretLeft, CaretRight)
│   ├── AboutSection.jsx(Phosphor: ArrowRight, ShieldCheck, Heart, Sparkle)
│   ├── TalentSection.jsx(Phosphor: MapPin)
│   ├── PremiumSection.jsx(Phosphor: Heart, Lock)
│   └── Footer.jsx      (Phosphor: Globe, InstagramLogo, PaperPlaneTilt)
├── data/mock.js
├── App.css
└── DESIGN_SYSTEM.md
```

---

*Version 2.0 - Updated with new color system and Phosphor Icons*
