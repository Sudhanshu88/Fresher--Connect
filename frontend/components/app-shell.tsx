"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";

const links = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/user", label: "Candidate" },
  { href: "/company", label: "Company" },
  { href: "/admin", label: "Admin" }
];

export function AppShell({
  children,
  title,
  subtitle,
  actions
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = usePlatformStore((state) => state.user);
  const logout = usePlatformStore((state) => state.logout);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="brand">
            <img src="/fc-logo.svg" alt="Fresher Connect logo" />
            <span className="brand-copy">
              <span>Fresher Connect</span>
              <span className="brand-sub">{subtitle || "React + Next.js workspace"}</span>
            </span>
          </Link>
          <nav className="nav">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${isActive(link.href) ? " active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link href={dashboardPath(user.role)} className="btn secondary">
                Dashboard
              </Link>
            ) : null}
            {user ? (
              <button
                className="btn ghost"
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="page">
        <div className="container stack">
          {title ? (
            <div className="section-head">
              <div className="stack">
                <span className="section-label">Next Frontend</span>
                <h1 className="page-title">{title}</h1>
              </div>
              {actions}
            </div>
          ) : null}
          {children}
        </div>
      </main>
      <footer className="footer">
        <div className="container footer-row">
          <span>React + TypeScript + Zustand migration layer for Fresher Connect.</span>
          <span>Flask + MongoDB backend stays unchanged behind the new UI.</span>
        </div>
      </footer>
    </div>
  );
}
