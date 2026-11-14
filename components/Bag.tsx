"use client";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext, useEffect, useState } from "react";
import { CURRENCY, type Product } from "@/lib/shades";
import { checkoutUrl } from "@/lib/shopify";

/* The bag lives in the browser (and survives a reload). Checkout hands it to Shopify as a cart link. */
type Line = { variantId: string; name: string; price: number; img: string; qty: number };
type Ctx = { count: number; add: (p: Product) => void; flash: string | null; open: () => void };
const BagCtx = createContext<Ctx>({ count: 0, add: () => {}, flash: null, open: () => {} });
const KEY = "tintashift-bag";

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { try { setLines(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(lines)); }, [lines, loaded]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setShown(false); };
    addEventListener("keydown", esc); return () => removeEventListener("keydown", esc);
  }, []);

  const add = (p: Product) => {
    setLines((ls) => ls.some((l) => l.variantId === p.variantId)
      ? ls.map((l) => (l.variantId === p.variantId ? { ...l, qty: l.qty + 1 } : l))
      : [...ls, { variantId: p.variantId, name: p.name, price: p.price, img: p.img, qty: 1 }]);
    setShown(true);                      // adding something opens the bag, so the next step (checkout) is in view
    setFlash(`${p.name} added to bag`);
    setTimeout(() => setFlash(null), 1600);
  };
  const qty = (id: string, d: number) => setLines((ls) => ls.flatMap((l) => (l.variantId !== id ? [l] : l.qty + d > 0 ? [{ ...l, qty: l.qty + d }] : [])));
  const count = lines.reduce((n, l) => n + l.qty, 0), total = lines.reduce((n, l) => n + l.qty * l.price, 0);

  return (
    <BagCtx.Provider value={{ count, add, flash, open: () => setShown(true) }}>
      {children}
      <AnimatePresence>
        {shown && (
          <>
            <motion.div className="bag-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShown(false)} />
            <motion.aside className="bag" role="dialog" aria-label="Bag" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }}>
              <header><h2>Your bag <span>{count}</span></h2><button onClick={() => setShown(false)} aria-label="Close bag">✕</button></header>
              {lines.length === 0 ? <p className="bag-empty">Your bag is empty.</p> : (
                <ul>
                  {lines.map((l) => (
                    <li key={l.variantId}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.img} alt="" />
                      <div><b>{l.name}</b><span>{CURRENCY}{l.price}</span></div>
                      <div className="bag-qty">
                        <button onClick={() => qty(l.variantId, -1)} aria-label={`One less ${l.name}`}>−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => qty(l.variantId, 1)} aria-label={`One more ${l.name}`}>+</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <footer>
                <div className="bag-total"><span>Subtotal</span><b>{CURRENCY}{total.toFixed(2)}</b></div>
                <a className={`pill dark wide ${lines.length ? "" : "off"}`} href={lines.length ? checkoutUrl(lines) : undefined}>Checkout <span aria-hidden>→</span></a>
                <p>Shipping and taxes are calculated at checkout. Secure checkout by Shopify.</p>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </BagCtx.Provider>
  );
}
export const useBag = () => useContext(BagCtx);
