# Nego - Managed Talent Marketplace

## Overview
Nego is a premium managed marketplace for elite escort services. The platform features a sophisticated dark-themed landing page with a red accent color scheme, custom typography, and smooth animations.

## Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT-based
- **Icons**: Phosphor Icons
- **Fonts**: Playfair Display (headings), DM Sans (body)

## What's Been Implemented

### Phase 1: Frontend Landing Page ✅
**Completed: January 2026**

1. **Hero Section**
   - Background image slider with Ken Burns effect
   - Parallax mouse movement
   - Main CTA "Negotiate" button with inverse hover state (red bg → transparent, white text → red text)
   - Floating particles animation
   - Slide counter and navigation

2. **About Section**
   - Bento grid/masonry layout
   - Feature pills with icons
   - Entrance animations

3. **Talent Section**
   - 4-column responsive grid
   - Location-only cards (privacy-focused)
   - Hover effects with like/view actions
   - Integrated with backend API

4. **Premium Content Section**
   - 3 locked image cards
   - Blur effect on locked content
   - Unlock price display
   - Integrated with backend API

5. **Footer**
   - 4-section grid layout
   - Social links
   - Back to top button

### Phase 2: Backend Development ✅
**Completed: January 2026**

1. **Database Models**
   - Talent: name, location, image, price, age, rating, verification status
   - User: email, name, hashed password, premium status, coins
   - PrivateContent: title, description, image, unlock price, locked status

2. **API Endpoints**
   - `GET /api/health` - Health check
   - `GET /api/talents` - List all talents (with filtering)
   - `GET /api/talents/{id}` - Get single talent
   - `POST /api/talents` - Create talent
   - `PATCH /api/talents/{id}` - Update talent
   - `DELETE /api/talents/{id}` - Delete talent
   - `GET /api/content` - List private content
   - `POST /api/content/{id}/unlock` - Unlock content with coins
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/login` - User login
   - `GET /api/auth/me` - Get current user
   - `POST /api/seed` - Seed database

3. **Frontend Integration**
   - API service layer (`services/api.js`)
   - TalentSection fetches from `/api/talents`
   - PremiumSection fetches from `/api/content`
   - Fallback to mock data if API fails

## Current Status
- ✅ Landing page fully functional
- ✅ Backend APIs implemented and tested
- ✅ Frontend-backend integration complete
- ✅ 20/20 API tests passing
- ✅ CTA button hover state working

## Test Credentials
```
Email: test@nego.com
Password: password123
```

## Seeded Data
- 8 talents across Nigerian cities (Lagos, Abuja, Port Harcourt, Kano, Enugu, Ibadan)
- 3 locked private content items (50, 75, 100 coins)

---

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] User authentication UI (login/register modals)
- [ ] Token management in frontend
- [ ] Protected routes for private content

### P1 (Important)
- [ ] Talent detail page/modal
- [ ] Coin purchase flow
- [ ] Content unlock functionality in UI
- [ ] User profile page

### P2 (Nice to Have)
- [ ] Search and filter talents
- [ ] Favorites/wishlist
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Payment integration (Stripe/Paystack)

---

## File Structure

```
/app
├── backend/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── talent.py
│   │   ├── user.py
│   │   └── content.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── talent.py
│   │   ├── auth.py
│   │   └── content.py
│   ├── tests/
│   │   └── test_nego_api.py
│   ├── server.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── landing/
│       │   │   ├── HeroSection.jsx
│       │   │   ├── AboutSection.jsx
│       │   │   ├── TalentSection.jsx
│       │   │   ├── PremiumSection.jsx
│       │   │   ├── Header.jsx
│       │   │   └── Footer.jsx
│       │   └── ui/
│       ├── services/
│       │   └── api.js
│       ├── data/
│       │   └── mock.js
│       ├── App.js
│       ├── App.css
│       └── DESIGN_SYSTEM.md
└── memory/
    └── PRD.md
```

## Design System Reference
See `/app/frontend/src/DESIGN_SYSTEM.md` for colors, typography, components, and animation patterns.
