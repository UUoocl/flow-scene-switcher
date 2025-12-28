# Project Context
- **Stack**: Svelte 5 + Vite + TypeScript.
- **Styling**: Tailwind CSS.
- **Library**: `@xyflow/svelte` (Svelte Flow).
- **Type**: Standalone SPA (No SvelteKit).

# Coding Rules
- Use Svelte 5 Runes (`$state`, `$derived`, `$props`).
- Use Tailwind utility classes for styling (e.g., `class="w-full h-screen"`).
- **Svelte Flow**: 
    - Container must have defined height/width.
    - Import styles: `import '@xyflow/svelte/dist/style.css'`.
    - Nodes/Edges must be reactive `$state` arrays.