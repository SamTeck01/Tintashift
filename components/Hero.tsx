"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { presets, products, sets, surface, isLight, DEVICE_NAME, CURRENCY, type SetId } from "@/lib/shades";
import { useBag } from "./Bag";
import HeroScene from "./HeroScene";
import Logo from "./Logo";

const ease = [0.22, 1, 0.36, 1] as const;
const device = products[0];

export default function Hero() {
  const [hex, setHex] = useState(presets[5].hex);
  const [custom, setCustom] = useState("#7c4dff");
  const [set, setSet] = useState<SetId>("si001");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { count, add, flash } = useBag();
  const preset = presets.find((p) => p.hex === hex);
  const label = preset ? preset.name : "Your colour";
  const bg = surface(hex);

  useEffect(() => { document.documentElement.style.setProperty("--shade", hex); }, [hex]);

  const pickCustom = (v: string) => {
    setCustom(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setHex(v), 120);
  };

  return (
    <section className={`hero ${isLight(bg) ? "ink-dark" : ""}`} style={{ background: bg }}>
      <HeroScene tint={bg} tip={hex} set={set} />
      <div className="hero-shade" />

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
        <p className="eyebrow">{DEVICE_NAME} · Smart Tips</p>
        <h1 className="shade-name">Any colour.<br />
          <AnimatePresence mode="wait">
            <motion.span key={label + hex} className="hero-colour"
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }} transition={{ duration: .35, ease }}>
              <i style={{ background: hex }} />{label}
            </motion.span>
          </AnimatePresence>
        </h1>
        <p className="shade-note">Press-on nails that change colour. Pick a shade, slide a tip into the {DEVICE_NAME}, and it shifts in seconds.</p>
        <div className="cta-row">
          <button className="pill dark" onClick={() => add()}>Add to bag <span className="price">{CURRENCY}{device.price}</span></button>
          <a className="pill outline" href="#how">How it works <span aria-hidden>↓</span></a>
        </div>
      </div>

      <motion.div className="panel glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease, delay: .2 }}>
        <div className="panel-row">
          <span className="panel-label">Pick a colour</span>
          <span className="panel-hex">{hex.toUpperCase()}</span>
        </div>
        <div className="panel-dots">
          {presets.map((p) => (
            <button key={p.hex} className={`dot ${p.hex === hex ? "is-active" : ""}`} style={{ ["--c" as string]: p.hex }}
              onClick={() => setHex(p.hex)} aria-label={p.name} title={p.name} />
          ))}
          <label className={`dot custom ${!preset ? "is-active" : ""}`} title="Any colour">
            <input type="color" value={custom} onChange={(e) => pickCustom(e.target.value)} aria-label="Pick any colour" />
          </label>
        </div>
        <div className="panel-row"><span className="panel-label">Nail set</span><span className="panel-hex">{CURRENCY}39 a set</span></div>
        <div className="panel-sets" role="radiogroup" aria-label="Nail set">
          {sets.map((s) => (
            <button key={s.id} role="radio" aria-checked={set === s.id} className={`set ${set === s.id ? "on" : ""}`} onClick={() => setSet(s.id)}>
              <span className="set-nail" style={{ ["--b" as string]: s.base ?? hex }} />
              <span className="set-txt"><b>{s.name}</b>{s.tag}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {flash && <motion.div className="toast glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{flash}</motion.div>}
      </AnimatePresence>
    </section>
  );
}
