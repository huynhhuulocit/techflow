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
- Work directly on `main` and push `origin main` by default unless the user explicitly requests another branch or says not to push.
- Before deployment, run `npm run verify:deploy` plus any relevant browser checks.
- After a requested change passes validation, stage only in-scope files, create a descriptive commit, and push without waiting for a separate review confirmation.
- A push to `main` is a production deployment; a push to another branch is a Cloudflare preview deployment.
- Never push secrets, local environment files, failed validation, or unrelated workspace changes.
- If the remote has diverged or rejects a normal push, stop and report the blocker; never force-push.
- Removing the pre-push approval gate does not mark generated technical claims as reviewed; evidence and content-review metadata remain required.
- Prefer accessible semantic HTML, keyboard-operable controls, and responsive layouts.
- Do not add an animation library for a motion that CSS can express clearly.

## Agent workflow

When the user explicitly asks for parallel agents on a substantial feature:

- Use `product_architect` to map scope, schema impact, and boundaries.
- Use `lesson_designer` for learning structure and interview depth.
- Use `visual_simulator` for workflow, state, and interaction specifications.
- Use `technical_reviewer` after implementation or before publishing lesson content.
- Parallelize read-only planning and review. Keep overlapping code edits sequential.
