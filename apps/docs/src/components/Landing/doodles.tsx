// Hand-authored SVG doodles for the landing page. Colors mirror the CSS custom properties in
// landing.css (SVG attributes are kept as plain hex so they never depend on the cascade).
// The exception: strokes drawn straight onto the page use currentColor, so they follow the theme.
const PAGE = "currentColor";

const INK = "#1b1a17";
const PAPER = "#fff9e6";
const YELLOW = "#ffd84d";
const GREEN = "#2db87c";
const CORAL = "#f05a3c";
const BLUE = "#2563eb";

const stroke = {
  stroke: INK,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A wobbly marker underline, stretched under whatever it is placed in. */
export function Underline({ color = CORAL }: { color?: string }) {
  return (
    <svg
      className="lp-underline"
      viewBox="0 0 300 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 13 C 40 5, 70 17, 112 9 S 190 4, 226 11 S 280 8, 296 10"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M30 18 C 80 13, 130 19, 176 15"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A marker circle that overshoots where it started, as if drawn in one go. */
export function MarkerCircle({ color = CORAL }: { color?: string }) {
  return (
    <svg
      className="lp-circle"
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M52 14 C 120 2, 232 4, 276 28 C 304 48, 270 86, 168 92 C 84 97, 8 82, 10 52 C 12 22, 70 8, 150 6 C 190 5, 230 9, 250 16"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** The mascot's sprout, body and face. */
function BuddyHead() {
  return (
    <>
      <path d="M112 34 C 110 18, 118 10, 124 4" fill="none" stroke={PAGE} />
      <path
        d="M124 6 C 134 -6, 152 -2, 154 10 C 142 16, 130 14, 124 6 Z"
        fill={GREEN}
        strokeWidth="4.5"
      />
      <path
        d="M112 24 C 102 10, 86 12, 82 24 C 92 32, 104 32, 112 24 Z"
        fill={GREEN}
        strokeWidth="4.5"
      />
      {/* body with a folded corner */}
      <path
        d="M34 36 C 80 29, 124 34, 160 31 L 190 63 C 193 112, 187 160, 190 210 C 150 217, 80 213, 33 211 C 28 150, 38 92, 34 36 Z"
        fill={YELLOW}
      />
      <path d="M160 31 L 161 64 L 190 63" fill={PAPER} strokeWidth="5" />
      {/* face */}
      <circle cx="84" cy="98" r="14" fill="#fff" strokeWidth="4.5" />
      <circle cx="138" cy="98" r="14" fill="#fff" strokeWidth="4.5" />
      <circle cx="88" cy="100" r="6" fill={INK} stroke="none" />
      <circle cx="142" cy="100" r="6" fill={INK} stroke="none" />
      <path d="M82 134 C 96 164, 128 164, 142 132" fill="none" />
      <circle cx="62" cy="128" r="9" fill={CORAL} opacity="0.55" stroke="none" />
      <circle cx="162" cy="128" r="9" fill={CORAL} opacity="0.55" stroke="none" />
    </>
  );
}

/** The mascot: a friendly config file. Drawn in a -10 0 250 260 box. */
function Buddy() {
  return (
    <g {...stroke} strokeWidth="6">
      <ellipse cx="112" cy="252" rx="78" ry="8" fill={PAGE} opacity="0.14" stroke="none" />
      {/* legs and shoes */}
      <path d="M82 206 L80 238 M142 206 L144 238" fill="none" stroke={PAGE} />
      <ellipse cx="70" cy="244" rx="21" ry="10" fill={CORAL} strokeWidth="5" />
      <ellipse cx="154" cy="244" rx="21" ry="10" fill={CORAL} strokeWidth="5" />
      {/* arms */}
      <path d="M36 134 C 16 142, 8 160, 12 178" fill="none" stroke={PAGE} />
      <path d="M190 120 C 214 112, 222 86, 212 62" fill="none" stroke={PAGE} />
      <circle cx="12" cy="182" r="9" fill={PAPER} strokeWidth="5" />
      <circle cx="211" cy="56" r="10" fill={PAPER} strokeWidth="5" />
      <BuddyHead />
    </g>
  );
}

/** The footer mascot, on its own. */
export function BuddyArt() {
  return (
    <svg viewBox="-10 -14 250 280" aria-hidden="true" focusable="false">
      <Buddy />
    </svg>
  );
}

/** The top of the mascot, for peeking out from behind something that hides its lower edge. */
export function BuddyPeekArt() {
  return (
    <svg viewBox="26 -14 172 200" aria-hidden="true" focusable="false">
      <g {...stroke} strokeWidth="6">
        <BuddyHead />
      </g>
    </svg>
  );
}

/** Reference layer: a paint palette. */
export function PaletteIcon() {
  return (
    <svg viewBox="0 0 100 96" aria-hidden="true" focusable="false">
      <path
        d="M10 50 C 6 22, 40 6, 64 12 C 94 20, 96 52, 78 62 C 64 68, 70 82, 52 86 C 26 90, 12 74, 10 50 Z"
        fill="#fff"
        {...stroke}
        strokeWidth="4.5"
      />
      <ellipse cx="62" cy="72" rx="7" ry="5" fill={PAPER} {...stroke} strokeWidth="3.5" />
      <circle cx="30" cy="36" r="8" fill={CORAL} {...stroke} strokeWidth="3.5" />
      <circle cx="54" cy="26" r="8" fill={YELLOW} {...stroke} strokeWidth="3.5" />
      <circle cx="76" cy="40" r="8" fill={GREEN} {...stroke} strokeWidth="3.5" />
      <circle cx="28" cy="62" r="8" fill={BLUE} {...stroke} strokeWidth="3.5" />
    </svg>
  );
}

/** System layer: a label that says what a value is for. */
export function TagIcon() {
  return (
    <svg viewBox="0 0 100 96" aria-hidden="true" focusable="false">
      <path d="M26 24 C 30 8, 54 6, 60 22" fill="none" {...stroke} stroke={PAGE} strokeWidth="4" />
      <path
        d="M14 36 L 44 20 L 88 24 L 84 70 L 46 88 Z"
        fill={YELLOW}
        {...stroke}
        strokeWidth="4.5"
        transform="rotate(-6 50 52)"
      />
      <circle cx="68" cy="38" r="6" fill={PAPER} {...stroke} strokeWidth="3.5" />
      <path
        d="M32 52 C 42 46, 52 56, 62 50 M34 66 C 42 62, 50 68, 58 64"
        fill="none"
        {...stroke}
        strokeWidth="3.5"
      />
    </svg>
  );
}

/** Components layer: a button being clicked. */
export function ButtonIcon() {
  return (
    <svg viewBox="0 0 100 96" aria-hidden="true" focusable="false">
      <rect x="8" y="28" width="78" height="42" rx="12" fill={BLUE} {...stroke} strokeWidth="4.5" />
      <path d="M24 49 L 62 49" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M64 54 L64 88 L72 80 L78 92 L85 89 L79 77 L90 77 Z"
        fill="#fff"
        {...stroke}
        strokeWidth="3.5"
      />
      <path
        d="M78 36 L88 28 M84 48 L96 46 M70 28 L72 16"
        fill="none"
        {...stroke}
        stroke={PAGE}
        strokeWidth="3.5"
      />
    </svg>
  );
}
