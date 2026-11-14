"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DEVICE_NAME, CURRENCY, type Product } from "@/lib/shades";
import { useBag } from "./Bag";
import Logo from "./Logo";

/** A looping clip that costs nothing until it is about to scroll into view, and pauses when it leaves. */
function Clip({ src, className = "vid" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!v.src) v.src = src; v.play().catch(() => {}); } else v.pause();
    }, { rootMargin: "300px 0px" });
    io.observe(v); return () => io.disconnect();
  }, [src]);
  return <video ref={ref} className={className} muted loop playsInline preload="none" />;
}

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: .8, ease: [0.22, 1, 0.36, 1] as const },
};

export function Shop({ products }: { products: Product[] }) {
  const { add } = useBag();
  return (
    <section id="shop" className="sec light">
      <div className="sec-head">
        <motion.h2 {...reveal} className="display">One device.<br />Every colour.</motion.h2>
        <motion.p {...reveal} className="lede">The {DEVICE_NAME} shifts your Smart Tips to any colour you pick in the app, whenever you want. Choose the device, a set of tips, or both together.</motion.p>
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
                <span className="card-price">{CURRENCY}{p.price}</span>
              </div>
              <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
              <button className="pill dark sm" disabled={!p.available} onClick={() => add(p)}>{p.available ? "Add to bag" : "Sold out"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
              </button>
            </div>
          </motion.article>
        ))}
      </div>
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
          <h2 className="display">Draw it.<br />Shift it.</h2>
          <p className="lede">Pick a colour or draw a design in the Tintashift app, slide each fingertip into the device and watch the TINTATip shift. Drawn in sketch, shifted with precision.</p>
          <div className="tech-stats">
            <div><b>∞</b><span>colours</span></div>
            <div><b>1</b><span>finger at a time</span></div>
            <div><b>0</b><span>polish, 0 dry time</span></div>
          </div>
        </motion.div>
        <motion.div {...reveal} className="tech-media">
          <Clip className="vid tall" src="/vid/shift.mp4" />
          <Clip src="/vid/wand.mp4" />
          <div className="vid img-wrap"><Image src="/img/app.jpg" alt="Tintashift app colour palette" fill sizes="30vw" /></div>
        </motion.div>
      </div>
    </section>
  );
}


export function Outfits() {
  return (
    <section className="sec light">
      <div className="outfit">
        <motion.div {...reveal} className="outfit-vid"><Clip src="/vid/outfits.mp4" /></motion.div>
        <motion.div {...reveal} className="outfit-copy">
          <h2 className="display">Match the outfit,<br />not the appointment.</h2>
          <p className="lede">Silk in the morning, denim by noon, black for the evening. Pick the colour of the outfit in the app and shift your TINTATips to match. No salon, no remover.</p>
          <a href="#shop" className="pill dark">Shop the device</a>
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
        <h2 className="display">New drops first.</h2>
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
      <nav><a href="#shop">Shop</a><a href="#how">How it works</a><a href="#about">About</a></nav>
      <small>© {new Date().getFullYear()} Tintashift</small>
    </footer>
  );
}
