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
  { href: "/jobs", label: "Live jobs" },
  { href: "/careers", label: "Careers" },
  { href: "/for-you", label: "For You" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/planner", label: "Planner" },
];

function isActive(path: string, href: string) {
  if (href === "/careers" && path.startsWith("/occupations")) return true;
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
      <header className="night sticky top-0 z-40 border-b border-white/[0.07] bg-night-900">
        <div className="container flex h-16 items-center gap-6">
          <Logo />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href} className={cn(n.href === "/" && "hidden xl:block")}>
                  <Link
                    href={n.href}
                    aria-current={isActive(path, n.href) ? "page" : undefined}
                    className={cn(
                      "relative whitespace-nowrap rounded px-2.5 py-2 text-[14px] transition-colors",
                      isActive(path, n.href) ? "font-medium text-white" : "text-night-300 hover:text-white",
                    )}
                  >
                    {n.label}
                    {isActive(path, n.href) && <span className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-mint shadow-[0_0_12px_rgba(140,207,180,0.8)]" aria-hidden />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] pl-3 pr-2 text-[13px] text-night-300 transition-colors hover:border-white/20 hover:text-night-100 md:flex"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="w-28 text-left xl:w-40">Search</span>
              <kbd className="rounded border border-white/10 px-1 font-mono text-[10px]">⌘K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="flex h-9 w-9 items-center justify-center rounded text-night-200 hover:bg-white/[0.06] md:hidden" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              href="/assistant"
              className={cn(buttonClass("ghost", "sm"), "hidden h-9 text-night-200 hover:bg-white/[0.06] hover:text-white sm:inline-flex", isActive(path, "/assistant") && "bg-white/[0.07] text-white")}
              aria-current={isActive(path, "/assistant") ? "page" : undefined}
            >
              <Sparkles className="h-4 w-4 text-mint" />
              Assistant
            </Link>

            {!ready ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" aria-hidden />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-9 items-center gap-1.5 rounded pl-1 pr-1.5 hover:bg-white/[0.06]"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-[11px] font-semibold text-night-900">{initials}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-night-300 sm:block" />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-64 animate-fade-in rounded-xl border border-white/10 bg-night-800/95 p-1.5 text-night-100 shadow-pop backdrop-blur-xl">
                    <div className="px-3 py-2.5">
                      <p className="truncate text-[14px] font-medium text-white">{user.name || "Your account"}</p>
                      <p className="truncate text-[12px] text-night-300">{user.email}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-mint" style={{ width: `${pct}%` }} /></div>
                        <span className="font-mono text-[11px] text-night-300">{pct}%</span>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-white/10" />
                    <Link role="menuitem" href="/profile" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] hover:bg-white/[0.06]">
                      <User className="h-4 w-4 text-night-300" /> Profile
                    </Link>
                    <Link role="menuitem" href="/assistant" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] hover:bg-white/[0.06] sm:hidden">
                      <Sparkles className="h-4 w-4 text-night-300" /> Path Assistant
                    </Link>
                    <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] hover:bg-white/[0.06]">
                      <LogOut className="h-4 w-4 text-night-300" /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={cn(buttonClass("ghost", "sm"), "hidden h-9 text-night-200 hover:bg-white/[0.06] hover:text-white sm:inline-flex")}>Log in</Link>
                <Link href="/signup" className={cn(buttonClass("mint", "sm"), "h-9")}>Sign up</Link>
              </>
            )}

            <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded text-night-200 hover:bg-white/[0.06] lg:hidden" aria-label="Open menu" aria-expanded={mobileOpen}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="night absolute right-0 top-0 flex h-full w-[86%] max-w-sm animate-fade-in flex-col border-l border-white/10 bg-night-850 shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="rounded p-2 text-night-200 hover:bg-white/[0.06]" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-0.5">
                {[...NAV, { href: "/courses", label: "Online courses" }, { href: "/certifications", label: "Certifications" }, { href: "/compare", label: "Compare universities" }, { href: "/search", label: "Search" }, { href: "/assistant", label: "Path Assistant" }, { href: "/profile", label: "Profile" }].map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={isActive(path, n.href) ? "page" : undefined}
                      className={cn("flex items-center rounded-md px-3 py-3 text-[15px]", isActive(path, n.href) ? "bg-mint/10 font-medium text-mint" : "text-night-200 hover:bg-white/[0.05]")}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-white/10 p-4">
              {user ? (
                <button onClick={logout} className={buttonClass("nightOutline", "md", "w-full")}>
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className={buttonClass("nightOutline", "md")}>Log in</Link>
                  <Link href="/signup" className={buttonClass("mint", "md")}>Sign up</Link>
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
