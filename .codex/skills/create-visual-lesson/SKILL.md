---
name: create-visual-lesson
description: Create or revise a TechFlow technical lesson with a concise interview answer, conceptual explanation, production trade-offs, visual workflow, and follow-up questions. Use for adding lesson content; do not use for implementation-only UI tasks.
---

# Create a visual technical lesson

Create one lesson that helps a Vietnamese developer both understand the mechanism and explain it in an interview.

## Required outcome

- Start with a correct 30-second answer of two to four sentences.
- Establish the learner's mental model before introducing edge cases.
- Break the mechanism into observable steps with explicit actors and state changes.
- Explain at least one production trade-off and one common misconception.
- Add three interviewer follow-ups that deepen rather than repeat the main question.
- Fit content into `src/content/types.ts`; propose a schema extension only when the lesson cannot be expressed without losing meaning.

## Visual choice

Use a sequence for actor-to-actor messages, a state model for lifecycle changes, a flow for branching decisions, and a comparison for competing approaches. Do not create a visual that merely repeats adjacent prose.

## Quality boundary

Distinguish specification-backed behavior from implementation details and teaching simplifications. Mark claims that need current documentation verification. Do not label a lesson verified without a separate review.
