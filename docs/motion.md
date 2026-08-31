# Motion System

## Intent

Motion communicates hierarchy, feedback, or state change. Razchly does not use decorative perpetual animation.

## Intensity

Default intensity is 4 of 10. The product should feel responsive and tactile, not cinematic.

## Authored moments

### Financial statement reveal

The primary statement reveals once when Dashboard enters. Desktop uses a horizontal document reveal; mobile uses a vertical paper reveal. It communicates the hierarchy of the current financial position.

### Route change

Route content enters with a short opacity and 8px vertical transition while the shell remains stationary.

### Sheet and dialog

- Mobile sheet: translate from the bottom with a restrained ease-out
- Desktop dialog: short opacity and scale correction
- Backdrop: opacity only
- Exit is slightly faster than entry

### Command palette

Short fade, 12px vertical correction, and minimal scale change. Search results use color and opacity feedback, not repeated entrance animation.

## Timing tokens

| Token | Duration | Use |
|---|---:|---|
| Instant | 0-100ms | Press feedback |
| Fast | 160-200ms | Hover and focus color |
| Standard | 240-320ms | Popover and route change |
| Deliberate | 500-720ms | One authored statement reveal |

Default ease-out: `[0.16, 1, 0.3, 1]`.

## Performance

- Animate transform, opacity, and carefully bounded clip-path.
- Never track scroll position in React state.
- Avoid animating width, height, top, or left.
- Do not add GSAP, WebGL, or another animation dependency.
- Lazy route loading remains intact.
- Pause or remove any motion that causes dropped frames on a mid-range Android device.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Render content immediately.
- Disable statement reveals and route movement.
- Keep state changes understandable through color, text, and layout.
- Do not remove content or delay interaction.

## Prohibited motion

- Scroll hijacking
- Auto-playing marquee
- Parallax on operational data
- Repeating card float or pulse
- Hover tilt
- Confetti for routine saves
- Motion attached to every list row
