/**
 * Pactora mark.
 *
 * Two opposing brackets - the buyer and the seller - holding a single square
 * between them: value held in escrow by two parties at once. Drawn on the
 * same geometry as the UI (2px strokes, square-ish corners, acid accent).
 */
export function PactoraMark({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* buyer - left bracket */}
      <path
        d="M9.5 3.5H4.5V20.5H9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {/* seller - right bracket */}
      <path
        d="M14.5 3.5H19.5V20.5H14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {/* escrow - value held between them */}
      <rect x="10" y="10" width="4" height="4" fill="#cdff00" />
    </svg>
  );
}

/** Wordmark: the mark plus the name, locked to the same baseline. */
export function PactoraLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <PactoraMark size={20} className="text-white/70" />
      <span className="font-mono text-xs uppercase tracking-label text-white">
        Pactora
      </span>
    </span>
  );
}
