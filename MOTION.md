# Portfolio motion

The site remains buildless HTML, CSS, and JavaScript. The existing portfolio repository contained one HTML document, so this change keeps that framework and its content rather than starting an unrelated React application. The changes are on `codex/portfolio-scroll-motion`. No production deployment or GitHub push is included.

## Run and inspect

```sh
npm run dev
npm test
```

The local preview serves at http://127.0.0.1:4173. Run `npm run preview:export -- /absolute/path/portfolio-motion.html` to create a standalone, portable preview. The export embeds the motion code, stylesheet, portrait, and clinic capture. Google Fonts remain an optional network request, with local fallbacks.

`npm run test:browser` checks the running preview using an installed Playwright package. `PLAYWRIGHT_MODULE` may point to the installed package, and `BROWSER_EXECUTABLE` may select a system Chromium browser. `QA_OUTPUT_DIR` optionally saves screenshots outside the repository.

## Architecture

- `index.html` retains the original introduction, about, services, six existing projects, skills, and contact. It adds the name masthead, semantic portfolio story, four-step process, FAQ, two new projects, and footer lettering. All content has a readable static layout.
- `motion/math.js` defines pure normalized-progress and easing functions. Story transitions are a function of position, not a series of irreversible trigger events. Reverse scrolling reconstructs the same composition.
- `motion/app.js` owns one demand-driven requestAnimationFrame scheduler. A passive scroll listener updates a target. Each frame exponentially settles the visual scroll position toward it, then updates the masthead, six thumbnails, scene state, and process state. The loop stops when settled. Layout measurements occur on initialization, resize, font completion, and image loading, not inside the scroll update.
- `motion/text-reveal.js` measures visual lines after fonts settle. It keeps the original inline markup as the accessible version and creates one `aria-hidden` visual copy. Words retain inline emphasis. Width changes trigger remeasurement. Explicit line breaks remain intact.
- `motion/motion.css` defines typography-preserving reveals, progressive layouts, image hover, native details expansion, SVG illustration transitions, CTA thumbnail entrance, footer glyph transitions, and supported cross-document View Transitions.

No React state or per-card animation loop is involved. No canvas, WebGL, GSAP, or Lenis dependency is required for this implementation. This follows the actual reference's shared, damped scroll-controller approach. Native browser scrolling remains intact; only the visual response settles behind scroll position.

## Name parallax

The name sits in a sticky hero with a perspective camera. Scrolling moves it upward and backward on the z axis. The project section has a higher stacking layer and overlaps the hero's final portion, so it passes in front of the receding name. This is layered depth, not simply translating all hero content at the same speed.

The hero falls back to normal document flow if its contents cannot fit the viewport. The project overlap is only applied when hero pinning is active.

## Portfolio story

A 625svh wrapper contains a sticky 100svh stage. The semantic project links converge at the centre, expand into a surrounding composition, and gather near the bottom as the story closes. The central area cycles through:

1. Project introduction and thumbnails.
2. Enterprise experience with a client-name grid and delivery attribution.
3. TYS contribution and delivery evidence.
4. A closing invitation for projects and roles.

The background card overlay reaches 95% opacity during the central evidence scenes. Inactive scene links and inactive thumbnail links are `inert` and excluded from the accessibility tree. All eight projects remain permanently available in the normal gallery.

There is no fabricated testimonial. The third scene uses the TYS contribution and support-call result supplied by Nikhil. The client-name grid is text rather than copied third-party logo artwork. Enterprise attribution is retained.

## Adjustable values

| Control | Location | Initial value |
| --- | --- | --- |
| Story height | `--story-height` in CSS | 625svh |
| Process height | `--process-height` in CSS | 350svh |
| General text entrance | `--motion-enter` | 900ms |
| Per-line stagger | `--motion-stagger` | 80ms |
| Hero text entrance and stagger | `--motion-hero`, `--motion-hero-stagger` | 720ms, 64ms |
| Text exit | `--motion-exit` | 480ms, no stagger |
| Entrance blur and movement | `.split-line` state rules | 5px, .25em |
| Visual scroll settling | `MOTION.settling` in app.js | .18 seconds |
| Masthead upward travel and depth | `MOTION.heroTravel`, `heroDepth` | 170px, 650px |
| Story introduction lead | `MOTION.storyLead` | .65 viewport heights |
| Scene boundaries | `sceneAt` in math.js | .32, .52, .75 |
| Thumbnail arrangement | `positions` in app.js | six normalized x/y centres |
| Card dimming | `storyFrame` in math.js | up to .95 |
| Project-image hover | CSS hover rules | 1.03 scale, 750ms |
| CTA entrance and hover | CSS thumbnail rules | 8rem offset, 70ms stagger, 2.5rem lift |
| Footer glyph reveal | CSS path rules | 12px blur, 550ms duration, 35ms stagger |
| Page entrance | `page-in` in CSS | 640ms, 1rem upward travel |

Changing scene thresholds may also require adjusting the thumbnail link-active range and dimming/gather intervals so interaction remains aligned with the visible scene.

## Process and supporting interactions

Desktop process steps use a sticky stage. Scroll position selects the active step. Buttons also support Enter, Space, arrow keys, Home, and End. Descriptions expand with grid-template-rows and opacity. Each step owns a lightweight SVG, which fades and scales in while its elements pop, grow, or reveal horizontally.

The same markup becomes an expanded sequence with inline figures on smaller screens. FAQ uses native details/summary. Browsers supporting intrinsic-size interpolation get smooth expansion, and older browsers retain normal details behaviour. Thumbnail entrance is separate from hover/focus lift so their transforms do not conflict.

The footer is an original SVG wordmark made from letter paths. Its blur/opacity effect acts on each glyph. Cross-document View Transitions are progressive CSS support for future same-origin page navigation. Current section anchors keep native scrolling, and cross-origin product links do not receive page transitions.

## Accessibility, fallback, and cleanup

Long pinned sequences require a fine-hover desktop viewport at least 900px wide and 760px tall, with no reduced-motion preference and IntersectionObserver available. Other configurations use ordinary document flow. The process shows every description; all story content and project links remain available. JavaScript failure leaves the original page readable.

Reduced-motion preference changes are handled while the page is open. Interactive hidden scenes use inert, not just opacity. The split copy is always aria-hidden, while the original text remains accessible. Images have reserved dimensions. Keyboard focus is visible. The mobile navigation supports Escape.

The controller exposes `destroy()` for page lifecycle or later framework integration. It aborts listeners, disconnects its observer, cancels its frame and resize timer, restores the semantic text, removes enhancement classes, and releases inactive controls. Pagehide destroys it; persisted pageshow remounts it.

## Reference and differences

Reinspected [Outredge](https://www.outredge.com/) and its delivered StoryScene, split-text, and reveal modules. Its scene controller uses native scroll position, requestAnimationFrame settling, semantic cards, optional canvas rendering, and data-driven text states.

This implementation reproduces the motion structure with DOM transforms. It deliberately omits the reference's optional WebGL card-bending and shader hover. The project art, portfolio copy, evidence scene, process figures, and wordmark belong to this portfolio. Timings and scene spacing remain visually tunable rather than a claim of pixel-identical reproduction.
