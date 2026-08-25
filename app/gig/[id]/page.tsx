'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Gig } from '@/lib/types';
import { Loader2, Clock, Star, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function GigDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    loadGig();
  }, [id]);

  const loadGig = async () => {
    const { data, error } = await supabase
      .from('gigs')
      .select('*, creator:profiles!gigs_creator_id_fkey(*)')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setGig(data as Gig);
    }
    setLoading(false);
  };

  const handleHire = async () => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }
    if (!gig) return;
    if (profile?.role === 'creator') {
      toast({ title: 'Creators cannot hire other creators', variant: 'destructive' });
      return;
    }
    if (gig.creator_id === user.id) {
      toast({ title: 'You cannot hire yourself', variant: 'destructive' });
      return;
    }

    setOrdering(true);
    const orderRef = `ZC${Date.now().toString().slice(-8)}`;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        gig_id: gig.id,
        hirer_id: user.id,
        creator_id: gig.creator_id,
        title: gig.title,
        description: gig.description,
        amount: gig.price,
        status: 'pending',
        order_ref: orderRef,
      })
      .select()
      .single();

    setOrdering(false);
    if (error) {
      toast({ title: 'Failed to create order', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order created successfully!' });
      router.push(`/orders/${data.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-lg font-medium">Gig not found</p>
          <Link href="/gig">
            <Button variant="outline" className="mt-4">Back to gigs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/gig" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to gigs
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2">
            <Card className="glass-card overflow-hidden">
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-secondary/40 to-card">
                {gig.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={gig.image_url} alt={gig.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Star className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                    {gig.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {gig.delivery_time}
                  </span>
                </div>
                <h1 className="mb-3 text-2xl font-bold tracking-tight">{gig.title}</h1>
                <p className="text-muted-foreground">{gig.description}</p>

                {gig.tags && gig.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {gig.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-border/60 bg-card/40 px-2.5 py-1 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-3xl font-bold text-primary">₹{gig.price}</p>
                </div>
                <Button onClick={handleHire} className="w-full glow-primary" size="lg" disabled={ordering}>
                  {ordering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hire Now'}
                </Button>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Protected preview before payment
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> UPI payment support
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Original unlocked after verified payment
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">About the Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                    {gig.creator?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="font-medium">{gig.creator?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{gig.creator?.email}</p>
                  </div>
                </div>
                {gig.creator?.bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{gig.creator.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Trust info */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">ZeroCap Trust Guarantee</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your payment is protected. The original file is only unlocked after the system verifies your payment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
