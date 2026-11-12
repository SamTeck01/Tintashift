"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { shades, products, DEVICE_NAME } from "@/lib/shades";
import { useBag } from "./Bag";
import { Swatches } from "./Hero";
import Logo from "./Logo";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: .8, ease: [0.22, 1, 0.36, 1] as const },
};

export function ShadesGrid() {
  const { add } = useBag();
  return (
    <section id="shades" className="sec light">
      <div className="sec-head">
        <motion.h2 {...reveal} className="display">Six shades.<br />One kit.</motion.h2>
        <motion.p {...reveal} className="lede">The {DEVICE_NAME} shifts every TINTATips nail between all six shades and any design you draw in the app. Buy it once and wear every colour.</motion.p>
      </div>
      <div className="shop">
        {products.map((p, k) => (
          <motion.article key={p.id} className={`prod ${k === 0 ? "feat" : ""}`} {...reveal} transition={{ ...reveal.transition, delay: k * .08 }}>
            <div className="prod-img">
              <Image src={p.img} alt={p.name} fill sizes="(max-width: 760px) 100vw, 40vw" />
              {p.badge && <span className="card-tag glass">{p.badge}</span>}
            </div>
            <div className="prod-body">
              <div className="card-foot">
                <div><h3>{p.name}</h3><p>{p.sub}</p></div>
                <span className="card-price">${p.price}</span>
              </div>
              <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
              <button className="pill dark sm" onClick={() => add()}>Add to bag
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
              </button>
            </div>
          </motion.article>
        ))}
      </div>
      <motion.div {...reveal} className="shade-strip">
        {shades.map((s) => (
          <div key={s.id} className="strip-item" style={{ background: s.bg, color: s.ink === "light" ? "#fff" : "#1a1216" }}>
            <span>{s.no}</span><b>{s.name}</b>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

const steps = [
  "Push back cuticles and clear dead skin.",
  "Lightly buff the nail surface.",
  "Wipe nails clean with an alcohol pad.",
  "Select the best-fitting sticky tab.",
  "Apply the tab and press firmly on all edges.",
  "Align the press-on at a 30° angle from the cuticle and press down.",
  "Keep hands dry for 2 hours while the adhesive sets.",
];

export function HowToWear() {
  return (
    <section id="how" className="sec light">
      <div className="sec-head">
        <motion.h2 {...reveal} className="display">On in minutes.<br />Shifted in seconds.</motion.h2>
        <motion.p {...reveal} className="lede">Seven simple steps. Everything you need is in the box: tips, tabs, file and alcohol pads.</motion.p>
      </div>
      <div className="steps">
        {steps.map((t, k) => (
          <motion.div key={k} className="step" {...reveal} transition={{ ...reveal.transition, delay: k * .05 }}>
            <div className="step-img"><Image src={`/img/step${k + 1}.jpg`} alt={t} fill sizes="(max-width: 700px) 70vw, 25vw" /></div>
            <p><span>Step {k + 1}</span>{t}</p>
          </motion.div>
        ))}
        <motion.div className="step kit" {...reveal}>
          <div className="step-img"><Image src="/img/kit.jpg" alt="TINTATips kit" fill sizes="(max-width: 700px) 70vw, 25vw" /></div>
          <p><span>In the box</span>24 tips, sticky tabs, nail file, alcohol pads.</p>
        </motion.div>
      </div>
    </section>
  );
}

export function Technology() {
  return (
    <section id="about" className="sec dark-sec">
      <div className="tech">
        <motion.div {...reveal} className="tech-copy">
          <p className="eyebrow">Wearable beauty technology</p>
          <h2 className="display">One device.<br />Every shade.</h2>
          <p className="lede">Pick a colour or draw a design in the Tintashift app, slide each fingertip into the device and watch the nail shift. Drawn in sketch, shifted with precision.</p>
          <div className="tech-stats">
            <div><b>6</b><span>signature shades</span></div>
            <div><b>1</b><span>finger at a time</span></div>
            <div><b>0</b><span>polish, 0 dry time</span></div>
          </div>
        </motion.div>
        <motion.div {...reveal} className="tech-media">
          <video className="vid tall" src="/vid/shift.mp4" autoPlay muted loop playsInline />
          <video className="vid" src="/vid/wand.mp4" autoPlay muted loop playsInline />
          <div className="vid img-wrap"><Image src="/img/app.jpg" alt="Tintashift app colour palette" fill sizes="30vw" /></div>
        </motion.div>
      </div>
    </section>
  );
}

const tones = [
  { id: "Fair", f: "brightness(1.08) saturate(.9)" },
  { id: "Light", f: "none" },
  { id: "Medium", f: "brightness(.86) saturate(1.15) sepia(.18)" },
  { id: "Deep", f: "brightness(.62) saturate(1.2) sepia(.3)" },
];

export function TryOnTones() {
  const [i, setI] = useState(2);
  const [t, setT] = useState(1);
  const s = shades[i];
  return (
    <section className="sec light">
      <div className="tones">
        <motion.div {...reveal} className="tones-copy">
          <h2 className="display">See the colour on a hand before it reaches yours.</h2>
          <div className="tone-tabs" role="tablist">
            {tones.map((x, k) => (
              <button key={x.id} role="tab" aria-selected={k === t} className={k === t ? "on" : ""} onClick={() => setT(k)}>{x.id}</button>
            ))}
          </div>
          <Swatches active={i} onPick={setI} size={26} />
          <p className="try-caption dark">{s.no}. {s.name} · {tones[t].id}</p>
        </motion.div>
        <motion.div {...reveal} className="tones-img" style={{ background: s.bg }}>
          {shades.map((x, k) => (
            <Image key={x.id} src={`/img/hand-${x.id}.jpg`} alt="" fill sizes="(max-width: 700px) 100vw, 55vw"
              className={`hero-img ${k === i ? "on" : ""}`} style={{ filter: tones[t].f }} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function Outfits() {
  return (
    <section className="sec light">
      <div className="outfit">
        <motion.div {...reveal} className="outfit-vid"><video className="vid" src="/vid/outfits.mp4" autoPlay muted loop playsInline /></motion.div>
        <motion.div {...reveal} className="outfit-copy">
          <h2 className="display">Match the outfit,<br />not the appointment.</h2>
          <p className="lede">Silk in the morning, denim by noon, black for the evening. Shift your nails to match without a salon visit or a drop of remover.</p>
          <a href="#shades" className="pill dark">Shop the shades</a>
        </motion.div>
      </div>
    </section>
  );
}

export function Newsletter() {
  const [done, setDone] = useState(false);
  return (
    <section className="sec light news">
      <motion.div {...reveal} className="news-inner">
        <h2 className="display">New shades first.</h2>
        <p className="lede">Drops, restocks and early access. No spam, ever.</p>
        {done ? <p className="news-done">You’re on the list. ✦</p> : (
          <form className="news-form" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
            <input type="email" required placeholder="Email address" aria-label="Email address" />
            <button className="pill dark">Subscribe</button>
          </form>
        )}
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <Logo />
      <p>Wearable Beauty Technology · live in colour</p>
      <nav><a href="#shades">Shades</a><a href="#how">How to wear</a><a href="#about">About</a></nav>
      <small>© {new Date().getFullYear()} Tintashift</small>
    </footer>
  );
}
