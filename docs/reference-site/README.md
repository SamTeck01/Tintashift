# Reference site: VERNIS by Ascenta Studio

Saved copy of https://ascentastudio.com/vernis/ supplied by SamTeck, kept for study only. Code only: their photos
and videos are left out on purpose (we must not reuse them). The live site still serves them.

What to read:
- `vernis.js`: the whole hero. Comments are in Spanish. Key parts: `TONOS` (shades), the fragment shader `FS`
  (cross-fades aligned photos, colour spreads from the click point), `MOVIL` (phones get their own 9:16 photos,
  prefix `m`), `acerca()` / `aleja()` (click the hand: a video `ida-<shade>.mp4` plays the camera move into the
  close-up; `vuelta-<shade>.mp4` plays it back; the close-up photo is underneath so the cut is invisible).
- `vernis.css`: layout. The `@media (max-aspect-ratio:4/5)` block is the phone layout.
- `index.html`: markup: `.ficha` (opening shot card), `.cerca` (close-up: back button `.volver`, panel with colour drops `.gotas`).
