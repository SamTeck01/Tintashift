"use client";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { presets, products, DEVICE_NAME, backdrop } from "@/lib/shades";
import { useBag } from "./Bag";
import Logo from "./Logo";

const Scene = dynamic(() => import("./Scene"), { ssr: false });
const ease = [0.22, 1, 0.36, 1] as const;
const device = products[0];

export default function Hero() {
  const [hex, setHex] = useState(presets[5].hex);
  const [custom, setCustom] = useState("#7c4dff");
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  useEffect(() => {
    const on = () => {
      const el = wrap.current; if (!el) return;
      const max = el.offsetHeight - window.innerHeight;
      progress.current = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / Math.max(1, max)));
    };
    on(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { count, add, flash } = useBag();
  const preset = presets.find((p) => p.hex === hex);
  const label = preset ? preset.name : "Your colour";
  const bg = backdrop(hex);

  useEffect(() => { document.documentElement.style.setProperty("--shade", hex); }, [hex]);

  const pickCustom = (v: string) => {
    setCustom(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setHex(v), 220);
  };

  return (
    <div ref={wrap} className="hero-wrap">
    <section className="hero" style={{ background: bg }}>
      <div className="hero-stack">
        <div className="scene"><Scene hex={hex} bg={bg} progress={progress} /></div>
        <div className="hero-shade" />
      </div>

      <header className="nav">
        <a href="#" className="nav-logo"><Logo /></a>
        <nav className="nav-links">
          <a href="#shop">Shop</a><a href="#how">How it works</a><a href="#about">About</a>
        </nav>
        <button className="pill glass bag-btn" aria-label="Bag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
          Bag <span className="bag-count">{count}</span>
        </button>
      </header>

      <div className="hero-copy">
        <p className="eyebrow">{DEVICE_NAME}</p>
        <h1 className="shade-name">Any colour.<br />
          <AnimatePresence mode="wait">
            <motion.span key={label + hex} className="hero-colour"
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }} transition={{ duration: .5, ease }}>
              <i style={{ background: hex }} />{label}
            </motion.span>
          </AnimatePresence>
        </h1>
        <p className="shade-note">Wear TINTATips press-ons, slide a fingertip in, and the tip comes out in any colour you pick. No polish, no salon, no drying time.</p>
        <div className="cta-row">
          <button className="pill dark" onClick={() => add()}>Add to bag <span className="price">${device.price}</span></button>
          <a className="pill outline" href="#how">How it works <span aria-hidden>↓</span></a>
        </div>
      </div>

      <motion.div className="picker glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease, delay: .3 }}>
        <span className="picker-label">Pick a colour</span>
        <div className="picker-dots">
          {presets.map((p) => (
            <button key={p.hex} className={`dot ${p.hex === hex ? "is-active" : ""}`} style={{ ["--c" as string]: p.hex }}
              onClick={() => setHex(p.hex)} aria-label={p.name} title={p.name} />
          ))}
          <label className={`dot custom ${!preset ? "is-active" : ""}`} title="Any colour">
            <input type="color" value={custom} onChange={(e) => pickCustom(e.target.value)} aria-label="Pick any colour" />
          </label>
        </div>
        <span className="picker-hex">{hex.toUpperCase()}</span>
      </motion.div>

      <AnimatePresence>
        {flash && <motion.div className="toast glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{flash}</motion.div>}
      </AnimatePresence>
    </section>
    </div>
  );
}
