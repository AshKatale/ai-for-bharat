# AI Discoverability Optimization Platform - Frontend UI Guide

Welcome to the frontend repository for the AI Discoverability Optimization Platform. This document serves as both a setup guide and a **comprehensive UI design system manual** to ensure visual consistency across all components.

## 🚀 Quick Start

Built fully in JavaScript with React + Vite + Tailwind CSS + React Router + Recharts + Axios.

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

---

## 🎨 UI Design System & Guidelines

Our application uses a **Modern Dark Mode Neon Green aesthetic**, prioritizing glassmorphism, dynamic gradients, clear visual hierarchy, and subtle micro-animations. Please follow these guidelines to maintain a premium feel.

### 1. Color Palette

We utilize Tailwind's extended color configuration (`tailwind.config.js`). Always use these variables instead of hard-coding hex values.

*   **Backgrounds**:
    *   `bg-dark-base` (`#000000`) - The primary pitch-black background.
    *   `bg-dark-card` (`#0a0f25`) - Solid background for standard cards.
    *   `bg-dark-muted` (`#0f172a`) - For subtle contrasted sections.
*   **Green Theme & Accents**:
    *   `brand`: `bg-brand` (`#22c55e`), `bg-brand-light` (`#4ade80`), `bg-brand-dark` (`#16a34a`).
    *   `accent`: `bg-accent` (`#10b981`), `bg-accent-dark` (`#059669`).
*   **Borders**:
    *   Use `border-dark-border` (`rgba(255,255,255,0.08)`) or `border-white/10`.

### 2. Typography

*   **Font**: We use the **Inter** font family (`font-sans`). It should be your default across the app.
*   **Text Colors**:
    *   Primary Text: `text-slate-100` or `text-slate-200`.
    *   Muted Text: `text-slate-400` or `text-slate-500`.
    *   Highlighted/Gradient Text: Ensure important text pops out. Using our custom class:
        ```html
        <span className="gradient-text">Beautiful Text</span>
        ```

### 3. Core Utility Classes (Custom CSS)

Our `index.css` provides powerful, reusable classes that form the core of our "Neon Glass" aesthetic. **Always use these instead of recreating them from scratch:**

#### Cards & Containers
*   `.glass-card` : Produces a frosted glass effect with a subtle border. It includes built-in hover effects (glow and upward lift). Use this for almost all main components and sections.
*   `.glass` : A heavier blur effect without the active hover states. Good for static overlays or headers.

#### Buttons
*   `.btn-primary` : Standard solid button with a green-to-emerald gradient, hover transition, and active scaling. (e.g., "Submit", "Start Analysis").
*   `.btn-outline` : Slate border button that glows green and fills on hover. Excellent for secondary actions.
*   `.btn-ghost` : Text-only button that gets a slight background on hover. Great for cancels, mild navigation.

*Usage Example:*
```jsx
<button className="btn-primary flex items-center gap-2">
  <PlayIcon size={18} /> Run Task
</button>
```

#### Inputs
*   `.input-field` : Gives inputs a dark glass background, subtle border, and a glowing green ring when focused.
    ```jsx
    <input type="text" className="input-field" placeholder="Search..." />
    ```

#### Glows
*   `.glow-green` : Adds a soft `brand` green shadow.
*   `.glow-emerald` : Adds an `accent` emerald shadow.

### 4. Animations

Animations make our app feel alive and responsive. We have bespoke and standard Tailwind animations available in `tailwind.config.js`:

*   **Entrance Animations**: Use `.animate-fade-slide` for elements entering the DOM (like a newly loaded list item, card, or modal). It fades and slides up.
*   **Loaders**: Use `.shimmer` class for skeleton loading bars or `.animate-pulse-dot` for discrete loading dots.
*   **Background / Ambiance**: The background already includes ambient drift animations. Use `.animate-float` for illustrations or icons you want to gently hover.

### 5. Best Practices Checklist for New UI

*   [ ] **Does it fit the Dark Mode theme?** Avoid stark white backgrounds. Rely on `bg-white/5` or `bg-dark-card` for layering.
*   [ ] **Did I use `.glass-card`?** Instead of `bg-slate-900 rounded-lg p-4`, try `className="glass-card p-4"`.
*   [ ] **Are buttons standard?** Use `btn-primary`, `btn-outline`, or `btn-ghost` directly instead of cobbling together raw classes.
*   [ ] **Is the layout responsive?** Make sure you use Tailwind's `md:`, `lg:` prefixes appropriately.
*   [ ] **Does it feel "premium"?** Add `transition-all duration-200` to interactive elements so hovers fade in nicely. Rely on our predefined custom animations and glows to make it pop.
