import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { LayoutDashboard, PlusCircle, Map as MapIcon, Sparkles, History } from "lucide-react";
import { ReactNode } from "react";

const navItems = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/log", label: "Log Energy", icon: PlusCircle },
  { path: "/map", label: "Energy Map", icon: MapIcon },
  { path: "/insights", label: "Insights", icon: Sparkles },
  { path: "/history", label: "History", icon: History },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden selection:bg-primary/30">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex flex-col w-64 border-r border-white/5 bg-background/50 backdrop-blur-xl p-6 z-10 relative">
        <div className="mb-12 px-2">
          <h1 className="font-serif text-3xl text-primary tracking-wide">Aura.</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">Social Energy</p>
        </div>
        
        <div className="flex flex-col space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer relative group ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} strokeWidth={1.5} />
                  <span className="font-medium relative z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 h-[100dvh] overflow-y-auto pb-24 md:pb-0 scroll-smooth">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t-white/10 pb-safe">
        <div className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className="flex flex-col items-center justify-center w-16 h-14 cursor-pointer relative"
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon
                    className={`w-6 h-6 transition-all duration-300 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="active-mobile-nav"
                      className="absolute -top-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_2px_rgba(var(--primary),0.5)]"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}