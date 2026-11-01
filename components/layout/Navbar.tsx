"use client";

import { ChevronDown, LogOut, Menu, Search, Sparkles, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { buttonClass } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { profileCompletion } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./SearchDialog";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/universities", label: "Universities" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/careers", label: "Careers" },
  { href: "/for-you", label: "For You" },
  { href: "/planner", label: "Planner" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { user, ready, data, signOut } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const initials = (user?.name || user?.email || "?").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const pct = data ? profileCompletion(data.profile).percent : 0;

  const logout = async () => {
    await signOut();
    toast.success("You've been logged out.");
    router.push("/");
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[80] focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:shadow-pop">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="container flex h-16 items-center gap-6">
          <Logo />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(path, n.href) ? "page" : undefined}
                    className={cn(
                      "relative rounded px-3 py-2 text-[14px] transition-colors",
                      isActive(path, n.href) ? "font-medium text-ink" : "text-ink-3 hover:text-ink",
                    )}
                  >
                    {n.label}
                    {isActive(path, n.href) && <span className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-brand-600" aria-hidden />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 items-center gap-2 rounded border border-line-strong bg-surface pl-3 pr-2 text-[13px] text-ink-3 transition-colors hover:border-ink-4 md:flex"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="w-28 text-left xl:w-40">Search</span>
              <kbd className="rounded border border-line px-1 font-mono text-[10px]">⌘K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="flex h-9 w-9 items-center justify-center rounded text-ink-2 hover:bg-ink/[0.05] md:hidden" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              href="/assistant"
              className={cn(buttonClass("ghost", "sm"), "hidden h-9 sm:inline-flex", isActive(path, "/assistant") && "bg-ink/[0.05] text-ink")}
              aria-current={isActive(path, "/assistant") ? "page" : undefined}
            >
              <Sparkles className="h-4 w-4 text-brand-600" />
              Assistant
            </Link>

            {!ready ? (
              <div className="h-9 w-9 skeleton rounded-full" aria-hidden />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-9 items-center gap-1.5 rounded pl-1 pr-1.5 hover:bg-ink/[0.05]"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">{initials}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-ink-3 sm:block" />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-64 animate-fade-in rounded-md border border-line bg-surface p-1.5 shadow-pop">
                    <div className="px-3 py-2.5">
                      <p className="truncate text-[14px] font-medium">{user.name || "Your account"}</p>
                      <p className="truncate text-[12px] text-ink-3">{user.email}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
                        <span className="font-mono text-[11px] text-ink-3">{pct}%</span>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-line" />
                    <Link role="menuitem" href="/profile" className="flex items-center gap-2.5 rounded px-3 py-2 text-[13.5px] hover:bg-paper">
                      <User className="h-4 w-4 text-ink-3" /> Profile
                    </Link>
                    <Link role="menuitem" href="/assistant" className="flex items-center gap-2.5 rounded px-3 py-2 text-[13.5px] hover:bg-paper sm:hidden">
                      <Sparkles className="h-4 w-4 text-ink-3" /> Path Assistant
                    </Link>
                    <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13.5px] hover:bg-paper">
                      <LogOut className="h-4 w-4 text-ink-3" /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={cn(buttonClass("ghost", "sm"), "hidden h-9 sm:inline-flex")}>Log in</Link>
                <Link href="/signup" className={cn(buttonClass("primary", "sm"), "h-9")}>Sign up</Link>
              </>
            )}

            <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded text-ink-2 hover:bg-ink/[0.05] lg:hidden" aria-label="Open menu" aria-expanded={mobileOpen}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm animate-fade-in flex-col bg-surface shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="rounded p-2 text-ink-2 hover:bg-paper" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-0.5">
                {[...NAV, { href: "/search", label: "Search" }, { href: "/assistant", label: "Path Assistant" }, { href: "/profile", label: "Profile" }].map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={isActive(path, n.href) ? "page" : undefined}
                      className={cn("flex items-center rounded px-3 py-3 text-[15px]", isActive(path, n.href) ? "bg-brand-50 font-medium text-brand-800" : "text-ink-2 hover:bg-paper")}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-line p-4">
              {user ? (
                <button onClick={logout} className={buttonClass("secondary", "md", "w-full")}>
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className={buttonClass("secondary", "md")}>Log in</Link>
                  <Link href="/signup" className={buttonClass("primary", "md")}>Sign up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
