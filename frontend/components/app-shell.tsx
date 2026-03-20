"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";

const links = [
  { href: "/jobs", label: "Jobs" },
  { href: "/register", label: "Candidates" },
  { href: "/login?role=company", label: "Employers" },
  { href: "/admin/login", label: "Admin" }
];

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  eyebrow = "Fresher Connect",
  contentClassName
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  contentClassName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = usePlatformStore((state) => state.user);
  const logout = usePlatformStore((state) => state.logout);
  const [search, setSearch] = useState("");

  function isActive(href: string) {
    const normalizedHref = href.split("?")[0];
    if (normalizedHref === "/") {
      return pathname === "/";
    }
    return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(params.toString() ? `/jobs?${params.toString()}` : "/jobs");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner topbar-modern react-topbar">
          <Link href="/" className="brand">
            <span className="brand-mark image-mark">
              <img className="brand-logo" src="/fc-logo.svg" alt="Fresher Connect logo" />
            </span>
            <span>
              <span className="brand-title">Fresher Connect</span>
              <span className="brand-sub">Enterprise talent marketplace</span>
            </span>
          </Link>
          <div className="header-inline-tools">
            <nav className="header-nav" aria-label="Primary">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`header-nav-link${isActive(link.href) ? " active-link" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <form className="header-search" onSubmit={handleSearch} role="search">
              <label className="sr-only" htmlFor="headerSearch">
                Search roles, skills, or employers
              </label>
              <input
                className="header-search-input"
                id="headerSearch"
                name="search"
                type="search"
                placeholder="Search roles, skills, or employers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button className="header-search-button" type="submit" aria-label="Search roles">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="6" />
                  <path d="m20 20-4.35-4.35" />
                </svg>
              </button>
            </form>
            <div className="button-row header-actions">
              {user ? (
                <>
                  <Link href={dashboardPath(user.role)} className="btn primary compact-btn">
                    Workspace
                  </Link>
                  <button
                    className="btn ghost compact-btn"
                    type="button"
                    onClick={async () => {
                      await logout();
                      router.push("/");
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn ghost compact-btn">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn primary compact-btn">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className={`container page-shell${contentClassName ? ` ${contentClassName}` : ""}`}>
          {title ? (
            <section className="section-head">
              <div className="page-intro">
                <span className="section-label">{eyebrow}</span>
                <h1 className="page-title">{title}</h1>
                {subtitle ? <p className="muted">{subtitle}</p> : null}
              </div>
              {actions}
            </section>
          ) : null}
          {children}
        </div>
      </main>
      <footer className="footer footer-rich">
        <div className="container footer-rich-grid">
          <section className="footer-brand-block" aria-label="Fresher Connect footer introduction">
            <Link className="brand footer-brand" href="/">
              <span className="brand-mark image-mark">
                <img className="brand-logo" src="/fc-logo.svg" alt="Fresher Connect logo" />
              </span>
              <span>
                <span className="brand-title footer-brand-title">Fresher Connect</span>
                <span className="brand-sub footer-brand-sub">Trusted hiring, clear communication</span>
              </span>
            </Link>
            <p className="footer-copy">
              Fresher Connect helps candidates discover credible opportunities and gives employers a structured workspace for hiring decisions.
            </p>
          </section>

          <nav className="footer-link-column" aria-label="Platform links">
            <span className="footer-column-title">Platform</span>
            <Link className="footer-link" href="/">
              About Fresher Connect
            </Link>
            <Link className="footer-link" href="/jobs">
              Explore opportunities
            </Link>
            <Link className="footer-link" href="/login?role=company">
              Employer access
            </Link>
            <Link className="footer-link" href="/admin/login">
              Admin access
            </Link>
          </nav>

          <nav className="footer-link-column" aria-label="Candidate links">
            <span className="footer-column-title">Candidates</span>
            <Link className="footer-link" href="/register">
              Create account
            </Link>
            <Link className="footer-link" href="/login">
              Sign in
            </Link>
            <Link className="footer-link" href="/jobs">
              Browse verified roles
            </Link>
            <Link className="footer-link" href="/user">
              Candidate workspace
            </Link>
          </nav>

          <nav className="footer-link-column" aria-label="Employer links">
            <span className="footer-column-title">Employers</span>
            <Link className="footer-link" href="/register?role=company">
              Register company
            </Link>
            <Link className="footer-link" href="/login?role=company">
              Recruiter sign in
            </Link>
            <Link className="footer-link" href="/company">
              Employer workspace
            </Link>
            <Link className="footer-link" href="/admin">
              Governance workspace
            </Link>
          </nav>
        </div>

        <div className="container footer-bottom-row">
          <span>Move from discovery to application progress without leaving the product context.</span>
          <Link className="text-link" href="/jobs">
            Browse opportunities
          </Link>
        </div>
      </footer>
    </div>
  );
}
