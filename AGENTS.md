# Notes for coding agents

Read `CLAUDE.md` first. It is the full handover: what the product is, what the client asked for, how the hero
picture works, how the site talks to Shopify, and what is still open.

The job most likely to come next is pointing the site at the right Shopify store. See "Connecting a Shopify
store" in `README.md`. In short: set `NEXT_PUBLIC_SHOPIFY_DOMAIN`, then make sure the product handles in
`lib/shades.ts` match the handles in that store.

Checks before pushing: `npm run build` must pass. The page must not scroll sideways at 360 px wide.
`main` and `ccr-a563bc74-rhkfx4` are kept identical; Vercel production deploys from `ccr-a563bc74-rhkfx4`.
