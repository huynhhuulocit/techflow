# Bilingual question authoring and AI simulation

This document describes TechFlow's authoring baseline. It is a local content-author tool; it does not turn the Question Bank into a public CMS and it never publishes AI-generated content automatically.

## Current scope

- Vietnamese (`vi`) remains the default language.
- The original Question Bank remains the unchanged set of 585 Vietnamese questions imported from GameStream.
- English (`en`) is a 45-question TypeScript pilot whose items share `questionId` values with the Vietnamese source.
- If an English translation does not exist, the UI does not silently substitute Vietnamese. The counter must make the available English scope explicit.
- Question Studio stores drafts in the local browser. Drafts are not mixed into the generated snapshot or published content.
- Two AI tasks are supported: generating question drafts and generating a simulation draft from a question draft.

## Data model and review states

English content is an overlay keyed by `questionId`; it does not duplicate source metadata or change the Vietnamese IDs and ordering. Each translation stores `translatedFromHash` so a changed source can be detected.

Important states are:

- `imported-needs-review`: a structurally valid Vietnamese import that has not completed technical review.
- `ai-translated-needs-review`: an English pilot translation that has not completed language review; source technical review is tracked separately.
- `draft-needs-review`: a manually entered or imported draft.
- `generated-needs-review`: an AI-generated question or simulation; this never means verified.
- `reviewed`: reserved for content with valid reviewer, timestamp, evidence, and content-hash metadata.

## Question Studio

Question Studio supports:

1. Manually entering locale, topic, level, and the four learning blocks.
2. Importing draft-schema JSON or Markdown with `Conclusion`, `Mechanism`, `Trade-off`, and `GameStream` markers.
3. Warning about exact or near duplicates before saving.
4. Copying a localized Question Bank item into an unsaved draft without modifying the source question.
5. Exporting saved drafts plus valid current form content as JSON for review or another workflow.
6. Generating question drafts with AI when the local author API is configured.
7. Generating a simulation draft for the selected question and previewing it with the deterministic player.

Storage is explicitly versioned. Locale uses `localStorage["techflow.locale"]`, drafts use `localStorage["techflow.author.question-drafts.v1"]`, and a token is written to `sessionStorage["techflow.author.token.v1"]` only after the author selects **Keep token in this tab**. If browser data is corrupt, blocked, or over quota, the UI surfaces a clear error and does not silently overwrite the remaining data.

AI question batches are appended to local draft storage after validation and duplicate checks. A generated simulation is attached only to the current unsaved form and must be saved explicitly. TechFlow removes it when generation inputs or its source binding become stale.

## Local AI architecture

```text
Question Studio
  -> same-origin POST + local author token
  -> Vite development middleware
  -> OpenAI Responses API + Structured Outputs
  -> schema validation + semantic validation
  -> local draft marked generated-needs-review
  -> human review
```

The API key, model, and author token are read only by the development server. Do not use the `VITE_` prefix for secrets because variables with that prefix may be bundled into frontend code.

Create `.env.local` from `.env.example`:

```dotenv
VITE_ENABLE_AUTHOR_STUDIO=false
OPENAI_API_KEY=<server-only-key>
OPENAI_MODEL=<model-supporting-structured-outputs>
TECHFLOW_AUTHOR_TOKEN=<long-random-local-token>
```

Restart `npm run dev` after changing environment variables. Enter the author token in Studio; until **Keep token in this tab** is selected it exists only in form memory. Never enter the API key in Studio.

Studio is automatically available during development. The `false` value is the safe production-build default; this flag controls production UI visibility but does not provision an API. Treat the generation brief, source notes, existing question titles, current four-layer question content, and failure-scenario text as data disclosed to the external AI provider. Never place passwords, tokens, customer data, or other secrets in these fields.

Local endpoints:

```text
POST /api/author/questions/generate
POST /api/author/simulations/generate
```

The middleware restricts requests to loopback and same origin, requires JSON plus the author token, limits bodies to 32 KiB, allows five requests per ten-minute client/token window, permits one generation in flight, and applies a 30-second upstream timeout. If any required server value is missing, the endpoint returns `ai_not_configured` and existing local drafts remain intact.

These endpoints exist only in the Vite development server. `npm run preview` serves the static production bundle and does not provide the AI author API. A production rollout requires an authenticated server route, secret manager, quota/billing policy, and dedicated audit log; never expose the development middleware to the Internet.

## Safe, learning-oriented simulations

AI returns only a `SimulationSpec` containing actors, scenarios, state snapshots, transitions, and invariants. TechFlow's renderer owns all HTML/CSS and state changes. The schema exposes no executable markup, URL, coordinate, or style fields; all generated strings are rendered as text.

A valid simulation requires:

- exactly one happy path;
- valid actor and highlight references;
- full snapshots with consistent state keys through each transition;
- invariants that reference real state keys;
- every invariant passing on the happy-path terminal snapshot;
- a failure scenario that cannot terminate in `success`;
- a clear learning objective, misconception, and takeaway;
- a `generated-needs-review` badge until an evidence/review pass is complete.

The player must be keyboard operable, provide Step/Back/Play/Pause/Reset, include a readable non-animated transcript, and respect `prefers-reduced-motion`.

## Validation before merge

```bash
npm run content:check
npm run content:validate
npm test
npm run lint
npm run build
```

Then verify in a browser:

1. Switch between VI and EN and reload to verify locale persistence.
2. Confirm that VI has 585 questions, the English pilot has 45 TypeScript questions, and no fallback occurs.
3. Create, edit, delete, export, and import drafts; reload to verify persistence.
4. Try AI without configuration and verify that the error does not remove a draft.
5. With a test key, verify that output remains a draft, passes the schema, and opens in the simulation player.
6. Check keyboard behavior, reduced motion, mobile layout, and the browser console.
