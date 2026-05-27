import { PageTransition } from "@/components/ui/page-transition";
import { Link } from "wouter";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
          <Compass className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-6xl text-foreground mb-4">Lost in the void.</h1>
        <p className="text-xl text-muted-foreground mb-8">This page exists outside of your tracked energy.</p>
        <Link href="/">
          <div className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white/10 hover:bg-white/20 text-foreground transition-all duration-300 border border-white/10 cursor-pointer">
            Return to Dashboard
          </div>
        </Link>
      </div>
    </PageTransition>
  );
}