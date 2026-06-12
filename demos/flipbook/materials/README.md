# Materials — how to add scrapbook assets

This folder holds all external scrapbook materials. Built-in
procedural pushpins/doodles/default-stickers still live in
`src/scrapbookAssets.js` as hand-drawn React SVG; this folder
is for **files you design yourself** (cameras, TVs, illustrated
holders, cute stickers, etc.).

```
public/materials/
├── frames/     ← SVG or PNG frames with a photo window
├── stickers/   ← SVG or PNG flat decorations
└── tape/       ← (reserved — patterned washi tape)
```

**SVG is strongly preferred for frames** — it's vector (crisp at
any size), auto-detects the photo window, and can be recolored.
PNG is supported as a fallback for complex illustrations where
you'd rather not deal with vector.

The algorithm is **seeded** — existing dates keep their layouts.
New assets only influence pages rendered after registration.

---

## 1. SVG frames ← recommended

### The only rule

Your SVG must contain **one rectangle** (or any shape) named
`photo-window`. The loader finds it, uses its bbox as the photo
area, and hides it. You don't measure anything.

| Tool        | How to mark the photo window                                |
| ----------- | ----------------------------------------------------------- |
| **Figma**   | Draw a rectangle, rename the layer to `photo-window`, export as SVG. Figma writes `data-name="photo-window"` on the element — the loader recognizes it. |
| **Illustrator** | Select the rectangle, open the Layers panel, rename it `photo-window`. On export, enable "Preserve IDs". |
| **Inkscape** | Select the rectangle, *Object → Object Properties… → Label:* `photo-window`. Or set the ID directly. |
| **Raw SVG** | Just `<rect id="photo-window" x="..." y="..." width="..." height="..."/>` |

Design considerations:
- **Aspect ratio:** the `photo-window` rect should be 3:4 portrait
  (width:height = 3:4). The layout engine expects portrait photos.
- **Draw the rest of the camera/frame AROUND the rect** so no
  visible illustration covers the rect's interior. The loader
  hides the rect — it doesn't cut a hole — so anything drawn on
  top of the rect stays visible.
- **viewBox required.** SVGs without a `viewBox` fall back to
  `width`/`height` attributes; include one to be safe.

### Step-by-step

1. Design your camera/TV/frame in Figma (or your tool of choice).
2. Add one rectangle layer named `photo-window` positioned where
   the photo should appear.
3. Export as SVG to `public/materials/frames/camera-retro.svg`.
4. Open `src/materialsCatalog.js` and add to `SVG_FRAMES`:

```js
{
  id:     'svg-camera-retro',
  src:    '/materials/frames/camera-retro.svg',
  tier:   'hero',          // 'hero' | 'medium' | 'minimal'
  weight: 4,               // 1 rare ... 5 common
  maxPerPage: 1,           // optional cap
}
```

That's it. Reload the browser.

### Tiers

- **hero** — statement frames (camera, TV). 1–2 per page.
- **medium** — character frames (stamps, tickets). ~20% of photos.
- **minimal** — quiet frames (clean polaroid). Most photos.

### Optional: baked-in caption

If your frame has a labelled strip (like a polaroid bottom),
add to the entry so the caption renders in the right spot:

```js
captionSlot: { top: 0.82, left: 0.10, width: 0.80, color: '#5c3a38' }
```

---

## 2. SVG stickers

Simpler — no `photo-window` needed, just an illustration.

1. Trim the transparent padding around your design.
2. Save to `public/materials/stickers/cat-sleeping.svg`.
3. Add to `SVG_STICKERS`:

```js
{ id: 'svg-cat-sleeping', src: '/materials/stickers/cat-sleeping.svg', weight: 3, size: 14 }
```

`size` is the rendered width as % of page width (6–18 typical).

---

## 3. PNG fallback

Use PNG when you'd rather not deal with SVG (painted textures,
photo-real materials). Same folder structure, different catalog.

### PNG frames

- Design at 3:4 portrait (e.g. 900×1200).
- Make the photo-window area fully transparent.
- **Manually measure** the transparent hole's rectangle as
  fractions of the PNG's width/height.

```js
// src/materialsCatalog.js → PNG_FRAMES
{
  id:     'png-camera-retro',
  src:    '/materials/frames/camera-retro.png',
  tier:   'hero',
  weight: 4,
  window: { top: 0.18, left: 0.15, width: 0.70, height: 0.50 },
  captionSlot: { top: 0.78, left: 0.15, width: 0.70, color: '#fdfaf4' },
}
```

### PNG stickers

```js
// src/materialsCatalog.js → PNG_STICKERS
{ id: 'png-cat-sleeping', src: '/materials/stickers/cat-sleeping.png', weight: 3, size: 14 }
```

---

## Tips

- **Give me a folder** — drop a bundle of SVGs into
  `public/materials/frames/` and I can scaffold the catalog
  entries for you in bulk.
- **Preview in a browser** — open the raw SVG file directly; if
  it doesn't render right there, it won't render in the diary.
- **Cache busting** — hard-refresh (Cmd-Shift-R) after overwriting
  a file with the same name.
- **Export-safe** — files in `/public` are same-origin, so the
  Instagram-story PNG export captures them cleanly.

---

## Debug checklist

| Symptom | Likely cause |
|---|---|
| Console: *"SVG ... missing a photo-window element"* | Your SVG's rect isn't named `photo-window`. Rename the layer in Figma and re-export. |
| Photo sits outside the frame illustration | The `photo-window` rect isn't positioned where the visual hole is, or the SVG lacks a `viewBox`. |
| Parts of the frame cover the photo | You drew illustration elements above the window rect; move them below (so they render first). |
| Frame never appears | Missing/typo'd entry in `SVG_FRAMES`, or `tier` misspelled. |
| SVG stretches oddly | `photo-window` isn't 3:4 portrait, or viewBox is non-standard. |
| Sticker is huge/tiny | Tweak `size` (6–18 range). |
