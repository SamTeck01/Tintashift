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
  { id: "device", name: DEVICE_NAME, sub: "Recolours your TINTATips in seconds", price: 99, img: "/img/device.jpg", badge: "The device",
    items: ["Slide a fingertip in, your TINTATip shifts to any colour", "Pick colours and draw designs in the Tintashift app", "USB-C rechargeable"] },
  { id: "kit", name: "Starter Kit", sub: `${DEVICE_NAME} + TINTATips`, price: 129, img: "/img/kit.jpg", badge: "Best value",
    items: [DEVICE_NAME, "24 TINTATips press-ons", "Sticky tabs, file and alcohol pads"] },
  { id: "tips", name: "TINTATips Refill", sub: "24 colour-shift press-ons", price: 38, img: "/img/step7.jpg",
    items: ["The only nails the device can shift", "Plain or with designs", "Sticky tabs included"] },
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
  return `hsl(${h} ${Math.round(Math.min(s, 0.6) * 100)}% 17%)`;
}
