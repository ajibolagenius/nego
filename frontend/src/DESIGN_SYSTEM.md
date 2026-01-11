# Nego Design System v3.1

## Overview
Nego is a premium managed marketplace for elite escort services. The design system emphasizes sophistication, luxury, and discretion through a bold dark aesthetic with striking red accents and dynamic interactions.

---

## 1. Color System

### Primary Palette
| Name | Hex | Usage |
|------|-----|-------|
| Primary Red | `#df2531` | CTAs, accents, highlights, logo accent |
| Primary Red Hover | `#c41f2a` | Button hover states |
| Black | `#000000` | Primary background |
| White | `#ffffff` | Primary text |

### Transparency Scale (Primary Red)
```css
bg-[#df2531]         /* 100% - Solid CTAs */
bg-[#df2531]/80      /* 80% - Strong accents */
bg-[#df2531]/50      /* 50% - Medium accents */
bg-[#df2531]/30      /* 30% - Borders */
bg-[#df2531]/20      /* 20% - Pills, tags, slider bg */
bg-[#df2531]/10      /* 10% - Background glows, hovers */
bg-[#df2531]/5       /* 5% - Subtle overlays */
```

### White Transparency Scale
```css
text-white           /* 100% - Headlines */
text-white/80        /* 80% - Body text */
text-white/60        /* 60% - Secondary text */
text-white/50        /* 50% - Descriptions */
text-white/40        /* 40% - Muted text */
text-white/20        /* 20% - Subtle borders */
text-white/10        /* 10% - Card borders */
text-white/5         /* 5% - Card backgrounds */
```

---

## 2. Typography

### Font Families
```css
/* Headlines & Display */
font-family: 'Playfair', Georgia, serif;

/* Body & UI */
font-family: 'DM Sans', -apple-system, sans-serif;
```

### Type Scale
| Element | Size | Weight |
|---------|------|--------|
| Hero H1 | text-4xl → text-9xl | font-black (900) |
| Section H2 | text-3xl → text-6xl | font-black (900) |
| Card Title | text-lg → text-2xl | font-bold (700) |
| Subtitle | text-xs → text-sm | font-semibold (600) |
| Body | text-sm → text-lg | font-normal (400) |

---

## 3. Iconography

### Primary Library
**Phosphor Icons** - `@phosphor-icons/react`

### Icon Weights
- **duotone** - Primary style for all icons
- **fill** - Active/selected states
- **bold** - Navigation arrows, important actions

### Icons by Section

**Header:**
`List`, `X`, `Coin`, `CaretDown`

**Hero:**
`CaretLeft`, `CaretRight`, `ArrowDown`

**About:**
`ArrowRight`, `ShieldCheck`, `Heart`, `Sparkle`, `Eye`

**Talent:**
`MapPin`, `Heart`, `Eye`, `ArrowRight`

**Premium:**
`Heart`, `Lock`, `Sparkle`, `Crown`, `Star`

**Footer:**
`Globe`, `InstagramLogo`, `DiscordLogo`, `TwitterLogo`, `ArrowUp`, `MapPin`, `Phone`, `Envelope`

---

## 4. Layout System

### Hero Section
- **Single column, centered** content
- Ken Burns background slider
- Parallax mouse movement effect
- Floating particle animations

### Masonry Bento Grid (Other Sections)
```css
grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4 md:gap-5
auto-rows-[120px] md:auto-rows-[140px]
```

### Container
```css
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

---

## 5. Animation System

### Entrance Animations
```css
/* Fade In Up */
transition-all duration-700
opacity-0 translate-y-8 → opacity-100 translate-y-0

/* Text Reveal */
overflow-hidden + translate-y-full → translate-y-0
```

### Background Effects
- **Ken Burns**: `duration-[8000ms]` scale animation on active slide
- **Parallax**: Mouse position affects background translate
- **Floating Particles**: `animate-float` with staggered delays

### Hover Animations
```css
hover:scale-105 active:scale-95   /* Buttons */
hover:-translate-y-1              /* Cards */
group-hover:scale-110             /* Images */
group-hover:translate-y-1         /* Icon accent */
```

### Scroll Indicator
```css
animate-bounce  /* Dot inside scroll indicator */
```

---

## 6. Section Specifications

### Hero
- Single column centered layout
- Background image slider (5 images)
- Ken Burns + parallax effects
- Floating particles (6)
- Text reveal animation
- CTA: "Negotiate" with ArrowDown icon
- Bottom: slide counter, dots, navigation arrows
- Scroll indicator

### About
- Masonry 12-column grid
- Text card (col-span-5, row-span-3)
- 5 image cards with varying spans
- Magnetic cursor effect on images
- Feature pills with icons

### Talent
- 4-column grid inside glass container
- Location-only cards (no names/ages)
- Like + View hover actions
- Corner accent reveal on hover

### Premium
- 2-column layout (text left, images right)
- **3 locked image cards** only
- Middle card offset (-20px translateY)
- Heart + Lock overlay icons
- Hover: blur reduction, red tint, "Unlock to View" label
- Benefit pills with icons

### Footer
- 4-section grid (Logo, Nav, Legal, Contact)
- Social icons with hover effects
- Back to top button
- No newsletter form

---

## 7. Component Patterns

### Primary Button
```jsx
<Button className="group bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-10 py-6 rounded-full shadow-lg shadow-[#df2531]/30 hover:shadow-[#df2531]/50 transition-all duration-300 hover:scale-105 active:scale-95">
  <span className="flex items-center gap-2">
    Label
    <Icon className="transition-transform group-hover:translate-y-1" />
  </span>
</Button>
```

### Glass Card
```jsx
<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#df2531]/30 transition-all duration-500">
```

### Locked Image Card
```jsx
<div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#df2531]/30 hover:border-[#df2531] group">
  <img className="blur-md group-hover:blur-sm group-hover:scale-105" />
  <div className="absolute inset-0 bg-black/50 group-hover:bg-[#df2531]/20 flex items-center justify-center">
    <Heart size={32} weight="duotone" />
    <Lock size={14} weight="fill" className="absolute" />
  </div>
</div>
```

### Feature Pill
```jsx
<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-[#df2531]/30 hover:bg-[#df2531]/10">
  <Icon size={16} weight="duotone" className="text-[#df2531]" />
  <span className="text-white text-sm">{label}</span>
</div>
```

---

## 8. File Structure

```
src/
├── components/landing/
│   ├── Header.jsx
│   ├── HeroSection.jsx     (Single column, centered)
│   ├── AboutSection.jsx    (Masonry grid)
│   ├── TalentSection.jsx   (Location-only cards)
│   ├── PremiumSection.jsx  (3 locked images)
│   └── Footer.jsx          (No newsletter)
├── data/mock.js
├── App.css
└── DESIGN_SYSTEM.md
```

---

## 9. Key Design Decisions

1. **Hero**: Single column centered for maximum impact
2. **Premium**: 3 locked cards only for cleaner preview
3. **Talent**: Location-only for privacy/intrigue
4. **Footer**: Clean layout without newsletter
5. **Icons**: 100% Phosphor Icons (duotone weight)
6. **Animations**: Every section has unique interactions

---

*Version 3.1 - Single column hero, 3 locked images in Premium*
