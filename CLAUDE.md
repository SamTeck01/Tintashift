# Tintashift — handover notes

Marketing/storefront site for **TINTAShift** ("Wearable Beauty Technology · live in color"), built by SamTeck for the client contact **Dave**.
Live: https://tintashift.vercel.app (Vercel project `tintashift`, production branch `ccr-a563bc74-rhkfx4`; every push redeploys).

## The product (get this right)
- **TINTAShifter** ("the Shifter", "the machine"): clear crystal block labelled "TINTAShift" with a chrome connector, a clear cable and a crystal fingertip clip. Price **249**.
- **TINTATips**: press-on nails. Only these change colour, and only at the **French tip**. Sold as designed sets, the **Signature Series SI001** (lilac, bows, pearls) and **SI002** (rose-grey chrome, silver stars). Price **39** per set. All have Swarovski crystals, almond shape.
- Colour is NOT a product. The Shifter changes the tip to any colour. Never present shades as things to buy.
- Kit contents: tips, adhesive tabs, 2 alcohol pads, nail file, crystal cuticle pusher, Shifter, silver aesthetics bag.
- Client sites for reference: tintashift.store (shop, was timing out), tintashift.uk. Instagram: @tintashift.

## What Dave wants for the hero (his latest brief)
- Follow the reference reel (ascenta.studio nail-polish site): one hand, big name top right, colour panel.
- **Machine on the left, one hand beside it.** No animation of the finger going into the machine ("too much animation").
- Keep the **colour panel**; under/near it a control to **switch the nail set** (SI001/SI002). The hand's nails change with it.
- He said the earlier version was "not close to the scroll animation" of the reference, so scroll-driven camera movement stays, kept subtle.

## Code map
- `components/Hero.tsx`: sticky hero inside `.hero-wrap` (320svh), tracks scroll progress 0..1, colour picker, nail-set buttons.
- `components/Scene.tsx`: React Three Fiber scene.
  - `tipUniform`: shared French-tip colour for all nails; `handBase`: nail-set base colour on the hand.
  - `Shifter`: coded crystal body, label canvas texture, cable, clip.
  - `FloatingTips`: `public/models/si001.glb` / `si002.glb`; vertex colour r marks raised decorations.
  - `Hand`: `public/models/hand.glb` textured by projecting `hand-skin.jpg`; `hand-nails.png` marks nails (r = nail, g = cuticle→tip).
  - `Stage`: camera path `CAM[0..2]` driven by scroll.
  - `geoOf()` converts meshopt-quantised glTF to float geometry. Do not call computeVertexNormals on the raw quantised geometry.
- `components/Sections.tsx`: shop, technology, how-to, outfits, newsletter, footer. `lib/shades.ts`: device name, colour presets, products, prices.
- Headless screenshots need `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` and long timeouts.

## How the 3D models were made (free)
Hunyuan3D-2 Hugging Face Space, endpoint `/shape_generation` (shape only, works on the anonymous GPU quota), from crops of the client's Instagram photos and an AI hand photo. Then `gltf-transform weld/simplify`, a Python bake (UV projection, nail mask, decoration vertex colours), then `gltf-transform meshopt`. Textured generation and TRELLIS need a browser-logged-in HF account or paid credits.

## Known gaps / next steps
- **Hand nail mask is misaligned**: only one nail on the hand takes the set/tip colour, the others stay nude. Fix the nail ellipses in the bake (see scratch notes above) or re-project. The 3D bows/stars only appear on the floating tips, not on the hand.
- Mobile hero was not re-checked after the last layout change (headless screenshot timed out).
- The Shifter is coded geometry, close but not exact (the AI mesh of it was too mushy). Real CAD from the client would be best.
- Bag is a counter only; no Shopify checkout yet (Dave offered Shopify credentials). Newsletter form does not store emails.
- Logo is a placeholder swirl. The white aluminium device in the older videos is an earlier design; use the crystal Shifter.
- Not verified on a real phone GPU; the scene is heavy (transmission material).

## Rules
- Develop on `ccr-a563bc74-rhkfx4`, commit and push when done. Keep Next.js patched (Vercel blocks vulnerable versions).
- Do not copy the reference site's photos or assets. Hand model credit is in README.
