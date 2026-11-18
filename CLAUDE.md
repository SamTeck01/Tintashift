# Tintashift — project notes

Marketing site and nail configurator for **TINTAShift** ("Wearable Beauty Technology · live in color"), built by SamTeck for the client **Dave**.
- Live: https://tintashift.vercel.app (Vercel project `tintashift`; production deploys from branch `ccr-a563bc74-rhkfx4`).
- Push every commit to both `ccr-a563bc74-rhkfx4` and `main` (Dave's Codex reads `main`). Commit and push when done, without asking.
- SamTeck pays for tokens: short turns, do the work, verify, one screenshot, no long explanations.
- Verify every generated image yourself before using it (device shape, where the nail goes, logo spelling).

## What Dave wants
- From SamTeck he wants **the nail configurator** (the hero). He built his own product page and cart; he will integrate the configurator into his own code later (his site is on IONOS at tintashift.store).
- His complaints so far: **slow**, **not good on mobile**, and it must be **perfect**.
- His brief for the hero: one hand like the reference, the machine with it, no animation of the finger going into the machine on the opening shot, a way to switch the colour and the nail set.

## The product
- **TINTAShifter** (€249). Use the **aluminium** one: slim matte silver bar, rounded-triangle section, "TINTAShift" engraved along the side (one word, TINTA bold, Shift light), an oval grey button and a 2×4 grid of holes near one end. **That end is open; the nail slides into it, finger and device in one straight line.** Photos: `docs/reference/shifter-aluminium-*.jpg`.
- **Smart Tips** (€39 a set): almond press-on nails. **The whole nail changes colour**; decorations (bows, stars, shells, pearls) stay on top. Store series: Muse, Icon, Spotlight, Chapter, Signature.
- **The Complete Shift** (€288). Colour is never a product.
- Brand: soft, editorial, chameleon logo (`public/img/chameleon.png`, low-res; ask Dave for the vector).

## The reference site (copy the technique, never the assets)
VERNIS by Ascenta Studio. Code in `docs/reference-site/` (read its README). Not 3D: aligned AI photos cross-faded in a small WebGL shader; a short video plays the camera move into the close-up; phones get their own 9:16 photos (`m-` prefix); `@media (max-aspect-ratio:4/5)` in `vernis.css` is the phone layout.

## How our hero works (follows the reference)
- **Opening shot:** aluminium Shifter + hand, nails in the picked colour, nail-set chips. No colour picker here. Hovering the hand shows "Try it on" (always shown on phones); clicking it or the Try it on button opens the close-up.
- **Close-up:** hand with the bow nail slid into the Shifter's end (`docs/source-images/alu-close-si001.png`, approved by SamTeck; keep it). Copy and nav clear; back button top left; panel = colour name, colour drops, Add to bag. Move in/out is a zoom and cross-fade (no video yet).
- **Phones** (`max-width:760px` or aspect narrower than 4:5; `isPhone()` in `HeroScene.tsx` must match `globals.css`): own portrait pictures, one full screen, name and two 52 px buttons at the bottom, nail-set row above, safe-area padding, as in the reference. The phone close-up (`mob-close-si001.png`) is cropped from the approved desktop close-up and extended downward.

## Code map
- `components/Hero.tsx`: copy, panel, close-up state, Try-it-on hint.
- `components/HeroScene.tsx`: one WebGL quad. Device layer + one hand layer per set over a surface in the picked colour; shadows multiply on; the green key colour on the nails is repainted in the picked colour; close-up layer on top.
- `public/hero/<name>.webp` + `<name>-m.webp` (photo; maps R keep, G nail, B shadow). Phone versions have prefix `m-`. `lib/hero-layers.json`: sizes, per-set scale/nudge, close-ups (phone values under `mobile`).
- `tools/build_hero.py`: builds all layers from `docs/source-images/alu-*.png` (desktop) and `mob-*.png` (phone). Re-run after changing a source picture.
- `lib/shades.ts` (colours, sets, products), `lib/shopify.ts` + `components/Bag.tsx` (catalogue from the store's public `products.json`, bag, checkout via Shopify cart link; set `NEXT_PUBLIC_SHOPIFY_DOMAIN` for another store), `app/layout.tsx` (hero preload, Vercel Analytics/Speed Insights), `components/Sections.tsx` (rest of the page).
- Checks: speed = Playwright with CDP network throttling (150 ms, ~2.4 Mbps) and CPU ×4; overflow = loop over the sizes above. Headless screenshots: Playwright with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

## Pictures
Generated with Figma's image generator (`generate_image`, model `gemini-3.1-flash-image`) in SamTeck's file `AfElvizgb8gt0U1WgJvPYT`. Nails are painted pure green `#00FF00` as a key colour. **Figma AI credits are used up until 1 Dec 2026.** Weave (Figma's video models) is not linked, so no video.

## Approved plan, status
1. Mobile responsiveness — **done** (matched to the reference's phone rules; checked at 375/390/430/768 px headless, not on real phones).
2. Close-ups for the other four sets (si002, spotlight, chapter, spectrum), desktop and phone, framed like `alu-close-si001.png` — **waiting for Figma credits**. Until then the close-up always shows the bow set.
3. Speed — **mostly done (15 Nov)**. On a phone with slow 4G and a 4× slower CPU: first content 0.93 s, first hero pictures in 1.55 s, 175 KB before the page settles (was 358 KB). Hero photos are WebP quality 80. Not done: still-image fallback while WebGL starts; framer-motion could be dropped to cut JS.
   Overflow: no sideways scroll or overlaps at 320×568, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440, 1920 and a sideways phone (844×390), opening and close-up. Phone hero has no minimum height (it broke 568 px screens); sideways phones have their own compact rules (`max-height:520px`).
4. Package the configurator for Dave: one folder `components/configurator/`, an `onAddToBag` hook for his cart, short README.
5. Polish: reduced motion, keyboard and screen-reader basics, still image if WebGL fails.
6. Video into the close-up — only if SamTeck links Weave.

## Tests
`node tests/e2e.js [url]` (Playwright): 17 checks each on desktop and phone: sets, close-up, colours, bag, Shopify checkout link, reload, shop, no sideways scroll, no errors, no broken files. All 34 passed on the live site on 15 Nov 2026.

## Blender scene — status (18 Nov 2026)
- `tools/blender/scene.py` builds everything from code (no .blend needed): scanned hand (mirrored to a left hand, + smooth forearm), procedural SSS skin, almond green-key nails with per-set bows/pearls/stars/shells, aluminium Shifter (rounded-triangle bar, engraved TINTA bold / Shift light in Inter from `docs/3d/fonts`, oval button, 2×4 holes, white rim, nail holder), white table, two area lights.
- `--shot wide|close|move --aspect desktop|phone --set <set> --maps` ; `move` renders the camera push + device turning into the index fingertip (48 frames). `--maps` writes `-id.png` (R keep, G nail).
- Renders in `docs/3d/renders/` (si001, 64 samples, ~5–10 min each on CPU). Not yet wired into the site; not yet approved by SamTeck.
- Known to improve: small step where forearm meets the scanned wrist; spread "claw" pose is the scan's; engraving is small at opening-shot distance; video not rendered yet.
- Credit for the hand is in the footer (`components/Sections.tsx`).

## Original Blender plan (agreed 18 Nov 2026)
Why: AI images/video can't keep the device consistent (two Kling first/last-frame tries, `docs/source-video/`, both morph the device); Weave's free tier allows only 2 runs and is now used up; Figma AI credits are out until 1 Dec. A real 3D scene gives a correct device, a real camera move, and exact per-frame masks so the video recolours live too.
Plan:
1. `pip install bpy` (works here; Python 3.13) and use Cycles on CPU (no GPU; long renders run in the background).
2. Hand: `docs/3d/female-hand-yanix.glb` — "Female Hand" by yanix, Sketchfab, **CC-BY 4.0: credit it on the site**. Scanned shape only: ~193k faces, flat palm-down pose with straight spread fingers, ends at the wrist, no UVs/textures, not rigged. **This is the final hand (18 Nov: the paid hand is off the table).** No free CC0 skin textures exist (ambientCG / Poly Haven have none), so build a procedural skin material: subsurface scattering, colour variation from curvature/AO (redder knuckles, fingertips, creases), fine noise bump for pores, slight sheen. No UVs needed.
3. Device: model the aluminium Shifter from `docs/reference/shifter-aluminium-*.jpg` (rounded-triangle bar, bead-blasted aluminium, engraved TINTAShift, oval grey button, 2×4 holes, open end with white rim and nail holder).
4. Nails: almond press-ons fitted on each finger, separate material, with bows / stars / shells / pearls per set.
5. Render, matching the current framing: opening shot, close-up (nail in the device's open end, finger and device in line), and the move between them (the device turns and slides so its open end meets the fingertip; camera pushes in). Desktop 16:9 and phone 9:16.
6. Also render passes per frame: nail mask, object mask, shadow — so `HeroScene.tsx` keeps recolouring (table + nails) on stills **and** on the video. Then wire the video in like the reference (`ida`/`vuelta` clips; still photo underneath so the cut is invisible).
