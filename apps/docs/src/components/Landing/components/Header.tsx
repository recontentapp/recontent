import { Link } from "vocs";

export type Theme = "light" | "dark";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <header className="lp-header lp-wrap">
      <Link to="/" className="lp-logo">
        <img src={`/logo-${theme}.svg`} alt="Recontent" width={120} height={28} />
      </Link>
      <div className="lp-header-end">
        <nav aria-label="Main">
          <ul className="lp-nav">
            <li>
              <Link to="/introduction/why-recontent">Docs</Link>
            </li>
            <li>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/recontentapp/recontentapp"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
        <button
          type="button"
          className="lp-theme-toggle"
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          onClick={onToggleTheme}
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  );
}
