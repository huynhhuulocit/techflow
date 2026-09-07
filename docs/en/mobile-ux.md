# Responsive mobile UX

## Goals

- Keep the complete primary navigation discoverable on tablet and mobile.
- Show every topic filter without horizontal scrolling.
- Preserve clear touch targets, keyboard focus, and a page without horizontal overflow.

## Breakpoint behavior

| Breakpoint | Behavior |
| --- | --- |
| Above `960px` | Primary navigation is displayed inline and the menu button is hidden. |
| At `960px` and below | Navigation becomes a disclosure panel. The trigger exposes `aria-expanded`; Escape closes the panel and returns focus to the trigger; outside interaction also closes it. Moving to desktop resets the open state. |
| At `850px` and below | The hero becomes one column, section actions stack, and stats and lesson cards use two columns. |
| At `560px` and below | Topic filters use a two-column grid, lesson cards use one column, and typography and spacing become more compact. |

## Accessibility invariants

- Navigation retains the semantic `nav` element; page navigation does not use `role="menu"`.
- Topic filters form a labeled group and every button exposes its state through `aria-pressed`.
- The menu, filters, search action, and section actions have touch targets close to or equal to `44px`.
- Interactive cards and controls have a visible focus ring.

## Regression checks

Check both Vietnamese and English at `320px`, `375px`, `768px`, and desktop widths from `1024px`. `documentElement.scrollWidth` must equal the viewport width, and the topic filter must not have internal overflow.
