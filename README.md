# Anthony Zoss – Import-ready React version

This is a Vite + React + TypeScript + Tailwind/shadcn-ready version of the original static `index.html`.

The visual design is preserved in `src/App.css`. The effects are imported in `src/App.tsx`:

```tsx
import { Component as InfiniteGrid } from "@/components/ui/the-infinite-grid"
import { SpinningText } from "@/components/ui/spinning-text"
```

## 1. Install dependencies

```bash
npm install
```

## 2. Add the imported effects

```bash
npx shadcn@latest add https://21st.dev/r/moazamtrade/the-infinite-grid
npx shadcn@latest add @magicui/spinning-text
```

## 3. Run the website

```bash
npm run dev
```

## Important note about the Infinite Grid

The 21st.dev component may install as a full demo component, not only a pure background. If you see unwanted demo text or buttons, open:

```txt
src/components/ui/the-infinite-grid.tsx
```

and remove the demo title/buttons there, keeping only the actual grid/background part. This is normal for shadcn-style components: they are copied into your project so you can edit them locally.

The grid is wrapped in `.imported-grid-layer`, which is positioned inside `.viewport`, so it remains clipped to the inner square.
