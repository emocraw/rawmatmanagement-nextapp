"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";

const ITEMS: Array<{ href: Route; label: string; id: string }> = [
  { href: "/", label: "Feed In", id: "index" },
  { href: "/confirmCFeedIn", label: "C Feed In", id: "confirmCFeedIn" },
  { href: "/confirmCFeedOut", label: "C Feed Out", id: "confirmCFeedOut" }
];

export function AppNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary mb-3">
      <div className="container-fluid px-3">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mb-2 mb-lg-0">
            {ITEMS.map((item) => (
              <li className="nav-item" key={item.id}>
                <Link href={item.href} className={`nav-link ${pathname === item.href ? "active" : ""}`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center gap-2">
            <li className="nav-item">
              <span className="nav-link">Hello: {userName || ""}</span>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  sessionStorage.clear();
                  router.push("/login");
                }}
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
