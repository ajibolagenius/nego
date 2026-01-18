# PWA Screenshots

This directory should contain screenshots for the PWA install prompt.

## Required Screenshots

To enable the "Richer PWA Install UI" on both desktop and mobile, you need to add the following screenshots:

### Mobile Screenshots (form_factor: "narrow")
- **mobile-1.png** (390x844 or similar mobile dimensions)
  - Recommended: Dashboard view on mobile
- **mobile-2.png** (390x844 or similar mobile dimensions)
  - Recommended: Browse talents view on mobile

### Desktop Screenshots (form_factor: "wide")
- **desktop-1.png** (1280x720 or 1920x1080)
  - Recommended: Dashboard view on desktop
- **desktop-2.png** (1920x1080 or larger)
  - Recommended: Talent profile or browse view on desktop

## How to Generate Screenshots

1. **Using Browser DevTools:**
   - Open your app in Chrome/Edge
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
   - Set to mobile viewport (e.g., iPhone 14 Pro - 390x844)
   - Navigate to the page you want to screenshot
   - Use browser's screenshot tool or take a screenshot

2. **For Desktop:**
   - Open your app in full screen
   - Use browser's screenshot tool or screen capture
   - Recommended dimensions: 1280x720 or 1920x1080

3. **Using Tools:**
   - Chrome DevTools: Device Mode → Screenshot
   - Firefox: Responsive Design Mode → Screenshot
   - Online tools: PWA Builder, Lighthouse

## File Naming
- Keep the exact filenames as specified in `manifest.json`
- Use PNG format for best quality
- Optimize images to reduce file size (use tools like TinyPNG, ImageOptim)

## Notes
- Screenshots should showcase your app's best features
- Use actual app screenshots, not mockups
- Ensure screenshots are up-to-date with current UI
- Test that screenshots display correctly in install prompts
