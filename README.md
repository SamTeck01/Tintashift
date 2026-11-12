# Tintashift

Landing page and storefront for Tintashift colour-shifting smart press-on nails.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

- `lib/shades.ts`: device name, colour presets, products and prices
- `components/Hero.tsx` + `components/Scene.tsx`: 3D hero. Pick any colour, the finger dips into the device and the nail comes out recoloured
- `components/Sections.tsx`: shop, technology, how it works, outfits, newsletter, footer
- `public/img`, `public/vid`: AI-generated shade images and clips from Tintashift's own videos

## Credits
- Hand model: `generic-hand` from [immersive-web/webxr-input-profiles](https://github.com/immersive-web/webxr-input-profiles) (MIT licence), posed and re-shaded in `components/Scene.tsx`.
