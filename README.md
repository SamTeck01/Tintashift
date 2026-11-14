# Tintashift

Landing page and storefront for Tintashift colour-shifting smart press-on nails.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

- `lib/shades.ts`: colour presets, hero nail sets, products and prices
- `components/Hero.tsx` + `components/HeroScene.tsx`: photo hero. Studio pictures blended in a small shader; pick a colour and a nail set and the surface and nails change
- `tools/build_hero.py`: builds the hero layers in `public/hero` from `docs/source-images`
- `components/Sections.tsx`: shop, technology, how it works, outfits, newsletter, footer

## Connecting a Shopify store
The site sells through Shopify without any secret key.

- **Which store:** `NEXT_PUBLIC_SHOPIFY_DOMAIN` (see `.env.example`). Unset, it uses `tintashift.store`. To use another store, set the variable in Vercel and redeploy.
- **Products:** `lib/shopify.ts` reads `https://<store>/products.json` on the server every five minutes. Names, prices and stock come from Shopify.
- **Checkout:** the bag's Checkout button opens `https://<store>/cart/<variantId>:<qty>,…`, which is that store's own Shopify checkout with the items in it. Payment, shipping and orders all happen in Shopify.
- **Product handles:** our pictures, badges and bullet points are matched to Shopify products by handle in `lib/shades.ts` (`tintashifter`, `the-complete-shift`, `tinta-signature`, `tinta-spotlight`, `tinta-chapter`, `tinta-icon`, `tinta-muse`). The hero's "Add to bag" adds the product with handle `tintashifter`, and each hero nail set names its product in `sets[].product`. If the new store uses other handles, change them there. Products the site does not know still appear, with Shopify's own picture and description.
- **Storefront API (optional):** needed only for discount codes, customer accounts or product options. Create a Storefront access token in Shopify (Headless channel), keep it in an environment variable, and replace the two functions in `lib/shopify.ts` (`getProducts`, `checkoutUrl`); `components/Bag.tsx` holds the bag.

## Speed and monitoring
- The hero is four small images (about 180 KB) preloaded in `app/layout.tsx`; the other nail sets load after the first picture is up. Videos further down load only when they are about to scroll into view.
- `@vercel/analytics` and `@vercel/speed-insights` are installed in `app/layout.tsx`. Turn on Web Analytics and Speed Insights for the project in the Vercel dashboard to see visitor numbers and real loading times.

## Credits
- Hero pictures: generated for this project with Figma's image generator. Product photos in the shop section are TINTAShift's own.
