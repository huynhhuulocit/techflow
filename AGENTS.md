# TechFlow project instructions

TechFlow is a Vietnamese-first visual technical learning and interview-preparation product.

## Product invariants

- Preserve the three learning layers: quick interview answer, conceptual understanding, and production trade-offs.
- Every visual must explain a real mechanism; decoration alone is not a learning visualization.
- Vietnamese is the default learner language. Keep technical terms in English when translating them would reduce precision.
- Represent lessons through the shared schema in `src/content/types.ts`; avoid one-off page structures.
- Never present generated technical claims as verified without an evidence or review pass.

## Engineering workflow

- Keep the MVP client-side and low-cost until authentication, persistence, or paid AI features are explicitly requested.
- Run `npm run build` after implementation changes.
- Prefer accessible semantic HTML, keyboard-operable controls, and responsive layouts.
- Do not add an animation library for a motion that CSS can express clearly.

## Agent workflow

When the user explicitly asks for parallel agents on a substantial feature:

- Use `product_architect` to map scope, schema impact, and boundaries.
- Use `lesson_designer` for learning structure and interview depth.
- Use `visual_simulator` for workflow, state, and interaction specifications.
- Use `technical_reviewer` after implementation or before publishing lesson content.
- Parallelize read-only planning and review. Keep overlapping code edits sequential.
