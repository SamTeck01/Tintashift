export type Shade = {
  id: string; no: string; name: string; note: string;
  hex: string; bg: string; deep: string; ink: "light" | "dark";
};
export const PRICE = 129;
export const shades: Shade[] = [
  { id: "nu", no: "01", name: "Nu", note: "Sheer, skin-close nude.", hex: "#d9b29a", bg: "#e7c3a6", deep: "#b98e70", ink: "dark" },
  { id: "rose", no: "02", name: "Rose", note: "Soft, powdered rose.", hex: "#e08d9c", bg: "#e5a1a8", deep: "#c47b86", ink: "dark" },
  { id: "corail", no: "03", name: "Corail", note: "Warm, sunlit coral.", hex: "#f1584c", bg: "#ef6a5b", deep: "#c94a3e", ink: "light" },
  { id: "cerise", no: "04", name: "Cerise", note: "Clean, true cherry red.", hex: "#b0101c", bg: "#b3151f", deep: "#7e0b14", ink: "light" },
  { id: "framboise", no: "05", name: "Framboise", note: "Deep, juicy raspberry.", hex: "#b3164f", bg: "#b8195a", deep: "#86103f", ink: "light" },
  { id: "prune", no: "06", name: "Prune", note: "Inky, velvet plum.", hex: "#3e0f27", bg: "#5a2340", deep: "#36122a", ink: "light" },
];

export const DEVICE_NAME = "TINTAShift Device";

export type Product = { id: string; name: string; sub: string; price: number; img: string; badge?: string; items: string[] };
export const products: Product[] = [
  { id: "kit", name: "Starter Kit", sub: `${DEVICE_NAME} + 24 TINTATips`, price: 129, img: "/img/kit.jpg", badge: "Best value",
    items: [DEVICE_NAME, "24 TINTATips press-ons", "Sticky tabs, file and alcohol pads", "Free Tintashift app"] },
  { id: "device", name: DEVICE_NAME, sub: "The colour-shift device", price: 99, img: "/img/device.jpg",
    items: ["Fingertip colour-shift device", "Pairs with the Tintashift app", "USB-C rechargeable"] },
  { id: "tips", name: "TINTATips Refill", sub: "24 press-on nails", price: 38, img: "/img/step7.jpg",
    items: ["24 TINTATips in 12 sizes", "Sticky tabs included", "Shift into all six shades"] },
];
