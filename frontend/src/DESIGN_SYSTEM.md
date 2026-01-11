# Nego Design System

## Overview
Nego is a premium managed marketplace for elite escort services. The design system emphasizes sophistication, luxury, and discretion through a dark, sensual aesthetic with strategic use of vibrant accents.

---

## 1. Brand Identity

### Brand Name
- **Primary:** NEGO.
- **Styling:** "NEGO" in white, period "." in fuchsia-500

### Brand Attributes
- Premium & Luxurious
- Sophisticated & Discreet
- Modern & Sleek
- Trustworthy & Secure

---

## 2. Color Palette

### Primary Colors
| Color | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Background Dark | `#0a0a0f` | `bg-[#0a0a0f]` | Primary background |
| Card Background | `#1a1a2e` | `bg-[#1a1a2e]` | Cards, elevated surfaces |
| Footer Background | `#0d0a1a` | `bg-[#0d0a1a]` | Footer section |

### Accent Colors
| Color | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Fuchsia Primary | `#d946ef` | `fuchsia-500` | Primary accent, CTAs, highlights |
| Fuchsia Light | `#e879f9` | `fuchsia-400` | Subtitles, labels |
| Fuchsia Dark | `#c026d3` | `fuchsia-600` | Hover states |
| Purple | `#a855f7` | `purple-500` | Secondary accent, gradients |
| Amber | `#f59e0b` | `amber-500` | Premium CTAs, tokens |

### Neutral Colors
| Color | Tailwind | Usage |
|-------|----------|-------|
| White | `text-white` | Headings, primary text |
| Gray 300 | `text-gray-300` | Body text |
| Gray 400 | `text-gray-400` | Secondary text, descriptions |
| Gray 500 | `text-gray-500` | Muted text, placeholders |

### Gradient Combinations
```css
/* Primary CTA Gradient */
from-fuchsia-500 to-fuchsia-600

/* Premium CTA Gradient */
from-amber-500 to-amber-600

/* Card Background Gradient */
from-[#1a1a2e]/80 to-[#1a1a2e]/40

/* Section Background Gradient */
from-purple-900/20 to-fuchsia-900/10

/* Button Accent Gradient */
from-blue-500 to-purple-500
```

---

## 3. Typography

### Font Families
```css
/* Headlines & Display */
font-family: 'Playfair', Georgia, 'Times New Roman', serif;

/* Body & UI Elements */
font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair:ital,opsz,wdth,wght@0,5..1200,87.5..112.5,300..900;1,5..1200,87.5..112.5,300..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
```

### Type Scale
| Element | Mobile | Tablet | Desktop | Weight |
|---------|--------|--------|---------|--------|
| Hero H1 | text-4xl | text-7xl | text-9xl | font-black (900) |
| Section H2 | text-3xl | text-5xl | text-6xl | font-black (900) |
| Card Title | text-lg | text-xl | text-2xl | font-bold (700) |
| Subtitle | text-xs | text-sm | text-sm | font-semibold (600) |
| Body | text-base | text-lg | text-lg | font-normal (400) |
| Caption | text-xs | text-sm | text-sm | font-medium (500) |

### Letter Spacing
- Subtitles/Labels: `tracking-[0.2em]` to `tracking-[0.3em]`
- Headings: `tracking-tight`

---

## 4. Spacing System

### Container
```css
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### Section Padding
| Screen | Padding Y |
|--------|-----------|
| Mobile | py-16 |
| Tablet | py-24 |
| Desktop | py-32 |

### Component Gaps
| Usage | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| Grid gaps | gap-3 | gap-4 | gap-6 |
| Card padding | p-5 | p-6 | p-8 |
| Stack spacing | space-y-5 | space-y-6 | space-y-8 |

---

## 5. Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Small | rounded-xl | Small cards, inputs |
| Medium | rounded-2xl | Cards, images |
| Large | rounded-3xl | Large cards, containers |
| Full | rounded-full | Buttons, pills, avatars |

---

## 6. Shadows & Effects

### Box Shadows
```css
/* Card shadow */
shadow-2xl

/* CTA Button shadow */
shadow-lg shadow-fuchsia-500/30

/* Hover state */
hover:shadow-fuchsia-500/50
```

### Blur Effects
```css
/* Backdrop blur */
backdrop-blur-sm    /* Light blur */
backdrop-blur-xl    /* Heavy blur for modals/overlays */

/* Background orbs */
blur-[120px] to blur-[200px]
```

### Glass Morphism
```css
bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/10
```

---

## 7. Components

### Buttons

#### Primary CTA
```jsx
<Button className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-bold px-8 md:px-10 py-5 md:py-6 rounded-full shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:shadow-fuchsia-500/50 hover:scale-105 active:scale-95">
  Negotiate
</Button>
```

#### Secondary CTA (Premium)
```jsx
<Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold px-8 py-6 rounded-full shadow-lg shadow-amber-500/30">
  Get Now
</Button>
```

#### Ghost Button
```jsx
<Button className="bg-[#1a1a2e] hover:bg-[#252540] text-white font-medium px-5 py-2.5 rounded-full border border-white/10">
  Buy Tokens
</Button>
```

### Cards

#### Bento Card (Content)
```jsx
<div className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#1a1a2e]/40 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/5 bento-item">
  {/* Content */}
</div>
```

#### Image Card
```jsx
<div className="relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom">
  <img className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
  <div className="absolute bottom-4 left-4 right-4">
    {/* Text overlay */}
  </div>
</div>
```

### Pills/Tags
```jsx
<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 bg-opacity-10 border border-white/10">
  <Icon className="w-4 h-4 text-white" />
  <span className="text-white text-sm font-medium">Label</span>
</div>
```

### Input Fields
```jsx
<div className="flex items-center bg-[#1a1525]/80 backdrop-blur-sm border border-gray-700/50 rounded-full overflow-hidden pl-5 pr-1 py-1">
  <input className="bg-transparent text-gray-300 placeholder-gray-500 outline-none text-sm" />
  <button className="w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-600">
    <SendIcon />
  </button>
</div>
```

---

## 8. Animation System

### Transition Durations
```css
duration-200   /* Quick interactions */
duration-300   /* Standard transitions */
duration-500   /* Smooth animations */
duration-700   /* Entrance animations */
duration-1000  /* Slow, dramatic effects */
```

### Easing Functions
```css
ease-out           /* Default exits */
ease-in-out        /* Smooth transitions */
cubic-bezier(0.4, 0, 0.2, 1)  /* Custom smooth */
```

### Keyframe Animations
```css
/* Fade In Up */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale In */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Float */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Pulse Glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(217, 70, 239, 0.3); }
  50% { box-shadow: 0 0 40px rgba(217, 70, 239, 0.5); }
}
```

### Hover Effects
```css
/* Scale up */
hover:scale-105 active:scale-95

/* Translate */
hover:translate-y-[-5px]

/* Image zoom */
.img-zoom img { transition: transform 0.6s; }
.img-zoom:hover img { transform: scale(1.1); }
```

### Scroll Animations (Intersection Observer)
- Trigger animations when elements enter viewport
- Use staggered delays: `transitionDelay: '${index * 100}ms'`
- Threshold: 0.1 to 0.2 for early trigger

---

## 9. Layout Patterns

### Bento Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  <div className="lg:col-span-2">Large card</div>
  <div className="row-span-2">Tall card</div>
  <div className="aspect-square">Square card</div>
  {/* ... */}
</div>
```

### Responsive Breakpoints
| Breakpoint | Width | Usage |
|------------|-------|-------|
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Small desktops |
| xl | 1280px | Large desktops |
| 2xl | 1536px | Extra large |

---

## 10. Iconography

### Library
- **Lucide React** (`lucide-react`)

### Common Icons
- `ChevronLeft`, `ChevronRight` - Navigation
- `Menu`, `X` - Mobile menu
- `Coins` - Tokens/Currency
- `Heart`, `Lock` - Premium/Locked content
- `Shield` - Verified/Security
- `Sparkles` - Premium/Exclusive
- `ArrowRight` - Links/CTAs
- `MapPin` - Location
- `Globe`, `Instagram`, `Send` - Social

### Icon Sizing
| Context | Size |
|---------|------|
| Small UI | w-3 h-3 to w-4 h-4 |
| Standard | w-5 h-5 |
| Feature | w-6 h-6 to w-8 h-8 |

---

## 11. Image Guidelines

### Aspect Ratios
| Usage | Ratio |
|-------|-------|
| Portrait cards | 3:4 |
| Square cards | 1:1 |
| Wide banners | 16:9 or 21:9 |
| Hero backgrounds | Full viewport |

### Image Treatment
- Object fit: `object-cover`
- Dark gradient overlay: `bg-gradient-to-t from-black/80 via-black/20 to-transparent`
- Blur for locked content: `blur-md`

---

## 12. Accessibility

### Focus States
- Use visible focus rings on interactive elements
- Maintain color contrast ratios (WCAG AA minimum)

### Touch Targets
- Minimum 44x44px for mobile touch targets
- Adequate spacing between interactive elements

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition-duration: 0.01ms !important; }
}
```

---

## 13. File Structure

```
src/
├── components/
│   ├── landing/
│   │   ├── Header.jsx
│   │   ├── HeroSection.jsx
│   │   ├── AboutSection.jsx
│   │   ├── TalentSection.jsx
│   │   ├── PremiumSection.jsx
│   │   └── Footer.jsx
│   └── ui/
│       └── button.jsx
├── data/
│   └── mock.js
├── App.js
├── App.css
└── index.css
```

---

## 14. Usage Examples

### Page Structure
```jsx
<div className="min-h-screen bg-[#0a0a0f]">
  <Header />
  <main>
    <HeroSection />
    <AboutSection />
    <TalentSection />
    <PremiumSection />
  </main>
  <Footer />
</div>
```

### Responsive Text Example
```jsx
<h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black">
  HEADING
</h1>
```

### Animation Trigger Example
```jsx
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
    { threshold: 0.2 }
  );
  observer.observe(sectionRef.current);
  return () => observer.disconnect();
}, []);

<div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
```

---

*Last Updated: January 2025*
*Version: 1.0*
