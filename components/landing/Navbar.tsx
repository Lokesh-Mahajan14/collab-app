"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Menu, X, Zap } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Changelog", href: "/changelog" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

 return(
  <header className={cn(
    "fixed top-0 right-0 left-0 z-50 bg-amber-200 transition-all duration-300 ",
    scrolled
     ? "glass border-b border-border/60 shadow-sm"
     :"bg-transparent"

  )}>
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <Link href="/"  className="flex items-center gap-2 group">
        <div className="w-7 h-7 rounded-[6px] bg-foreground flex items-center justify-center transition-transform  group-hover:scale-95">
          <Zap className="w-4 h-4 text-background fill-background" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">
            CollabFlow
        </span>

      </Link>
      <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
      </ul>
      {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/auth/login"
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">
              Get started free
            </Button>
          </Link>
        </div>
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
    </nav>
    {
      mobileOpen && (
        <div className="md:hidden border-t border-boder/60 bg-background/95 backdrop-blur-md px-4 py-4 flex flex-col gap-1 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="px-3 py-2.5 text-sm text-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              Log in
            </Link>
            <Link href="/auth/signup" className="w-full">
              <Button className="w-full justify-center">
                Get started free
              </Button>
            </Link>
          </div>
        </div>

    
      )
    }
    

  </header>

 );
}
