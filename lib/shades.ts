export type Shade = {
  id: string; no: string; name: string; note: string;
  hex: string; bg: string; deep: string; ink: "light" | "dark";
};
export const PRICE = 38;
export const shades: Shade[] = [
  { id: "nu", no: "01", name: "Nu", note: "Sheer, skin-close nude.", hex: "#d9b29a", bg: "#e7c3a6", deep: "#b98e70", ink: "dark" },
  { id: "rose", no: "02", name: "Rose", note: "Soft, powdered rose.", hex: "#e08d9c", bg: "#e5a1a8", deep: "#c47b86", ink: "dark" },
  { id: "corail", no: "03", name: "Corail", note: "Warm, sunlit coral.", hex: "#f1584c", bg: "#ef6a5b", deep: "#c94a3e", ink: "light" },
  { id: "cerise", no: "04", name: "Cerise", note: "Clean, true cherry red.", hex: "#b0101c", bg: "#b3151f", deep: "#7e0b14", ink: "light" },
  { id: "framboise", no: "05", name: "Framboise", note: "Deep, juicy raspberry.", hex: "#b3164f", bg: "#b8195a", deep: "#86103f", ink: "light" },
  { id: "prune", no: "06", name: "Prune", note: "Inky, velvet plum.", hex: "#3e0f27", bg: "#5a2340", deep: "#36122a", ink: "light" },
];
