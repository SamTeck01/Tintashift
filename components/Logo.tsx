export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6a6b9" /><stop offset=".35" stopColor="#c58cf0" />
            <stop offset=".7" stopColor="#7aa8ff" /><stop offset="1" stopColor="#7fe0c8" />
          </linearGradient>
        </defs>
        <path d="M16 3a13 13 0 1 0 13 13h-5.5A7.5 7.5 0 1 1 16 8.5c2.4 0 4.2 1.4 4.2 3.6 0 2-1.6 3.4-3.6 3.4-1.4 0-2.4-.9-2.4-2.1"
          fill="none" stroke="url(#lg)" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      <span className="logo-word">TINTA<b>SHIFT</b></span>
    </span>
  );
}
