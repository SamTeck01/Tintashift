export const DEVICE_NAME = "TINTAShifter";
export const CURRENCY = "€";

/** Quick-pick colours for the hero panel. Any colour works; these are starting points, not products. */
export const presets = [
  { name: "Cherry", hex: "#b3121f" },
  { name: "Coral", hex: "#f2604f" },
  { name: "Blush", hex: "#e8a3ae" },
  { name: "Nude", hex: "#d8b39b" },
  { name: "Lilac", hex: "#b9a3e3" },
  { name: "Cobalt", hex: "#2f56c9" },
  { name: "Sage", hex: "#8fb39a" },
  { name: "Plum", hex: "#4a1530" },
  { name: "Ink", hex: "#16161c" },
];

/** Nail sets shown on the hand in the hero. `id` matches a layer in public/hero; `base` colours the little swatch. */
export const sets = [
  { id: "si001", name: "Signature", tag: "SI001 · Bow", base: "#cdbdec", product: "tinta-signature" },
  { id: "si002", name: "Signature", tag: "SI002 · Star", base: "#b7a5ad", product: "tinta-signature" },
  { id: "spotlight", name: "Spotlight", tag: "Sea glass", base: "#a9cbe8", product: "tinta-spotlight" },
  { id: "chapter", name: "Chapter", tag: "Pearl", base: "#f3dcdd", product: "tinta-chapter" },
  { id: "spectrum", name: "Spectrum", tag: "Full colour", base: null, product: null },
] as const;
export type SetId = (typeof sets)[number]["id"];

/** A product as the site shows it. `id` is the Shopify product handle and `variantId` the variant that goes
 *  into the cart. The live list comes from Shopify (lib/shopify.ts); this copy is the fallback if that fetch
 *  fails, taken from tintashift.store/products.json in Nov 2026. */
export type Product = { id: string; variantId: string; name: string; sub: string; price: number; img: string; available: boolean; badge?: string; items: string[] };
export const products: Product[] = [
  { id: "tintashifter", variantId: "57823795446086", name: DEVICE_NAME, sub: "The colour-changing device", price: 249, img: "/img/shifter-crystal.jpg", available: true, badge: "The device",
    items: ["Shifts your Smart Tips to any colour in seconds", "Crystal body with fingertip clip", "Pick the shade in the TINTAShift app"] },
  { id: "the-complete-shift", variantId: "57823795478854", name: "The Complete Shift", sub: "TINTAShifter and Smart Tips in one set", price: 288, img: "/img/complete-shift.jpg", available: true, badge: "Complete set",
    items: ["TINTAShifter and one set of Smart Tips", "Adhesive tabs, alcohol pads, file, crystal cuticle pusher", "Silver aesthetics bag"] },
  { id: "tinta-signature", variantId: "57823795413318", name: "TINTA Signature", sub: "Your personal sense of colour and form", price: 39, img: "/img/series-signature.jpg", available: true,
    items: ["Almond shape, Swarovski crystals", "Colour shifts at the French tips"] },
  { id: "tinta-spotlight", variantId: "57823795183942", name: "TINTA Spotlight", sub: "For the moments you give your own colour", price: 39, img: "/img/series-spotlight.jpg", available: true,
    items: ["Almond shape, Swarovski crystals", "Colour shifts with the Shifter"] },
  { id: "tinta-chapter", variantId: "57823795216710", name: "TINTA Chapter", sub: "A new chapter, a new expression", price: 39, img: "/img/series-chapter.jpg", available: true,
    items: ["Almond shape, pearls and crystals", "Colour shifts with the Shifter"] },
  { id: "tinta-icon", variantId: "57823795118406", name: "TINTA Icon", sub: "A clear expression of your own style", price: 39, img: "/img/series-icon.jpg", available: true,
    items: ["Smart Tips press-ons", "Colour shifts with the Shifter"] },
  { id: "tinta-muse", variantId: "57823795085638", name: "TINTA Muse", sub: "An initial spark for your look", price: 39, img: "/img/series-muse.jpg", available: true,
    items: ["Smart Tips press-ons", "Colour shifts with the Shifter"] },
];

function hsl(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
}
function hex(h: number, s: number, l: number) {
  const f = (n: number) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
/** The tabletop takes the picked colour, as in a studio shot on coloured paper: same hue, a step lighter and
 *  softer than the nails so they stand out, and never too dark or too pale to read on. */
export function surface(picked: string) {
  const { h, s, l } = hsl(picked);
  return hex(h, Math.min(s, 0.72) * 0.92, Math.min(0.82, Math.max(0.4, l + 0.08)));
}
/** True when dark text reads better than white on that surface. */
export function isLight(colour: string) {
  const n = parseInt(colour.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62;
}
