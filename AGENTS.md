# AGENTS.md

This file defines the core rules, philosophy, and constraints for anyone (human or AI) contributing to **Suluu**.

Suluu is a curated library of **beautiful, fluid, animated React components**.  
Every component must feel intentional, refined, and worth copying.

---

## 1. Core Philosophy

Only build components where **animation is a meaningful part of the experience**, not decoration.

### Components must feel:

- **Elegant** — refined, calm, and deliberate
- **Soft / Springy** — natural motion with carefully tuned springs
- **Premium** — high-end and polished, never cheap or generic
- **Slightly unexpected** — has a memorable personality
- **Useful** — solves a real UI need in products

If a component can exist without its animation and still feel complete, it probably does not belong in Suluu.

---

## 2. What Suluu Is (and Is Not)

### Suluu is:
- A curated set of high-quality animated primitives and micro-interactions
- Motion-first
- Copy-paste friendly (shadcn-compatible)
- Minimal and elegant in visual design

### Suluu is not:
- A full design system
- A replacement for shadcn/ui or Radix
- A collection of basic components with weak hover effects
- A place for flashy, noisy, or overly complex animations

Quality and restraint are more important than quantity.

---

## 3. Animation Principles

- Prefer **spring-based** motion (`motion/react`) over duration-based easing
- Motion should feel physical and natural
- Always respect `prefers-reduced-motion`
- Avoid excessive movement — animation should enhance, not distract
- Micro-interactions should feel responsive and tactile
- Layout animations and shared element transitions are encouraged when they improve clarity

### Good examples of meaningful animation:
- A switch thumb that settles with a soft spring
- Digits that roll like a refined odometer
- A button that is magnetically attracted to the cursor
- A surface that morphs fluidly between states

### Bad examples:
- Simple `scale(1.05)` on hover
- Opacity fades with no personality
- Animations that feel disconnected from user action

---

## 4. Icon Rules

### Default icons must be custom SVGs
- Create icons as **inline custom SVGs**
- Do **not** add icon library dependencies (no `lucide-react`, `heroicons`, etc.)
- Keep SVGs optimized, minimal, and animation-friendly
- Structure SVGs so individual parts can be animated when needed

### End users must remain free
- Always allow icon customization
- Prefer patterns like:
  - `icon` prop
  - `children`
  - render props
- Never force users to use Suluu’s default icons

The goal is: **beautiful defaults, zero lock-in**.

---

## 5. Component Design Rules

### API Design
- Keep public APIs small and focused
- Prefer clear, predictable prop names
- Support both controlled and uncontrolled patterns when state is involved
- Expose `className` and relevant HTML attributes
- Use TypeScript strictly

### Styling
- Use Tailwind CSS v4
- Prefer CSS variables for theming
- Components should be visually neutral by default when they are primitives
- Avoid shipping heavy pre-styled surfaces unless the component’s purpose is the surface itself

### Composition
- Prefer composable primitives over monolithic components
- Make it easy to restyle and extend

---

## 6. Accessibility Requirements

Every component must:
- Be keyboard accessible
- Have correct ARIA attributes when needed
- Manage focus properly
- Support reduced motion
- Maintain sufficient contrast in both light and dark themes

Accessibility is not optional.

---

## 7. Code Quality Standards

- Write clean, readable, and maintainable code
- Prefer simplicity over cleverness
- Avoid over-engineering
- Keep files focused on a single responsibility
- Animate with intention — remove any motion that does not improve the experience
- Leave the code in a state that another developer can easily understand

This project prioritizes **long-term quality** over speed.

---

## 8. Documentation Expectations

Every component should include:
- Clear purpose description
- Live interactive examples
- Installation methods (registry first, npm second)
- Props documentation
- Theming notes
- Accessibility notes when relevant

Documentation should feel as refined as the components themselves.

---

## 9. Decision Filter

Before adding or approving a new component, ask:

1. Is animation essential to this component’s identity?
2. Does it feel elegant and premium?
3. Is it useful in real products?
4. Can it be implemented cleanly and maintainably?
5. Does it align with Suluu’s restrained, high-quality aesthetic?

If the answer to any of these is “no”, do not add it.

---

## 10. Final Principle

Suluu should feel like a small collection of components that someone is proud to use — not a large library that someone has to manage.

**Fewer components. Higher quality. More intention.**
