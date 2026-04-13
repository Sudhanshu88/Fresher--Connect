"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { LiveUpdatesTicker } from "@/components/live-updates-ticker";
import { usePlatformStore } from "@/lib/stores/platform-store";

export function AuthShell({
  brandSubtitle,
  showBrand = true,
  showUtilityHeader = false,
  signInHref = "/login",
  createAccountHref = "/register",
  pageClassName,
  shellClassName,
  leftClassName,
  rightClassName,
  left,
  right
}: {
  brandSubtitle: string;
  showBrand?: boolean;
  showUtilityHeader?: boolean;
  signInHref?: string;
  createAccountHref?: string;
  pageClassName?: string;
  shellClassName?: string;
  leftClassName?: string;
  rightClassName?: string;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const bootstrapped = usePlatformStore((state) => state.bootstrapped);
  const hydrateSession = usePlatformStore((state) => state.hydrateSession);

  useEffect(() => {
    if (bootstrapped) {
      return;
    }
    void hydrateSession();
  }, [bootstrapped, hydrateSession]);

  return (
    <div className={pageClassName ? `auth-page ${pageClassName}` : "auth-page"}>
      {showUtilityHeader ? (
        <>
          <header className="topbar auth-utility-header">
            <div className="auth-utility-inner">
              <Link className="brand auth-utility-brand" href="/">
                <span className="brand-mark image-mark">
                  <Image className="brand-logo" src="/fc-logo.svg" alt="Fresher Connect logo" width={36} height={36} priority />
                </span>
                <span className="auth-utility-brand-copy">
                  <span className="brand-title">Fresher Connect</span>
                </span>
              </Link>

              <div className="auth-utility-tools">
                <button className="auth-utility-item auth-utility-lang" type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3a14.5 14.5 0 0 1 0 18" />
                    <path d="M12 3a14.5 14.5 0 0 0 0 18" />
                  </svg>
                  <span>ENG</span>
                </button>

                <Link className="auth-utility-item auth-utility-chip" href="/jobs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3a14.5 14.5 0 0 1 0 18" />
                    <path d="M12 3a14.5 14.5 0 0 0 0 18" />
                  </svg>
                  <span>Opportunities</span>
                </Link>

                <span className="auth-utility-divider" aria-hidden="true" />

                <Link className="auth-utility-item auth-utility-link" href="/jobs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 7h10l1 11H6L7 7Z" />
                    <path d="M9 7a3 3 0 1 1 6 0" />
                  </svg>
                  <span>Hiring Teams</span>
                </Link>

                <Link className="auth-utility-item auth-utility-pill" href="/">
                  Support
                </Link>

                <div className="button-row auth-utility-cta">
                  <Link className="btn ghost compact-btn auth-signin-btn" href={signInHref}>
                    Sign In
                  </Link>
                  <Link className="btn primary compact-btn auth-signup-btn" href={createAccountHref}>
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </header>
          <LiveUpdatesTicker />
        </>
      ) : null}

      <main className={shellClassName ? `auth-shell ${shellClassName}` : "auth-shell"}>
        <section className={leftClassName ? `auth-copy ${leftClassName}` : "auth-copy"}>
          {showBrand ? (
            <Link className="brand" href="/">
              <span className="brand-mark image-mark">
                <Image className="brand-logo" src="/fc-logo.svg" alt="Fresher Connect logo" width={36} height={36} />
              </span>
              <span>
                <span className="brand-title">Fresher Connect</span>
                <span className="brand-sub">{brandSubtitle}</span>
              </span>
            </Link>
          ) : null}
          {left}
        </section>

        <section className={rightClassName ? `auth-card auth-card-strong ${rightClassName}` : "auth-card auth-card-strong"}>{right}</section>
      </main>
    </div>
  );
}
