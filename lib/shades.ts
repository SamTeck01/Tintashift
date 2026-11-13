export const DEVICE_NAME = "TINTAShifter";

/** Quick-pick colours for the hero picker. Any colour works — these are just starting points. */
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

export type Product = { id: string; name: string; sub: string; price: number; img: string; badge?: string; items: string[] };
export const products: Product[] = [
  { id: "shifter", name: DEVICE_NAME, sub: "The colour-shift device", price: 249, img: "/img/kit.jpg", badge: "The device",
    items: ["Shifts the French tips of your TINTATips to any colour", "Crystal body with fingertip clip", "Comes in the silver aesthetics bag with tabs, file and pads"] },
  { id: "si001", name: "Signature SI001", sub: "TINTATip Signature Series", price: 39, img: "/img/si001.jpg",
    items: ["Almond shape, lilac", "Bows, pearls and Swarovski crystals", "Colour shifts at the French tips"] },
  { id: "si002", name: "Signature SI002", sub: "TINTATip Signature Series", price: 39, img: "/img/si002.jpg",
    items: ["Almond shape, chrome rose-grey", "Silver stars and Swarovski crystals", "Colour shifts at the French tips"] },
];

/** Background tone derived from the picked colour: same hue, deep and calm so the nail pops. */
export function backdrop(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; const d = max - min;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = Math.round(h * 60 + 360) % 360;
  const s = d ? d / (1 - Math.abs(max + min - 1)) : 0;
  return `hsl(${h}, ${Math.round(Math.min(s, 0.6) * 100)}%, 17%)`;
}
