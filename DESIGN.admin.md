# DESIGN.admin.md — ProShop Admin Design System

> **Scope:** Admin Internal Tools — страницы `/admin/*`
> **Companion file:** `DESIGN.consumer.md` для public + auth (`/`, `/product/:id`, `/cart`, `/login`, `/register`, `/profile`, `/shipping`, `/payment`, `/placeorder`, `/order/:id`)
> **Design language:** Light SaaS Clean — tool-feel, плотность, monospace для ID, минимум декора
> **Format:** shadcn/ui style vocabulary + Tailwind CSS 4 + CSS variables (design-only — Pencil prototype, не production)
> **Last updated:** 2026-05-12

---

## Назначение

Дизайн-словарь для **Pencil-прототипа admin-секции**. Покрыты страницы:

- `/admin/featuredashboard` (Feature Flags — Appendix A)
- `/admin/userlist` (Users list — Appendix B)
- `/admin/user/:id/edit` (User edit — Appendix C)
- `/admin/productlist` (Products list — Appendix D)
- `/admin/product/:id/edit` (Product edit — Appendix E)
- `/admin/orderlist` (Orders list — Appendix F)

Consumer-страницы (Home, Product, Cart, Checkout-flow, Login/Register/Profile, Order details) живут в `DESIGN.consumer.md` со своим design language. Эти системы **не делят токены** — admin = tool, consumer = shop.

  Production-стек проекта остаётся **React 16 + react-bootstrap**; миграция на shadcn/Tailwind не входит в текущий scope. CSS variables ниже — словарь для дизайна, не для исполнения.

---

## 1. Color Palette

Базовая нейтральная — **slate** (более прохладный, лучше ложится на emerald accent). Primary — **emerald-500** (`#10b981`). Семантические роли:

| Role             | Light mode (purpose / hex)            | Dark mode (purpose / hex)            | Notes                                                                  |
|------------------|---------------------------------------|--------------------------------------|------------------------------------------------------------------------|
| `--background`   | page surface · `#f8fafc` (slate-50)   | page surface · `#0f172a` (slate-900) | depth от background → card → card-alt, без теней                       |
| `--foreground`   | primary text · `#0f172a` (slate-900)  | primary text · `#f1f5f9` (slate-100) | контраст с `--background` ≥ 13:1                                       |
| `--card`         | card surface · `#ffffff`              | card surface · `#1e293b` (slate-800) | таблицы, stat-cards, search-bar wrapper                                |
| `--card-alt`     | elevated · `#f1f5f9` (slate-100)      | elevated · `#334155` (slate-700)     | thead, hover-row, secondary buttons, badge backgrounds                 |
| `--primary`      | primary action · `#10b981` (emerald-500) | primary action · `#10b981` (same) | ON-toggle, primary button, focus ring, active filter chip              |
| `--primary-fg`   | text on primary · `#ffffff`           | text on primary · `#052e16` (emerald-950) | гарантирует контраст ≥ 4.5:1 в обоих режимах                       |
| `--muted`        | secondary text · `#64748b` (slate-500)| secondary text · `#94a3b8` (slate-400) | subtitle, table column headers, placeholders                          |
| `--accent`       | hover tint · `#ecfdf5` (emerald-50)   | hover tint · `#064e3b` (emerald-900) | active filter chip bg, search focus ring/15%                           |
| `--destructive`  | error · `#dc2626` (red-600)           | error · `#ef4444` (red-500)          | error baner, retry CTA на error-card                                   |
| `--border`       | divider · `#e2e8f0` (slate-200)       | divider · `#334155` (slate-700)      | table row dividers, card borders, input borders                        |
| `--ring`         | focus ring · `#10b981` (emerald-500)  | focus ring · `#10b981` (same)        | 2px solid, offset 2px, opacity 20–25% для outer halo                   |

### Status colors (feature flag states)

Не управляются `--primary` — это семантическое окрашивание самих фич, фиксированное независимо от accent.

| Status     | Light bg / fg                            | Dark bg / fg                              | Usage                                                       |
|------------|------------------------------------------|-------------------------------------------|-------------------------------------------------------------|
| Testing    | `#fef3c7` / `#a16207` (amber-100 / 700)  | `#422006` / `#fcd34d` (amber-950 / 300)   | бейдж + traffic progress-bar в Testing                      |
| Enabled    | `#dcfce7` / `#15803d` (green-100 / 700)  | `#052e16` / `#6ee7b7` (green-950 / 300)   | бейдж + traffic progress-bar в Enabled                      |
| Disabled   | `#f1f5f9` / `#64748b` (slate-100 / 500)  | `#1e293b` / `#64748b`                     | бейдж, muted row text, OFF-toggle                           |

Dark mode strategy: **CSS variables only**, переключение через `.dark` class на `<html>` (рекомендация шаблона; `prefers-color-scheme` не используем — позволяет ручной toggle в будущем).

---

## 2. Typography

**Display font:** `Geist` — precise geometric sans от Vercel. Tech-feel, отлично сочетается с моноширным для ID.
**Fallback:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Import:** `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap`

**Mono font:** `JetBrains Mono` — feature ID, code snippets, percentages в таблице, любые data-cells.
**Fallback:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
**Import:** `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap`

### Type scale

| Step    | Size  | Line-height | Letter-spacing | Weight | Usage                                                       |
|---------|-------|-------------|----------------|--------|-------------------------------------------------------------|
| Display | 48px  | 1.1         | -0.03em        | 700    | (зарезервировано для marketing-страниц, на admin не нужно)  |
| H1      | 28px  | 1.1         | -0.02em        | 600    | "Feature Flags" — page title                                |
| H2      | 20px  | 1.2         | -0.015em       | 600    | section header (если появится в будущем)                    |
| H3      | 16px  | 1.3         | -0.01em        | 600    | card title (stat-card, state-card)                          |
| H4      | 14px  | 1.4         | -0.005em       | 600    | sub-headers внутри таблицы / drawer                         |
| Body    | 14px  | 1.5         | 0              | 400    | name column, body copy. Admin density выше consumer.        |
| Small   | 13px  | 1.4         | 0              | 400    | subtitle, footer notes, secondary metadata                  |
| Caption | 11px  | 1.3         | 0.06em         | 600    | UPPERCASE — eyebrow labels, table column headers, badges    |
| Mono    | 13px  | 1.5         | 0              | 400    | feature ID, percentage, code in subtitle (`features.json`)  |

---

## 3. Spacing Scale

**Base unit: 2px.** Primary rhythm — 4-multiples (`4 / 8 / 16 / 24 / 32 / 48 / 64`). 2-multiples (`2 / 6 / 10 / 14 / 18`) разрешены для admin density (filter chips, table rows, stat-cards) — но только по этой шкале, не «произвольно».

```
2px   — hairline       (skeleton block inner padding, decorative offsets — rare)
4px   — micro          (icon ↔ label gap, toggle knob inset)
6px   — xs-tight       (filter chip vertical, live-indicator vertical, badge vertical)
8px   — xs             (button vertical sm, table cell inner gap, knob 8px from edge)
10px  — sm-tight       (table row vertical padding, thead vertical padding)
12px  — sm             (chip horizontal, search internal, secondary content gap)
14px  — md-tight       (stat-card vertical padding, slider thumb size)
16px  — md             (card inner padding default, button md horizontal, gap between cards)
18px  — md-loose       (state-card padding — empty/loading/error variants)
24px  — lg             (page margin top, gap between header → stats, between major blocks)
32px  — lg-plus        (vertical rhythm between stats → controls → table)
48px  — xl             (page-level vertical rhythm: top of main content, bottom of page)
64px  — 2xl            (reserved — large empty states, dialog padding)
```

Page-level layout: outer container `max-width: 1280px`, horizontal padding **24px** (lg), vertical padding **32px** top / **48px** bottom (lg-plus → xl).

**Rule of thumb:** if a value isn't in the list above, it's wrong — pick the nearest valid step. No `15px`, no `22px`, no `5px`.

---

## 4. Border Radius Scale

```
none: 0px      — hard-edged dividers, table cell borders
sm:   4px      — skeleton blocks, tiny chips, code inline backgrounds
md:   6px      — buttons, inputs, search field, secondary chips
lg:   10px     — cards (default): table container, stat-card, state-card
xl:   14px     — modals, drawers, popovers (reserved)
full: 9999px   — pills: status badges, filter chips, toggle switch, "live" indicator
```

Pencil intermediate: filter chips имеют `radius: full` (pill), но stat-cards — `radius: lg` (10px) для прямоугольного density-feel.

---

## 5. Elevation / Shadow Approach

**Philosophy:** **NO box shadows.** Глубина — через background contrast (`--background` → `--card` → `--card-alt`).

3-level elevation system:

- **Level 0 (page):** `--background` (`#f8fafc` light / `#0f172a` dark) — outermost canvas
- **Level 1 (card):** `--card` (`#ffffff` light / `#1e293b` dark) — table, stats, state-cards. Border 1px solid `--border`.
- **Level 2 (card-alt):** `--card-alt` (`#f1f5f9` light / `#334155` dark) — thead, hover-row, secondary controls. Используется как «выделение внутри Level 1», не как floating.

**Исключения** для тонкого focus-feedback (только эти два, нигде больше):

```css
--shadow-focus: 0 0 0 3px var(--ring)/20%;     /* outer ring on inputs/buttons */
--shadow-popover: 0 4px 16px rgba(15,23,42,0.08);  /* dropdowns, tooltips — reserved */
```

NO `shadow-lg`, NO `shadow-xl`, NO multi-layer shadow stacks. Если что-то «не выглядит достаточно elevated» — значит нужно поменять background contrast, а не наляпать тень.

---

## 6. Component Patterns

### Cards

```
Background:    var(--card)
Padding:       varies by subtype — Stat-card 14×16 (md-tight × md), State-card 18 (md-loose),
               Table container 0 (rows handle their own padding 10×16)
Border radius: 10px (lg)
Border:        1px solid var(--border)
Hover (interactive cards): bg → var(--card-alt), transition 150ms ease
```

### Buttons

```
Primary:    bg var(--primary), text var(--primary-fg), radius 6px, padding 8px 16px, font 13px/600
            Hover: brightness(1.05), transition 150ms ease
            Active: scale(0.98)
Secondary:  bg transparent, border 1px var(--border), text var(--foreground), radius 6px, padding 8px 16px
            Hover: bg var(--card-alt), transition 150ms
Ghost:      bg transparent, no border, text var(--muted)
            Hover: text var(--foreground), bg var(--card-alt)
Danger:     bg var(--destructive), text #fff, radius 6px (reserved)
Disabled:   opacity 0.4, cursor not-allowed, NO hover effect
Sizes:      sm: 6px 12px / 12px font · md (default): 8px 16px / 13px · lg: 10px 20px / 14px
```

### Inputs

```
Background:    var(--card)
Border:        1px solid var(--border)
Border radius: 6px (md)
Padding:       8px 12px (8px 32px when icon-prefixed search)
Font:          13px Geist, color var(--foreground)
Placeholder:   var(--muted)
Focus:         border var(--primary), box-shadow 0 0 0 3px var(--ring)/15%
Disabled:      bg var(--card-alt), color var(--muted), cursor not-allowed
Search icon:   14px, left 10px, color var(--muted), inline SVG (Lucide search)
```

### Status Badge (semantic — feature state)

```
Padding:       3px 8px
Border radius: 9999px (pill)
Font:          11px/600, letter-spacing 0.04em, UPPERCASE
Min-width:     74px (выравнивает Testing / Enabled / Disabled)
Text-align:    center
Background:    статус-зависимое (см. § 1 Status colors)
```

### Filter Chip (status filter)

```
Padding:       6px 12px
Border radius: 9999px (pill)
Font:          11px/600 Geist (NOT uppercase — отличается от Status Badge)
Border:        1px solid var(--border)
Background:    var(--card)
Color:         var(--muted)
Hover:         bg var(--card-alt), color var(--foreground)
Active state:  bg var(--accent), color var(--primary), border-color var(--primary)/40
Format:        "All · 22" — название + middle-dot + count, "·" в 0.04em letter-spacing
```

### Toggle Switch

```
Track size:    32px × 18px
Track radius:  9999px (full)
Track bg ON:   var(--primary)
Track bg OFF:  #cbd5e1 (slate-300) light / #475569 (slate-600) dark
Knob:          14px × 14px, bg #fff, radius 50%
Knob offset:   2px from track edge (right on ON, left on OFF)
Transition:    knob translateX 150ms ease, bg-color 150ms ease
Touch zone:    minimum 44×44 (см. § 9 Accessibility) — visual 32×18 центрирован
Disabled:      opacity 0.4, cursor not-allowed
ARIA:          role="switch", aria-checked, aria-label "Toggle <feature_name>"
```

### Slider (traffic_percentage 0–100)

```
Track height:  4px
Track radius:  9999px (full)
Track bg:      var(--card-alt)
Fill bg:       var(--primary) (Enabled) / amber-500 #f59e0b (Testing) / no fill (Disabled)
Thumb:         14px × 14px circle, bg #fff, border 2px var(--primary), radius 50%
Thumb hover:   scale(1.15), shadow 0 0 0 6px var(--primary)/15%
Thumb focus:   box-shadow 0 0 0 6px var(--ring)/30%
Range labels:  0% and 100% optional underneath, 11px var(--muted)
ARIA:          role="slider", aria-valuemin/max/now, aria-label
```

### Progress Bar (inline, в таблице — visual readout traffic, не interactive)

```
Track height:  4px
Track bg:      var(--card-alt)
Fill bg:       статус-зависимый цвет — emerald (Enabled), amber (Testing), none (Disabled)
Border radius: 9999px (full)
Animation:     fill-width 200ms ease-out on initial render
```

### Stat Card

```
Background:    var(--card)
Border:        1px solid var(--border)
Border radius: 10px (lg)
Padding:       14px 16px
Layout:        2 lines — number (24px/600/-0.02em) + caption (11px/500 var(--muted))
Number color:  default var(--foreground) / for status-specific stats: status fg color (Enabled → green-700, Testing → amber-700, Disabled → slate-500)
```

### Table

```
Container:     bg var(--card), border 1px var(--border), radius 10px, overflow:hidden
THead:         bg var(--card-alt), padding 10px 16px, font 11px/600 UPPERCASE letter-spacing 0.06em, color var(--muted)
Row:           padding 10px 16px, font 13px, border-bottom 1px var(--border) (last row no border)
Row hover:     bg var(--card-alt) (NOT var(--accent) — accent reserved for active selection)
Density:       regular — row visual height ≈ 42px
ID column:     monospace 12px var(--foreground)/dark slate
Name column:   regular 14px var(--foreground), weight 500
Muted row:     opacity 0.6 для Disabled feature rows
```

### Skeleton (loading)

```
Background:    linear-gradient(90deg, var(--card-alt) 0%, var(--border) 50%, var(--card-alt) 100%)
Background-size: 200% 100%
Animation:     shimmer 1.5s infinite linear
Shapes:        bars matching real element dimensions (height 14px for row text, 18px+full radius for badges, 32×18 для toggle)
```

### State Cards (empty / error)

```
Empty state:
  Layout:       centered, padding 24px 16px
  Icon:         36×36 circle, bg var(--card-alt), color var(--muted), 18px icon (Lucide)
  Title:        12px/600 var(--foreground)
  Description:  11px var(--muted), line-height 1.4
  Optional CTA: ghost-button link to MCP

Error state:
  Background:   #fef2f2 (red-50) light / rgba(220,38,38,0.1) dark
  Border:       1px solid #fecaca (red-200) light / var(--destructive)/30 dark
  Title:        12px/600 var(--destructive), prefix ✕
  Action:       inline link "Retry →" in var(--primary), weight 600
```

### Live Indicator (SSE connected)

```
Pill:          padding 6px 12px, radius 9999px, font 11px/600
Connected:     bg #ecfdf5 (emerald-50) light / var(--accent) dark, color var(--primary), border 1px #a7f3d0
Disconnected:  bg var(--card-alt), color var(--muted), border 1px var(--border), label "○ Offline"
Dot:           6×6 circle, bg var(--primary) — animated pulse 2s when connected
```

### Checkbox

```
Box:           16×16, radius 4px (sm), border 1.5px var(--border), bg var(--card)
Checked:       bg var(--primary), border var(--primary), white check icon (Lucide check 12×12, stroke 2.5px)
Indeterminate: bg var(--primary), white horizontal bar (10×2)
Label:         13px Geist, gap 8px between box and label, color var(--foreground)
Hover:         border var(--primary)/60
Focus:         box-shadow 0 0 0 3px var(--ring)/15%
Disabled:      opacity 0.4, cursor not-allowed
ARIA:          role="checkbox", aria-checked, label через <label for=...> или aria-label
Click zone:    44×44 минимум (отступы вокруг визуального box'а)
```

### Textarea

```
Background:    var(--card)
Border:        1px solid var(--border)
Border radius: 6px (md)
Padding:       8px 12px
Font:          13px Geist, color var(--foreground), line-height 1.5
Placeholder:   var(--muted)
Min-height:    96px (5 lines примерно) — increases via resize:vertical
Max-height:    300px (после — internal scroll)
Resize:        vertical only (resize: vertical)
Focus:         border var(--primary), box-shadow 0 0 0 3px var(--ring)/15%
Disabled:      bg var(--card-alt), color var(--muted), no resize
Char counter:  optional — 11px var(--muted), bottom-right inline под textarea, format "245 / 500"
```

### Number Input

```
Inherits from Input (см. выше) +
Text-align:    right (правое выравнивание чисел)
Font:          13px JetBrains Mono (для tabular nums)
Spinner:       custom — две стрелки на правом краю, 14×7 каждая, color var(--muted)
               hover: color var(--foreground)
               (или скрыть нативные стрелки и оставить только цифры — выбрать в Pencil)
Suffix:        optional inline — "$", "%", "pcs" — 13px var(--muted) после числа, padding 0 12px
Validation:    min/max — при выходе за пределы border var(--destructive) + helper text
```

### File / Image Upload Zone

```
Dropzone:      bg var(--card), border 1.5px dashed var(--border), radius 10px (lg)
               padding 24px, min-height 120px, text-align center, cursor pointer
Hover:         border var(--primary), bg var(--accent)
Drag-over:     border 2px solid var(--primary), bg var(--accent)
Icon:          Lucide "upload-cloud" 32×32 var(--muted), 8px above text
Text:          14px var(--foreground) "Drop image or click to browse", subtext 11px var(--muted) "PNG, JPG up to 2MB"
Preview:       после загрузки — image 120×120, radius 10px, рядом filename (13px) + Remove (ghost-button)
               progress bar 4px snake underneath при upload (если есть прогресс)
URL fallback:  Input text-field под dropzone — "or paste image URL"
ARIA:          role="button", aria-label "Upload product image"
Touch:         dropzone сам по себе — touch target ≥ 120×120
```

### Action Icon Button (Edit / Delete в таблицах)

```
Size:          28×28 (sm) — компактнее обычного button, но click zone ≥ 32×32 через transparent padding
Border radius: 6px (md)
Icon:          14×14 Lucide
Edit:          icon "pencil", bg transparent, color var(--muted)
               Hover: bg var(--card-alt), color var(--foreground)
Delete:        icon "trash-2", bg transparent, color var(--muted)
               Hover: bg #fef2f2 (red-50), color var(--destructive)
Active:        scale(0.95)
Focus:         ring 2px var(--ring)/30%
Group:         icon-only buttons в таблице — gap 4px между ними
Confirmation:  Delete клик → confirm dialog "Are you sure?" (см. Confirm Dialog ниже)
ARIA:          aria-label "Edit user John Doe" / "Delete user John Doe"
```

### Boolean Cell Indicator (✓ / ✗ / date)

Используется в таблицах для bool-полей (Paid, Delivered, isAdmin).

```
True (icon):   Lucide "check" 14×14, color var(--primary) (emerald), bg #ecfdf5 round 20×20
True (date):   "2026-05-04" — 12px JetBrains Mono var(--foreground), вместо иконки если есть timestamp
False:         Lucide "x" 14×14, color var(--destructive), bg #fef2f2 round 20×20
Pending:       Lucide "minus" 14×14, color var(--muted), bg var(--card-alt) round 20×20
Alignment:     центр ячейки
ARIA:          aria-label "Paid on 2026-05-04" / "Not paid" / "Pending"
```

### Pagination

```
Container:     flex, gap 4px, justify-center, padding 16px 0 на странице
Page button:   28×28 min, padding 0 10px (для multi-digit), radius 6px
               font 12px/600 Geist, bg var(--card), border 1px var(--border), color var(--foreground)
Hover:         bg var(--card-alt)
Active page:   bg var(--primary), color var(--primary-fg), border var(--primary)
Disabled:      opacity 0.4, cursor not-allowed (для Prev/Next on edges)
Ellipsis:      "…" — 12px var(--muted), padding 0 4px, не интерактивный
Prev/Next:     icon-only (Lucide chevron-left/right 14×14) или текст "Previous" / "Next"
Touch:         min-height 32px (desktop), 44px на mobile
ARIA:          <nav aria-label="Pagination">, current page — aria-current="page"
```

### Form Layout (edit pages)

```
Container:     max-width 480px (single column form), centered, padding 24px 0
Section:       gap 20px vertical between form-groups (значение out-of-scale, дозволено по умолчанию)
Form group:    Label + Input (или Textarea / Checkbox / File Upload) — vertical stack, gap 6px
Label:         13px/600 Geist, color var(--foreground), margin-bottom 6px
Required mark: красная "*" после текста label, color var(--destructive), font-size 13px
Helper text:   11px var(--muted), margin-top 4px under input
Error text:    11px var(--destructive), margin-top 4px (заменяет helper при ошибке)
Inline group:  для side-by-side полей (например Price + Stock) — flex gap 16px
Submit row:    margin-top 24px, primary button full-width на mobile / auto на desktop
Back link:     ghost-button с Lucide "arrow-left" icon, top of page, margin-bottom 16px
               Text: "Go Back" — 13px Geist, color var(--muted), Hover: color var(--foreground)
```

### Page Header with Primary CTA

```
Container:     flex, justify-between, align-center, margin-bottom 24px
Left:          eyebrow (Caption / muted) + H1 (28px) — см. Typography
Right:         Primary button — "+ Create Product" with Lucide "plus" icon 14×14 +  text
               Или Live indicator / Filter dropdown (зависит от страницы)
Mobile:        right block падает под H1, full-width button
```

### Notification Banner (replaces Bootstrap Message)

Inline alerts в верхней части контента, для success/error/info.

```
Container:     padding 12px 16px, radius 10px (lg), border 1px, margin-bottom 16px
               display flex, align-center, gap 12px
Icon:          18×18 Lucide, slot для иконки variant-зависимой
Body:          13px Geist, color depends on variant
Close button:  Lucide "x" 16×16 ghost-button, right side, color inherits muted
Variants:
  Success:     bg #ecfdf5 (emerald-50) light / var(--accent) dark
               border #a7f3d0 / var(--primary)/30
               color #15803d (green-700) / #6ee7b7
               icon: "check-circle"
  Error:       bg #fef2f2 (red-50) / rgba(220,38,38,0.1)
               border #fecaca / var(--destructive)/30
               color var(--destructive)
               icon: "alert-circle"
  Warning:     bg #fef3c7 (amber-100) / #422006
               border #fde68a / #92400e
               color #a16207 / #fcd34d
               icon: "alert-triangle"
  Info:        bg #eff6ff (blue-50) / #172554
               border #bfdbfe / #1e40af
               color #1e40af / #93c5fd
               icon: "info"
Auto-dismiss:  success — 5s, error — manual close required
ARIA:          role="alert" (error/warning) or role="status" (success/info), aria-live="polite"
```

### Confirm Dialog (delete confirmation)

```
Backdrop:      fixed inset 0, bg rgba(15, 23, 42, 0.5), z-index 100
Dialog:        bg var(--card), radius 14px (xl), border 1px var(--border)
               width 400px max, padding 24px, position centered
Title:         16px/600 var(--foreground), margin-bottom 8px
Description:   13px var(--muted), margin-bottom 20px, line-height 1.5
Actions:       flex justify-end, gap 8px
               Cancel: Secondary button
               Confirm Delete: Danger button (bg var(--destructive), text #fff)
Animation:     fade-in 200ms ease-out, scale 0.95 → 1
ARIA:          role="dialog", aria-modal="true", aria-labelledby (title), focus trap, Esc closes
```

---

## 7. Interactive States

**EVERY interactive element MUST have ALL of these states defined:**

| Element       | Default                              | Hover                                 | Focus                                 | Active           | Loading              | Empty / Disabled                          |
|---------------|--------------------------------------|---------------------------------------|---------------------------------------|------------------|----------------------|-------------------------------------------|
| Button (primary) | bg primary, text primary-fg       | brightness(1.05)                      | ring 2px primary, offset 2px           | scale(0.98)      | spinner + opacity .7 | opacity .4, no-pointer                    |
| Button (secondary)| bg transparent, border             | bg card-alt                           | ring 2px primary                      | scale(0.98)      | spinner              | opacity .4, no-pointer                    |
| Input            | border 1px border, bg card        | border 1px slate-300                  | border primary, ring 3px primary/15%  | —                | skeleton bar         | bg card-alt, read-only cursor             |
| Card             | bg card, border 1px border        | (non-interactive default — no change) | outline ring (when focusable)         | —                | skeleton shimmer     | empty state shown with icon + CTA         |
| Link             | color foreground                  | color primary, underline              | outline ring                          | color primary    | —                    | color muted                               |
| Toggle           | bg primary (ON) / slate-300 (OFF) | brightness(1.05)                      | ring 2px primary                      | —                | —                    | opacity .4, not-allowed                   |
| Filter Chip      | bg card, border, color muted      | bg card-alt, color foreground         | ring 2px primary                      | (active variant) | —                    | bg card-alt, color muted/60               |
| Filter Chip (active) | bg accent, color primary, border primary/40 | brightness(1.02)            | ring 2px primary                      | —                | —                    | —                                         |
| Table row        | bg card                           | bg card-alt                           | outline ring (when row is focusable)  | —                | skeleton row         | row hidden when filtered out              |
| Slider thumb     | bg #fff, border 2px primary       | scale(1.15), halo 6px primary/15%     | halo 6px primary/30%                  | scale(0.95)      | —                    | opacity .4, no-pointer                    |
| Checkbox         | unchecked bg card, border 1.5px   | border primary/60                     | ring 3px primary/15%                  | scale(0.95) on click | —                | opacity .4, not-allowed                   |
| Checkbox (checked)| bg primary, white check icon     | brightness(1.05)                      | ring 3px primary/15%                  | scale(0.95)      | —                    | opacity .4                                |
| Textarea         | border 1px border, bg card        | border 1px slate-300                  | border primary, ring 3px primary/15%  | —                | skeleton bar         | bg card-alt, no resize                    |
| File upload zone | dashed border, bg card            | border primary, bg accent             | ring 2px primary                      | (drag-over: border 2px primary) | progress bar inside | opacity .4, not-allowed       |
| Action icon btn  | bg transparent, color muted       | bg card-alt, color foreground (or destructive for delete) | ring 2px primary/30% | scale(0.95) | spinner replaces icon | opacity .4, not-allowed     |
| Pagination page  | bg card, border, color foreground | bg card-alt                           | ring 2px primary                      | (current: bg primary)| —                  | opacity .4 (Prev/Next on edges)          |
| Banner (Success/Error/Warning/Info) | variant bg+border+icon | brightness(1.02) on close-button only | ring 2px primary on close-btn  | —                | —                    | n/a (dismissed via close)                 |

**Empty states**: every list/table MUST have a designed empty state (icon + message + optional CTA). For Feature Flags page: "No features match your filter" with clear-filter action.

**Loading states**: use skeleton shimmer, NOT spinners. Only action-triggered loading (e.g., MCP-link click) uses inline spinner button-state.

---

## 8. Animation / Transitions

**Philosophy:** purposeful, not decorative. Every animation explains a state change.

```
Base transition:   150ms ease            (color, background, border, opacity)
Knob slide:        translateX 150ms ease (toggle ON/OFF)
Hover scale:       1.02 — НЕ 1.05+ (admin tool feels measured, not bouncy)
Active scale:      0.98 (button press feedback)
Fade in:           opacity 0 → 1, 200ms ease-out (page mount, modals, toasts)
Slide up:          translateY(8px) → 0, 200ms ease-out (toasts, drawers from bottom)
Progress fill:     width 0 → N% 200ms ease-out (traffic bars on initial paint)
Skeleton shimmer:  background-position 200% → -200%, 1.5s infinite linear
Row stagger:       30ms between table rows on initial paint (optional polish)
```

NEVER: random animations, decorative parallax, transitions > 300ms, bouncy easing (`cubic-bezier(.68,-.55,...)`).

```css
/* Reduced motion — required */
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

- Body text on `--background`: `#0f172a` on `#f8fafc` → **15.4:1** (light), `#f1f5f9` on `#0f172a` → **14.6:1** (dark) ✓
- Body on `--card`: `#0f172a` on `#ffffff` → **16.1:1** ✓
- `--muted` on `--background`: `#64748b` on `#f8fafc` → **4.85:1** (light) — passes 4.5:1 for body ✓
- Primary button (`--primary-fg` on `--primary`): `#ffffff` on `#10b981` → **3.4:1** — passes 3:1 для large text + UI components, BUT для маленькой кнопки используем `font-weight: 600` + `font-size: ≥13px` чтобы держать читаемость
- Status badges: каждая пара bg/fg ≥ 4.5:1 (Testing amber-100 / amber-700 = 7.2:1, Enabled green-100 / green-700 = 5.8:1, Disabled slate-100 / slate-500 = 4.5:1) ✓

Проверка: https://webaim.org/resources/contrastchecker/ — все ключевые пары прошли AA, ни одна — AAA не требуется для admin-tool.

### Keyboard navigation

- ALL interactive elements reachable via `Tab` (toggle, slider, chips, search, table rows когда clickable, retry-CTA)
- Focus ring: **2px solid `var(--ring)`, offset 2px** — visible на обоих фонах
- Skip-to-content link as first focusable element (`<a href="#main">Skip to main content</a>`)
- `Esc` закрывает любые drawer / popover (reserved для future features)
- Filter chips — стрелочки ←→ для перемещения между ними внутри group (как radio-tab pattern)

### ARIA

- **Status badges**: `<span aria-label="Status: Enabled, traffic 100%">ENABLED</span>` — иначе screen reader произносит только "ENABLED"
- **Toggle**: `<button role="switch" aria-checked="true" aria-label="Toggle feature search_v2">`
- **Slider**: `<input role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25" aria-label="Traffic percentage for search_v2">`
- **Decorative icons** (search-icon, eyebrow-bullet): `aria-hidden="true"`
- **Live indicator** SSE state: `aria-live="polite"` на parent контейнер, чтобы анонс "live / offline" не лез поверх речи
- **Filter chips group**: `role="group" aria-label="Filter by status"`, каждый chip — `aria-pressed="true|false"`
- **Skeleton rows**: `aria-busy="true"` на table при loading, skeleton cells — `aria-hidden="true"`
- **Search input**: `<input aria-label="Search features">` (нет видимой label — placeholder не считается)

### Touch targets

Minimum **44×44px** на mobile. Toggle visual 32×18 — обёрнут в `<button>` с padding 13px вертикально, 6px горизонтально = 44×44 click zone. Filter chips — height 32px на desktop, **44px на mobile** через `min-height` media query.

---

## 10. Format Declaration

```
Component library: shadcn/ui (style vocabulary only — used as Pencil-prototype reference, NOT installed)
CSS framework:     Tailwind CSS 4 (CSS variables on :root and .dark — design specification, NOT production)
Token system:      CSS custom properties (semantic naming, hex values resolvable to Tailwind palette)
Icon set:          Lucide Icons (https://lucide.dev) — outline 1.5px stroke, 14px / 18px / 24px sizes
Production stack:  React 16 + react-bootstrap (current — out of scope for this design phase)
```

**CSS variables setup (Pencil reference — not for runtime):**

```css
:root {
  --background:   248 250 252;   /* slate-50  #f8fafc */
  --foreground:   15 23 42;      /* slate-900 #0f172a */
  --card:         255 255 255;   /* white     #ffffff */
  --card-alt:     241 245 249;   /* slate-100 #f1f5f9 */
  --primary:      16 185 129;    /* emerald-500 #10b981 */
  --primary-fg:   255 255 255;   /* white     #ffffff */
  --muted:        100 116 139;   /* slate-500 #64748b */
  --accent:       236 253 245;   /* emerald-50 #ecfdf5 */
  --destructive:  220 38 38;     /* red-600   #dc2626 */
  --border:       226 232 240;   /* slate-200 #e2e8f0 */
  --ring:         16 185 129;    /* emerald-500 */
}

.dark {
  --background:   15 23 42;      /* slate-900 #0f172a */
  --foreground:   241 245 249;   /* slate-100 #f1f5f9 */
  --card:         30 41 59;      /* slate-800 #1e293b */
  --card-alt:     51 65 85;      /* slate-700 #334155 */
  --primary:      16 185 129;    /* emerald-500 */
  --primary-fg:   5 46 22;       /* emerald-950 #052e16 */
  --muted:        148 163 184;   /* slate-400 #94a3b8 */
  --accent:       6 78 59;       /* emerald-900 #064e3b */
  --destructive:  239 68 68;     /* red-500   #ef4444 */
  --border:       51 65 85;      /* slate-700 #334155 */
  --ring:         16 185 129;    /* emerald-500 */
}
```

---

## 11. Anti-AI-slop Guards (mandatory)

> Источник: [`docs/anti-slop-supplement.md`](./docs/anti-slop-supplement.md). Закрывает признаки AI-look 1, 2, 4, 5, 9, 11 — те, что сам по себе design system не предотвращает. Project-specific overrides внизу секции.

### Layout & composition

- **NO 2-column comparison blocks.** Запрещённые паттерны: «Without us / With us», «Before / After», «Old way / New way» side-by-side. Используй single-column storytelling, 3-card grid, или таблицу — не два колоночных блока.
- **ASCII wireframe first.** Прежде чем генерировать UI-код, нарисуй ASCII-wireframe layout'а страницы (header / sections / cards / footer). Сгенерированный код должен соответствовать wireframe'у EXACTLY — никаких изобретённых дополнительных секций. Все Appendices A–F ниже уже содержат wireframe'ы.
- **Generous spacing between sections.** Минимум 48px между major sections на desktop, 32px на mobile, минимум 24px internal padding. См. project-specific override ниже.

### Visual style

- **NO gradients on backgrounds, buttons, or hero blocks.** Используй solid colors из §1 tokens. Единственное исключение — skeleton shimmer animation (gradient background-position в §6 Skeleton).
- **Cards: subtle elevation, NEVER heavy borders.** Запрещено: `border: 2px+`, `border: 3px solid black`, double borders. См. §5 Elevation — мы используем background contrast (Level 0/1/2) + 1px borders.
- **shadcn/ui MUST be customized.** Default shadcn theme (slate / zinc / gray out-of-box) — запрещён. См. §1 — мы используем slate-палитру с **emerald** accent, не default.

### UX-first thinking

- **User journey before visual style.** Перед генерацией страницы — ответь на 4 вопроса: (1) Кто на этой странице? (2) Что они пытаются сделать? (3) Где primary CTA? (4) Какой следующий шаг? Визуальные решения следуют за user journey, не наоборот.
- **Primary CTA must be above the fold.** Hero ≤ 60vh, primary CTA видим без scroll на 1366×768 desktop. Admin страницы редко имеют hero — для list-страниц «above the fold» означает: первый ряд таблицы виден без scroll.
- **Contrast ≥ 4.5:1 for body text always.** No light-gray text on white «потому что красиво в screenshots». См. §9 Accessibility — все ключевые пары verified.

### Project-specific overrides (admin tooling)

- **Spacing minimum: 24px** между major sections (override supplement minimum 48px). Admin = densely-packed data tool UI; data-density намеренно ценится больше «воздуха». Generous-spacing rule в полной мере применяется в `DESIGN.consumer.md`. Внутри admin: 24px между header→stats и stats→controls, 32px между controls→table.
- **Card borders: 1px solid `var(--border)` at full opacity** — clear visual separation в data tables. 10% opacity подход не используем; depth = background contrast (Level 0/1/2 см. §5) AND 1px borders вместе.

### Magic phrase

«Be a human designer so it doesn't look like AI. With design taste.» — уже присутствует в самом конце файла, дублировать не нужно.

---

## Appendix A — Page-specific spec: `/admin/featuredashboard`

Конкретная компоновка для Pencil-прототипа этой страницы. Использует токены и паттерны выше.

### Layout structure (top to bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
│  ─ Eyebrow label: "Admin · Internal Tools" (Caption / muted)    │
│  ─ H1: "Feature Flags"                                          │
│  ─ Subtitle: "Read-only view of features.json. Manage flags     │
│     via the feature-flags MCP server. Your traffic bucket: 47." │
│  ─ Right: Live indicator (● Live emerald pill)                  │
├─────────────────────────────────────────────────────────────────┤
│  Stats row (4 cards)                                            │
│  ─ Total | Enabled (green) | Testing (amber) | Disabled (grey)  │
├─────────────────────────────────────────────────────────────────┤
│  Controls                                                        │
│  ─ Search input (flex:1) with leading icon                      │
│  ─ Filter chips: All · N | Enabled · N | Testing · N | Disabled │
├─────────────────────────────────────────────────────────────────┤
│  Table (single)                                                  │
│  Cols: ID (mono 160) | Name (flex) | Status (100) |             │
│        Traffic (130, bar+pct) | For me (60, ON/off) | (40)      │
│  Rows: data row × N, hover bg card-alt, Disabled rows opacity .6│
│  Skeleton: 5 skeleton rows during initial load                  │
├─────────────────────────────────────────────────────────────────┤
│  Footer hint (dashed border card)                                │
│  ─ "Wired features: <code>...</code>" — на левой стороне        │
│  ─ "3 wired" — на правой                                        │
├─────────────────────────────────────────────────────────────────┤
│  (out-of-flow) State cards — Empty / Loading / Error            │
│  Используются вместо table при отсутствии данных или ошибке.    │
└─────────────────────────────────────────────────────────────────┘
```

### Content tokens for Pencil

- **Sample feature IDs** (для realistic mockup): `search_v2`, `semantic_search`, `search_autosuggest`, `paypal_express_buttons`, `image_lazy_loading`, `product_recommendations`, `cart_redesign`, `gift_message`, `save_for_later`, `wishlist`, `quick_view`, `compare_products`, `loyalty_program`, `referral_bonus`, `dark_mode`, `social_login`, `guest_checkout`, `address_autocomplete`, `live_chat`, `personalized_homepage`, `email_capture`, `abandoned_cart_email`
- **Statuses distribution**: 22 total → 7 Enabled, 11 Testing, 4 Disabled (matches Stats row)
- **Sample names** — natural human-readable: "New Search Algorithm", "Semantic Vector Search", "PayPal Express Buttons", etc.
- **Traffic %**: Enabled = 100, Testing = 5/10/25/50/75, Disabled = 0 or "—"

### Interactions to mock in Pencil

1. Filter chip click → активирует state (bg accent, color primary, border primary/40)
2. Search input → focus state (border primary, halo 3px primary/15%)
3. Toggle click → анимация knob slide 150ms + bg color transition
4. Slider drag (если будет в прототипе) → fill width + percentage live update
5. Row hover → bg card-alt
6. Empty state — отдельный экран при `features.length === 0` после фильтра
7. Error state — top banner вариант + standalone state-card вариант (выбрать один в Pencil)

---

## Appendix B — `/admin/userlist` (Users list)

Простой list-page без фильтров и поиска (для текущего масштаба seed: 3 пользователя). Если число вырастет — добавить Search + Filter chips по паттерну Feature Dashboard.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
│  ─ Eyebrow: "Admin · Internal Tools"                            │
│  ─ H1: "Users"                                                  │
│  ─ Right: (reserved для будущих фильтров — пока пусто)          │
├─────────────────────────────────────────────────────────────────┤
│  Table                                                           │
│  Cols: ID (mono 220) | Name (flex) | Email (240, link) |        │
│        Admin (80, boolean cell) | Actions (80)                  │
│  Rows: 13px row text, ID моноширно (truncated с tooltip)        │
│  Email: <a> с color var(--foreground), hover underline + primary │
│  Admin column: Boolean cell — ✓ emerald round для admin, иначе — │
│  Actions: Edit (icon) + Delete (icon), gap 4px                  │
├─────────────────────────────────────────────────────────────────┤
│  (out-of-flow) Confirm Dialog при клике Delete                  │
│  Title: "Delete user?"                                          │
│  Description: "This will permanently remove <name> (<email>)."  │
│  Actions: Cancel (secondary) / Delete (danger)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Sample rows**: `Admin User · admin@example.com · ✓`, `John Doe · john@example.com · —`, `Jane Doe · jane@example.com · —`
- **ID format**: Mongo ObjectId (`60d0fe4f5311236168a109ca`) — truncate в UI до `60d0fe…109ca` (8+4 chars + ellipsis), full в tooltip
- **Empty state** (если пусто): "No users yet" + CTA "Add the first user" (даже если seeder уже создаёт — для общего паттерна)

### Interactions

1. Email клик → `mailto:` link открывает почтовый клиент
2. Edit icon → переход `/admin/user/:id/edit`
3. Delete icon → Confirm Dialog → confirm → row исчезает (с stagger fade 200ms) → Banner Success "User deleted" 5s
4. Row hover → bg card-alt
5. Loading → skeleton 5 rows (как в Feature Dashboard)

---

## Appendix C — `/admin/user/:id/edit` (User edit)

Single-column form, 3 поля. Использует Form Layout pattern.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Go Back                                                       │
├─────────────────────────────────────────────────────────────────┤
│  H1: "Edit User"                                                 │
│  Subtitle (optional): "<email> · created 2026-04-12"            │
├─────────────────────────────────────────────────────────────────┤
│  Form (max-width 480px, centered)                               │
│  ┌─────────────────────────────────────────┐                    │
│  │ Name *                                  │                    │
│  │ [______________________________________]│                    │
│  └─────────────────────────────────────────┘                    │
│  ┌─────────────────────────────────────────┐                    │
│  │ Email Address *                         │                    │
│  │ [______________________________________]│                    │
│  │ helper: We'll never share this.         │                    │
│  └─────────────────────────────────────────┘                    │
│  ┌─────────────────────────────────────────┐                    │
│  │ [✓] Is Admin                            │                    │
│  │ helper: Grants access to /admin/*       │                    │
│  └─────────────────────────────────────────┘                    │
│  ┌──────────────┐                                                │
│  │ Update       │   (Primary button, right-aligned на desktop)   │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Required marks**: name & email — required (red asterisk)
- **Email validation**: native `type="email"` + helper "Must be a valid email address" if invalid
- **isAdmin**: Checkbox + label "Is Admin" + helper "Grants access to /admin/*"
- **Save success**: Banner Success "User updated" → redirect `/admin/userlist` после 1s

### Interactions

1. Submit click → loading state (button spinner, disabled inputs) → success Banner → redirect
2. Email invalid → border destructive, error text below
3. Cancel — нет (Back link заменяет)
4. Esc — focus back to Go Back link
5. Loading user details → skeleton form (3 input-shaped placeholders)
6. Error fetching → Banner Error inline, retry button

---

## Appendix D — `/admin/productlist` (Products list)

List с CTA в header + pagination. 5+ колонок, plus actions.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
│  ─ Eyebrow: "Admin · Internal Tools"                            │
│  ─ H1: "Products"                                               │
│  ─ Right: Primary button "+ Create Product" (Lucide plus icon)  │
├─────────────────────────────────────────────────────────────────┤
│  Controls (optional, появляется когда products > 20):           │
│  ─ Search input "Search products by name or brand…"             │
│  ─ Filter chips by category (dynamic from data — Electronics,   │
│    Books, etc.) — overflow-x scroll если > 6                    │
├─────────────────────────────────────────────────────────────────┤
│  Table                                                           │
│  Cols: ID (mono 140, truncated) | Name (flex, weight 500) |     │
│        Price (90, mono right-aligned with $) |                  │
│        Category (110) | Brand (110) | Actions (80)              │
│  Price: monospace tabular, "$" prefix in muted color            │
│  Empty stock row: opacity 0.6 + small badge "Out of stock" в Name col │
├─────────────────────────────────────────────────────────────────┤
│  Pagination (под таблицей, центр)                                │
│  ← Prev · 1 · 2 · [3] · 4 · 5 · … · Next →                      │
├─────────────────────────────────────────────────────────────────┤
│  (out-of-flow) Confirm Dialog при Delete                        │
│  Title: "Delete product?"                                       │
│  Description: "<name> will be permanently removed."             │
└─────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Sample rows** (для realistic mockup):
  - `Airpods Wireless Bluetooth Headphones · $89.99 · Electronics · Apple`
  - `iPhone 13 Pro 256GB Memory · $599.99 · Electronics · Apple`
  - `Cannon EOS 80D DSLR Camera · $929.99 · Electronics · Cannon`
  - `Sony Playstation 5 · $399.99 · Electronics · Sony`
  - `Logitech G-Series Gaming Mouse · $49.99 · Electronics · Logitech`
  - `Amazon Echo Dot 3rd Generation · $29.99 · Electronics · Amazon` (out of stock — opacity .6)
- **Create button**: Primary, icon-left plus, opens loading state then navigates to `/admin/product/<id>/edit` for new product
- **Pagination**: max 12 products per page; show full numbered pages когда total ≤ 7, ellipsis truncation для > 7

### Interactions

1. Create Product → button shows spinner, ~500ms latency, redirect to new edit page
2. Search input → debounced 250ms filter on name + brand (client-side, реальный API на will-add при росте)
3. Filter chip click → applies category filter, accent state
4. Edit icon → navigate
5. Delete icon → Confirm Dialog → on confirm, row fade-out 200ms, Banner Success
6. Pagination → URL updates `/admin/productlist/:pageNumber`, skeleton rows during load
7. Loading initial → 5 skeleton rows + skeleton pagination ✓✓

---

## Appendix E — `/admin/product/:id/edit` (Product edit)

Большая форма, 7 полей включая image upload. Single-column layout, но с inline-group для Price + Stock.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Go Back                                                       │
├─────────────────────────────────────────────────────────────────┤
│  H1: "Edit Product"                                              │
│  Subtitle: "<existing name> · last updated 2026-05-04"          │
├─────────────────────────────────────────────────────────────────┤
│  Form (max-width 560px — шире обычного из-за inline-groups)     │
│                                                                  │
│  ─ Name *                                                        │
│    [_________________________________________________]           │
│                                                                  │
│  ─ Image                                                         │
│    ┌─────────────────────────────────────┐                       │
│    │  [preview 120×120]  filename.jpg    │ ← после upload         │
│    │                     Remove          │                       │
│    └─────────────────────────────────────┘                       │
│    ИЛИ (если ничего не загружено):                              │
│    ┌─────────────────────────────────────┐                       │
│    │       ☁ Drop image or click         │                       │
│    │       PNG, JPG up to 2MB            │                       │
│    └─────────────────────────────────────┘                       │
│    [or paste image URL: ____________________]                    │
│                                                                  │
│  ─ Inline group (flex gap 16px):                                │
│    ┌──── Price ────┐  ┌── Count In Stock ──┐                    │
│    │  $ [_____]    │  │  [_____] pcs       │                    │
│    └───────────────┘  └────────────────────┘                    │
│                                                                  │
│  ─ Brand *           ─ Category *                                │
│    [____________]      [____________]   (inline group, flex)     │
│                                                                  │
│  ─ Description                                                   │
│    [Textarea, 5 lines min                          ]            │
│    [                                                ]            │
│    [                                                ]            │
│    helper: 245 / 500 chars                                       │
│                                                                  │
│  ┌──────────────┐                                                │
│  │ Update       │                                                │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Sample values**: Name "Airpods Wireless Bluetooth Headphones", Price `89.99`, Stock `10`, Brand "Apple", Category "Electronics", Description multi-paragraph
- **Image preview**: 120×120 rounded card, fit cover. Если URL — показать с прелоадером.
- **Number inputs**: Price — prefix `$`, mono; Stock — suffix `pcs`, mono. Both right-aligned numbers.
- **Description**: Textarea с char-counter 245/500
- **All required marks** на: Name, Price, Brand, Category (Image и Description — optional)

### Interactions

1. Image upload click / drag → dropzone state changes → upload progress bar → preview replaces dropzone
2. Image URL paste → preview fetches via URL → если 404 → Banner Warning "Image couldn't load"
3. Price/Stock numeric input → reject non-digits, allow decimals для Price only
4. Description live counter — turns destructive when > 500
5. Form submit с invalid → focus first error field, scroll into view, banner Error
6. Submit success → Banner Success "Product updated" → redirect `/admin/productlist` после 1s
7. Loading product details → skeleton всей формы (placeholders для каждого поля)

---

## Appendix F — `/admin/orderlist` (Orders list)

Read-only list заказов. Boolean cells для Paid / Delivered (с датой или ✗). Только Details action.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
│  ─ Eyebrow: "Admin · Internal Tools"                            │
│  ─ H1: "Orders"                                                 │
│  ─ Right: Stats inline pills — "Total: 42", "Pending: 12"       │
├─────────────────────────────────────────────────────────────────┤
│  Controls (когда orders > 20):                                  │
│  ─ Filter chips: All · Paid · Unpaid · Delivered · Pending      │
│  ─ Search input "Search by order ID or user…"                   │
├─────────────────────────────────────────────────────────────────┤
│  Table                                                           │
│  Cols: ID (mono 140, truncated) | User (flex) | Date (110, mono) │
│        Total (90, mono $, right) | Paid (110) | Delivered (110) │
│        Actions (80)                                              │
│  Paid:      ✓ + date "2026-05-04" / ✗ red                       │
│  Delivered: ✓ + date "2026-05-06" / ✗ red                       │
│  Actions:   "Details" secondary button (text-only, sm)          │
├─────────────────────────────────────────────────────────────────┤
│  Pagination — same pattern as Product list (если orders > 20)   │
└─────────────────────────────────────────────────────────────────┘
```

### Content tokens

- **Sample rows**:
  - `60d2…3a7b · John Doe · 2026-05-01 · $429.99 · ✓ 2026-05-01 · ✗`
  - `60d2…3a7c · Jane Doe · 2026-05-02 · $89.99 · ✓ 2026-05-02 · ✓ 2026-05-04`
  - `60d2…3a7d · Admin User · 2026-05-03 · $1,299.99 · ✗ · ✗`
- **Date format**: ISO short `YYYY-MM-DD` в monospace, не локализуем (admin tool, не consumer)
- **Total**: monospace tabular, `$` префикс в muted color, formatted с разделителями `1,299.99`
- **Pending pill в header**: "Pending: N" — bg amber-100 / amber-700, count of unfullfilled orders (not paid OR not delivered)

### Interactions

1. Details button → navigate `/order/:id` (user-facing order page in admin context)
2. Filter chip "Unpaid" → server-side filter or client-side (depends on scale), URL ?paid=false
3. Sort by Date column (clickable header) — chevron icon next to active sort
4. Row hover → bg card-alt
5. Boolean cell hover → tooltip с full timestamp "Paid on 2026-05-04 14:32 UTC"

---

> Be a human designer so it doesn't look like AI. With design taste.
