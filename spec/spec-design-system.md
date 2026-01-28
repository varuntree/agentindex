# AgentIndex Design System

**Version:** 1.0
**Last Updated:** 2026-01-28

## Table of Contents
- [Brand Identity](#brand-identity)
- [Design Tokens](#design-tokens)
- [Components](#components)
- [Layout Patterns](#layout-patterns)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Icons](#icons)
- [Background Patterns](#background-patterns)
- [Animations](#animations)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Design Principles](#design-principles)
- [File Structure](#file-structure)

---

## Brand Identity

### Product
- **Name:** AgentIndex
- **Tagline:** "Australia's open real estate agent directory"
- **Mission:** Transparent, data-driven real estate agent discovery

### Visual Language
- **Style:** Modern brutalism with friendly touches
- **Origin:** Derived from Voqo.ai design system
- **Character:** Bold, accessible, trustworthy
- **Key Attributes:** High contrast, clear hierarchy, generous whitespace

---

## Design Tokens

### Color Palette

#### Primary Colors
```css
--primary: #26C169;        /* Voqo Green - main brand color */
--primary-dark: #126D39;   /* Hover/active states */
--primary-light: #ECF87F;  /* Lime accent - use sparingly */
```

**Tailwind Classes:**
- `bg-[#26C169]` - primary background
- `text-[#26C169]` - primary text
- `border-[#26C169]` - primary border
- `bg-[#126D39]` - dark variant
- `bg-[#ECF87F]` - light accent

#### Grayscale
```css
--white: #FFFFFF;
--black: #000000;
--gray-800: #1F2937;  /* Headings */
--gray-700: #374151;  /* Body text */
--gray-600: #4B5563;  /* Secondary text */
--gray-400: #9CA3AF;  /* Muted text */
--gray-300: #D1D5DB;  /* Borders */
--gray-200: #E5E7EB;  /* Light borders */
--gray-50: #F3F4F6;   /* Section backgrounds */
```

**Tailwind Classes:**
- Standard gray scale: `gray-50`, `gray-200`, `gray-300`, `gray-400`, `gray-600`, `gray-700`, `gray-800`
- Text hierarchy: `text-gray-800` (headings), `text-gray-700` (body), `text-gray-600` (secondary)

#### Semantic Colors
```css
--success: #26C169;  /* Same as primary */
--warning: #F59E0B;  /* Amber */
--error: #EF4444;    /* Red */
--info: #3B82F6;     /* Blue */
```

**Tailwind Classes:**
- Success: `text-green-600`, `bg-green-100`, `border-green-300`
- Warning: `text-amber-600`, `bg-amber-100`, `border-amber-300`
- Error: `text-red-600`, `bg-red-100`, `border-red-300`
- Info: `text-blue-600`, `bg-blue-100`, `border-blue-300`

#### Rating Colors
```css
--rating-5: #26C169;  /* 5 stars - Excellent */
--rating-4: #84CC16;  /* 4 stars - Very Good */
--rating-3: #F59E0B;  /* 3 stars - Good */
--rating-2: #F97316;  /* 2 stars - Fair */
--rating-1: #EF4444;  /* 1 star - Poor */
```

**Usage:**
- Apply dynamically based on average rating
- Use for star icons, rating badges, and stat highlights

---

### Typography

#### Font Families
```css
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Inter', sans-serif;
--font-accent: 'Fraunces', serif;
```

**Tailwind Config:**
```js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  heading: ['Montserrat', 'sans-serif'],
  accent: ['Fraunces', 'serif'],
}
```

**Implementation:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Inter:wght@400;500;600;700&family=Fraunces:wght@400;600&display=swap" rel="stylesheet">
```

#### Font Scale

| Token | Size | Weight | Line Height | Tailwind Class | Use Case |
|-------|------|--------|-------------|----------------|----------|
| Display | 48px / 3rem | 900 | 1.2 | `text-5xl font-black font-heading leading-tight` | Hero headings |
| H1 | 36px / 2.25rem | 700 | 1.2 | `text-4xl font-bold font-heading leading-tight` | Page titles |
| H2 | 30px / 1.875rem | 700 | 1.2 | `text-3xl font-bold font-heading leading-tight` | Section headings |
| H3 | 24px / 1.5rem | 600 | 1.4 | `text-2xl font-semibold font-heading leading-snug` | Card titles |
| H4 | 20px / 1.25rem | 600 | 1.4 | `text-xl font-semibold font-heading leading-snug` | Subsection titles |
| Body Large | 18px / 1.125rem | 400 | 1.6 | `text-lg font-normal leading-relaxed` | Lead paragraphs |
| Body | 16px / 1rem | 400 | 1.6 | `text-base font-normal leading-relaxed` | Standard text |
| Body Small | 14px / 0.875rem | 400 | 1.6 | `text-sm font-normal leading-relaxed` | Captions, metadata |
| Label | 12px / 0.75rem | 500 | 1.4 | `text-xs font-medium uppercase tracking-wider leading-snug` | Badges, tags |

#### Typography Utilities

**Headings:**
```html
<h1 class="text-4xl font-bold font-heading leading-tight text-gray-800">
  Page Title
</h1>

<h2 class="text-3xl font-bold font-heading leading-tight text-gray-800">
  Section Heading
</h2>

<h3 class="text-2xl font-semibold font-heading leading-snug text-gray-800">
  Card Title
</h3>
```

**Body Text:**
```html
<p class="text-lg font-normal leading-relaxed text-gray-700">
  Lead paragraph with emphasis
</p>

<p class="text-base font-normal leading-relaxed text-gray-700">
  Standard paragraph text
</p>

<span class="text-sm font-normal leading-relaxed text-gray-600">
  Supporting metadata
</span>
```

**Special Text:**
```html
<span class="font-accent text-2xl font-semibold">
  Decorative accent text
</span>
```

---

### Spacing System

**Base Unit:** 4px

| Token | Value | Tailwind | Common Use |
|-------|-------|----------|------------|
| xs | 4px | `1` | Icon gaps, tight spacing |
| sm | 8px | `2` | Button padding, compact layouts |
| md | 12px | `3` | Form field spacing |
| base | 16px | `4` | Default spacing |
| lg | 24px | `6` | Card padding |
| xl | 32px | `8` | Component gaps |
| 2xl | 48px | `12` | Section spacing |
| 3xl | 64px | `16` | Large section padding |
| 4xl | 96px | `24` | Hero spacing |

**Common Patterns:**
```html
<!-- Card padding -->
<div class="p-6">...</div>

<!-- Section spacing -->
<section class="py-16">...</section>

<!-- Stack spacing -->
<div class="space-y-4">...</div>

<!-- Grid gaps -->
<div class="grid gap-6">...</div>
```

**Container:**
```html
<div class="max-w-7xl mx-auto px-4 md:px-8">
  <!-- Content -->
</div>
```

---

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;     /* Default */
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-full: 9999px;
```

**Tailwind Classes:**
- `rounded-sm` - 4px (tight corners)
- `rounded-md` - 6px (standard buttons)
- `rounded-lg` - 8px (cards, default)
- `rounded-xl` - 12px (featured cards)
- `rounded-2xl` - 16px (hero sections)
- `rounded-full` - Pills, avatars, circular buttons

---

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-brand: 0 10px 15px rgba(38,193,105,0.35);
--shadow-brutalist: 4px 4px 0px rgba(0,0,0,1);
```

**Tailwind Classes:**
- `shadow-sm` - Subtle elevation
- `shadow-md` - Default card shadow
- `shadow-lg` - Hover state, dropdowns
- `shadow-[0_10px_15px_rgba(38,193,105,0.35)]` - Brand glow (custom)
- `shadow-[4px_4px_0px_rgba(0,0,0,1)]` - Brutalist offset (custom)

**Hover Patterns:**
```html
<div class="shadow-sm hover:shadow-lg transition-shadow duration-300">
  Card with lift effect
</div>
```

---

### Borders

**Default (Brutalist):**
```css
border: 2px solid #000000;
```
**Tailwind:** `border-2 border-black`

**Subtle:**
```css
border: 1px solid #E5E7EB;
```
**Tailwind:** `border border-gray-200`

**Focus State:**
```css
border: 2px solid #26C169;
```
**Tailwind:** `focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20`

---

## Components

### Buttons

#### Primary Button
**Use:** Main CTAs, form submissions

```html
<button class="
  bg-[#26C169] text-white
  border-[3px] border-black
  rounded-md
  px-4 py-2
  font-semibold
  hover:bg-[#126D39]
  active:scale-95
  transition-all duration-300
  shadow-sm hover:shadow-md
">
  Primary Action
</button>
```

#### Secondary Button
**Use:** Alternative actions, cancel buttons

```html
<button class="
  bg-white text-black
  border-[3px] border-black
  rounded-md
  px-4 py-2
  font-semibold
  hover:bg-[#26C169] hover:text-white
  active:scale-95
  transition-all duration-300
">
  Secondary Action
</button>
```

#### Ghost Button
**Use:** Tertiary actions, link-style buttons

```html
<button class="
  bg-transparent text-gray-700
  rounded-md
  px-4 py-2
  font-medium
  hover:bg-gray-100
  active:scale-95
  transition-all duration-300
">
  Ghost Action
</button>
```

#### Destructive Button
**Use:** Delete, remove actions

```html
<button class="
  bg-red-500 text-white
  border-[3px] border-black
  rounded-md
  px-4 py-2
  font-semibold
  hover:bg-red-600
  active:scale-95
  transition-all duration-300
">
  Delete
</button>
```

#### Button Sizes

**Small:**
```html
<button class="h-8 px-3 text-sm">Small Button</button>
```

**Medium (default):**
```html
<button class="h-10 px-4 text-base">Medium Button</button>
```

**Large:**
```html
<button class="h-12 px-6 text-lg">Large Button</button>
```

#### Button with Icon

```html
<button class="flex items-center gap-2 ...">
  <Search className="w-4 h-4" />
  <span>Search</span>
</button>

<!-- Icon only -->
<button class="w-10 h-10 flex items-center justify-center ...">
  <Search className="w-5 h-5" />
</button>
```

#### Loading State

```html
<button disabled class="opacity-50 cursor-not-allowed ...">
  <Loader2 className="w-4 h-4 animate-spin mr-2" />
  Loading...
</button>
```

---

### Cards

#### Standard Card
**Use:** Generic content containers

```html
<div class="
  bg-white
  border-2 border-black
  rounded-lg
  p-6
  shadow-sm hover:shadow-lg
  hover:-translate-y-1
  transition-all duration-300
">
  <h3 class="text-2xl font-semibold font-heading leading-snug text-gray-800 mb-2">
    Card Title
  </h3>
  <p class="text-base font-normal leading-relaxed text-gray-700">
    Card content goes here.
  </p>
</div>
```

#### Agent Card (Listing View)
**Use:** Agent directory listings

```html
<article class="
  bg-white
  border-2 border-black
  rounded-lg
  p-6
  shadow-sm hover:shadow-lg
  hover:-translate-y-1
  transition-all duration-300
">
  <div class="flex items-start gap-4 mb-4">
    <!-- Agent Photo -->
    <img
      src="/agent-photo.jpg"
      alt="Agent Name"
      class="w-20 h-20 rounded-full border-2 border-black object-cover"
    />

    <div class="flex-1">
      <!-- Agent Name -->
      <h3 class="text-xl font-semibold font-heading leading-snug text-gray-800">
        Agent Name
      </h3>

      <!-- Agency -->
      <p class="text-sm font-normal leading-relaxed text-gray-600">
        Ray White Melbourne
      </p>

      <!-- Rating -->
      <div class="flex items-center gap-1 mt-1">
        <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
        <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
        <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
        <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
        <Star className="w-4 h-4 fill-gray-300 text-gray-300" />
        <span class="text-sm font-normal leading-relaxed text-gray-700 ml-1">
          4.2 (24)
        </span>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-3 gap-3 mb-4">
    <div class="flex items-center gap-2 text-sm">
      <Home className="w-4 h-4 text-gray-400" />
      <span class="text-gray-700">127</span>
    </div>
    <div class="flex items-center gap-2 text-sm">
      <TrendingUp className="w-4 h-4 text-gray-400" />
      <span class="text-gray-700">$1.2M</span>
    </div>
    <div class="flex items-center gap-2 text-sm">
      <MapPin className="w-4 h-4 text-gray-400" />
      <span class="text-gray-700">VIC</span>
    </div>
  </div>

  <!-- CTA -->
  <button class="
    w-full
    bg-white text-black
    border-[3px] border-black
    rounded-md
    px-4 py-2
    font-semibold
    hover:bg-[#26C169] hover:text-white
    active:scale-95
    transition-all duration-300
  ">
    View Profile
  </button>
</article>
```

#### Stat Card
**Use:** Key metrics display

```html
<div class="
  bg-white
  border-2 border-black
  rounded-lg
  p-6
  shadow-sm
">
  <div class="flex items-center justify-between mb-2">
    <BarChart className="w-8 h-8 text-gray-400" />
  </div>
  <div class="text-4xl font-bold font-heading leading-tight text-[#26C169] mb-1">
    12,847
  </div>
  <div class="text-sm font-normal leading-relaxed text-gray-600">
    Active Agents
  </div>
</div>
```

#### Review Card
**Use:** Agent reviews

```html
<div class="
  bg-white
  border-2 border-black
  rounded-lg
  p-6
  shadow-sm
">
  <!-- Header -->
  <div class="flex items-start justify-between mb-3">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
        JD
      </div>
      <div>
        <div class="font-semibold text-gray-800">John D.</div>
        <div class="text-sm text-gray-600">Verified Buyer</div>
      </div>
    </div>
    <span class="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-medium uppercase tracking-wider">
      Buyer
    </span>
  </div>

  <!-- Rating -->
  <div class="flex items-center gap-1 mb-3">
    <Star className="w-5 h-5 fill-[#26C169] text-[#26C169]" />
    <Star className="w-5 h-5 fill-[#26C169] text-[#26C169]" />
    <Star className="w-5 h-5 fill-[#26C169] text-[#26C169]" />
    <Star className="w-5 h-5 fill-[#26C169] text-[#26C169]" />
    <Star className="w-5 h-5 fill-[#26C169] text-[#26C169]" />
  </div>

  <!-- Review Text -->
  <p class="text-base font-normal leading-relaxed text-gray-700 mb-3">
    Excellent service from start to finish. Highly recommend!
  </p>

  <!-- Metadata -->
  <div class="flex items-center gap-4 text-sm text-gray-600">
    <span>Sold in Northcote</span>
    <span>•</span>
    <span>Jan 2026</span>
  </div>
</div>
```

---

### Navigation

#### Header (Desktop)

```html
<header class="sticky top-0 z-50 bg-white border-b-2 border-black h-16">
  <div class="max-w-7xl mx-auto px-4 md:px-8 h-full">
    <div class="flex items-center justify-between h-full">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <img src="/logo.svg" alt="AgentIndex" class="h-8" />
        <span class="font-heading font-bold text-xl text-gray-800">
          AgentIndex
        </span>
      </a>

      <!-- Search (Center) -->
      <div class="flex-1 max-w-md mx-8">
        <div class="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search agents, suburbs, agencies..."
            class="
              w-full h-10 pl-10 pr-4
              border-2 border-black rounded-lg
              focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
              text-base
            "
          />
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex items-center gap-6">
        <a href="/agents" class="text-base font-medium text-gray-700 hover:text-[#26C169] transition-colors">
          Agents
        </a>
        <a href="/suburbs" class="text-base font-medium text-gray-700 hover:text-[#26C169] transition-colors">
          Suburbs
        </a>
        <a href="/about" class="text-base font-medium text-gray-700 hover:text-[#26C169] transition-colors">
          About
        </a>
        <button class="
          bg-[#26C169] text-white
          border-[3px] border-black
          rounded-md
          px-4 py-2
          font-semibold
          hover:bg-[#126D39]
          transition-all duration-300
        ">
          Add Agent
        </button>
      </nav>
    </div>
  </div>
</header>
```

#### Header (Mobile)

```html
<header class="sticky top-0 z-50 bg-white border-b-2 border-black h-14">
  <div class="px-4 h-full">
    <div class="flex items-center justify-between h-full">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <img src="/logo.svg" alt="AgentIndex" class="h-7" />
        <span class="font-heading font-bold text-lg text-gray-800">
          AgentIndex
        </span>
      </a>

      <!-- Mobile Actions -->
      <div class="flex items-center gap-2">
        <button class="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button class="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</header>
```

#### Mobile Navigation Panel

```html
<div class="fixed inset-0 z-50 bg-white">
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b-2 border-black">
      <span class="font-heading font-bold text-lg text-gray-800">Menu</span>
      <button class="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>

    <!-- Links -->
    <nav class="flex-1 overflow-y-auto p-4">
      <div class="space-y-2">
        <a href="/agents" class="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          Agents
        </a>
        <a href="/suburbs" class="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          Suburbs
        </a>
        <a href="/about" class="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          About
        </a>
      </div>

      <div class="mt-6">
        <button class="
          w-full
          bg-[#26C169] text-white
          border-[3px] border-black
          rounded-md
          px-4 py-3
          text-lg
          font-semibold
          hover:bg-[#126D39]
          active:scale-95
          transition-all duration-300
        ">
          Add Agent
        </button>
      </div>
    </nav>
  </div>
</div>
```

---

### Search Components

#### Search Bar (Standard)

```html
<div class="relative w-full max-w-xl">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input
    type="search"
    placeholder="Search agents, suburbs, agencies..."
    class="
      w-full h-12 pl-10 pr-4
      border-2 border-black rounded-lg
      focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
      text-base
    "
  />
</div>
```

#### Search with Autocomplete

```html
<div class="relative w-full max-w-xl">
  <!-- Input -->
  <div class="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="search"
      placeholder="Search agents, suburbs, agencies..."
      class="
        w-full h-12 pl-10 pr-4
        border-2 border-black rounded-lg
        focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
        text-base
      "
    />
  </div>

  <!-- Dropdown -->
  <div class="
    absolute top-full left-0 right-0 mt-2
    bg-white border-2 border-black rounded-lg shadow-lg
    max-h-80 overflow-y-auto
  ">
    <!-- Section -->
    <div class="p-2">
      <div class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-600">
        Agents
      </div>

      <!-- Item -->
      <a href="/agents/john-smith" class="
        flex items-center gap-3 px-3 py-2
        hover:bg-gray-50 rounded-md
        transition-colors
      ">
        <User className="w-5 h-5 text-gray-400" />
        <div class="flex-1">
          <div class="font-medium text-gray-800">John Smith</div>
          <div class="text-sm text-gray-600">Ray White Melbourne</div>
        </div>
      </a>

      <!-- More items... -->
    </div>

    <!-- Section -->
    <div class="p-2 border-t border-gray-200">
      <div class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-600">
        Suburbs
      </div>

      <!-- Item -->
      <a href="/suburbs/northcote" class="
        flex items-center gap-3 px-3 py-2
        hover:bg-gray-50 rounded-md
        transition-colors
      ">
        <MapPin className="w-5 h-5 text-gray-400" />
        <div class="flex-1">
          <div class="font-medium text-gray-800">Northcote</div>
          <div class="text-sm text-gray-600">VIC 3070</div>
        </div>
      </a>
    </div>
  </div>
</div>
```

#### Filter Bar

```html
<div class="flex flex-wrap items-center gap-3">
  <!-- Dropdown Filter -->
  <select class="
    h-10 px-3
    border-2 border-black rounded-md
    text-sm font-medium
    focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
  ">
    <option>All States</option>
    <option>NSW</option>
    <option>VIC</option>
    <option>QLD</option>
  </select>

  <!-- Toggle Filter -->
  <button class="
    h-10 px-4
    bg-white text-black
    border-2 border-black
    rounded-md
    text-sm font-medium
    hover:bg-gray-100
    transition-colors
  ">
    Top Rated Only
  </button>

  <!-- Active Filter Badge -->
  <div class="flex items-center gap-2 px-3 h-10 bg-[#26C169] text-white border-2 border-black rounded-md">
    <span class="text-sm font-medium">VIC</span>
    <button class="hover:opacity-70">
      <X className="w-4 h-4" />
    </button>
  </div>

  <!-- Clear All -->
  <button class="text-sm font-medium text-gray-600 hover:text-gray-800">
    Clear all
  </button>
</div>
```

---

### Voice Agent UI

#### Floating Voice Button

```html
<button class="
  fixed bottom-6 right-6
  w-14 h-14
  bg-[#26C169] text-white
  border-[3px] border-black
  rounded-full
  shadow-lg hover:shadow-xl
  hover:scale-110
  active:scale-95
  transition-all duration-300
  flex items-center justify-center
  animate-pulse
">
  <Mic className="w-6 h-6" />
</button>
```

#### Voice Button with Badge

```html
<button class="
  fixed bottom-6 right-6
  w-14 h-14
  bg-[#26C169] text-white
  border-[3px] border-black
  rounded-full
  shadow-lg hover:shadow-xl
  hover:scale-110
  active:scale-95
  transition-all duration-300
  flex items-center justify-center
  relative
">
  <Mic className="w-6 h-6" />

  <!-- Badge -->
  <div class="
    absolute -top-2 -right-2
    px-2 py-0.5
    bg-black text-white
    border-2 border-white
    rounded-full
    text-xs font-medium
    whitespace-nowrap
  ">
    Navigator
  </div>
</button>
```

#### Voice Panel (Mobile - Bottom Sheet)

```html
<div class="
  fixed inset-x-0 bottom-0
  bg-white border-t-2 border-black
  rounded-t-2xl
  p-6
  shadow-[0_-10px_25px_rgba(0,0,0,0.1)]
">
  <!-- Handle -->
  <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-[#26C169] rounded-full flex items-center justify-center animate-pulse">
        <Mic className="w-5 h-5 text-white" />
      </div>
      <div>
        <div class="font-semibold text-gray-800">Voice Navigator</div>
        <div class="text-sm text-gray-600">Listening...</div>
      </div>
    </div>
    <button class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
      <X className="w-5 h-5" />
    </button>
  </div>

  <!-- Visualizer -->
  <div class="flex items-center justify-center gap-1 h-16 mb-4">
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style="height: 20px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.1s]" style="height: 35px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" style="height: 50px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.3s]" style="height: 35px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.4s]" style="height: 20px;"></div>
  </div>

  <!-- Status -->
  <p class="text-center text-gray-600 text-sm">
    "Find me an agent in Northcote..."
  </p>
</div>
```

#### Voice Panel (Desktop - Popover)

```html
<div class="
  fixed bottom-24 right-6
  w-80
  bg-white border-2 border-black
  rounded-lg
  p-6
  shadow-lg
">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-[#26C169] rounded-full flex items-center justify-center animate-pulse">
        <Mic className="w-5 h-5 text-white" />
      </div>
      <div>
        <div class="font-semibold text-gray-800">John's Assistant</div>
        <div class="text-sm text-gray-600">Speaking...</div>
      </div>
    </div>
    <button class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
      <X className="w-5 h-5" />
    </button>
  </div>

  <!-- Visualizer -->
  <div class="flex items-center justify-center gap-1 h-12 mb-4 bg-gray-50 rounded-md">
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style="height: 15px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.1s]" style="height: 25px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" style="height: 35px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.3s]" style="height: 25px;"></div>
    <div class="w-1 bg-[#26C169] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.4s]" style="height: 15px;"></div>
  </div>

  <!-- Transcript -->
  <div class="space-y-2 text-sm">
    <div class="p-2 bg-gray-50 rounded text-gray-600">
      You: "What's your commission rate?"
    </div>
    <div class="p-2 bg-[#ECF87F] rounded text-gray-800">
      Agent: "My standard commission is 2.2%..."
    </div>
  </div>
</div>
```

---

### Badges and Tags

#### License Status Badge

```html
<!-- Active -->
<span class="
  inline-flex items-center gap-1
  px-3 py-1
  bg-green-100 text-green-800
  border border-green-300
  rounded-full
  text-xs font-medium uppercase tracking-wider
">
  <CheckCircle className="w-3 h-3" />
  Active
</span>

<!-- Suspended -->
<span class="
  inline-flex items-center gap-1
  px-3 py-1
  bg-red-100 text-red-800
  border border-red-300
  rounded-full
  text-xs font-medium uppercase tracking-wider
">
  <AlertCircle className="w-3 h-3" />
  Suspended
</span>

<!-- Unknown -->
<span class="
  inline-flex items-center gap-1
  px-3 py-1
  bg-gray-100 text-gray-600
  border border-gray-300
  rounded-full
  text-xs font-medium uppercase tracking-wider
">
  <HelpCircle className="w-3 h-3" />
  Unknown
</span>
```

#### Property Type Tag

```html
<span class="
  inline-block
  px-3 py-1
  bg-gray-100 text-gray-700
  rounded-full
  text-sm font-medium
">
  House
</span>

<span class="
  inline-block
  px-3 py-1
  bg-gray-100 text-gray-700
  rounded-full
  text-sm font-medium
">
  Apartment
</span>
```

#### Reviewer Type Badge

```html
<!-- Buyer -->
<span class="
  inline-block
  px-3 py-1
  bg-blue-100 text-blue-800
  border border-blue-300
  rounded-full
  text-xs font-medium uppercase tracking-wider
">
  Buyer
</span>

<!-- Seller -->
<span class="
  inline-block
  px-3 py-1
  bg-purple-100 text-purple-800
  border border-purple-300
  rounded-full
  text-xs font-medium uppercase tracking-wider
">
  Seller
</span>
```

#### Sale Method Badge

```html
<!-- Auction -->
<span class="
  inline-block
  px-3 py-1
  bg-orange-100 text-orange-800
  border border-orange-300
  rounded-full
  text-xs font-medium uppercase tracking-wider
">
  Auction
</span>

<!-- Private Treaty -->
<span class="
  inline-block
  px-3 py-1
  bg-blue-100 text-blue-800
  border border-blue-300
  rounded-full
  text-xs font-medium uppercase tracking-wider
">
  Private Treaty
</span>
```

#### Verification Badge

```html
<span class="
  inline-flex items-center gap-1
  px-2 py-0.5
  bg-[#26C169] text-white
  rounded-full
  text-xs font-medium
">
  <CheckCircle className="w-3 h-3" />
  Verified
</span>
```

---

### Rating Display

#### Star Rating (Large)

```html
<div class="flex items-center gap-1">
  <Star className="w-6 h-6 fill-[#26C169] text-[#26C169]" />
  <Star className="w-6 h-6 fill-[#26C169] text-[#26C169]" />
  <Star className="w-6 h-6 fill-[#26C169] text-[#26C169]" />
  <Star className="w-6 h-6 fill-[#26C169] text-[#26C169]" />
  <Star className="w-6 h-6 fill-gray-300 text-gray-300" />
  <span class="ml-2 text-lg font-semibold text-gray-800">4.0</span>
  <span class="text-sm text-gray-600">(127 reviews)</span>
</div>
```

#### Star Rating (Small)

```html
<div class="flex items-center gap-1">
  <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
  <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
  <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
  <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
  <Star className="w-4 h-4 fill-gray-300 text-gray-300" />
  <span class="ml-1 text-sm text-gray-700">4.0 (127)</span>
</div>
```

#### Rating Distribution

```html
<div class="space-y-2">
  <!-- 5 stars -->
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium text-gray-700 w-12">5 star</span>
    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div class="h-full bg-[#26C169]" style="width: 65%;"></div>
    </div>
    <span class="text-sm text-gray-600 w-8 text-right">82</span>
  </div>

  <!-- 4 stars -->
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium text-gray-700 w-12">4 star</span>
    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div class="h-full bg-[#84CC16]" style="width: 20%;"></div>
    </div>
    <span class="text-sm text-gray-600 w-8 text-right">25</span>
  </div>

  <!-- 3 stars -->
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium text-gray-700 w-12">3 star</span>
    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div class="h-full bg-[#F59E0B]" style="width: 10%;"></div>
    </div>
    <span class="text-sm text-gray-600 w-8 text-right">13</span>
  </div>

  <!-- 2 stars -->
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium text-gray-700 w-12">2 star</span>
    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div class="h-full bg-[#F97316]" style="width: 3%;"></div>
    </div>
    <span class="text-sm text-gray-600 w-8 text-right">4</span>
  </div>

  <!-- 1 star -->
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium text-gray-700 w-12">1 star</span>
    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div class="h-full bg-[#EF4444]" style="width: 2%;"></div>
    </div>
    <span class="text-sm text-gray-600 w-8 text-right">3</span>
  </div>
</div>
```

---

### Tables

#### Standard Table

```html
<div class="overflow-x-auto border-2 border-black rounded-lg">
  <table class="w-full">
    <thead class="bg-gray-100 border-b-2 border-black">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Agent Name
        </th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Agency
        </th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Rating
        </th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Sales
        </th>
        <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 font-medium text-gray-800">John Smith</td>
        <td class="px-4 py-3 text-gray-700">Ray White Melbourne</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
            <span class="text-gray-700">4.5</span>
          </div>
        </td>
        <td class="px-4 py-3 text-gray-700">127</td>
        <td class="px-4 py-3 text-right">
          <button class="text-[#26C169] hover:text-[#126D39] font-medium">
            View Profile
          </button>
        </td>
      </tr>
      <tr class="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
        <td class="px-4 py-3 font-medium text-gray-800">Sarah Jones</td>
        <td class="px-4 py-3 text-gray-700">LJ Hooker Richmond</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#26C169] text-[#26C169]" />
            <span class="text-gray-700">4.8</span>
          </div>
        </td>
        <td class="px-4 py-3 text-gray-700">89</td>
        <td class="px-4 py-3 text-right">
          <button class="text-[#26C169] hover:text-[#126D39] font-medium">
            View Profile
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Pagination

```html
<nav class="flex items-center justify-between">
  <!-- Info -->
  <div class="text-sm text-gray-600">
    Showing <span class="font-medium">1</span> to <span class="font-medium">20</span> of <span class="font-medium">487</span> results
  </div>

  <!-- Pages -->
  <div class="flex items-center gap-2">
    <!-- Previous -->
    <button class="
      w-9 h-9 flex items-center justify-center
      border-2 border-black rounded-md
      text-gray-700
      hover:bg-gray-100
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors
    " disabled>
      <ChevronLeft className="w-5 h-5" />
    </button>

    <!-- Page 1 (active) -->
    <button class="
      w-9 h-9 flex items-center justify-center
      bg-[#26C169] text-white
      border-2 border-black rounded-md
      font-semibold
    ">
      1
    </button>

    <!-- Page 2 -->
    <button class="
      w-9 h-9 flex items-center justify-center
      bg-white text-gray-700
      border-2 border-black rounded-md
      hover:bg-gray-100
      transition-colors
    ">
      2
    </button>

    <!-- Page 3 -->
    <button class="
      w-9 h-9 flex items-center justify-center
      bg-white text-gray-700
      border-2 border-black rounded-md
      hover:bg-gray-100
      transition-colors
    ">
      3
    </button>

    <!-- Ellipsis -->
    <span class="w-9 h-9 flex items-center justify-center text-gray-600">
      ...
    </span>

    <!-- Last page -->
    <button class="
      w-9 h-9 flex items-center justify-center
      bg-white text-gray-700
      border-2 border-black rounded-md
      hover:bg-gray-100
      transition-colors
    ">
      25
    </button>

    <!-- Next -->
    <button class="
      w-9 h-9 flex items-center justify-center
      border-2 border-black rounded-md
      text-gray-700
      hover:bg-gray-100
      transition-colors
    ">
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
</nav>
```

---

### Form Elements

#### Text Input

```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    placeholder="you@example.com"
    class="
      w-full h-10 px-3
      border-2 border-black rounded-md
      focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
      text-base
      placeholder:text-gray-400
    "
  />
  <p class="text-sm text-gray-600">We'll never share your email.</p>
</div>
```

#### Text Input (Error State)

```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    placeholder="you@example.com"
    class="
      w-full h-10 px-3
      border-2 border-red-500 rounded-md
      focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20
      text-base
      placeholder:text-gray-400
    "
  />
  <p class="text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    Please enter a valid email address.
  </p>
</div>
```

#### Textarea

```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700">
    Your Review
  </label>
  <textarea
    rows="4"
    placeholder="Share your experience..."
    class="
      w-full px-3 py-2
      border-2 border-black rounded-md
      focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
      text-base
      placeholder:text-gray-400
      resize-none
    "
  ></textarea>
  <p class="text-sm text-gray-600">Minimum 50 characters.</p>
</div>
```

#### Select Dropdown

```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700">
    State/Territory
  </label>
  <select class="
    w-full h-10 px-3
    border-2 border-black rounded-md
    focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
    text-base
  ">
    <option>Select a state...</option>
    <option>New South Wales</option>
    <option>Victoria</option>
    <option>Queensland</option>
    <option>South Australia</option>
    <option>Western Australia</option>
    <option>Tasmania</option>
    <option>Northern Territory</option>
    <option>Australian Capital Territory</option>
  </select>
</div>
```

#### Checkbox

```html
<label class="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    class="
      w-5 h-5
      border-2 border-black rounded
      text-[#26C169]
      focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
    "
  />
  <span class="text-base text-gray-700">
    I agree to the terms and conditions
  </span>
</label>
```

#### Radio Button

```html
<div class="space-y-3">
  <div class="text-sm font-medium text-gray-700 mb-2">Transaction Type</div>

  <label class="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="transaction"
      value="buyer"
      class="
        w-5 h-5
        border-2 border-black
        text-[#26C169]
        focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
      "
    />
    <span class="text-base text-gray-700">Buyer</span>
  </label>

  <label class="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="transaction"
      value="seller"
      class="
        w-5 h-5
        border-2 border-black
        text-[#26C169]
        focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
      "
    />
    <span class="text-base text-gray-700">Seller</span>
  </label>
</div>
```

---

### Loading States

#### Spinner

```html
<div class="flex items-center justify-center">
  <Loader2 className="w-8 h-8 text-[#26C169] animate-spin" />
</div>
```

#### Skeleton Card

```html
<div class="bg-white border-2 border-black rounded-lg p-6 animate-pulse">
  <div class="flex items-start gap-4 mb-4">
    <div class="w-20 h-20 bg-gray-200 rounded-full"></div>
    <div class="flex-1 space-y-2">
      <div class="h-5 bg-gray-200 rounded w-1/2"></div>
      <div class="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
  <div class="space-y-2">
    <div class="h-4 bg-gray-200 rounded"></div>
    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
</div>
```

#### Progress Bar

```html
<div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div class="h-full bg-[#26C169] animate-pulse" style="width: 65%;"></div>
</div>
```

---

## Layout Patterns

### Hero Section

```html
<section class="py-16 md:py-24 bg-gradient-to-br from-[#ECF87F] to-white relative overflow-hidden">
  <!-- Background pattern -->
  <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, rgba(0,0,0,0.2) 2px, transparent 2px); background-size: 30px 30px;"></div>

  <div class="max-w-7xl mx-auto px-4 md:px-8 relative">
    <div class="max-w-3xl">
      <h1 class="text-5xl font-black font-heading leading-tight text-gray-800 mb-6">
        Find Australia's Top Real Estate Agents
      </h1>
      <p class="text-lg font-normal leading-relaxed text-gray-700 mb-8">
        Compare verified reviews, sales data, and performance metrics across 12,000+ licensed agents nationwide.
      </p>

      <!-- Search -->
      <div class="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          placeholder="Search agents, suburbs, agencies..."
          class="
            w-full h-12 pl-10 pr-4
            border-2 border-black rounded-lg
            focus:border-[#26C169] focus:ring-2 focus:ring-[#26C169] focus:ring-opacity-20
            text-base
            shadow-md
          "
        />
      </div>
    </div>
  </div>
</section>
```

### Grid Layout (Agent Cards)

```html
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <h2 class="text-3xl font-bold font-heading leading-tight text-gray-800 mb-8">
      Featured Agents
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <!-- Agent cards here -->
    </div>
  </div>
</section>
```

### Two Column Layout

```html
<section class="py-16 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Sidebar -->
      <aside class="md:col-span-1">
        <div class="bg-white border-2 border-black rounded-lg p-6 sticky top-20">
          <!-- Filters -->
        </div>
      </aside>

      <!-- Main Content -->
      <main class="md:col-span-2">
        <div class="space-y-6">
          <!-- Content cards -->
        </div>
      </main>
    </div>
  </div>
</section>
```

---

## Responsive Breakpoints

```js
// Tailwind config
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Wide desktop
      '2xl': '1536px', // Ultra-wide
    }
  }
}
```

**Grid Columns by Breakpoint:**

| Breakpoint | Width | Columns | Example |
|------------|-------|---------|---------|
| Mobile | < 768px | 1 | `grid-cols-1` |
| Tablet | 768-1023px | 2 | `md:grid-cols-2` |
| Desktop | 1024-1279px | 3 | `lg:grid-cols-3` |
| Wide | ≥ 1280px | 4 | `xl:grid-cols-4` |

**Common Responsive Patterns:**

```html
<!-- Responsive text -->
<h1 class="text-3xl md:text-4xl lg:text-5xl">Heading</h1>

<!-- Responsive spacing -->
<section class="py-8 md:py-12 lg:py-16">Content</section>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  Cards
</div>

<!-- Responsive visibility -->
<div class="block md:hidden">Mobile only</div>
<div class="hidden md:block">Desktop only</div>
```

---

## Icons

**Library:** Lucide React (`lucide-react`)

**Installation:**
```bash
npm install lucide-react
```

**Usage:**
```jsx
import { Search, User, Star, MapPin, Home } from 'lucide-react';

<Search className="w-5 h-5 text-gray-400" />
```

**Icon Sizes:**

| Use Case | Size | Tailwind Class |
|----------|------|----------------|
| Inline text | 16px | `w-4 h-4` |
| Buttons | 20px | `w-5 h-5` |
| Cards | 24px | `w-6 h-6` |
| Features | 32px | `w-8 h-8` |
| Hero | 48px | `w-12 h-12` |

**Common Icons:**
- `Search` - Search bars
- `User` - Agent profiles
- `Star` - Ratings
- `MapPin` - Locations
- `Home` - Properties
- `TrendingUp` - Performance
- `Phone` - Contact
- `Mail` - Email
- `ChevronRight` - Navigation
- `Menu` - Mobile menu
- `X` - Close buttons
- `CheckCircle` - Success states
- `AlertCircle` - Warnings
- `Mic` - Voice interface
- `Loader2` - Loading states

---

## Background Patterns

### Dot Pattern

```html
<div
  class="absolute inset-0 opacity-10"
  style="
    background-image: radial-gradient(circle, rgba(0,0,0,0.2) 2px, transparent 2px);
    background-size: 30px 30px;
  "
></div>
```

**Usage:** Hero sections, feature areas (use sparingly)

### Gradient Background

```html
<div class="bg-gradient-to-br from-[#ECF87F] to-white">
  Content
</div>

<div class="bg-gradient-to-r from-[#26C169] to-[#126D39]">
  Content
</div>
```

---

## Animations

### Transition Utilities

```html
<!-- All properties -->
<div class="transition-all duration-300">Content</div>

<!-- Specific property -->
<div class="transition-colors duration-300">Content</div>
<div class="transition-transform duration-300">Content</div>
<div class="transition-shadow duration-300">Content</div>
```

### Hover Effects

**Card Lift:**
```html
<div class="hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
  Card
</div>
```

**Button Press:**
```html
<button class="active:scale-95 transition-transform duration-150">
  Button
</button>
```

**Color Change:**
```html
<a class="text-gray-700 hover:text-[#26C169] transition-colors duration-300">
  Link
</a>
```

### Loading Animations

**Pulse:**
```html
<div class="animate-pulse">
  Loading content
</div>
```

**Spin:**
```html
<Loader2 className="animate-spin" />
```

### Custom Voice Pulse Animation

```css
@keyframes voice-pulse {
  0%, 100% { height: 20%; }
  50% { height: 100%; }
}

.voice-bar {
  animation: voice-pulse 0.8s ease-in-out infinite;
}
```

```html
<div class="h-12 flex items-center gap-1">
  <div class="w-1 bg-[#26C169] rounded-full voice-bar" style="animation-delay: 0s;"></div>
  <div class="w-1 bg-[#26C169] rounded-full voice-bar" style="animation-delay: 0.1s;"></div>
  <div class="w-1 bg-[#26C169] rounded-full voice-bar" style="animation-delay: 0.2s;"></div>
  <div class="w-1 bg-[#26C169] rounded-full voice-bar" style="animation-delay: 0.3s;"></div>
  <div class="w-1 bg-[#26C169] rounded-full voice-bar" style="animation-delay: 0.4s;"></div>
</div>
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:

```html
<button class="
  focus:outline-none
  focus:ring-2
  focus:ring-[#26C169]
  focus:ring-offset-2
">
  Button
</button>

<input class="
  focus:border-[#26C169]
  focus:ring-2
  focus:ring-[#26C169]
  focus:ring-opacity-20
" />
```

### ARIA Labels

```html
<button aria-label="Search">
  <Search className="w-5 h-5" />
</button>

<nav aria-label="Main navigation">
  <!-- Links -->
</nav>
```

### Semantic HTML

Always use semantic elements:
- `<header>` for page headers
- `<nav>` for navigation
- `<main>` for main content
- `<article>` for agent cards, reviews
- `<section>` for content sections
- `<aside>` for sidebars
- `<footer>` for page footers

---

## Performance

### Image Optimization

```html
<!-- Responsive images -->
<img
  src="/agent-photo-small.jpg"
  srcset="
    /agent-photo-small.jpg 400w,
    /agent-photo-medium.jpg 800w,
    /agent-photo-large.jpg 1200w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Agent Name"
  loading="lazy"
/>
```

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Inter:wght@400;500;600;700&family=Fraunces:wght@400;600&display=swap"
  rel="stylesheet"
>
```

---

## Design Principles

1. **Clarity First**: Information hierarchy should be immediately obvious
2. **Bold but Friendly**: Strong borders and high contrast balanced with rounded corners and generous whitespace
3. **Performance**: Fast load times, optimize images, minimize animations
4. **Mobile-First**: Design for mobile, enhance for desktop
5. **Accessible**: WCAG 2.1 AA compliance minimum
6. **Consistent**: Use design tokens, avoid one-offs
7. **Trustworthy**: Verification badges, clear data sources, transparent reviews
8. **Data-Driven**: Lead with metrics and evidence

---

## File Structure

```
/components
  /ui
    button.tsx
    card.tsx
    badge.tsx
    input.tsx
    ...
  /agent
    agent-card.tsx
    agent-profile.tsx
    agent-stats.tsx
  /voice
    voice-button.tsx
    voice-panel.tsx
  /navigation
    header.tsx
    mobile-nav.tsx
  /search
    search-bar.tsx
    autocomplete.tsx

/styles
  globals.css
  tailwind.config.js

/lib
  utils.ts
  constants.ts
