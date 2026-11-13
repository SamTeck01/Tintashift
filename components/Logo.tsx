/* The TINTAShift mark: the brand's chameleon (cut from their own artwork) and the wordmark set in type. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/chameleon.png" alt="" width={34} height={30} className="logo-mark" />
      <span className="logo-word">TINTA<b>Shift</b></span>
    </span>
  );
}
