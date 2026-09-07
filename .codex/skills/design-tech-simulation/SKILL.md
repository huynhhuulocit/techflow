---
name: design-tech-simulation
description: Design or revise an interactive TechFlow simulation that teaches a technical workflow, lifecycle, failure mode, or trade-off through state and controls. Use when interaction materially improves understanding; skip decorative motion.
---

# Design a technical simulation

Turn a mechanism into an implementation-ready interaction rather than an animation storyboard alone.

## Specify

- Learning objective and the misconception the simulation should correct.
- Actors, initial state, valid transitions, terminal state, and invariants.
- Controls such as play, pause, step, reset, speed, scenario, or parameter inputs only when useful.
- What changes visually at every transition and the explanation shown to the learner.
- At least one failure or what-if scenario when it is part of real system behavior.
- Keyboard interaction, accessible labels, color-independent state, and reduced-motion behavior.

## Implementation boundary

Prefer deterministic local state for lesson playback. Separate the state model from rendering so another visual renderer can reuse it. Use CSS for simple transitions; add a dependency only for graph layout, gesture handling, or complex coordinated motion that would otherwise be fragile.

Return acceptance criteria that can be tested without relying on screenshots alone.
