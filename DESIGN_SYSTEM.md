# DommeDirectory Design System

## Overview
A dark-themed, premium design system focused on readability, trust, and conversion.

---

## Color Palette

### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#0a0a0a` | Main page background |
| `bg-secondary` | `#0d0d0d` | Header, nav bars |
| `bg-tertiary` | `#141414` | Elevated surfaces |
| `bg-card` | `#1a1a1a` | Cards, panels |
| `bg-input` | `#262626` | Form inputs |

### Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| `accent-primary` | `#dc2626` (red-600) | Primary buttons, links, badges |
| `accent-hover` | `#b91c1c` (red-700) | Button hover states |
| `accent-light` | `#ef4444` (red-500) | Hover text, icons |

### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `#ffffff` | Headlines, important text |
| `text-secondary` | `#9ca3af` (gray-400) | Body text, descriptions |
| `text-muted` | `#6b7280` (gray-500) | Placeholders, hints |
| `text-disabled` | `#4b5563` (gray-600) | Disabled states |

### Border Colors
| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | `#1f1f1f` | Default borders |
| `border-hover` | `#374151` (gray-700) | Hover states |
| `border-focus` | `#dc2626` | Focused inputs |

### Status Colors
| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#22c55e` (green-500) | Success states |
| `warning` | `#eab308` (yellow-500) | Warning states |
| `error` | `#dc2626` (red-600) | Error states |
| `online` | `#22c55e` (green-500) | Online indicator |

---

## Typography

### Font Families
- **Headings**: Cinzel (serif, uppercase, wide tracking)
- **Body**: Inter (sans-serif)

### Type Scale
| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 2.25rem (36px) | 700 | Page titles |
| H2 | 1.5rem (24px) | 600 | Section headers |
| H3 | 1.25rem (20px) | 600 | Card titles |
| Body | 1rem (16px) | 400 | Paragraphs |
| Small | 0.875rem (14px) | 400 | Labels, meta |
| XSmall | 0.75rem (12px) | 400 | Badges, tags |

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 0.25rem (4px) | Tight spacing |
| `space-2` | 0.5rem (8px) | Icon gaps |
| `space-3` | 0.75rem (12px) | Small padding |
| `space-4` | 1rem (16px) | Default padding |
| `space-6` | 1.5rem (24px) | Section gaps |
| `space-8` | 2rem (32px) | Large sections |

---

## Components

### Buttons

**Primary Button**
```
bg: red-600
text: white
padding: 10px 16px
border-radius: 8px
hover: bg-red-700
focus: ring-2 ring-red-500/30
```

**Secondary Button**
```
bg: #1a1a1a
text: white
border: 1px solid gray-700
padding: 10px 16px
border-radius: 8px
hover: bg-gray-800
```

**Ghost Button**
```
bg: transparent
text: gray-400
padding: 10px 16px
hover: text-white
```

### Cards

**Profile Card**
```
bg: #1a1a1a
aspect-ratio: 3/4
border-radius: 0 (tight grid)
overlay: gradient-to-t from-black/90
hover: scale(1.02)
```

**Content Card**
```
bg: #1a1a1a
border: 1px solid #1f1f1f
border-radius: 12px
padding: 24px
hover: border-gray-700
```

### Inputs

**Text Input**
```
bg: #262626
text: white
placeholder: gray-500
border: 1px solid transparent
border-radius: 6px
padding: 12px 16px
focus: border-red-500, ring-red-500/20
```

### Badges

**Verified Badge**
```
bg: red-600/20
text: red-600
padding: 4px 8px
border-radius: 9999px
font-size: 12px
```

---

## Layout Patterns

### Container
- Max width: 1920px
- Padding: 16px (mobile), 24px (tablet), 32px (desktop)

### Grid
- Profile grid: 2-6 columns responsive
- Gap: 4px (tight), 16px (loose)

### Header
- Height: 56px
- Background: #0d0d0d
- Border-bottom: 1px solid #1f1f1f

---

## Animation Standards

### Transitions
- Default: `transition-all duration-200`
- Hover scale: `duration-300`
- Page transitions: `duration-500`

### Hover Effects
- Cards: `hover:scale-[1.02]`
- Buttons: `hover:bg-red-700`
- Links: `hover:text-red-500`

---

## Accessibility

- Minimum contrast ratio: 4.5:1
- Focus indicators: red-500 ring
- Interactive elements: min 44px touch target
- Reduced motion support: `prefers-reduced-motion`
