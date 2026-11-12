# Tintashift — Build Plan

Reference: Instagram reel (ascenta.studio "3500$ website") — a single-product nail-polish storefront.
Goal: match the layout, motion and feel of the reference. All photos, copy and brand assets are our own (we can't reuse theirs).

## 1. What the reference shows (from the video)

| # | Section | Behaviour |
|---|---------|-----------|
| 1 | **Hero: shade switcher** | Full-bleed photo: a hand on a tinted backdrop with 6 bottles in a row. Whole page background and photo crossfade to the active shade. Shade name is large in the top right (Prune, Corail, Nu, Cerise, Framboise, Rose in the reference). |
| 2 | **Hand close-up** | When you pick a shade, the bottles leave and a close-up hand with painted nails appears. A floating glass card (top right on desktop, bottom on mobile) shows the shade name, 6 swatch dots and Add-to-bag / price. |
| 3 | **"Six shades. One finish."** | A grid of tall product cards (bottle ↔ hand image), each with a name pill and a price/add pill. The cards scroll horizontally. |
| 4 | **Try-on** | "See the colour on a hand before it reaches yours." Skin-tone selector (Fair / Light / Medium / Deep). The hand image updates to match the tone and shade. |
| 5 | **Newsletter** | "New shades first." Email capture. |
| — | Nav / footer | Minimal top nav with a small logo, centered links and a bag icon. Thin footer. |

Look and feel: soft, light sans serif (Inter Tight or Neue Montreal style), glass pills, 600–900 ms eased crossfades, very little UI chrome. Mobile is a first-class layout (the phone in the video shows a stacked version).

## 2. Our 6 shades (placeholder names — rename freely)
`shades.ts` → `{ id, name, hex, bg, price, bottleImg, handImg, handImgByTone{} }`

## 3. Tech stack
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + Framer Motion.
- **Commerce:** Shopify Storefront API (headless) for products, cart and checkout. This matches Dave's "Shopify through API".
- **Images:** next/image with AVIF and preloaded shade sets so swaps never flash.
- **Hosting:** Vercel.
- **Newsletter:** Shopify customer API or Klaviyo.

## 4. Assets needed (critical path, and the hardest part)
1. Bottle line-up photo × 6 backgrounds, or one cut-out shot of the bottles composited on solid colours.
2. Hand close-up × 6 shades × 4 skin tones = 24 images. These can be AI-generated or retouched from one shoot, as long as the lighting matches.
3. Product cards: bottle + hand image per shade.
→ The UI/UX designer owns the Figma file and the asset spec.

## 5. Phases and task split
| Phase | Work | Owner |
|---|---|---|
| 0 | Figma: desktop + mobile frames for the 5 sections, motion notes | UI/UX designer |
| 1 | Repo setup, design tokens, `shades.ts`, layout and nav | Frontend 1 |
| 2 | Hero and hand close-up switcher, glass card, crossfade engine | Frontend 1 |
| 3 | Product grid, horizontal scroll, Try-on section, newsletter | Frontend 2 |
| 4 | Shopify Storefront API integration: products, cart drawer, checkout redirect | Backend |
| 5 | Asset production and optimisation | Designer + PM |
| 6 | QA: Lighthouse ≥ 90, mobile Safari, reduced-motion fallback | All |
| 7 | Deploy to Vercel, domain, hand over the GitHub repo | PM |

## 6. Definition of done
- Side-by-side with the reference at 1440px and 390px: same layout, spacing and motion.
- Shade switching runs at < 100 ms perceived latency with no image flash.
- Real checkout works through Shopify.

## 7. Open questions for Dave
- Brand name, logo, real shade names and prices?
- Shopify store: does it exist yet? Is a Storefront API token available?
- Languages: DE + EN (like the Bau videos)?
- Who produces the photography?
