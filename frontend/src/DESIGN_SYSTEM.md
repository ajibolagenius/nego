# Nego Design System v3.0

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
bg-[#df2531]/20      /* 20% - Pills, tags */
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
| Hero H1 | text-4xl → text-8xl | font-black (900) |
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

### Common Icons by Section

**Header:**
- `List` - Mobile menu open
- `X` - Mobile menu close
- `Coin` - Token button
- `CaretDown` - Dropdown indicator

**Hero:**
- `CaretLeft`, `CaretRight` - Slider navigation
- `Play` - Video button
- `ArrowDown` - CTA accent

**About:**
- `ArrowRight` - Links/CTAs
- `ShieldCheck` - Verified badge
- `Heart` - Premium
- `Sparkle` - Exclusive
- `Eye` - View/hover indicator

**Talent:**
- `MapPin` - Location
- `Heart` - Like/favorite
- `Eye` - Quick view
- `ArrowRight` - Profile link

**Premium:**
- `Heart` - Locked content icon
- `Lock` - Locked overlay
- `Sparkle` - Premium badge
- `Crown` - VIP indicator
- `Star` - Rating/exclusive

**Footer:**
- `Globe` - Website
- `InstagramLogo` - Instagram
- `DiscordLogo` - Discord
- `TwitterLogo` - Twitter/X
- `ArrowUp` - Back to top
- `MapPin` - Location
- `Phone` - Contact
- `Envelope` - Email

---

## 4. Layout System

### Masonry Bento Grid
All sections use a masonry-inspired Bento grid layout.

```css
/* Base Grid */
grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4 md:gap-5

/* Auto Rows for Masonry */
auto-rows-[120px] md:auto-rows-[140px]

/* Column Spans */
col-span-1    /* Single cell */
col-span-2    /* Double wide */
lg:col-span-3 /* Triple on desktop */
lg:col-span-5 /* Half+ width */
lg:col-span-7 /* Large feature */

/* Row Spans */
row-span-2    /* Double height */
row-span-3    /* Triple height */
row-span-4    /* Tall feature */
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

/* Fade In Side */
opacity-0 translate-x-8 → opacity-100 translate-x-0
opacity-0 -translate-x-8 → opacity-100 translate-x-0

/* Scale In */
opacity-0 scale-95 → opacity-100 scale-100
```

### Hover Animations
```css
/* Button */
hover:scale-105 active:scale-95

/* Card Lift */
hover:-translate-y-1

/* Image Zoom */
transition-transform duration-700 group-hover:scale-110

/* Icon Rotation */
transition-transform duration-300 group-hover:rotate-12

/* Link Arrow */
transition-transform duration-300 group-hover:translate-x-1
```

### Keyframe Animations
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

### Stagger Delays
```css
style={{ transitionDelay: `${index * 100}ms` }}
```

---

## 6. Interactive Effects

### Magnetic Cursor (About Section)
```jsx
const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  setCursorPos({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  });
};
```

### Parallax on Mouse Move (Hero)
```jsx
const handleMouseMove = (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;
  setMousePosition({ x, y });
};
```

### Ken Burns Effect (Hero Slider)
```css
transition-transform duration-[8000ms] ease-out
/* Active slide scales from 1 to 1.1 over 8 seconds */
```

### Active Navigation Indicator
```css
/* Animated underline that grows on hover/active */
w-0 group-hover:w-4 → w-6 (active)
```

---

## 7. Component Patterns

### Primary Button
```jsx
<Button className="group bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-10 py-6 rounded-full shadow-lg shadow-[#df2531]/30 hover:shadow-[#df2531]/50 transition-all duration-300 hover:scale-105 active:scale-95">
  <span className="flex items-center gap-2">
    Label
    <Icon className="transition-transform group-hover:translate-x-1" />
  </span>
</Button>
```

### Glass Card
```jsx
<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#df2531]/30 transition-all duration-500">
```

### Image Card with Hover
```jsx
<div className="relative rounded-2xl overflow-hidden group cursor-pointer">
  <img className="transition-transform duration-700 group-hover:scale-110" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
  <div className="absolute bottom-4 left-4 transition-all duration-500 group-hover:translate-y-0 opacity-100">
    {/* Content */}
  </div>
</div>
```

### Feature Pill
```jsx
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#df2531]/10 border border-[#df2531]/20 hover:bg-[#df2531]/20 hover:scale-105 transition-all duration-300">
  <Icon size={14} weight="duotone" className="text-[#df2531]" />
  <span className="text-white text-xs">{label}</span>
</div>
```

---

## 8. Section Structure

### Standard Section
```jsx
<section className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
  {/* Background effects */}
  <div className="absolute inset-0">
    <div className="bg-[#df2531]/10 rounded-full blur-[150px]" />
  </div>
  
  {/* Content */}
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Section header */}
    <div className="text-center mb-12 md:mb-16">
      <p className="text-[#df2531] tracking-[0.3em] uppercase text-xs">Subtitle</p>
      <h2 className="text-5xl font-black text-white">TITLE</h2>
    </div>
    
    {/* Masonry Grid Content */}
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
      {/* Grid items */}
    </div>
  </div>
</section>
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| default | 0px | Mobile first |
| sm | 640px | Large mobile |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

---

## 10. File Structure

```
src/
├── components/landing/
│   ├── Header.jsx      (List, X, Coin, CaretDown)
│   ├── HeroSection.jsx (CaretLeft/Right, Play, ArrowDown)
│   ├── AboutSection.jsx(ArrowRight, ShieldCheck, Heart, Sparkle, Eye)
│   ├── TalentSection.jsx(MapPin, Heart, Eye, ArrowRight)
│   ├── PremiumSection.jsx(Heart, Lock, Sparkle, Crown, Star)
│   └── Footer.jsx      (Globe, InstagramLogo, DiscordLogo, TwitterLogo, ArrowUp, MapPin, Phone, Envelope)
├── data/mock.js
├── App.css
└── DESIGN_SYSTEM.md
```

---

*Version 3.0 - Masonry Bento Grid, Full Phosphor Icons, Enhanced Animations*
