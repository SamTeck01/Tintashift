# Tintashift — handover notes

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

## The reference site (how it really works)
VERNIS by Ascenta Studio, https://ascentastudio.com/vernis/. SamTeck supplied its saved code. **It is not real-time 3D.** Its own comments say: every view is a set of pixel-aligned AI-generated photos (one per shade, wide shot and close-up), cross-faded in a small WebGL shader; the camera move between wide and close-up is a short AI-generated video whose first and last frames are those photos. That is why it looks photoreal and loads instantly. Do not copy its assets; copy the technique.

## What Dave wants for the hero (his latest brief)
- Follow the reference reel (ascenta.studio nail-polish site): one hand, big name top right, colour panel.
- **Machine on the left, one hand beside it.** No animation of the finger going into the machine ("too much animation").
- Keep the **colour panel**; under/near it a control to **switch the nail set** (SI001/SI002). The hand's nails change with it.
- He said the earlier version was "not close to the scroll animation" of the reference, so scroll-driven camera movement stays, kept subtle.
- His words (WhatsApp): "keep the style with 1 hand, like in the example", "without putting the finger inside the machine", "no too much animation", "keep the color panel, and then under it you can slide what nails you want to switch it with, like the products", "on the left side is the machine, and then the hand where you can switch the color and also the model / nail set".
- SamTeck's verdict on the earlier real-time 3D hero (13 Nov): not good enough, looked fake next to the reference and loaded slowly. It was replaced the same day by the photo hero below. He also wants more than the tip to change: the whole surface takes the colour, and the Spectrum set changes the whole nail.

## Code map
- `components/Hero.tsx`: full-screen hero. Copy top right, glass panel bottom right with the colour dots and the nail-set slider. No scroll animation.
- `components/HeroScene.tsx`: one WebGL quad, no 3D. It blends a device layer and one hand layer per nail set over a surface in the picked colour: shadows multiply onto the surface, the crystal shows the surface through it, the green key colour on the nails is repainted in the picked colour. Switching set slides the hand out to the top-left and the next one in.
- `public/hero/<name>.webp` + `<name>-m.webp`: photo and maps (R keep, G tip mask or device sparkle, B shadow) for `device`, `si001`, `si002`, `spotlight`, `chapter`, `spectrum`. `lib/hero-layers.json`: image size and each hand's vertical nudge.
- `tools/build_hero.py`: builds those layers from `docs/source-images/wide-*.png` (background removal with rembg, backdrop flattening, tip key). Re-run it after adding or replacing a source image.
- `lib/shades.ts`: colour presets, hero nail sets, the store's seven products and prices, `surface()` (tabletop colour for a picked shade).
- `lib/shopify.ts`: the Shopify connection (see below). `components/Bag.tsx`: bag state (kept in localStorage) and the bag drawer.
- `components/Logo.tsx`: the brand's chameleon (`public/img/chameleon.png`, cut from their Instagram artwork, low resolution) plus the wordmark set in type.
- `components/Sections.tsx`: shop, technology, how-to, outfits, newsletter, footer.
- Headless screenshots: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

## Shopify connection (no credentials involved)
Dave asked on 13 Nov 2026 to connect the site to his Shopify store, tintashift.store. It is connected without a token or admin access:
- **Catalogue:** `getProducts()` reads the store's public feed `https://tintashift.store/products.json` on the server and refreshes every five minutes (`revalidate = 300` on the page), so names, prices, stock and new products follow Shopify. Our own picture, badge and bullets are kept per product handle; the Shifter and Complete Shift keep our crystal pictures because the store's photo still shows the old aluminium device. If the feed fails, the static list in `lib/shades.ts` is used.
- **Checkout:** the bag's Checkout button is a Shopify cart link, `https://tintashift.store/cart/<variantId>:<qty>,…`, which opens his real Shopify checkout with those items. Tested: it redirects to the Shopify checkout.
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
- Checked in headless Chromium at 1440×810 and 390×780 only, not on real devices.

## Rules
- Develop on `ccr-a563bc74-rhkfx4`, commit and push when done. Keep Next.js patched (Vercel blocks vulnerable versions).
- Do not copy the reference site's photos or assets.
