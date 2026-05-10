# DESIGN.consumer.md — ProShop Consumer Design System

> **Scope:** Consumer-facing страницы — public (`/`, `/product/:id`, `/cart`, `/login`, `/register`) + auth checkout-flow (`/profile`, `/shipping`, `/payment`, `/placeorder`, `/order/:id`)
> **Companion file:** `DESIGN.admin.md` для admin-tooling (`/admin/*`) — другой design language, токены не разделяются
> **Design language:** **Tech-product gradient** — Geist + violet→indigo gradient accent, чуть playful, subtle shadows, current-day shop voice
> **Format:** shadcn/ui style vocabulary + Tailwind CSS 4 + CSS variables (design-only — Pencil prototype, не production)
> **Last updated:** 2026-05-12

---

## Назначение

Дизайн-словарь для **Pencil-прототипа consumer-секции**. Покрывает:

- `/` + `/search/:keyword` + `/page/:n` — Home / Search results (Appendix A)
- `/product/:id` — Product details (Appendix B)
- `/cart/:id?` — Cart (Appendix C)
- `/login` — Login (Appendix D)
- `/register` — Register (Appendix E)
- `/profile` — Profile (Appendix F)
- `/shipping` — Shipping address (Appendix G)
- `/payment` — Payment method (Appendix H)
- `/placeorder` — Place Order review (Appendix I)
- `/order/:id` — Order details (Appendix J)

Admin-страницы (`/admin/*`) — `DESIGN.admin.md` с tool-feel дизайном. Здесь shop-voice: больше дыхания, subtle shadows на product cards, gradient accent для hero/CTA, decorative-но-functional декор.

Production-стек: React 16 + react-bootstrap. Дизайн ниже — для Pencil-прототипа.

---

## 1. Color Palette

Базовая нейтральная — **zinc** (нейтральнее slate, лучше под gradient violet/indigo accent). Primary — **violet-600** (`#7c3aed`) для solid контекстов + **gradient violet→indigo** для decorative.

| Role             | Light mode                              | Dark mode                                | Notes                                                                  |
|------------------|-----------------------------------------|------------------------------------------|------------------------------------------------------------------------|
| `--background`   | `#fafafa` (zinc-50)                     | `#0a0a0a` (zinc-950)                     | page surface                                                          |
| `--foreground`   | `#0f172a` (slate-900)                   | `#fafafa` (zinc-50)                      | primary text, контраст ≥ 15:1 на background                            |
| `--card`         | `#ffffff`                               | `#18181b` (zinc-900)                     | product cards, modal/dialog, header nav                                |
| `--card-alt`     | `#f5f5f5` (zinc-100)                    | `#27272a` (zinc-800)                     | hover row, secondary controls, search bg на dark hero                  |
| `--primary`      | `#7c3aed` (violet-600)                  | `#a78bfa` (violet-400)                   | solid контекст: links, category labels, rating stars, active state    |
| `--primary-fg`   | `#ffffff`                               | `#0a0a0a`                                | контраст ≥ 4.5:1                                                       |
| `--muted`        | `#64748b` (slate-500)                   | `#a1a1aa` (zinc-400)                     | subtitle, metadata, placeholder                                        |
| `--accent`       | `#ede9fe` (violet-100)                  | `#2e1065` (violet-950)                   | hover tint, active card border, tab indicator bg                       |
| `--destructive`  | `#dc2626` (red-600)                     | `#ef4444` (red-500)                      | error banners, remove-from-cart, out-of-stock                          |
| `--border`       | `#e5e7eb` (gray-200)                    | `#27272a` (zinc-800)                     | card borders, input borders, divider                                   |
| `--ring`         | `#7c3aed` (violet-600)                  | `#a78bfa` (violet-400)                   | focus ring, 3px halo с opacity 15-20%                                  |

### Gradient tokens (signature decorative)

Gradient — **главная визуальная подпись** consumer-системы. Используется на больших поверхностях и primary CTA.

```css
--gradient-primary:     linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); /* violet-500 → indigo-500 */
--gradient-primary-hover: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); /* slightly darker */
--gradient-hero-bg:     linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%); /* violet-100 → blue-100 — фон hero-карточек */
--gradient-text:        same as --gradient-primary, с -webkit-background-clip:text для логотипа
```

**Когда gradient, когда solid:**
- **Gradient**: hero banners, primary CTA (Add to Cart, Checkout, Place Order), featured/sale badges, logo wordmark, cart pill в header, hover shadow на product cards (violet glow)
- **Solid `--primary`**: inline text links, category labels (eyebrow), rating stars, active filter chip, active tab underline, breadcrumb current item, focus ring
- **Никогда gradient**: для тонкого текста (≤14px) — нечитаемо, для иконок (стирается), для borders (используем `--primary` solid)

### Semantic shop colors (in-stock / sale / rating)

| Token            | Light                                  | Dark                                  | Usage                                                       |
|------------------|----------------------------------------|---------------------------------------|-------------------------------------------------------------|
| In stock         | `#10b981` (emerald-500) + bg `#d1fae5` | `#34d399` (emerald-400) + bg `#064e3b`| stock indicator dot + label                                 |
| Low stock        | `#f59e0b` (amber-500) + bg `#fef3c7`   | `#fbbf24` + bg `#451a03`              | "Only 3 left" warning                                       |
| Out of stock     | `#ef4444` (red-500) + bg `#fee2e2`     | `#f87171` + bg `#450a0a`              | "Out of stock", greyed product card opacity .55             |
| Sale / discount  | `--gradient-primary`                   | same                                  | -15%, -25%, "Save 15%" pill, strikethrough indicator        |
| Rating star      | `#7c3aed` (violet-600)                 | `#a78bfa`                             | filled stars — НЕ жёлтые, для брендовой консистентности     |
| Rating star (off)| `#e5e7eb` (gray-200)                   | `#3f3f46`                             | unfilled portion                                            |

Dark mode strategy: **CSS variables only**, `.dark` class на `<html>`, ручной toggle.

---

## 2. Typography

**Display font:** `Geist` — тот же, что в admin (consistency на уровне shared brand), но используется более выразительно: Display 48px+, generous spacing, weight 600/700.
**Fallback:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Import:** `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap`

**Mono font:** `JetBrains Mono` — для SKU, dimensions, технических данных в product meta.
**Fallback:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

### Type scale

| Step    | Size  | Line-height | Letter-spacing | Weight | Usage                                                                |
|---------|-------|-------------|----------------|--------|----------------------------------------------------------------------|
| Display | 48px  | 1.05        | -0.03em        | 700    | Home hero headline ("Discover what's new")                           |
| H1      | 32px  | 1.1         | -0.02em        | 600    | Page title (product name, "Your Cart", "Sign in")                    |
| H2      | 22px  | 1.2         | -0.015em       | 600    | Section header ("You might also like", "Order Summary")              |
| H3      | 16px  | 1.3         | -0.01em        | 600    | Card title (related-product name, checkout step label)               |
| H4      | 14px  | 1.4         | -0.005em       | 600    | Sub-section (form-group label на крупных формах)                     |
| Body    | 15px  | 1.6         | 0              | 400    | Product description, copy. Чуть крупнее admin (14px) для consumer.   |
| Body-sm | 14px  | 1.55        | 0              | 400    | Cart item names, breadcrumbs                                         |
| Small   | 13px  | 1.5         | 0              | 400    | Metadata, helper text, footer links                                  |
| Price   | 32px  | 1           | -0.02em        | 700    | Главный price treatment — tabular nums, акцентный                    |
| Price-sm| 18px  | 1.2         | -0.015em       | 700    | Price на product cards в grid                                        |
| Caption | 11px  | 1.3         | 0.05em         | 600    | UPPERCASE — eyebrow, category label, breadcrumb sep                  |
| Mono    | 13px  | 1.5         | 0              | 400    | SKU, codes, technical specs                                          |

**Tabular numerals**: все цены и количества используют `font-variant-numeric: tabular-nums` для равной ширины цифр (важно для consistency в cart items, order summary).

---

## 3. Spacing Scale

**Base unit: 4px.** Consumer-страницы чуть «воздушнее» admin — добавлен `96px` (3xl) для page-level vertical rhythm между major sections.

```
4px   — micro          (icon ↔ label gap, badge horizontal padding tight)
8px   — xs             (button vertical sm, gap between rating stars)
12px  — sm             (button vertical md, gap inside card body)
16px  — md             (card inner padding default, gap between thumbs, search-input horizontal)
20px  — md-plus        (gap between section header and content, between product card grid items)
24px  — lg             (page horizontal padding, between header → main, between cart items)
32px  — lg-plus        (между Main → Tabs, между Tabs → Description, gap в 2-col main layout)
48px  — xl             (между sections — Description → Related, Hero → Categories)
64px  — 2xl            (page top margin from header, footer top padding)
96px  — 3xl            (page-level rhythm на Home — между Hero → Categories → Featured → Footer)
```

Outer container: `max-width: 1280px` (desktop), `max-width: 100%` mobile/tablet. Horizontal padding **24px** mobile / **32px** desktop. Vertical padding top **32px** / bottom **64px**.

2-multiples из admin (6/10/14/18) **разрешены только для admin-page**-style плотности (например, profile orders table). На главных consumer-страницах — 4-multiples only.

---

## 4. Border Radius Scale

```
none: 0px      — divider lines, table dividers (если появятся)
sm:   4px      — small chips, code blocks, breadcrumb separator background
md:   8px      — buttons, inputs, search field, small product thumbnails в gallery
lg:   12px     — cards (default): product cards, related cards, info cards
xl:   14px     — hero banners, modals, drawers (slightly more pronounced)
2xl:  20px     — premium hero (Home page main banner), promo banners
full: 9999px   — pills: badges (FEATURED, sale), filter chips, cart counter, stock dot, CTA secondary on Home
```

Чуть «softer» чем admin (admin cards=10, здесь cards=12) — consumer-feel.

---

## 5. Elevation / Shadow Approach

**Philosophy:** **Subtle shadows for product cards и hover lifts.** Отличие от admin — здесь shadow help продукту «всплыть» над фоном, что важно для photo-driven shop UI. Hover shadow тонко окрашен в **violet glow** — gradient accent светится из тени.

3-level elevation:

- **Level 0 (page):** `--background` (`#fafafa` light / `#0a0a0a` dark)
- **Level 1 (card):** `--card` (`#ffffff` light / `#18181b` dark) + subtle shadow:
  ```css
  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03);
  ```
- **Level 2 (hover/active):** lift effect:
  ```css
  --shadow-card-hover: 0 8px 24px rgba(124, 58, 237, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06);
  /* violet tint = gradient accent светится */
  ```
- **Level 3 (modal/dropdown/toast):** floating
  ```css
  --shadow-popover: 0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06);
  ```
- **Level 4 (primary CTA — Add to Cart, Checkout):** branded glow
  ```css
  --shadow-cta: 0 4px 12px rgba(124, 58, 237, 0.25);
  --shadow-cta-hover: 0 8px 20px rgba(124, 58, 237, 0.35);
  ```

**Focus halo** (отдельный от shadow):
```css
--shadow-focus: 0 0 0 3px rgba(124, 58, 237, 0.15); /* outer ring на inputs/buttons */
```

NEVER: shadow-lg по умолчанию, multi-layer dark shadows. Gradient violet glow — единственный окрашенный shadow в системе.

---

## 6. Component Patterns

### Cards (base)

```
Background:    var(--card)
Padding:       16px (default) / 20px (rcard) / 24px (auth-form card)
Border radius: 12px (lg)
Border:        1px solid var(--border)
Shadow:        var(--shadow-card)
Transition:    box-shadow 200ms ease, border-color 200ms ease, transform 200ms ease
Hover (interactive): box-shadow var(--shadow-card-hover), border-color var(--primary)/30, transform translateY(-2px)
```

### Product Card (CENTRAL pattern)

```
Container:     extends base Card + cursor:pointer
Layout:        vertical — image top, body below
Image:         aspect-ratio 1:1 (square) или 4:3, bg var(--card-alt), object-fit cover
               radius 12px 12px 0 0 (top corners only), height 200px (in grid)
Image hover:   image scale(1.05), 300ms ease (out-of-flow zoom)
Badges (top-left of image):
  FEATURED:    bg #fff, color var(--primary), padding 3px 9px, radius 6px, font 9px/700, letter-spacing 0.04em UPPERCASE, префикс ★
  Sale -15%:   bg var(--gradient-primary), color #fff, padding 4px 10px, radius 9999px (pill), font 10px/700
Body:
  Padding:     14px 16px 16px
  Category:    Caption (11px/600 UPPERCASE 0.05em letter-spacing) color var(--primary) — "Cannon · Cameras"
  Name:        14px/600 Geist, color var(--foreground), line-clamp 2, margin 4px 0 8px
  Rating:      строка с stars (12px) + "4.8 · 124 reviews" (11px var(--muted)), margin-bottom 10px
  Price row:   flex justify-between
                left: Price-sm (18px/700) или с strikethrough если sale
                right: Icon-button "+" 32×32 gradient → opens quick-add OR inline "Add to Cart" link
Out-of-stock state: opacity 0.55, image grayscale 100%, badge "Out of stock" над image (red bg)
ARIA: <article role="article" aria-labelledby="product-name-N">, image alt=description
```

### Buttons

```
Sizes: sm 8px 14px / 12px font · md 12px 20px / 14px · lg 16px 28px / 15px

Primary (gradient):
  Background:  var(--gradient-primary)
  Color:       #fff
  Border:      none
  Radius:      8px (md) — кроме CTA "Add to Cart" на product page (10px lg)
  Shadow:      var(--shadow-cta)
  Hover:       var(--gradient-primary-hover) + var(--shadow-cta-hover), transition 200ms
  Active:      scale(0.97), 100ms
  Loading:     spinner replaces label content, opacity 0.85, cursor wait
  Disabled:    opacity 0.4, no shadow, cursor not-allowed

Secondary:
  Background:  var(--card)
  Color:       var(--foreground)
  Border:      1px solid var(--border)
  Radius:      8px (md)
  Hover:       bg var(--card-alt), border var(--primary)/40
  Focus:       var(--shadow-focus)

Ghost:
  Background:  transparent
  Color:       var(--muted)
  Hover:       color var(--foreground), bg var(--card-alt)

Icon-button (gradient):
  Size:        32×32 (sm) / 40×40 (md)
  Background:  var(--gradient-primary)
  Radius:      8px (md), full для round CTA на cards
  Icon:        14px (sm) / 16px (md) Lucide white
  Hover:       var(--gradient-primary-hover), scale(1.05)
```

### Inputs

```
Background:    var(--card)
Border:        1px solid var(--border)
Border radius: 8px (md)
Padding:       10px 14px (8px 36px when icon-prefixed)
Font:          14px Geist, color var(--foreground)
Placeholder:   var(--muted)
Focus:         border var(--primary), shadow var(--shadow-focus)
Disabled:      bg var(--card-alt), color var(--muted)
Error:         border var(--destructive), shadow 0 0 0 3px rgba(220,38,38,0.15)
Helper text:   12px var(--muted), margin-top 6px
Error text:    12px var(--destructive), margin-top 6px (заменяет helper при ошибке)
```

### Rating Stars

```
Container:     inline-flex, gap 2px (между звездами), align-baseline
Star:          14px Lucide "star" — выбор filled / outline / half-filled
Filled:        var(--primary) (violet-600) — НЕ yellow, для брендовой консистентности
Outline:       stroke var(--border) (gray-200), fill transparent
Half:          half-filled через clip-path 50%, fill var(--primary)
Number:        margin-left 8px, 12px Geist var(--foreground) — "4.8"
Reviews count: margin-left 6px, 12px var(--muted) — "· 124 reviews"
Interactive:   на /product reviews-секции — hover star увеличивается scale(1.15), 200ms, click фиксирует rating
ARIA:          <div role="img" aria-label="Rated 4.8 out of 5 stars, 124 reviews">
```

### Price Display

```
Layout:        inline group, gap 10px, items-baseline
Current price: Price (32px/700 Geist) tabular-nums, color var(--foreground)
               Decimals в меньшем размере: "$789" 32px + ".99" 18px (для visual hierarchy)
Strikethrough: 18px Geist 500, color var(--muted), text-decoration line-through, margin-left 10px
Sale badge:    pill 10px/700, bg var(--gradient-primary), color #fff, padding 4px 10px, radius 9999px
               margin-top 6px (под price), text "Save 15% — limited time" или "-15%"
Free shipping: inline, 11px var(--muted), gap 8px после price
Currency:      "$" prefix в основном цвете (не muted) — приоритетный visual
```

### Stock Indicator

```
Layout:        inline-flex, gap 8px, align-center, padding 8px 0
Dot:           8×8 round, status-зависимый (см. Status colors в §1)
Label:         12px/600 Geist, status-зависимый цвет
States:
  In stock:    dot emerald-500, label "In stock · ships in 1–2 business days"
  Low stock:   dot amber-500, label "Only 3 left in stock"
  Out:         dot red-500, label "Out of stock — notify me"
ARIA:          aria-label "Stock status: In stock"
```

### Quantity Selector

```
Container:     inline-flex, border 1px solid var(--border), radius 8px, overflow hidden, bg var(--card)
Buttons:       32×32 (compact) / 40×40 (lg), bg transparent, color var(--muted), font 14px/600, cursor pointer
               Hover: bg var(--card-alt), color var(--foreground)
               Active: scale(0.95)
Value display: 36-44px width, text-align center, font 14px/600 JetBrains Mono (tabular-nums)
Disabled-min:  "−" button opacity 0.4 (когда value === 1), not-allowed
Disabled-max:  "+" button opacity 0.4 (когда value === stockMax)
ARIA:          <div role="group" aria-label="Quantity">, buttons aria-label "Increase/Decrease"
```

### Cart Item Row

```
Layout:        grid-template-columns 80px 1fr 120px 100px 40px, gap 16px, align-center, padding 16px 0, border-bottom 1px var(--border)
Image:         80×80, radius 8px, object-fit cover, bg var(--card-alt)
Body:
  Name:        Body-sm (14px/500), line-clamp 1
  Brand/cat:   12px var(--muted), margin-top 4px — "Cannon · Cameras"
  Stock:       optional 11px (warning if low)
Qty:           Quantity Selector (32×32 buttons)
Price:         Price-sm (18px/700) tabular-nums, right-aligned
Remove:        Icon-button ghost (Lucide "trash-2" 16×16), color var(--muted)
               Hover: color var(--destructive), bg #fef2f2
Mobile:        stack vertical — image left, name+brand+qty+price stacked right, remove top-right
```

### Carousel

```
Container:     position relative, overflow-x auto with scroll-snap-type x mandatory
Track:         display flex, gap 16px (md), padding-left 24px (для starting align)
Item:          flex-shrink 0, width 280px (mobile auto), scroll-snap-align start
Dots:          centered below, gap 6px, margin-top 16px
  Dot:         8×8 round, bg var(--border), cursor pointer
  Active dot:  bg var(--gradient-primary), width 20px (pill stretch), border-radius 9999px
  Hover:       bg var(--muted)
Nav arrows:    optional — 36×36 round buttons, bg var(--card)+border, position absolute left/right -16px, top 50%
Autoplay:      5s interval, pause on hover
ARIA:          <div role="region" aria-label="Top products carousel", aria-live="polite">
```

### Search Box (Header)

```
Container:     flex 1, max-width 400px (desktop) / full-width (mobile), position relative
Input:         padding 8px 14px 8px 36px, font 13px, border 1px var(--border), radius 8px, bg var(--card)
Icon:          Lucide "search" 14×14, position absolute left 12px, color var(--muted)
Focus:         border var(--primary), shadow var(--shadow-focus)
Placeholder:   "Search for products, brands, categories…", color var(--muted)
Autocomplete:  optional dropdown — bg var(--card), radius 12px, shadow var(--shadow-popover), max-height 320px overflow-y, top 100% mt 4px
  Item:        padding 10px 14px, font 13px, hover bg var(--card-alt)
  Highlight:   matched text bold + color var(--primary)
  Empty:       padding 14px, font 12px var(--muted), "No results — try a different query"
ARIA:          <input role="combobox" aria-autocomplete="list" aria-controls="search-results">
```

### Checkout Steps Breadcrumb

```
Container:     flex, gap 0, align-center, justify-center, padding 24px 0, max-width 720px, mx-auto
Step:          flex align-center, gap 8px, font 12px/600 Geist
  Circle:      24×24 round, font 11px/700, border 1.5px solid
  Label:       11px UPPERCASE letter-spacing 0.06em
Connector:     flex 1, height 1.5px, bg var(--border)

States:
  Completed:   circle bg var(--gradient-primary) border same, white check icon 14×14
               label color var(--foreground), connector bg var(--gradient-primary)
  Current:     circle bg var(--card) border 2px solid var(--primary), text var(--primary)
               label color var(--primary), connector AFTER current → var(--border)
  Upcoming:    circle bg var(--card) border var(--border), text var(--muted)
               label color var(--muted)

Steps for ProShop: Cart · Shipping · Payment · Review · Order
```

### Order Summary Sidebar

```
Container:     bg var(--card), border 1px var(--border), radius 12px, padding 24px, position sticky top 24px
Title:         H3 (16px/600) margin-bottom 16px
Line items:    flex justify-between, font 14px, padding 8px 0, border-bottom 1px var(--border) (last none)
  Left:        text var(--muted) — "Items (3)", "Shipping", "Tax (estimated)"
  Right:       text var(--foreground), font 14px Geist tabular-nums
Total row:     padding-top 16px, border-top 1.5px solid var(--border)
  Left:        Body (15px/600) "Total"
  Right:       Price-sm (18px/700) tabular-nums color var(--foreground)
CTA:           full-width Primary gradient button (lg size), margin-top 20px — "Proceed to checkout" / "Place Order"
Promo input:   optional — small input + "Apply" ghost button, before total row
Trust:         12px var(--muted) below CTA, with shield icon — "Secure checkout · 30-day returns"
```

### Address Form

```
Layout:        single-column max-width 480px (in checkout) / 2-col на profile
Field groups:  
  Country:     Select (dropdown native + custom-style chevron) — full-width
  Full name:   single text input
  Address:     single text input — "Street address"
  Address 2:   single text input — "Apartment, suite, etc. (optional)"
  City + Zip:  inline group (60/40 ratio)
  State:       Select (если US) или Text (для других стран)
  Phone:       optional, type="tel"
Gap:           20px между group, 6px между label и input
Submit:        Primary gradient button md, margin-top 24px
"Save address": Checkbox под submit — "Save for future orders"
```

### Payment Method Radio (Stacked Cards)

```
Layout:        vertical stack, gap 12px
Radio card:    full-width, padding 16px, border 1.5px solid var(--border), radius 12px, cursor pointer, bg var(--card)
  Default:     border var(--border), bg var(--card)
  Hover:       border var(--primary)/40, bg var(--card-alt)/30
  Selected:    border 2px solid var(--primary), bg var(--accent)/30
Content:       flex align-center, gap 12px
  Radio circle: 18×18 round, border 1.5px var(--border), bg var(--card)
                  Selected: border var(--primary), inner dot 8×8 bg var(--gradient-primary)
  Logo:        height 24px, PayPal/Stripe/etc — provided as <img>
  Label:       Body (15px/500) — "PayPal", with helper 12px var(--muted) "You'll be redirected"
```

### Auth Form (Login/Register card)

```
Container:     max-width 400px, mx-auto, padding 48px 24px (top spacing)
Card:          extends base Card + padding 32px 28px + shadow var(--shadow-card)
Header:        H1 (32px/600) centered, margin-bottom 8px — "Sign in" / "Create account"
Subtitle:      Small (13px var(--muted)) centered, margin-bottom 24px — "Welcome back" / "Join ProShop"
Form:          vertical gap 16px between groups
Field:         label 13px/600 → input → optional helper
Forgot:        ghost-link Small inline-end под password input
Remember:      Checkbox + label "Keep me signed in"
Submit:        Primary gradient full-width lg
Divider:       optional "or" — line + text + line, margin 20px 0
Alt-link:      Small centered с link — "Don't have an account? Sign up"
Validation:    inline error per field; banner error если whole-form (wrong creds)
```

### Featured Hero Banner

```
Container:     bg var(--gradient-hero-bg), radius 20px (2xl), padding 48px 32px, overflow hidden, position relative
Layout:        2-col grid — text left (max-width 480px), image right (object position right, partially overflow для drama)
Eyebrow:       Caption color var(--primary), margin-bottom 12px — "LIMITED DROP"
Headline:      Display (48px/700) -0.03em, color var(--foreground), margin-bottom 16px
Body:          Body (15px/400) var(--muted), max-width 360px, line-height 1.6, margin-bottom 24px
CTAs:          inline-flex gap 12px
  Primary:     gradient button lg — "Shop now"
  Secondary:   ghost-link с arrow → — "Learn more"
Image:         positioned absolute right, 70% height of container, opacity 0.95
Mobile:        stack vertical, image becomes banner-bottom, padding 32px 20px
```

### Category Tile

```
Card:          extends base Card, padding 0, cursor pointer
Image:         aspect-ratio 4:3, bg var(--card-alt), radius 12px 12px 0 0 + Lucide icon 32×32 centered placeholder
Body:          padding 14px 16px
Name:          Body-sm (14px/600) — "Cameras"
Count:         Small (13px var(--muted)) — "47 products"
Hover:         box-shadow var(--shadow-card-hover), border var(--primary)/30, image scale(1.03)
```

### Tabs (product detail)

```
Container:     flex, gap 32px (lg-plus), border-bottom 1px var(--border), margin-bottom 20px
Tab:           padding 12px 0, font 14px/600 Geist, color var(--muted), cursor pointer, border-bottom 2px transparent, mb -1px
Active:        color var(--primary), border-bottom-color var(--primary)
Hover:         color var(--foreground)
Focus:         outline ring 2px var(--ring)/30%, ring-offset 4px
Count badge:   optional inline — "Reviews (124)" — number in muted
ARIA:          <div role="tablist">, tabs role="tab" aria-selected, panel role="tabpanel"
```

### Breadcrumb

```
Container:     flex align-center gap 6px, font 12px Geist, margin-bottom 24px, color var(--muted)
Item:          color var(--muted), cursor pointer (если link)
  Hover:       color var(--foreground)
Current:       color var(--foreground), font-weight 500 (никогда не link)
Separator:     "/" color var(--border), padding 0 2px, font-size 12px
ARIA:          <nav aria-label="Breadcrumb"><ol> with <li>, current item — aria-current="page"
```

### Header Nav

```
Container:     flex justify-between align-center, padding 14px 0 (compact), border-bottom 1px var(--border), sticky top 0 z 10, bg var(--card)+blur(8px), backdrop-filter blur
Logo:          18px/700 Geist tabular-nums -0.02em, gradient text via background-clip:text — "ProShop"
Search:        flex 1 max-width 400px center
Nav links:     ghost-link Small — "Categories", "Deals", "Help"
Sign in / User: ghost-button с user avatar 28×28 round (если logged in) или text "Sign in"
Cart:          gradient pill — bg var(--gradient-primary), color #fff, padding 6px 14px, radius 8px
               Icon Lucide "shopping-cart" 16×16 + label "Cart" + count badge (round, bg white opacity 25%)
Mobile:        burger menu, logo center, cart icon right; nav collapses в drawer
```

### Footer

```
Container:     bg var(--card), border-top 1px var(--border), padding 64px 24px 32px, margin-top 96px
Layout:        4-col grid (gap 32px) → 2-col tablet → 1-col mobile
Col header:    Caption (11px/600 UPPERCASE) color var(--foreground), margin-bottom 16px
Link:          Small color var(--muted), padding 4px 0, hover color var(--primary)
Bottom row:    flex justify-between, padding-top 32px, border-top 1px var(--border)
  Logo:        same as header
  Copyright:   Small var(--muted) — "© 2026 ProShop. All rights reserved."
  Social:      icon-buttons row — Lucide social icons 20×20, color var(--muted), hover var(--primary)
```

### Toast / Snackbar

```
Container:     position fixed bottom 24px right 24px, max-width 360px, z 100
Card:          bg var(--card), border 1px var(--border), radius 12px, padding 14px 16px, shadow var(--shadow-popover)
Layout:        flex align-center gap 12px
Icon:          18×18 Lucide, variant-зависимый (check-circle / alert / info)
Body:          Body-sm font, text-foreground
Close:         Lucide x 16×16, ghost-button right
Variants:      Success (emerald), Error (destructive), Info (primary), Warning (amber)
Animation:     slideUp + fadeIn 250ms ease-out on mount, fadeOut 200ms on dismiss
Auto-dismiss:  Success/Info — 4s, Error — manual
Example:       "✓ Added to cart" / "✕ Couldn't load product"
ARIA:          role="status" (success/info) or "alert" (error), aria-live polite/assertive
```

### Promo Banner (top of page)

```
Container:     full-width, padding 10px 24px, bg var(--gradient-primary), color #fff, font 13px/500, text-center
Content:       inline — "Free shipping on orders over $50 · Code: FREESHIP" + dismiss button right
Dismiss:       Lucide x 14×14, color rgba(255,255,255,0.7), hover white
Storage:       localStorage flag, не показывать повторно в течение 7 дней
```

### Image Gallery (product page)

```
Hero:          aspect-ratio 1:1 (square) or 4:3, bg var(--gradient-hero-bg) при placeholder
               radius 14px (xl), overflow hidden, position relative
Featured badge: position absolute top 14px left 14px (см. Product Card)
Zoom:          on hover desktop — cursor zoom-in, click → modal lightbox
               on click mobile — open lightbox (Lucide x close, swipe-to-dismiss)
Thumbs:        flex gap 8px, margin-top 8px
  Thumb:       54×54, radius 8px, border 1.5px solid var(--border), cursor pointer
  Active:      border-color var(--primary), bg var(--accent)
  Hover:       border-color var(--primary)/60
```

### Review Card

```
Container:     padding 16px 0, border-bottom 1px var(--border) (last none)
Header:        flex align-center gap 12px, margin-bottom 8px
  Avatar:      36×36 round, bg var(--card-alt) (initials fallback)
  Name+date:   stacked, name Body-sm 600, date Small var(--muted)
  Rating:      align right в header — Rating Stars без num
Body:          Body var(--foreground), line-height 1.6, margin-bottom 8px
Verified:      optional small badge — "✓ Verified purchase" 11px var(--primary)
Reply:         optional nested, padding-left 32px, smaller font
```

### Skeleton (loading)

```
Same shimmer как admin — но окрашен violet:
Background:    linear-gradient(90deg, var(--card-alt) 0%, #ede9fe 50%, var(--card-alt) 100%)
Animation:     shimmer 1.5s infinite linear
Shapes:        для Product card — image-skeleton 200×200 + 4 line-skeletons (cat, name×2, price)
```

### Empty / Error states

```
Empty state (cart, search results, profile orders):
  Layout:       centered, padding 64px 24px
  Icon:         64×64 round, bg var(--accent), color var(--primary), Lucide icon 32×32
  Title:        H2 (22px/600) margin 16px 0 8px
  Description: Body var(--muted) max-width 360px, margin-bottom 24px
  CTA:          Primary gradient button md — "Continue shopping" / "Browse products"

Error state:
  Same layout, icon color var(--destructive), bg #fee2e2
  Title:        "Something went wrong"
  Description:  error message + "Retry" link
```

---

## 7. Interactive States

| Element            | Default                              | Hover                                  | Focus                              | Active        | Loading                 | Disabled                |
|--------------------|--------------------------------------|----------------------------------------|------------------------------------|---------------|-------------------------|-------------------------|
| Button (primary)   | bg gradient, color #fff, shadow-cta  | gradient-hover, shadow-cta-hover       | shadow-focus (3px violet halo)     | scale(0.97)   | spinner replaces label  | opacity .4, no shadow   |
| Button (secondary) | bg card, border                       | bg card-alt, border primary/40         | shadow-focus                       | scale(0.97)   | spinner                 | opacity .4              |
| Icon button (grad) | bg gradient round                     | gradient-hover, scale(1.05)            | shadow-focus                       | scale(0.95)   | spinner                 | opacity .4              |
| Input              | border, bg card                       | border slate-300                       | border primary, shadow-focus       | —             | skeleton bar            | bg card-alt, no resize  |
| Product Card       | shadow-card                           | shadow-card-hover, image scale(1.05), border primary/30, translateY(-2px) | outline ring | scale(0.99) on tap | skeleton | opacity .55, grayscale (out of stock) |
| Rating star (interactive) | outline var(--border)         | scale(1.15), fill primary partial      | ring around star                   | filled var(--primary) | — | —                       |
| Quantity stepper btn | bg transparent, color muted        | bg card-alt, color foreground          | ring 2px primary/30                | scale(0.95)   | —                       | opacity .4 (when min/max) |
| Carousel dot       | bg border (round)                     | bg muted                               | ring 2px primary/30                | bg gradient (pill stretch) | — | —                       |
| Carousel arrow     | bg card+border, opacity .85           | opacity 1, scale(1.05)                 | shadow-focus                       | scale(0.95)   | —                       | opacity .3 (at edges)   |
| Tab                | color muted                           | color foreground                       | outline ring, ring-offset 4px      | (active variant: color primary, border-bottom primary) | — | —                       |
| Breadcrumb link    | color muted                           | color foreground, underline            | outline ring                       | —             | —                       | —                       |
| Cart pill (header) | bg gradient                           | gradient-hover, scale(1.02)            | shadow-focus                       | scale(0.97)   | —                       | —                       |
| Auth input         | border, bg card                       | border slate-300                       | border primary, shadow-focus       | —             | skeleton                | bg card-alt             |
| Radio (payment)    | border 1.5px, bg card                 | border primary/40, bg card-alt/30      | ring 2px primary                   | (selected: border 2px primary, bg accent/30) | — | opacity .4 (out of service) |
| Checkbox           | border 1.5px, bg card                 | border primary/60                      | ring 3px primary/15                | scale(0.95) on click | — | opacity .4             |
| Search input       | border, bg card                       | border slate-300                       | border primary, shadow-focus, autocomplete opens | — | spinner inside       | —                       |
| Toggle (filter on rdsults) | bg slate-300                  | brightness(1.05)                       | ring                               | —             | —                       | opacity .4              |

**Empty states**: cart, search results, profile orders, address book — каждый MUST иметь designed empty state (icon + title + description + CTA).
**Loading states**: skeleton shimmer на product cards / list items. Кнопка Add to Cart показывает inline spinner на 600-800ms имитацию (для tactile feedback при mock-mode).

---

## 8. Animation / Transitions

**Philosophy:** purposeful + tactile. Чуть длиннее admin (200ms vs 150ms base) — consumer ценит «smoothness». Никаких bouncy easings.

```
Base transition:    200ms ease            (color, background, border, opacity)
Card hover lift:    translateY(-2px) + box-shadow change, 200ms ease-out
Image zoom:         transform scale(1.05), 300ms ease (product card image, gallery hero)
Button press:       scale(0.97), 100ms (snappy tactile)
Icon button press:  scale(0.95), 100ms
Primary CTA hover:  shadow grow + slight gradient shift, 200ms
Toast slide-up:     translateY(16px → 0) + opacity 0 → 1, 250ms ease-out
Modal/drawer:       opacity + scale(0.96 → 1), 250ms ease-out
Skeleton shimmer:   1.5s infinite linear (background-position)
Carousel autoplay:  5s interval, 600ms ease-in-out на transition между slides
Tab indicator:      border-bottom-color 200ms, layout animation если используется Framer Motion-like (Pencil не покрывает)
Add to Cart success: 200ms scale(1.05) flash + toast slide-up
```

NEVER: random keyframes, bouncy `cubic-bezier(.68,-.55,.265,1.55)`, transitions > 400ms, decorative parallax.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Accessibility

### Contrast (WCAG 2.1 AA verified)

- Body на `--background` light: `#0f172a` on `#fafafa` → **15.0:1** ✓
- Body на `--background` dark: `#fafafa` on `#0a0a0a` → **20.4:1** ✓
- `--primary` (`#7c3aed`) on `#fafafa`: **5.9:1** ✓ (AA для normal text)
- `--primary-fg` (`#fff`) on `--primary` (`#7c3aed`): **4.6:1** ✓ (AA для buttons)
- Gradient buttons — для контраста используем чёрный текст на light части (если будет) или ВСЕГДА white поверх gradient (т.к. оба stop'а тёмные)
- Rating star violet vs default yellow: violet contrast on white **5.9:1** vs yellow `#fbbf24` **1.4:1** — violet СУЩЕСТВЕННО доступнее
- `--muted` on `--card`: `#64748b` on `#fff` → **4.83:1** ✓
- Stock indicator green `#10b981` на белом: 3.5:1 → используем + текст ≥13px/600 для AA

### Keyboard navigation

- ВСЕ интерактивные элементы reachable Tab: search, nav links, product cards, qty steppers, Add to Cart, cart items, checkout form fields, payment radios, submit buttons, toast close
- Focus ring: **3px solid var(--ring), offset 2px, with shadow halo** — visible на gradient backgrounds (ring contrast)
- Skip-to-content link: first focusable, скрыт пока не focused → `position absolute top -40px → top 0 on focus`, bg var(--primary), color #fff
- Esc закрывает: modal, lightbox gallery, drawer, autocomplete dropdown
- Arrow keys: carousel navigation (← →), tab navigation (← →), payment radio group (↑ ↓)
- Enter / Space: activates buttons, toggles, links
- Focus trap: modals, drawers, lightbox

### ARIA

- **Product Card**: `<article role="article" aria-labelledby="product-N-name">`
- **Rating Stars**: `<div role="img" aria-label="Rated 4.8 out of 5 stars, 124 reviews">`
- **Quantity stepper**: `<div role="group" aria-label="Quantity for Product Name">`, кнопки aria-label "Increase quantity"
- **Cart item**: `<li>` с aria-label "Cannon EOS 80D — quantity 1 — $789.99"
- **Carousel**: `<div role="region" aria-label="Top products" aria-live="polite">`, dots `role="tab"`, items `role="tabpanel"`
- **Search input**: `<input role="combobox" aria-autocomplete="list" aria-controls="search-results" aria-expanded>`
- **Toast**: `role="status"` (success/info) | `role="alert"` (error) с `aria-live="polite|assertive"`
- **Checkout breadcrumb**: `<nav aria-label="Checkout progress">`, current step `aria-current="step"`
- **Payment radio**: `<fieldset><legend>Payment method</legend>`, each radio `aria-describedby` helper
- **Stock indicator**: `aria-label="Stock status: In stock, ships in 1 to 2 days"`
- **Price strikethrough**: `<del aria-label="Original price">$929.99</del>` + sale `aria-label="Save 15%"`
- **Decorative gradients**: `aria-hidden="true"` на pure-decorative elements

### Touch targets

Min **44×44** на mobile:
- Quantity stepper buttons: visual 32×32, wrapped в 44×44 click zone (8px transparent padding)
- Carousel dots: visual 8×8, wrap 24×24 click zone
- Icon buttons (cart, search clear): 32×32 visual, 44×44 zone
- Cards (entire product card tappable): no min requirement, но Add to Cart внутри — visible CTA

---

## 10. Format Declaration

```
Component library: shadcn/ui (style vocabulary only — Pencil-prototype reference, NOT installed)
CSS framework:     Tailwind CSS 4 (CSS variables on :root and .dark — design spec, NOT production)
Token system:      CSS custom properties + gradient tokens
Icon set:          Lucide Icons (https://lucide.dev) — outline 1.5px stroke, 14 / 16 / 20 / 24 / 32 px sizes
Image placeholders:Unsplash для realistic mockup (electronics, product photography) — Pencil подтянет
Production stack:  React 16 + react-bootstrap (current — out of scope for this design phase)
```

**CSS variables setup (Pencil reference — not for runtime):**

```css
:root {
  --background:        250 250 250;   /* zinc-50    #fafafa */
  --foreground:        15 23 42;      /* slate-900  #0f172a */
  --card:              255 255 255;   /* white      #ffffff */
  --card-alt:          245 245 245;   /* zinc-100   #f5f5f5 */
  --primary:           124 58 237;    /* violet-600 #7c3aed */
  --primary-fg:        255 255 255;
  --muted:             100 116 139;   /* slate-500  #64748b */
  --accent:            237 233 254;   /* violet-100 #ede9fe */
  --destructive:       220 38 38;     /* red-600    #dc2626 */
  --border:            229 231 235;   /* gray-200   #e5e7eb */
  --ring:              124 58 237;
}

.dark {
  --background:        10 10 10;      /* zinc-950   #0a0a0a */
  --foreground:        250 250 250;
  --card:              24 24 27;      /* zinc-900   #18181b */
  --card-alt:          39 39 42;      /* zinc-800   #27272a */
  --primary:           167 139 250;   /* violet-400 #a78bfa */
  --primary-fg:        10 10 10;
  --muted:             161 161 170;   /* zinc-400   #a1a1aa */
  --accent:            46 16 101;     /* violet-950 #2e1065 */
  --destructive:       239 68 68;
  --border:            39 39 42;
  --ring:              167 139 250;
}

/* gradient tokens — same across light/dark */
--gradient-primary:       linear-gradient(135deg, rgb(139 92 246) 0%, rgb(99 102 241) 100%);
--gradient-primary-hover: linear-gradient(135deg, rgb(124 58 237) 0%, rgb(79 70 229) 100%);
--gradient-hero-bg:       linear-gradient(135deg, rgb(237 233 254) 0%, rgb(219 234 254) 100%);

/* shadows */
--shadow-card:        0 1px 3px rgb(15 23 42 / 0.05), 0 1px 2px rgb(15 23 42 / 0.03);
--shadow-card-hover:  0 8px 24px rgb(124 58 237 / 0.12), 0 2px 6px rgb(15 23 42 / 0.06);
--shadow-cta:         0 4px 12px rgb(124 58 237 / 0.25);
--shadow-cta-hover:   0 8px 20px rgb(124 58 237 / 0.35);
--shadow-popover:     0 12px 32px rgb(15 23 42 / 0.12), 0 4px 12px rgb(15 23 42 / 0.06);
--shadow-focus:       0 0 0 3px rgb(124 58 237 / 0.15);
```

---

## 11. Anti-AI-slop Guards (mandatory)

> Источник: [`docs/anti-slop-supplement.md`](./docs/anti-slop-supplement.md). Закрывает признаки AI-look 1, 2, 4, 5, 9, 11 — те, что сам по себе design system не предотвращает. Project-specific overrides внизу секции — главный: **controlled gradient разрешён как brand signature**.

### Layout & composition

- **NO 2-column comparison blocks.** Запрещённые паттерны: «Without us / With us», «Before / After», «Old way / New way» side-by-side. Используй single-column storytelling, 3-card grid, или таблицу.
- **ASCII wireframe first.** Прежде чем генерировать UI-код, нарисуй ASCII-wireframe layout'а страницы (header / sections / cards / footer). Сгенерированный код должен соответствовать wireframe'у EXACTLY — никаких изобретённых секций. Все Appendices A–J ниже уже содержат wireframe'ы.
- **Generous spacing between sections.** Минимум 48px между major sections на desktop, 32px на mobile, минимум 24px internal padding. ✓ Consumer уже использует 32–48–96px scale (см. §3).

### Visual style

- **Gradients: CONTROLLED brand signature.** Supplement требует «NO gradients globally», но consumer ProShop переопределяет это правило (см. project-specific overrides ниже). Gradient = намеренная брендовая подпись.
- **Cards: subtle elevation, NEVER heavy borders.** Запрещено: `border: 2px+`, `border: 3px solid black`, double borders. См. §5 Elevation — используем 1px border + subtle shadow + background contrast.
- **shadcn/ui MUST be customized.** Default shadcn theme (slate / zinc / gray out-of-box) — запрещён. См. §1 — мы используем zinc-палитру с **violet→indigo gradient** accent. Default shadcn violet — solid only; мы добавили gradient signature.

### UX-first thinking

- **User journey before visual style.** Перед генерацией страницы — ответь на 4 вопроса: (1) Кто на этой странице? (2) Что они пытаются сделать? (3) Где primary CTA? (4) Какой следующий шаг? Все Appendices содержат Interactions sections с явным user-flow.
- **Primary CTA must be above the fold.** Hero ≤ 60vh, primary CTA видим без scroll на 1366×768 desktop. ✓ Consumer hero ~35–40vh — в пределах нормы. На product page CTA «Add to Cart» — справа от gallery, выше fold.
- **Contrast ≥ 4.5:1 for body text always.** No light-gray text on white. См. §9 Accessibility — все ключевые пары verified, включая `--primary` violet `#7c3aed` на `#fafafa` = 5.9:1 ✓.

### Project-specific overrides (consumer shop)

- **Gradient как brand signature** — supplement-правило «NO gradients globally» **переопределено**. Gradient разрешён ТОЛЬКО на:
  - Hero banners (Home featured hero, product image gallery placeholder)
  - Primary CTA (Add to Cart, Place Order, Sign up — `var(--gradient-primary)`)
  - Sale / discount pills и Featured badges
  - Logo wordmark (background-clip:text)
  - Cart pill в header
  - Hover shadow на product cards (violet glow — `var(--shadow-card-hover)`)
  - Active carousel dot (pill stretch)

  Gradient **ЗАПРЕЩЁН** на:
  - Тонком тексте (≤14px) — нечитаемо
  - Иконках — стирается при subset render
  - Borders — используй `var(--primary)` solid
  - Плотных контролах: checkbox, radio, qty stepper buttons, inputs
  - Большом теле текста (Body, Description) — solid `var(--foreground)`

  Это intentional differentiation от admin (admin = no gradients), не arbitrary decoration.

- **Card borders: 1px solid `var(--border)` at full opacity + subtle shadow** — clear separation. Supplement-вариант с 10% opacity заменён на shadow + border + background contrast вместе.
- **Hero ≤ 60vh** соблюдается. Featured Hero Banner (Home) — ~35vh на desktop; Product gallery hero — фиксированные 300px (~30vh).

### Magic phrase

«Be a human designer so it doesn't look like AI. With design taste.» — уже присутствует в самом конце файла, дублировать не нужно.

---

## Appendix A — `/` (Home / Search results)

### Layout (Home, по умолчанию)

```
┌──────────────────────────────────────────────────────────────────┐
│  Promo banner (gradient, dismissible) — "Free shipping over $50" │
├──────────────────────────────────────────────────────────────────┤
│  Header — Logo · Search · Sign in · Cart pill                    │
├──────────────────────────────────────────────────────────────────┤
│  Featured Hero Banner (2xl radius 20px, gradient bg)             │
│  ─ Eyebrow "LIMITED DROP"                                        │
│  ─ Display headline "Discover what's new"                        │
│  ─ Body description + Primary CTA + ghost link                   │
│  ─ Hero image right side                                          │
├──────────────────────────────────────────────────────────────────┤
│  Shop by category (H2 + Category Tile grid 4-col)                │
│  ─ Cameras · Headphones · Phones · Computers · Storage · ...     │
├──────────────────────────────────────────────────────────────────┤
│  Top products (Carousel — autoplay 5s)                           │
│  ─ H2 "Top rated this month"                                     │
│  ─ Carousel of Product Cards, 4 visible desktop / 2 tablet / 1m  │
├──────────────────────────────────────────────────────────────────┤
│  All products (H2 "Browse all" + 4-col grid + pagination)        │
│  ─ Filter chips above (All · Cameras · Phones · ...) с count    │
│  ─ Grid: 4-col desktop / 3-col laptop / 2-col tablet / 1-col mob │
│  ─ Pagination centered под grid (см. admin Pagination pattern   │
│    с adapted styling — gradient active page)                     │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Search results variant (`/search/:keyword`)

Замена hero блока: H1 "Results for '<keyword>'" + filter chips + "Showing 24 of 87 products". Иначе же grid идентичен.

### Content tokens

- **Hero**: "Discover what's new" / "Pro gear, hand-picked" / "Build your setup"
- **Categories** (6 tiles): Cameras (47) · Headphones (32) · Phones (28) · Computers (54) · Storage (19) · Gaming (41)
- **Top products carousel**: 8 items (autoplay, infinite loop)
- **All products grid**: 12 на страницу, "Page 1 of 5"

### Interactions

1. Promo banner dismiss → localStorage flag, no re-show 7 days
2. Search submit → URL `/search/:keyword`, results page
3. Hero CTA → navigate to featured category или promotional landing
4. Category tile click → `/search/:keyword=cameras` style filter
5. Carousel autoplay 5s, hover pauses, dots clickable
6. Product card click → `/product/:id`; Add-to-Cart icon button (corner) → quick-add без navigation + Toast Success
7. Filter chip click → URL param, grid refreshes (skeleton 12 items during reload)
8. Pagination → URL update, scroll top, skeleton during fetch

---

## Appendix B — `/product/:id` (Product details)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                            │
├──────────────────────────────────────────────────────────────────┤
│  Breadcrumb: Home / Electronics / Cameras / Cannon EOS 80D       │
├──────────────────────────────────────────────────────────────────┤
│  Main (2-col 1.1fr 1fr gap 32px):                                │
│  ─ Left: Image Gallery (hero + 4 thumbs)                          │
│  ─ Right: Details                                                  │
│     · Category (eyebrow)                                          │
│     · H1 Product name                                             │
│     · Rating Stars + reviews count                                │
│     · Price ($789.99 + strikethrough $929.99 + Save 15% pill)     │
│     · Stock indicator (green dot + "In stock · ships 1–2 days")  │
│     · Quantity selector                                           │
│     · Primary CTA "Add to Cart · $789.99" (full-width gradient)  │
│     · Secondary "♡ Save for later"                                │
│     · Meta grid: SKU · Category · Brand · Shipping                │
├──────────────────────────────────────────────────────────────────┤
│  Tabs: Description (active) · Specifications · Reviews · Returns │
├──────────────────────────────────────────────────────────────────┤
│  Tab content (Description by default — long-form body text)      │
├──────────────────────────────────────────────────────────────────┤
│  H2 "You might also like" + 4-col Related Products grid          │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Sample product**: Cannon EOS 80D DSLR Camera with 24.2MP CMOS Sensor, $789.99 (was $929.99, save 15%), 4.8 stars (124 reviews), In stock
- **Gallery**: 1 hero + 4 thumb angles
- **Meta**: SKU `CN-EOS80D-K2`, Category `Cameras`, Brand `Cannon`, Shipping `Free · 1–2 days`
- **Description**: 2-3 paragraphs marketing copy
- **Specifications tab**: table of specs (Sensor: APS-C CMOS, Megapixels: 24.2, ISO range: 100-16000, Display: 3" articulating)
- **Reviews tab**: list of Review Cards, average rating breakdown (5★ 78, 4★ 32, 3★ 9, 2★ 3, 1★ 2)

### Interactions

1. Thumbnail click → swap hero image (fade transition 200ms)
2. Hero hover (desktop) → cursor zoom-in; click → modal lightbox
3. Quantity stepper - / + → updates value, button label updates "Add to Cart · $1,579.98" (×2)
4. Add to Cart click → loading state 600ms → Toast success "Added to cart" + Cart pill count badge animates
5. Save for later → outline → filled heart icon
6. Tab switch → content fade 200ms
7. Reviews tab → "Write a review" CTA (если logged in) → modal with star-rater + textarea
8. Related card click → navigate `/product/:id`

---

## Appendix C — `/cart/:id?` (Cart)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                            │
├──────────────────────────────────────────────────────────────────┤
│  Breadcrumb (optional) — Home / Cart                              │
├──────────────────────────────────────────────────────────────────┤
│  H1 "Your Cart" + count "3 items"                                 │
├──────────────────────────────────────────────────────────────────┤
│  Main (2-col 2fr 1fr gap 32px):                                  │
│  ─ Left: Cart items list                                          │
│     Each: image · name+brand · qty · price · remove               │
│  ─ Right: Order Summary Sidebar (sticky)                          │
│     · Items subtotal                                              │
│     · Shipping (Free / $9.99 / TBD)                              │
│     · Tax (estimated)                                            │
│     · Total                                                       │
│     · "Proceed to checkout" gradient CTA                          │
│     · Promo code input + Apply ghost                              │
│     · Trust line "Secure checkout · 30-day returns"               │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Empty state (`/cart` без items)

```
Icon (Lucide "shopping-cart" 32×32 в primary)
H2 "Your cart is empty"
Body "Discover top products in our catalog"
Primary CTA "Browse products" → /
```

### Content tokens

- **Sample items**: Cannon EOS 80D ×1 ($789.99), Sony Alpha A7 III ×1 ($1,799.99), Cannon EF 50mm ×2 ($125.00 each)
- **Subtotal**: $2,839.98
- **Shipping**: Free (orders ≥ $50)
- **Tax**: $227.20 (8%)
- **Total**: $3,067.18

### Interactions

1. Quantity change → recalc subtotal + tax + total (instant, no API roundtrip in mock)
2. Remove icon click → Confirm dialog (light, "Remove from cart?") → item fades out 200ms
3. Promo code → Apply → loading 500ms → Toast Success "10% off applied" + total updates
4. Proceed to checkout → /shipping
5. Empty state Browse → /

---

## Appendix D — `/login` (Login)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header (compact — logo only, no search)                          │
├──────────────────────────────────────────────────────────────────┤
│  Centered Auth Form (max-width 400px, padding-top 48px)          │
│  ┌──────────────────────────────────────────────┐                │
│  │  H1 "Sign in"                                │                │
│  │  Subtitle "Welcome back to ProShop"          │                │
│  │  ────────────────────────────────────────    │                │
│  │  Email *                                     │                │
│  │  [_______________________________]           │                │
│  │                                              │                │
│  │  Password *               [Forgot?]          │                │
│  │  [_______________________________]           │                │
│  │                                              │                │
│  │  [✓] Keep me signed in                       │                │
│  │                                              │                │
│  │  [    Sign in (gradient full-width)    ]    │                │
│  │                                              │                │
│  │  ─────────── or ───────────                  │                │
│  │                                              │                │
│  │  Don't have an account? Sign up              │                │
│  └──────────────────────────────────────────────┘                │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Errors**: invalid email format → inline; wrong creds → Banner error above form "Invalid email or password"
- **Forgot link**: ghost-link Small, color var(--primary), no underline default

### Interactions

1. Submit → loading button 600ms → success: redirect to / or referrer
2. Wrong creds → Banner Error + focus email input
3. Forgot → /reset-password (out of scope, link reserved)
4. Sign up link → /register

---

## Appendix E — `/register` (Register)

### Layout

Same shell as Login, fields differ:

```
H1 "Create account"
Subtitle "Join ProShop — free, takes 30 seconds"

Name *
[_______________________________]

Email *
[_______________________________]

Password *
[_______________________________]
helper: At least 8 characters

Confirm password *
[_______________________________]

[✓] I agree to the Terms of Service and Privacy Policy

[ Create account (gradient full-width) ]

Already have an account? Sign in
```

### Interactions

1. Password helper updates real-time (length check, шкала strength опционально)
2. Confirm password — inline error если не совпадают
3. Terms checkbox required (submit disabled until checked)
4. Submit → loading → redirect to / + Welcome toast

---

## Appendix F — `/profile` (Profile)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                            │
├──────────────────────────────────────────────────────────────────┤
│  H1 "Profile"                                                      │
├──────────────────────────────────────────────────────────────────┤
│  Main (2-col 1fr 2fr gap 32px):                                  │
│                                                                    │
│  ─ Left: User info card                                            │
│     · Avatar 80×80 round (gradient placeholder + initials)        │
│     · H3 Name                                                      │
│     · Small Email var(--muted)                                     │
│     · Form: Name / Email / Password (change) / Confirm            │
│     · Primary CTA "Update profile"                                 │
│                                                                    │
│  ─ Right: My Orders list                                           │
│     · H2 "My Orders" + count "12 orders"                          │
│     · Table: ID · Date · Total · Paid · Delivered · [Details]    │
│     · Pagination if > 10                                          │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Sample user**: John Doe · john@example.com · Joined Mar 2025
- **Orders table**: Boolean cell for Paid/Delivered с date или ✗ (как admin OrderList — но в consumer styling)
- **Empty orders**: "No orders yet — start exploring" + CTA "Browse products"

### Interactions

1. Update profile → loading button → Toast Success "Profile updated"
2. Password change → confirm-password required, validates match
3. Order row click → /order/:id

---

## Appendix G — `/shipping` (Shipping address)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                            │
├──────────────────────────────────────────────────────────────────┤
│  Checkout Steps Breadcrumb (Cart ✓ · [Shipping] · Payment · Review · Order)│
├──────────────────────────────────────────────────────────────────┤
│  Main (2-col 2fr 1fr gap 32px):                                  │
│                                                                    │
│  ─ Left: Address Form (max-width 480px)                            │
│     H2 "Shipping address"                                          │
│     · Country (select)                                             │
│     · Full name                                                    │
│     · Address (street)                                             │
│     · Address 2 (optional)                                         │
│     · City + ZIP (inline 60/40)                                   │
│     · State (select)                                               │
│     · Phone (optional, tel)                                        │
│     · [✓] Save address for future orders                          │
│     · Primary CTA "Continue to Payment"                            │
│                                                                    │
│  ─ Right: Order Summary (sticky, без CTA)                         │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Interactions

1. Country change → State dropdown re-populates (US states / провинции Canada / other)
2. ZIP validation → format check, autocomplete city (опционально)
3. Continue → /payment

---

## Appendix H — `/payment` (Payment method)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                            │
├──────────────────────────────────────────────────────────────────┤
│  Checkout Steps Breadcrumb (Cart ✓ · Shipping ✓ · [Payment] · Review · Order)│
├──────────────────────────────────────────────────────────────────┤
│  Main (2-col 2fr 1fr gap 32px):                                  │
│                                                                    │
│  ─ Left: Payment Method Radio cards (max-width 480px)              │
│     H2 "Payment method"                                            │
│     · [●] PayPal — "You'll be redirected to PayPal" (selected)    │
│     · [ ] Credit card (reserved)                                   │
│     · [ ] Apple Pay (reserved)                                     │
│     · Primary CTA "Continue to Review"                             │
│                                                                    │
│  ─ Right: Order Summary (sticky)                                   │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **PayPal**: logo image inline, default selected
- **Credit card / Apple Pay**: disabled-state, "Coming soon" label

### Interactions

1. Radio select → border 2px primary + bg accent/30 transitions 200ms
2. Continue → /placeorder

---

## Appendix I — `/placeorder` (Place Order review)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                            │
├──────────────────────────────────────────────────────────────────┤
│  Checkout Steps Breadcrumb (Cart ✓ · Shipping ✓ · Payment ✓ · [Review] · Order)│
├──────────────────────────────────────────────────────────────────┤
│  Main (2-col 2fr 1fr gap 32px):                                  │
│                                                                    │
│  ─ Left: Review sections (in cards, stacked)                       │
│     · Shipping card: address + "Edit" ghost-link                  │
│     · Payment card: PayPal logo + "Edit"                          │
│     · Items card: list of Cart Items (compact — image 60×60 + name+qty + price) + subtotal│
│                                                                    │
│  ─ Right: Order Summary (sticky, ENHANCED)                         │
│     · Items count                                                  │
│     · Subtotal                                                     │
│     · Shipping                                                     │
│     · Tax                                                          │
│     · Total (Price 18px/700)                                       │
│     · Primary CTA "Place Order (gradient, lg)" with lock icon     │
│     · Small print: "By placing your order, you agree to..."        │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Interactions

1. Edit link → navigate back to /shipping or /payment, preserving state
2. Place Order → loading 1.2s (simulate PayPal redirect) → /order/:id with success
3. Errors (out of stock мid-checkout) → Banner Error inline, "Update cart" CTA

---

## Appendix J — `/order/:id` (Order details)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                            │
├──────────────────────────────────────────────────────────────────┤
│  H1 "Order #60d2…3a7b"                                            │
│  Subtitle Small "Placed on 2026-05-01 · 3 items"                  │
├──────────────────────────────────────────────────────────────────┤
│  Main (2-col 2fr 1fr gap 32px):                                  │
│                                                                    │
│  ─ Left: Order content                                             │
│     · Status banner — emerald gradient bg if paid+delivered,      │
│       amber bg if paid not delivered, gradient bg with PayPal     │
│       button if not paid                                          │
│     · Shipping card: address + delivery status                    │
│     · Payment card: method + payment status (✓ Paid 2026-05-01)  │
│     · Items list: full Cart Item rows (with images)               │
│                                                                    │
│  ─ Right: Order Summary (read-only)                                │
│     · Subtotal · Shipping · Tax · Total                           │
│     · Status pills (Paid · Delivered) with timestamps             │
│     · "Need help? Contact support" ghost-link                      │
├──────────────────────────────────────────────────────────────────┤
│  Footer                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Order ID**: full Mongo ObjectId, displayed как `60d2…3a7b` (8+4 truncated, hover tooltip full)
- **Statuses**:
  - Paid: green dot + "✓ Paid on 2026-05-01"
  - Delivered: green dot + "✓ Delivered on 2026-05-04"
  - Pending payment: amber + PayPal button to complete
  - Pending delivery: amber + tracking info

### Interactions

1. PayPal button click → modal/redirect (real PayPal in production; mock confirmation in Pencil)
2. Edit not allowed (read-only once placed)
3. "Contact support" → mailto: or support page
4. Order page also serves admin "Details" view (`/admin/orderlist` Details link → /order/:id) — same component, but admin sees additional "Mark delivered" button (if admin user)

---

> Be a human designer so it doesn't look like AI. With design taste.
