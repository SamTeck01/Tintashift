"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { shades, PRICE, type Shade } from "@/lib/shades";
import { useBag } from "./Bag";
import Logo from "./Logo";

const ease = [0.22, 1, 0.36, 1] as const;

function Tip({ s, active, onClick }: { s: Shade; active: boolean; onClick: () => void }) {
  return (
    <button className={`tip ${active ? "is-active" : ""}`} onClick={onClick} aria-label={`${s.name} shade`} aria-pressed={active}>
      <span className="tip-shape" style={{ ["--c" as string]: s.hex, ["--d" as string]: s.deep }} />
      <span className="tip-meta">
        <span className="tip-no">{s.no}</span>
        <span className="tip-name">{s.name}</span>
        <span className="tip-price">${PRICE}</span>
      </span>
    </button>
  );
}

export function Swatches({ active, onPick, size = 22 }: { active: number; onPick: (i: number) => void; size?: number }) {
  return (
    <div className="swatches">
      {shades.map((s, i) => (
        <button key={s.id} className={`dot ${i === active ? "is-active" : ""}`} onClick={() => onPick(i)}
          aria-label={s.name} style={{ width: size, height: size, ["--c" as string]: s.hex }} />
      ))}
    </div>
  );
}

export default function Hero() {
  const [i, setI] = useState(5);
  const [tryOn, setTryOn] = useState(false);
  const { count, add, flash } = useBag();
  const s = shades[i];

  useEffect(() => {
    document.documentElement.style.setProperty("--shade-bg", s.bg);
    document.documentElement.style.setProperty("--shade", s.hex);
  }, [s]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTryOn(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className={`hero ink-${s.ink}`} style={{ background: s.bg }}>
      {/* preload all shade images so switching never flashes */}
      <div className="hero-stack">
        {shades.map((x, k) => (
          <Image key={x.id} src={`/img/hero-${x.id}.jpg`} alt="" fill priority={k === 5} sizes="100vw"
            className={`hero-img ${k === i && !tryOn ? "on" : ""}`} />
        ))}
        {shades.map((x, k) => (
          <Image key={`h-${x.id}`} src={`/img/hand-${x.id}.jpg`} alt="" fill sizes="100vw"
            className={`hero-img hand ${k === i && tryOn ? "on" : ""}`} />
        ))}
        <div className="hero-shade" />
      </div>

      <header className="nav">
        <a href="#" className="nav-logo" onClick={() => setTryOn(false)}><Logo /></a>
        <nav className="nav-links">
          <a href="#shades">Shades</a><a href="#how">How to wear</a><a href="#about">About</a>
        </nav>
        <button className="pill glass bag-btn" aria-label="Bag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
          Bag <span className="bag-count">{count}</span>
        </button>
      </header>

      <AnimatePresence mode="wait">
        {!tryOn ? (
          <motion.div key="main" className="hero-copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .4 }}>
            <p className="eyebrow">{s.no} · Smart press-on</p>
            <AnimatePresence mode="wait">
              <motion.h1 key={s.id} className="shade-name"
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: .55, ease }}>
                {s.name}
              </motion.h1>
            </AnimatePresence>
            <p className="shade-note">{s.note} Colour-shifting, chip-free. 24 tips.</p>
            <div className="cta-row">
              <button className="pill dark" onClick={() => add()}>Add to bag <span className="price">${PRICE}</span></button>
              <button className="pill outline" onClick={() => setTryOn(true)}>Try it on <span aria-hidden>↗</span></button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="try" className="try-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .4 }}>
            <button className="back glass" onClick={() => setTryOn(false)} aria-label="Back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <motion.div className="try-card glass" initial={{ opacity: 0, y: 20, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .6, ease, delay: .15 }}>
              <p className="eyebrow">Try it on</p>
              <AnimatePresence mode="wait">
                <motion.h2 key={s.id} className="try-name" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .35 }}>{s.name}</motion.h2>
              </AnimatePresence>
              <Swatches active={i} onPick={setI} />
              <p className="try-caption">{s.no}. {s.name}</p>
              <button className="pill dark wide" onClick={() => add()}>Add to bag <span className="price">${PRICE}</span></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!tryOn && (
          <motion.div className="tips" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: .6, ease }}>
            {shades.map((x, k) => <Tip key={x.id} s={x} active={k === i} onClick={() => setI(k)} />)}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {flash && <motion.div className="toast glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{flash} · {s.name}</motion.div>}
      </AnimatePresence>
    </section>
  );
}
