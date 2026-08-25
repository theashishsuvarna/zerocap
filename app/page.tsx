'use client';

import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Lock, Zap, ArrowRight, CheckCircle2, FileLock, CreditCard, Eye } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Trustless delivery for the creator economy
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Get paid before
              <br />
              they get the <span className="text-gradient-primary">final files</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              ZeroCap protects creators from clients who receive work without paying. Upload deliverables,
              share protected previews, and unlock originals only after verified UPI payment.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto glow-primary">
                  Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/gig">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Browse Gigs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How ZeroCap Works</h2>
            <p className="mt-3 text-muted-foreground">A trustless escrow flow built for the creator economy</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: FileLock,
                step: '01',
                title: 'Upload Deliverable',
                desc: 'Creators upload the final work. The system generates a protected, watermarked preview for the client.',
              },
              {
                icon: CreditCard,
                step: '02',
                title: 'Client Pays via UPI',
                desc: 'The client sees the preview and pays via UPI QR or UPI ID. Payment is verified server-side — never on a button click.',
              },
              {
                icon: CheckCircle2,
                step: '03',
                title: 'Original Unlocked',
                desc: 'Only after verified payment does the original file become downloadable via a short-lived signed URL.',
              },
            ].map((item) => (
              <Card key={item.step} className="glass-card relative overflow-hidden p-6 transition-all hover:glow-sm">
                <div className="absolute right-4 top-4 text-5xl font-bold text-muted/20">{item.step}</div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for Trust</h2>
            <p className="mt-3 text-muted-foreground">Every layer designed to protect both sides of the transaction</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lock, title: 'Private Storage', desc: 'Originals stored in private buckets. Never publicly accessible.' },
              { icon: Eye, title: 'Protected Previews', desc: 'Watermarked previews let clients evaluate before paying.' },
              { icon: Shield, title: 'Server-Side Verification', desc: 'Payment status changes verified on the server, never the frontend.' },
              { icon: Zap, title: 'UPI Payments', desc: 'Native UPI QR and ID support. Fast, familiar, India-first.' },
            ].map((feature) => (
              <div key={feature.title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="glass-card relative overflow-hidden p-10 text-center">
            <div className="absolute inset-0 bg-radial-fade opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to work <span className="text-gradient-primary">trustlessly?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join ZeroCap today. Create gigs, hire creators, and deliver work with confidence.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="glow-primary">
                    Create Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/gig">
                  <Button size="lg" variant="outline">
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
