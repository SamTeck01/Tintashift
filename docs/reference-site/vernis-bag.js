/* Bag adapted from ascenta-parfum/checkout.js. A native dialog owns focus,
   Escape and the mobile top layer; this design showcase takes no payments. */
(() => {
  'use strict';
  const key = 'vernis:bag:v1', products = new Map();
  let bag = [], previousFocus = null;
  try { bag = JSON.parse(localStorage.getItem(key)) || []; } catch (_) {}
  if (!Array.isArray(bag)) bag = [];
  const money = n => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(n);
  const dialog = document.createElement('dialog');
  dialog.id = 'vernisBag'; dialog.className = 'bag-dialog';
  dialog.setAttribute('aria-labelledby', 'bagTitle');
  dialog.innerHTML = `<div class="bag-sheet">
    <header class="bag-head"><h2 id="bagTitle">Your bag <span id="bagItems"></span></h2>
      <button type="button" class="bag-close" aria-label="Close bag" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
    <div class="bag-lines"></div>
    <footer class="bag-foot"><p class="bag-total"><span>Subtotal</span><strong></strong></p>
      <p class="bag-note">Design showcase. Purchases are unavailable.</p>
      <button type="button" class="bag-continue">Continue exploring <span aria-hidden="true">↗</span></button></footer>
    </div>`;
  document.body.append(dialog);
  const lines = dialog.querySelector('.bag-lines');
  const button = document.querySelector('#bolsa');
  button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', dialog.id);
  function count() { return bag.reduce((n,l) => n + l.qty, 0); }
  function save() { try { localStorage.setItem(key, JSON.stringify(bag)); } catch (_) {} }
  function badge() {
    const n = count(), badge = document.querySelector('#cuenta');
    badge.textContent = n; badge.classList.toggle('llena', n > 0);
    button.setAttribute('aria-label', `Bag, ${n} item${n === 1 ? '' : 's'}`);
  }
  function render() {
    const n = count();
    dialog.querySelector('#bagItems').textContent = `(${n})`;
    lines.replaceChildren();
    if (!bag.length) {
      const empty = document.createElement('div'); empty.className = 'bag-empty';
      empty.innerHTML = '<h3>A little colour?</h3><p>Your bag is empty. Explore the six shades.</p>';
      lines.append(empty);
    }
    for (const l of bag) {
      const p = products.get(l.sku); if (!p) continue;
      const row = document.createElement('article'); row.className = 'bag-line'; row.dataset.sku = l.sku;
      // Product values come from the site's fixed catalogue, never from persisted markup.
      row.innerHTML = `<img src="${p.img}" alt="${p.name} nail lacquer" width="84" height="112">
        <div class="bag-detail"><h3>${p.name}</h3><p>Gloss nail lacquer · 12 ml</p>
          <div class="bag-qty"><button type="button" data-q="-1" aria-label="One less ${p.name}">−</button><span>${l.qty}</span><button type="button" data-q="1" aria-label="One more ${p.name}">+</button></div></div>
        <div class="bag-amount"><strong>${money(p.price*l.qty)}</strong><button type="button" class="bag-remove" aria-label="Remove ${p.name}">Remove</button></div>`;
      lines.append(row);
    }
    dialog.querySelector('.bag-total strong').textContent = money(bag.reduce((n,l) => n + l.qty*products.get(l.sku).price,0));
  }
  function close() { dialog.close(); }
  button.addEventListener('click', () => {
    if (dialog.open) return;
    render(); previousFocus = document.activeElement;
    dialog.showModal(); document.documentElement.classList.add('bag-open');
  });
  dialog.querySelector('.bag-close').addEventListener('click', close);
  dialog.querySelector('.bag-continue').addEventListener('click', close);
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('bag-open');
    previousFocus?.focus({preventScroll:true});
  });
  lines.addEventListener('click', e => {
    const b = e.target.closest('button'), row = b?.closest('.bag-line'); if (!row) return;
    const sku = row.dataset.sku, line = bag.find(l => l.sku === sku); if (!line) return;
    if (b.classList.contains('bag-remove')) bag = bag.filter(l => l.sku !== sku);
    else line.qty = Math.min(99, line.qty + Number(b.dataset.q));
    bag = bag.filter(l => l.qty > 0); save(); badge(); render();
    const target = [...lines.querySelectorAll('.bag-line')].find(r => r.dataset.sku === sku);
    (target?.querySelector(b.classList.contains('bag-remove') ? '.bag-remove' : `[data-q="${b.dataset.q}"]`) || lines.querySelector('button') || dialog.querySelector('.bag-close')).focus({preventScroll:true});
    document.querySelector('#estadoBolsa').textContent = `Bag updated. ${count()} items.`;
  });
  window.VERNIS_BAG = {
    init(catalogue) {
      catalogue.forEach(p => products.set(p.sku,p));
      const seen = new Set();
      bag = bag.filter(l => l && products.has(l.sku) && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 99 && !seen.has(l.sku) && seen.add(l.sku));
      badge();
    },
    add(sku) {
      if (!products.has(sku)) return count();
      const l = bag.find(l => l.sku === sku);
      if (l) l.qty = Math.min(99,l.qty+1); else bag.push({sku,qty:1});
      save(); badge(); if (dialog.open) render(); return count();
    }
  };
})();
