import { products as fallback, type Product } from "./shades";

/* The shop is Dave's Shopify store. Nothing secret is needed to sell from this site:
   - the catalogue is read from the store's public product feed, so names, prices and stock follow Shopify;
   - checkout is a Shopify cart link (/cart/<variant>:<qty>,…), which opens his real checkout with the bag in it.
   Point NEXT_PUBLIC_SHOPIFY_DOMAIN at another store to switch shops. */
export const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? "tintashift.store";

export function checkoutUrl(lines: { variantId: string; qty: number }[]) {
  return `https://${SHOP_DOMAIN}/cart/${lines.map((l) => `${l.variantId}:${l.qty}`).join(",")}`;
}

type Feed = { products: { handle: string; title: string; body_html: string | null; variants: { id: number; price: string; available: boolean }[]; images: { src: string }[] }[] };
const text = (html: string | null) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Live catalogue, refreshed every five minutes. Our own picture, badge and bullet points are kept for the
 *  products we know; anything new in Shopify shows up with Shopify's own picture and description. */
export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`https://${SHOP_DOMAIN}/products.json?limit=100`, { next: { revalidate: 300 }, headers: { "User-Agent": "Mozilla/5.0 (storefront)" } });
    if (!res.ok) throw new Error(`Shopify feed ${res.status}`);
    const feed = (await res.json()) as Feed;
    const live = feed.products.filter((p) => p.variants.length).map((p): Product => {
      const known = fallback.find((f) => f.id === p.handle), v = p.variants[0];
      return {
        id: p.handle, variantId: String(v.id), name: known?.name ?? p.title, sub: text(p.body_html) || known?.sub || "",
        price: Number(v.price), available: v.available, badge: known?.badge, items: known?.items ?? [],
        // the device and the complete set keep our crystal pictures; the nail series use the store's photos
        img: known && ["tintashifter", "the-complete-shift"].includes(p.handle) ? known.img : p.images[0]?.src ?? known?.img ?? "/img/kit.jpg",
      };
    });
    if (!live.length) return fallback;
    const order = fallback.map((f) => f.id), rank = (id: string) => (order.indexOf(id) + 1 || 99);
    return live.sort((a, b) => rank(a.id) - rank(b.id));
  } catch {
    return fallback;
  }
}
