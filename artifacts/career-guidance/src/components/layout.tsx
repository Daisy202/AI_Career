import { Link, useLocation } from "wouter";
import { Compass, BarChart2, MessageSquare, Star, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui-elements";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/assessment", label: "Assessment", icon: <Compass className="w-4 h-4 mr-2" /> },
    { href: "/recommendations", label: "Matches", icon: <Star className="w-4 h-4 mr-2" /> },
    { href: "/dashboard", label: "Dashboard", icon: <BarChart2 className="w-4 h-4 mr-2" /> },
    { href: "/chat", label: "AI Advisor", icon: <MessageSquare className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl group-hover:shadow-lg transition-all">
                  <Compass className="h-6 w-6 text-white" />
                </div>
                <span className="font-display font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground">
                  CareerGuide<span className="text-accent">ZW</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.href || (location.startsWith('/career') && link.href === '/recommendations');
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/feedback" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                Feedback
              </Link>
              <Button size="sm" className="rounded-full px-6">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl bg-muted text-foreground hover:bg-primary/10 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-white absolute w-full left-0 shadow-2xl">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-4 rounded-xl text-base font-bold",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
              <div className="h-px bg-border/50 my-4" />
              <Link
                href="/feedback"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-4 py-4 rounded-xl text-base font-bold text-foreground hover:bg-muted"
              >
                <Star className="w-5 h-5 mr-3 text-muted-foreground" />
                Provide Feedback
              </Link>
              <div className="px-4 pt-2">
                <Button className="w-full">Sign In</Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white py-12 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">CareerGuideZW</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Empowering pre-university students in Zimbabwe to make data-driven career choices with AI.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/feedback" className="text-sm font-semibold text-muted-foreground hover:text-primary">
              Feedback
            </Link>
            <span className="text-border">|</span>
            <Link href="#" className="text-sm font-semibold text-muted-foreground hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
