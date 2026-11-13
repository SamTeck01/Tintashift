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

## Credits
- Hero pictures: generated for this project with Figma's image generator. Product photos in the shop section are TINTAShift's own.
