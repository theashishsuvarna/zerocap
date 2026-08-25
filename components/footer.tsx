import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600">
              <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight">
              Zero<span className="text-gradient-primary">Cap</span>
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/gig" className="transition-colors hover:text-foreground">Browse Gigs</Link>
            <Link href="/post-job" className="transition-colors hover:text-foreground">Post a Job</Link>
            <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
            <Link href="/auth/sign-up" className="transition-colors hover:text-foreground">Get Started</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ZeroCap. Trustless delivery.
          </p>
        </div>
      </div>
    </footer>
  );
}
