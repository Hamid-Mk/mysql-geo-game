# SQL Atlas — Full Visual Redesign

Redesign the SQL Atlas website to feel like "Duolingo meets sci-fi space exploration meets a professional data tool" — a branded, game-like experience for high school students.

## Brand Analysis

### Logo Colors Extracted
The SVG logo (`frontend/assets/sql-atlas-logo.svg`) uses:
- **#4DD9D9** — Primary bright teal/cyan (globe outline, magnifier text)
- **#5CE0E0** — Lighter teal (globe meridians, handle highlight)
- **#2AA8A8** — Deeper teal (orbit ring, latitude lines)
- **#083D42** — Very dark teal (border accents)
- **#061719** — Near-black (globe fill)

These teal tones will anchor the entire design system.

### Design Direction
| Aspect | Current | New |
|--------|---------|-----|
| Feeling | Clean school dashboard | Sci-fi mission control game |
| Colors | Generic blue (#2563EB) + teal | Logo-derived teal palette + cosmic purples + neon accents |
| Typography | Inter only | Inter + JetBrains Mono + Space Grotesk (display) |
| Backgrounds | Simple gradient + grid | Animated starfield + nebula glow + floating particles |
| Cards | Flat with border | Glassmorphic with holographic hover effects |
| Buttons | Linear gradient | Pulsing glow + shimmer animations |
| Dark mode | Slightly different variables | Deep space black with luminous neon accents |
| Light mode | Bright white | Frosted glass panels on soft cosmic gradients |

## Proposed Changes

### CSS Overhaul

#### [MODIFY] [style.css](file:///Users/admin/Desktop/Thomas%20More%20University/Applied%20Computer%20Science/Skills-Integration-1/Team-Project/mysql-geo-game/frontend/css/style.css)

Complete redesign of the CSS with:

**New color system** derived from logo:
- Light mode: Soft teal/cyan tones on light backgrounds with frosted-glass panels
- Dark mode: Deep space (#060B18) with luminous teal/cyan neon accents
- Accent palette: Logo teal (#4DD9D9), deep teal (#2AA8A8), cosmic purple (#7B61FF), neon green (#39FFB0)
- Difficulty colors: Beginner=green, Intermediate=teal, Advanced=magenta

**New visual effects:**
- Animated CSS starfield background (pseudo-element with radial-gradient dots)
- Floating nebula particles via CSS animations
- Holographic card hover effects (rotating gradient + shimmer)
- Glassmorphism on all panels (backdrop-filter: blur + translucent backgrounds)
- Pulsing glow on primary buttons
- Animated progress bars with shimmer effect
- Scan-line animation on terminal panel
- Card tilt-on-hover with glare effect

**Dark vs Light mode differentiation:**
- Dark: Deep space background, neon glow effects, luminous borders, star particles visible
- Light: Soft gradient sky, frosted glass panels, subtle shadows, muted glow effects
- Different hover effects per mode (neon outline in dark, soft shadow lift in light)

---

### HTML Pages

#### [MODIFY] [index.html](file:///Users/admin/Desktop/Thomas%20More%20University/Applied%20Computer%20Science/Skills-Integration-1/Team-Project/mysql-geo-game/frontend/index.html)
- Add Space Grotesk font import
- Add animated star particles container
- Add logo to the hero section
- Add game-like level icons (🚀, ⚡, 🌟 replaced with custom SVG icons)
- Add a footer with branding
- Enhance hero section with large logo display

#### [MODIFY] [login.html](file:///Users/admin/Desktop/Thomas%20More%20University/Applied%20Computer%20Science/Skills-Integration-1/Team-Project/mysql-geo-game/frontend/login.html)
- Add Space Grotesk font
- Add star particles
- Enhance login panel with animated border glow
- Keep the logo prominent

#### [MODIFY] [quiz.html](file:///Users/admin/Desktop/Thomas%20More%20University/Applied%20Computer%20Science/Skills-Integration-1/Team-Project/mysql-geo-game/frontend/quiz.html)
- Add Space Grotesk font
- Add star particles
- Enhance status chips with glow effects
- Add animated progress indicator

#### [MODIFY] [admin_teacher.html](file:///Users/admin/Desktop/Thomas%20More%20University/Applied%20Computer%20Science/Skills-Integration-1/Team-Project/mysql-geo-game/frontend/admin_teacher.html)
- Add Space Grotesk font
- Add star particles
- Keep teacher portal distinguishable (amber accent) but within the space theme

---

### JavaScript

#### [MODIFY] [app.js](file:///Users/admin/Desktop/Thomas%20More%20University/Applied%20Computer%20Science/Skills-Integration-1/Team-Project/mysql-geo-game/frontend/js/app.js)
- Add animated star particles generator (replaces static grid)
- Enhanced card tilt effect with glare
- Smoother pointer-follow glow effect
- No changes to game logic / API integration

> [!IMPORTANT]
> All JS game logic (quiz.js, admin.js) remains **100% unchanged** — only visual presentation code is modified.

## Verification Plan

### Manual Verification
- Open each page (index, login, quiz, admin) in the browser
- Toggle dark/light mode on each page
- Verify logo is visible and correct on all pages
- Check hover effects, animations, and transitions
- Test responsive layout at mobile/tablet/desktop sizes
- Verify all interactive elements (buttons, links, forms) remain functional
