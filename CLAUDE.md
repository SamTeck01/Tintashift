# Tintashift — handover notes

## START HERE (state on 15 Nov 2026, end of the first long session)
SamTeck moved to a new session. Everything is in this repo on `ccr-a563bc74-rhkfx4` and `main` (kept identical; Vercel production deploys from `ccr-a563bc74-rhkfx4`). The reference site's code is in `docs/reference-site/` (read its README).

How the hero works now (follows the reference):
- Opening shot: aluminium Shifter + one hand, whole nails in the picked colour, nail-set slider in the panel, **no colour picker** here. Hovering the hand shows "Try it on"; clicking the hand (or the Try it on button) opens the close-up.
- Close-up: hand with the bow nail slid into the end of the Shifter (`docs/source-images/alu-close-si001.png`, the picture SamTeck said he loves; keep it). Copy and nav clear away, back button top left, panel = "Try it on", colour name, **colour picker**, Add to bag.
- Phones: own 9:16 photos (`mob-*.png` → `public/hero/m-*`), one full screen, copy and panel over the empty surface.

Next steps SamTeck asked for and not done yet:
1. Close-ups for the other four nail sets (desktop `alu-close-<set>.png` and phone `mob-close-<set>.png`), same framing as `alu-close-si001.png`. Until then the close-up always shows the bow set.
2. A real video for the move into the close-up and back, like the reference's `ida-`/`vuelta-` clips. Needs a video model; Weave (Figma) was still not linked.
3. Check the phone close-up picture (`mob-close-si001.png`) against the desktop one: it was generated separately and has not been reviewed by SamTeck.

Working style SamTeck asked for: he is paying for tokens, so keep turns short, do the work, show one screenshot, don't over-explain. Push to both branches when done without asking. Figma AI credits (image generation) reset daily at 00:00 UTC.

Marketing/storefront site for **TINTAShift** ("Wearable Beauty Technology · live in color"), built by SamTeck for the client contact **Dave**.
Live: https://tintashift.vercel.app (Vercel project `tintashift`, production branch `ccr-a563bc74-rhkfx4`; every push redeploys).

## The product (get this right)
Studied on 13 Nov 2026 from the brand's Instagram (@tintashift, 22 posts), tintashift.store (Shopify) and tintashift.uk. Photos are in `docs/reference/`.
- **Brand line:** "Wearable Beauty Technology. Smart color-changing nails are the first expression. Live in Color." Tone: fashion editorial, soft lilac/silver/iridescent, chameleon logo.
- **How it works (their words):** pick a shade in the app, slide the tip into the Shifter, the tip changes in seconds. "App controls the palette. Shifter controls the state." "100 shades. One set."
- **TINTAShifter** (store: "Device", **€249**). Two designs exist in their photos:
  - *Crystal* (newest posts and the kit flat-lay, `shifter-crystal-kit.jpg`): clear cut-crystal bar with emerald-cut facets, "TINTAShift" printed in black on a frosted inner panel, one round Swarovski stone near the cap end, chrome collar and nozzle, a clear soft tube looping to a small **bone-shaped** crystal clip with a chrome spring clip inside. This is the one to build.
  - *Aluminium* (older videos and still the store's product photo, `shifter-aluminium-store-photo.jpg`): silver tube with a button and speaker holes; the nail tip slots into the end.
- **Smart Tips / TINTATips** (store: "Smart Tips", **€39** each): press-on nails, almond shape, Swarovski crystals, colour shifts at the **French tip**. The store sells five series: **MUSE, ICON, SPOTLIGHT, CHAPTER, SIGNATURE**. Instagram shows Signature SI001 (lilac, bows, pearls) and SI002 (rose-grey chrome, silver stars), and the Spotlight "Design Series" (blue/glass, shells, bows).
- **The Complete Shift** (store: "Complete set", **€288**): Shifter plus Smart Tips.
- Colour is NOT a product. Never present shades as things to buy. (The store's current hero wrongly shows six polish shades with "12 ml · Wide brush", copied from the reference.)
- Kit contents: tips, adhesive tabs, 2 alcohol pads, nail file, crystal cuticle pusher, Shifter, silver aesthetics bag.
- Shopify catalogue is readable at `https://tintashift.store/products.json`.

## Decisions from SamTeck on 14 Nov 2026 (these override the notes above where they differ)
- **Use the aluminium Shifter, not the crystal one.** Studied from their photos (`docs/reference/shifter-aluminium-*.jpg`): a slim bar of matte silver anodised aluminium, fine bead-blasted finish, roughly 11 cm long, soft rounded-triangle cross-section. "TINTAShift" engraved along the side. Near one end an oval translucent grey button and a 2×4 grid of small holes. That end is open with a white plastic rim and a nail-shaped holder inside; **the nail slides into this open end**, on the finger. A pink-to-teal gradient version also appears.
- **The whole nail changes colour, not just the French tip.** Decorations (bows, stars, pearls) stay on top.
- **Opening shot framed like the reference:** camera further back, hand and device small, plenty of empty surface.
- **Close-up view:** the picture is the hand with a nail dipped into the device. The move into it should be a real video like the reference's (`ida-*.mp4` / `vuelta-*.mp4`); that needs a video model, which needs Weave linked.
- Finish the normal Next.js site; Dave converts it for Shopify himself with Codex. No theme file from us.
- Candidate pictures for this direction: `docs/source-images/candidate-alu-wide.png` and `candidate-alu-close.png` (green = key colour for the picked shade).

## The reference site (how it really works)
VERNIS by Ascenta Studio, https://ascentastudio.com/vernis/. SamTeck supplied its saved code. **It is not real-time 3D.** Its own comments say: every view is a set of pixel-aligned AI-generated photos (one per shade, wide shot and close-up), cross-faded in a small WebGL shader; the camera move between wide and close-up is a short AI-generated video whose first and last frames are those photos. That is why it looks photoreal and loads instantly. Do not copy its assets; copy the technique.

## What Dave wants for the hero (his latest brief)
- Follow the reference reel (ascenta.studio nail-polish site): one hand, big name top right, colour panel.
- **Machine on the left, one hand beside it.** No animation of the finger going into the machine ("too much animation").
- Keep the **colour panel**; under/near it a control to **switch the nail set** (SI001/SI002). The hand's nails change with it.
- He said the earlier version was "not close to the scroll animation" of the reference, so scroll-driven camera movement stays, kept subtle.
- His words (WhatsApp): "keep the style with 1 hand, like in the example", "without putting the finger inside the machine", "no too much animation", "keep the color panel, and then under it you can slide what nails you want to switch it with, like the products", "on the left side is the machine, and then the hand where you can switch the color and also the model / nail set".
- SamTeck's verdict on the earlier real-time 3D hero (13 Nov): not good enough, looked fake next to the reference and loaded slowly. It was replaced the same day by the photo hero below. He also wants more than the tip to change: the whole surface takes the colour, and the Spectrum set changes the whole nail.

## Code map (current, after the 14–15 Nov rebuild)
- `components/Hero.tsx`: full-screen hero. Copy top right, glass panel bottom right with colour dots and the nail-set slider. "See it up close" (or clicking the picture) opens the close-up: the copy clears, a back button appears top left, and the panel carries the colour name and Add to bag, as on the reference.
- `components/HeroScene.tsx`: one WebGL quad, no 3D. Opening shot = device layer + one hand layer per nail set over a surface in the picked colour; close-up = one photo of the hand with a nail in the Shifter. Shadows multiply onto the surface; the green key colour on the nails is repainted in the picked colour (whole nail). Moving to the close-up is a zoom and cross-fade, not a video.
- `public/hero/`: `device`, `si001`, `si002`, `spotlight`, `chapter`, `spectrum`, `close-si001`, each as `<name>.webp` + `<name>-m.webp` (R keep, G nail, B shadow). `lib/hero-layers.json`: size, per-set scale and nudge, list of close-ups.
- `tools/build_hero.py`: builds those from `docs/source-images/alu-wide-<set>.png` and `alu-close-<set>.png`. Re-run after adding a picture; a new `alu-close-<set>.png` is picked up automatically, but `Hero.tsx` currently shows only the first close-up.
- `lib/shades.ts`: colour presets, hero nail sets, products, `surface()`. `lib/shopify.ts` + `components/Bag.tsx`: catalogue, bag, checkout link. `app/layout.tsx`: hero preload, Vercel Analytics and Speed Insights.
- `components/Logo.tsx`, `components/Sections.tsx` as before. Headless screenshots: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

## Phones (15 Nov 2026, following the reference)
- Phones and upright tablets use their own portrait 9:16 photographs (`docs/source-images/mob-*.png`, built to `public/hero/m-*`), exactly as the reference does with its `m-` images. The hero stays one full screen: hand and Shifter in the top half, copy and panel overlaid on the empty surface below. `isPhone()` in `HeroScene.tsx` and the `(max-width:760px),(max-aspect-ratio:4/5)` rule in `globals.css` must agree.
- `tools/build_hero.py` builds both sets (`build("alu","")` and `build("mob","m-")`); `lib/hero-layers.json` has the phone values under `mobile`.

## Open after the rebuild
- **Close-ups for the other four sets** were not generated: Figma AI credits ran out on 14 Nov (they reset daily at 00:00 UTC). Prompt: the close-up prompt in the Figma file history with only the nail decoration changed. Until then the close-up always shows the bow set.
- **No motion video** into the close-up; needs a video model (Weave was still not linked on 14 Nov).
- The generated Shifter is rounder than the real rounded-triangle bar, and each generated hand differs slightly.

## Shopify connection (no credentials involved)
Dave asked on 13 Nov 2026 to connect the site to his Shopify store, tintashift.store. It is connected without a token or admin access:
- **Catalogue:** `getProducts()` reads the store's public feed `https://tintashift.store/products.json` on the server and refreshes every five minutes (`revalidate = 300` on the page), so names, prices, stock and new products follow Shopify. Our own picture, badge and bullets are kept per product handle; the Shifter and Complete Shift keep our crystal pictures because the store's photo still shows the old aluminium device. If the feed fails, the static list in `lib/shades.ts` is used.
- **Checkout:** the bag's Checkout button is a Shopify cart link, `https://tintashift.store/cart/<variantId>:<qty>,…`, which opens his real Shopify checkout with those items. Tested: it redirects to the Shopify checkout.
- **SamTeck said on 14 Nov 2026 that tintashift.store is "the old store".** Dave will connect the right store himself with his Codex from the GitHub repo (`AGENTS.md` and the README section "Connecting a Shopify store" are written for that). The new store's domain was not given.
- To use another store set `NEXT_PUBLIC_SHOPIFY_DOMAIN`. The site itself stays a Next.js app on Vercel; it is not a Shopify theme, so there is no theme file to upload. Pointing his domain at Vercel is done in Vercel's domain settings.
- Not done: discount codes, customer accounts and a cart shared with the Shopify theme. Those need the Storefront API and a Storefront access token from Dave's Shopify admin (Headless channel).

## How the hero pictures were made
Figma's image generator (`generate_image`, model `gemini-3.1-flash-image`), in SamTeck's Figma file "Tintashift hero imagery" (key `AfElvizgb8gt0U1WgJvPYT`). It is text-to-image only and spends his Figma AI credits; he approved that on 13 Nov 2026. Output is 1376×768.
- Every image uses the same prompt skeleton so angle and light match: three-quarter view about 35° above a plain white surface, hand entering from the upper-left, soft key light from the upper left, French tips painted "solid, flat, vivid pure green (#00FF00)" as a key colour. Only the nail description changes per set. `wide-si001.png` also contains the Shifter, described from the kit photo.
- `docs/source-images/top-*.png` are top-down versions of four sets, generated first and not used yet. They suit a close-up "Try it on" view like the reference's.
- Weave (Figma's image-editing and video models) is not linked to his account, so there is no image-to-image editing and no generated camera-move video yet.

## Known gaps / next steps
- No close-up view yet. The reference zooms from the wide shot to a top-down close-up with a short generated video; we have the top-down stills but no video.
- Source images are 1376 px wide, so the hero is slightly soft on large high-density screens. The reference serves 2560 px and 4K.
- The nail designs are generated from descriptions of the real sets, not the real products. Muse and Icon are in the shop list but have no hero set because their designs are not clear in the client's photos. "Spectrum" (whole nail changes) comes from their Instagram, not the store.
- The Shifter in the picture is generated from a description of the crystal device. It matches the kit photo closely but is not a photo of the real unit.
- Each set is a different generated hand, so skin and pose change slightly when switching sets. The Spotlight image has a bracelet and a ring.
- Newsletter form does not store emails. The chameleon logo is cut from a small Instagram image; ask Dave for the vector logo.
- No real order has been placed through the site; the checkout link was only followed as far as the Shopify checkout page.
- Checked in headless Chromium only, at widths from 360 to 1920 px (no sideways scroll at any of them), not on real devices.
- Phones and upright tablets (`max-width:760px` or aspect narrower than 4:5) use the stacked layout; the same rule is in `HeroScene.tsx` and `globals.css` and must stay in step.

## Rules
- Develop on `ccr-a563bc74-rhkfx4` (Vercel production) and push the same commits to `main` (SamTeck asked for `main` on 14 Nov 2026 so Dave's Codex can pick the repo up). Commit and push when done, without asking. Keep Next.js patched (Vercel blocks vulnerable versions).
- Do not copy the reference site's photos or assets.
