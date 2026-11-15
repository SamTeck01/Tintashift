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
