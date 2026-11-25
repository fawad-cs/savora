# SAVORA — More than food. It's an experience.

A cinematic, multi-page restaurant website built with **HTML, CSS and vanilla JavaScript** plus GSAP, ScrollTrigger, Three.js, Lenis and Lucide. No frameworks, no build step and no Python.

## Run it locally

The pages use ES modules and an import map, so they need to be served over HTTP (opening the files directly with `file://` will not work):

```bash
npx serve .          # or: npx vite   /   python is not required
```

Then open `http://localhost:3000`. Libraries load from CDNs (cdnjs, jsDelivr, unpkg) at pinned versions: GSAP 3.12.5, Three.js 0.169.0, Lenis 1.1.13, Lucide 0.460.0.

## Pages

| Page | File | What works |
|---|---|---|
| Home | `index.html` | Loader, live 3D hero, scroll-scrubbed signature burger film, interactive 3D showcase (4 dishes), signature dishes, horizontal preparation reel, chef's selection with live preview, atmosphere, guest experience, sample reviews carousel, reservation CTA |
| Menu | `menu.html` | 20 dishes, category filter (deep-linkable: `menu.html#pizza`), search across names/ingredients/diet labels, empty state, quick-view dialog with a rotatable 3D model |
| Dish details | `dish.html#<dish-id>` | Reusable page: 3D viewer (views, zoom, layer reveal), ingredients, preparation story, model layers, related dishes, back to menu, not-found state |
| Our Story | `story.html` | Beginning + timeline, culinary philosophy, ingredient selection, kitchen, chef, craft (3D renders), atmosphere |
| Experience | `experience.html` | Dining atmosphere, private dining, special occasions, chef's table, interior gallery, the evening timeline, CTA |
| Reservations | `reservations.html` | Validated form (required fields, email, phone, date range, Mondays closed, time slots per day, guests, 500-char requests) and an honest "not yet booked" confirmation with copyable details |
| Contact | `contact.html` | Contact details, hours, validated form with an honest "not sent" result, stylised sample map, social links |

`reservations.html#private` pre-fills an Oak Room enquiry (linked from the Experience page).

## Honesty notes (please read before going live)

- **No backend is connected.** The reservation and contact forms validate and prepare the request, then clearly say nothing has been booked or sent and offer a Copy button. Connect a booking system / email service (e.g. a serverless function) and replace the `onValid` callbacks in `js/reservations.js` and `js/contact.js`.
- **Sample content.** Dishes, prices ("demonstration menu prices"), the chef profile, producer names, reviews, address, phone and map are fictional and labelled on the page.
- **No photography.** This build ships no photos. Every dish image is a **real-time 3D render** generated in the browser, and atmosphere images are **SVG illustrations** labelled "Illustration". To use real photos, replace any `<figure data-art="…">` with an `<img>` (WebP recommended) and remove the label.

## 3D food assets — how they work

No `.glb` models were available, so instead of faking 3D with rotating photos, every dish is **genuine procedural geometry** built in `js/three/food-model.js`:

- **Lathe profiles** for buns, plates, bowls, glasses, tart shells and the pizza crust.
- **Displaced meshes** for the seared patty, draped cheese, ruffled lettuce, octopus tentacles and the fish fillet.
- **Instanced meshes** for sesame seeds, risotto grains, pepperoni, herbs, berries and sauce dots.
- **Canvas-painted textures** for char, crumb, marbling, tomato cross-sections and crema.

Each builder returns a `Dish` with named `layers`, an `explode(t)` method for ingredient separation and a `dispose()` that frees geometry, materials and textures.

`js/three/food-scene.js` provides:
- `DishViewer`: an interactive viewer with OrbitControls (drag/pinch/zoom), camera presets (top, front, side, ¾, close-up), layer reveal, keyboard orbit (← →, + −), auto-pause when off-screen, and full disposal.
- `renderDishImage()`: a single shared WebGL context that renders dishes to WebP images for cards. Renders load lazily, are queued and cached for the session.
- WebGL detection with graceful fallbacks (messages and illustrations).

### Swapping in real `.glb` models

Put models in `assets/models/` and add a builder that loads them with `GLTFLoader` (`three/addons/loaders/GLTFLoader.js`). As long as it returns `{ root, inner, layers, explode, dispose, spacing }`, every viewer, render and scroll sequence keeps working. For the burger film, name the layer nodes `topBun`, `lettuce`, `tomato`, `cheese`, `patty`, `bottomBun`.

### The signature burger sequence

`js/three/scroll-experience.js` pins the section and scrubs one GSAP timeline with ScrollTrigger:

1. The burger drops in from above while turning into place.
2. It settles at centre in a front view.
3. The layers separate vertically (`explode 0 → 1`) as the camera pulls back.
4. Each ingredient slides forward in turn with an editorial caption.
5. The layers reassemble.
6. The camera moves through top-down, front, side, three-quarter and close-up views.
7. Final full-screen presentation with a slow 360° turn and the dish CTA.

When the visitor prefers reduced motion (or WebGL is missing), it becomes a static layout: an exploded 3D render (or an SVG illustration) with all captions visible.

## Design system

- **Colour.** Warm black `#0d0b09`, charcoal `#151210` / `#1c1814`, ivory `#f3ece0`, cream `#d9cfbf`, burnt orange `#c8582a`, muted gold `#b8945a` / `#d4b47c`.
- **Type.** Bodoni Moda for display and editorial italics, Manrope for text. Fluid sizes with `clamp()`.
- **Spacing.** 8-px based scale (`--s1`…`--s8`), section padding `clamp(5rem, 11vw, 10rem)`, max width 1320px (1480px on large screens).
- **Buttons.** Outline, solid ember and gold variants with a fill-sweep hover and magnetic pull on pointer devices. All are 44px+ targets.
- **Navigation.** Transparent over the hero, solid after scrolling, hides on scroll-down, underline active state, full-screen mobile overlay with staggered links, Escape to close.
- **Cards.** Square-edged frames, a render that scales slightly on hover, dotted price leaders on the menu.
- **Motion principles.** Slow expo easing, one purpose per animation, and line-masked text reveals, clip-path image reveals, parallax, horizontal reveals and curtain page transitions. Everything is disabled under `prefers-reduced-motion`.

## Structure

```
savora/
├── index.html  menu.html  dish.html  story.html  experience.html  reservations.html  contact.html
├── css/   style.css (design system) · responsive.css · home.css · menu.css · dish.css · story.css · experience.css · forms-pages.css
├── js/    main.js · navigation.js · animations.js · components.js · forms.js · art.js
│          home.js · menu.js · dish.js · story.js · experience.js · reservations.js · contact.js
│          data/menu-data.js
│          three/food-model.js · three/food-scene.js · three/scroll-experience.js
└── README.md
```

## Accessibility & performance

Semantic landmarks, skip link, labelled forms with live error messages and focus management, keyboard support for tabs, carousels, viewers and dialogs, and alt text on every render and illustration. Three.js loads lazily (dynamic `import()`), 3D models build only when needed, renderers pause off-screen and are disposed on close or page hide, and pixel ratio is capped on low-power devices.
