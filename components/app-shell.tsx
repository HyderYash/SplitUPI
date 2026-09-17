"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Moon, Sun, Menu, Play, Plus, Info } from "lucide-react";

export function Logo() {
  return (
    <span className="wordmark">
      <span className="logo-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      Split<span className="logo-upi">UPI</span>
    </span>
  );
}
export function AppHeader() {
  const path = usePathname();
  function toggleTheme() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("splitupi:theme", next);
    } catch {
      /* Theme is usable without storage. */
    }
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" aria-label="SplitUPI home">
          <Logo />
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#how-it-works" className="nav-link">
            How it works
          </Link>
          <Link href="/about" className="nav-link">
            The experiment <ArrowUpRight size={13} />
          </Link>
          <Link href="/launch/splitupi-film.html" className="nav-link">
            The film <Play size={12} />
          </Link>
        </nav>
        <div className="header-actions">
          <span className="prototype-pill">
            <span />
            Prototype v0.1
          </span>
          <button
            onClick={toggleTheme}
            className="icon-button theme-toggle"
            aria-label="Toggle color theme"
          >
            <Moon className="moon" size={18} />
            <Sun className="sun" size={18} />
          </button>
          {path !== "/create" && (
            <Link className="button button-small header-cta" href="/create">
              Try it out <ArrowUpRight size={15} />
            </Link>
          )}
          <details className="mobile-menu" onClick={(event) => {
            if ((event.target as Element).closest("a")) event.currentTarget.open = false;
          }} onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.open = false;
          }}>
            <summary aria-label="Open navigation">
              <Menu size={19} />
            </summary>
            <div>
              <Link href="/create">
                <Plus size={16} />
                Create a payment
              </Link>
              <Link href="/demo">
                <Play size={15} />
                Explore the demo
              </Link>
              <Link href="/launch/splitupi-film.html">
                <Play size={15} />
                Watch the film
              </Link>
              <Link href="/about">
                <Info size={16} />
                About the experiment
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/">
          <Logo />
        </Link>
        <span>Made for the way we pay.</span>
        <Link href="/about">
          An open experiment <ArrowUpRight size={13} />
        </Link>
      </div>
      <p>
        This is an experimental prototype and does not determine how NPCI,
        banks, PSPs or merchants classify or price transactions. Actual payment
        treatment depends on applicable rules and payment-provider
        implementation.
      </p>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} SplitUPI</span>
        <span>
          Built with intention. In India. <span className="india-dot" />
        </span>
      </div>
    </footer>
  );
}
