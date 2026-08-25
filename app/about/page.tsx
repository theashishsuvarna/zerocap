'use client';

import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Shield,
  Lock,
  Eye,
  CreditCard,
  CheckCircle2,
  FileLock,
  ArrowRight,
  Server,
  Database,
  KeyRound,
  User,
} from 'lucide-react';

export default function AboutPage() {
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
              About ZeroCap
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Built to make freelance delivery more <span className="text-gradient-primary">trustworthy.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              ZeroCap protects creators from unpaid final deliveries while giving hirers a secure,
              transparent way to pay and receive their work.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The Problem</h2>
            <p className="mt-3 text-muted-foreground">
              Freelance work delivery has a fundamental trust gap that affects both sides.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileLock,
                title: 'Files sent before payment',
                desc: 'Freelancers often send final files before receiving payment, leaving them vulnerable to non-payment.',
              },
              {
                icon: Eye,
                title: 'Clients hesitate to pay blind',
                desc: 'Clients may hesitate to pay before seeing the work, unsure of what they are actually getting.',
              },
              {
                icon: Shield,
                title: 'Trust gaps in workflows',
                desc: 'Traditional freelance workflows create trust gaps with no structured protection for either party.',
              },
              {
                icon: Lock,
                title: 'Digital files are hard to recover',
                desc: 'Digital files are easy to copy and difficult to recover once delivered, making reversal impossible.',
              },
            ].map((item) => (
              <Card key={item.title} className="glass-card p-6 transition-all hover:glow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The ZeroCap Solution */}
      <section className="relative border-t border-border/40 py-20">
        <div className="absolute inset-0 bg-radial-fade opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The ZeroCap Solution</h2>
            <p className="mt-3 text-muted-foreground">
              A Pay-to-Unlock workflow that protects both creators and hirers at every step.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
            {[
              { label: 'Creator uploads', icon: FileLock },
              { label: 'Protected preview', icon: Eye },
              { label: 'Payment', icon: CreditCard },
              { label: 'Verification', icon: CheckCircle2 },
              { label: 'Original file unlocked', icon: KeyRound },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex flex-1 items-center gap-4">
                <Card className="glass-card flex flex-1 flex-col items-center gap-3 p-6 text-center transition-all hover:glow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </Card>
                {i < arr.length - 1 && (
                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Four steps from creation to delivery</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Create / Hire',
                desc: 'Creators list gigs and hirers post jobs. Orders are created when a hirer engages a creator for a service.',
                icon: User,
              },
              {
                step: '02',
                title: 'Deliver Protected',
                desc: 'The creator uploads the final deliverable. A protected preview is generated so the hirer can review the work safely.',
                icon: FileLock,
              },
              {
                step: '03',
                title: 'Pay Securely',
                desc: 'The hirer pays via UPI QR code or UPI ID. Payment details are submitted for server-side verification.',
                icon: CreditCard,
              },
              {
                step: '04',
                title: 'Unlock Original',
                desc: 'After payment is verified, the original file is unlocked and becomes downloadable via a short-lived signed URL.',
                icon: KeyRound,
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

      {/* Built By */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built By</h2>
          </div>
          <Card className="glass-card relative overflow-hidden p-8 sm:p-10">
            <div className="absolute inset-0 bg-radial-fade opacity-40" />
            <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-primary/20">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">Ashish Suvarna</h3>
                <p className="mt-1 text-sm font-medium text-primary">Founder &amp; Creator, ZeroCap</p>
                <p className="mt-4 text-muted-foreground">
                  ZeroCap is a project by Ashish Suvarna, built around a simple belief: creators should get
                  paid for the work they deliver, and clients should receive the final work they paid for.
                  It is a product focused on solving trust and payment problems in the freelance creator
                  economy.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Vision */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="glass-card relative overflow-hidden p-10 text-center">
            <div className="absolute inset-0 bg-radial-fade opacity-50" />
            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Eye className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Our Vision</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Build a safer digital economy where creators can deliver with confidence and clients can
                pay with confidence.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trust &amp; Security</h2>
            <p className="mt-3 text-muted-foreground">
              ZeroCap is built with security as a foundational principle, not an afterthought.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Supabase Authentication',
                desc: 'User accounts and sessions are managed through Supabase Auth, providing secure sign-in and session management.',
              },
              {
                icon: Lock,
                title: 'Private File Storage',
                desc: 'Original deliverables are stored in private storage buckets. Files are never publicly accessible and require signed URLs to download.',
              },
              {
                icon: Eye,
                title: 'Protected Deliverables',
                desc: 'Creators upload work to a private bucket while a separate preview is generated for the hirer to review before paying.',
              },
              {
                icon: Server,
                title: 'Server-Side Payment Verification',
                desc: 'Payment verification runs on the server through an edge function, not on the client. Payment status is never changed by a button click.',
              },
              {
                icon: Database,
                title: 'Row Level Security',
                desc: 'Every table in the database has Row Level Security enabled, ensuring users can only access data they are authorized to see.',
              },
              {
                icon: KeyRound,
                title: 'Verified Payment Before Access',
                desc: 'Original files are unlocked only after payment has been verified on the server. Short-lived signed URLs provide temporary download access.',
              },
            ].map((item) => (
              <Card key={item.title} className="glass-card p-6 transition-all hover:glow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="glass-card relative overflow-hidden p-10 text-center">
            <div className="absolute inset-0 bg-radial-fade opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to work without the <span className="text-gradient-primary">trust gap?</span>
              </h2>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/gig">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Browse Gigs
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full glow-primary sm:w-auto">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
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
