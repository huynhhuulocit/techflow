---
name: review-tech-lesson
description: Review a TechFlow lesson or simulation before publishing for technical accuracy, misleading simplifications, interview usefulness, visual-state consistency, accessibility, and evidence gaps. This is a read-only review workflow.
---

# Review a technical lesson

Review the complete learner experience: prose, code, visual ordering, controls, and follow-up questions.

## Priority order

1. Incorrect technical claims or unsafe advice.
2. Visual sequences that imply the wrong causality, ordering, or ownership.
3. Simplifications presented as universal behavior.
4. Code that contradicts the explanation or cannot run as described.
5. Missing failure modes or production trade-offs central to the topic.
6. Accessibility and interaction failures.
7. Interview answers that are correct but impractical to deliver.

For each finding include severity, exact location, why it matters, and a precise correction. Separate blockers from improvements. Ignore purely stylistic preferences unless they obscure meaning.

Finish with one verdict: `blocked`, `ready after fixes`, or `ready to publish`. Never apply the fixes during this workflow.
