# Tintashift

Landing page and storefront for Tintashift colour-shifting smart press-on nails.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

- `lib/shades.ts`: device name, colour presets, products and prices
- `components/Hero.tsx` + `components/Scene.tsx`: 3D hero. The TINTAShifter with one hand beside it; pick a colour and a nail set and the French tips shift
- `components/Sections.tsx`: shop, technology, how it works, outfits, newsletter, footer
- `public/img`, `public/vid`: AI-generated shade images and clips from Tintashift's own videos

## Credits
- Hand model and skin texture: [MakeHuman](http://www.makehumancommunity.org) base mesh and `young_caucasian_female` skin, both CC0. Cut, smoothed and packed into `public/models/hand.glb` by `tools/build_hand.py`.
